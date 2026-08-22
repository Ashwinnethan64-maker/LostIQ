# LOSTIQ — AUTHENTICATION & SECURITY ARCHITECTURE

> **Version**: 1.0.0 (Production Hardened)  
> **Identity Provider**: Firebase Authentication (Google OAuth)  
> **Application Database**: Supabase PostgreSQL (`public.users`, `public.reports`, `public.claims`)  
> **Storage Provider**: Firebase Storage (Image downsampling + validation)

---

## 1. End-to-End Conceptual Flow

```
+-------------------------------------------------------------------------+
|                               LOGIN PAGE                                |
|                   User clicks "Continue with Google"                    |
+------------------------------------+------------------------------------+
                                     |
                                     v
+------------------------------------+------------------------------------+
|                         GOOGLE OAUTH POPUP                              |
|           User authenticates against Google Identity Provider           |
+------------------------------------+------------------------------------+
                                     |
                                     v
+------------------------------------+------------------------------------+
|                       FIREBASE AUTHENTICATION                           |
|       Firebase returns authenticated User credential on client          |
+------------------------------------+------------------------------------+
                                     |
                                     v
+------------------------------------+------------------------------------+
|                        GET FRESH ID TOKEN                               |
|        Client requests signed JWT: await user.getIdToken(true)          |
+------------------------------------+------------------------------------+
                                     |
                                     v
+------------------------------------+------------------------------------+
|                   SERVER-SIDE TOKEN VERIFICATION                        |
|   POST /api/auth/bootstrap with Header: "Authorization: Bearer <token>" |
|   verifyServerSession() decodes and validates exp, sub, uid, email      |
+------------------------------------+------------------------------------+
                                     |
                                     v
+------------------------------------+------------------------------------+
|                     SUPABASE USER BOOTSTRAP                             |
|   syncUserProfileInDb() persists/upserts user row into public.users     |
|   Primary Key: Canonical Firebase Auth UID                              |
+------------------------------------+------------------------------------+
                                     |
                                     v
+------------------------------------+------------------------------------+
|                  ESTABLISH AUTHORIZED APPLICATION SESSION               |
|      AuthContext transition: BOOTSTRAPPING -> AUTHORIZED                |
|      RouteGuard grants access to protected routes                       |
+------------------------------------+------------------------------------+
                                     |
                                     v
+------------------------------------+------------------------------------+
|                             DASHBOARD                                   |
|   Loads real user reports via GET /api/reports?userId=<canonical_uid>   |
+-------------------------------------------------------------------------+
```

---

## 2. Authentication State Machine

The client application never bypasses or renders protected pages prematurely. The state transitions are:

- `INITIALIZING`: App is mounting and checking `onAuthStateChanged`.
- `UNAUTHENTICATED`: No active Firebase session. Protected routes redirect to `/login`.
- `AUTHENTICATING`: Google OAuth popup is active.
- `BOOTSTRAPPING`: Fresh ID token is being verified server-side with `/api/auth/bootstrap` and synced with Supabase PostgreSQL.
- `AUTHORIZED`: Token verified and user bootstrapped. Access granted to `/dashboard`, `/report/lost`, `/report/found`.
- `ERROR`: Authentication or verification failed. Error message presented with retry option.

---

## 3. Server-Side Protection & Token Derivation

Protected API routes never trust client-supplied identity:
```typescript
const session = await verifyServerSession(req);
if (!session) {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}
const canonicalUid = session.uid;
```

---

## 4. Public vs Protected Routes

- **Public Routes** (Never blocked by auth):
  - `/` (Editorial Landing Page)
  - `/login` (Sign In Portal)
  - `/reports` (Explore Directory)
  - `/api/health` (Health Probe)
  - `/api/search` (Directory Search)
- **Protected Routes** (Guarded by `<RouteGuard>`):
  - `/dashboard` (Control Desk)
  - `/report/lost` (Lost Submission Form)
  - `/report/found` (Found Submission Form)
  - `/api/reports/create` (Report Insertion API)
  - `/api/claims/create` (Recovery Claim API)
