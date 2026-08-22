# Technical Requirements Document (TRD)

## LostIQ — Intelligent Lost & Found

- **Document Version:** 1.0.0
- **Path:** `/docs/TRD.md`
- **Status:** Active Architectural Source of Truth
- **Hosting Target:** Vercel

---

# 1. Technical Strategy

CampusFind AI uses a **modern full-stack Next.js architecture** with Firebase for authentication, database, and file storage, and the Gemini API for multimodal AI analysis.

The architecture remains simple, maintainable, hackathon-friendly, and production-ready.

**Cloud Run is NOT part of the application architecture.**

The application is deployed using **Vercel**.

The system avoids unnecessary microservices and unnecessary Google Cloud infrastructure.

---

# 2. Frontend

## Framework
* **Next.js** (App Router)
* **TypeScript** (Strict Mode)

## Styling & Component System
* **Tailwind CSS** for responsive, utility-first modern styling.
* **shadcn/ui** component conventions and primitives.
* **Lucide React** for icons.

## Frontend Principles
* **Server Components by default**; Client Components only when interactivity, form state, or browser APIs require them.
* **Strict TypeScript**: Full interface compliance with backend schemas.
* **Reusable components**: Modular directory structure organized by feature domain.
* **Accessibility (WCAG AA)**: Semantic HTML, visible focus rings, ARIA labels, screen-reader friendly status messages.
* **Resilience**: Graceful error boundaries, optimistic UI updates, and skeleton loading states.

## Frontend Responsibilities
* Authentication UI (Google Sign-In & Email/Password).
* User Dashboard & My Reports overview.
* Lost & Found report creation forms with real-time preview.
* Secure image upload handling.
* Search & Discovery directory with multi-faceted filtering.
* Report Details view.
* AI Match Results with confidence badges & transparent breakdown.
* Visual Match Comparison & AI explanation display.
* Safe Recovery / Claim initiation modal.

---

# 3. Backend

## Backend Architecture
Built directly on Next.js built-in backend capabilities:
* **Route Handlers** (`app/api/...`) for RESTful interactions and client uploads.
* **Server Actions & Service Layer Modules** for core business logic.

Business logic is strictly decoupled from route handlers:

```text
Request
  ↓
Authentication & Authorization Check
  ↓
Input Validation (Zod Schemas)
  ↓
Route Handler / Server Action
  ↓
Service Layer (Reports, Matching, Claims)
  ↓
Repository / Firebase Firestore / Storage / Gemini API
```

## Backend Responsibilities
* Server-side authentication token verification (Firebase Admin / Client auth check).
* RBAC Authorization (`user` vs `admin`).
* Strict Zod payload validation and HTML/XSS sanitization.
* Firestore CRUD operations.
* File-upload validation (MIME, magic numbers, 5MB limit) & Firebase Storage upload.
* Multimodal AI analysis invocation via `@google/genai`.
* Candidate retrieval with indexed queries.
* Multi-signal match calculation & human-readable rationale synthesis.
* Efficient search & pagination.
* Safe error formatting without leaking stack traces or internal secrets.

---

# 4. Database

## Database Provider
**Firebase Cloud Firestore**

## Core Collections & Schema Overview
```text
users/
  └── {userId} (profile, role, contactPrefs, timestamps)
reports/
  └── {reportId} (type, title, description, category, location, date, time, imageUrl, status, aiAttributes, userId, timestamps)
matches/
  └── {matchId} (lostReportId, foundReportId, overallScore, visualScore, semanticScore, locationScore, timeScore, categoryScore, explanation, status, createdAt)
claims/
  └── {claimId} (reportId, claimantId, proofDetails, status, reviewerId, timestamps)
notifications/ (optional)
  └── {notificationId} (recipientId, title, message, link, read, createdAt)
```

---

# 5. Authentication & Authorization

## Provider
**Firebase Authentication**
* **Primary:** Google Sign-In (OAuth popup / redirect)
* **Secondary:** Email & Password authentication
* **Session:** Persistent client session + server-side Firebase ID token verification.

## Authorization & Roles
* `user`: Can create/edit own reports, search reports, initiate claims on matching items.
* `admin`: Can moderate all reports, review disputed claims, flag spam.
* **Security Rule:** The server NEVER trusts a client-supplied `userId`. All mutations derive identity from the verified session token.

---

# 6. File Storage

## Storage Provider
**Firebase Storage**

* Raw binary images are never stored in Firestore; Firestore records only the storage path and public/signed CDN URL.
* **Storage Path Structure:**
  ```text
  reports/{userId}/{reportId}/{safeFilename}
  ```
* **Upload Security Controls:**
  - Allowed MIME Types: `image/jpeg`, `image/png`, `image/webp`.
  - Max File Size: `5MB`.
  - Filename sanitization: Random UUID generation with extension normalization (never trusting original client filenames).

---

# 7. AI Multimodal Item Analysis

## Provider & SDK
* **Provider:** Google Gemini API
* **Official SDK:** `@google/genai` (Node.js/TypeScript)
* **Model Configuration:** Configurable via environment variables (e.g. `gemini-1.5-flash` or `gemini-2.0-flash`).

## Extracted Structured Attributes
When a report with an image and description is analyzed, Gemini returns validated JSON:
```json
{
  "summary": "Black wireless earbuds in a matte charging case",
  "category": "electronics",
  "objectType": "wireless earbuds",
  "brand": "Sony",
  "dominantColor": "black",
  "attributes": [
    "matte charging case",
    "usb-c port",
    "white scratch on upper lid"
  ],
  "keywords": [
    "earbuds",
    "sony",
    "wireless",
    "case",
    "audio"
  ]
}
```

* **Cost & Efficiency Guard:** AI-extracted attributes are computed once upon creation and stored in Firestore. Subsequent page views read the stored attributes directly—Gemini is never invoked repeatedly for static reads.

---

# 8. AI Configuration

Environment variables drive all AI configurations:
```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
GEMINI_API_VERSION=v1
```
* Zero hardcoded credentials or model strings.
* Graceful fallback when API key is missing or quota is exhausted.

---

# 9. Matching Engine

## Location
Dedicated, UI-agnostic module located in:
```text
src/lib/matching/
├── engine.ts              # Core matching coordinator
├── visual-matcher.ts      # Visual & attribute similarity
├── semantic-matcher.ts    # Description & keyword overlap
├── location-matcher.ts    # Campus zone & building proximity
├── temporal-matcher.ts    # Date/time window validation
└── explainer.ts           # Rationale synthesis
```

---

# 10. Multi-Signal Weighting & Score Formula

Configurable multi-signal formula:
```text
overallScore =
    (visualScore * MATCH_WEIGHT_VISUAL)
  + (semanticScore * MATCH_WEIGHT_SEMANTIC)
  + (locationScore * MATCH_WEIGHT_LOCATION)
  + (timeScore * MATCH_WEIGHT_TIME)
  + (categoryScore * MATCH_WEIGHT_CATEGORY)
```

### Default Configurable Weights:
* Visual / Attribute Similarity: **40%** (`MATCH_WEIGHT_VISUAL=0.40`)
* Semantic / Description Similarity: **25%** (`MATCH_WEIGHT_SEMANTIC=0.25`)
* Location Proximity: **20%** (`MATCH_WEIGHT_LOCATION=0.20`)
* Time Proximity: **10%** (`MATCH_WEIGHT_TIME=0.10`)
* Category Match: **5%** (`MATCH_WEIGHT_CATEGORY=0.05`)

---

# 11. Candidate Retrieval Strategy

To ensure sub-second response times and eliminate unbounded database scans:
1. **Target Filter:** For a `LOST` item, query exclusively `FOUND` items with `status == 'ACTIVE'` (and vice-versa).
2. **Category Pruning:** Pre-filter by same or compatible category.
3. **Temporal Sanity Filter:** Exclude candidate found reports timestamped significantly before the lost item was lost.
4. **Scoring Execution:** Run the multi-signal matching engine only across the pruned candidate subset (top 20-50 candidates).

---

# 12. Explainable Match Generation

Every match candidate presents dynamic signal metrics and a synthesized human-readable reason:

```text
Score: 94% Match

Signals:
• Visual: 92/100
• Semantic: 89/100
• Location: 97/100
• Time: 91/100
• Category: 100/100

Why this match:
Both reports describe a black Sony wireless earbud case with a visible scratch on the lid. Both were recorded at the Central Library 2nd Floor within 3 hours of each other.
```

---

# 13. Search Engine

* Real-time multi-field search across `title`, `description`, `keywords`, `category`, `location`, and `type`.
* Natural language search normalization.
* Zero unnecessary AI calls for simple keyword and filter queries.

---

# 14. Environment Variables (`.env.example`)

```env
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Server Admin (Private)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Google Gemini API
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash
GEMINI_API_VERSION=v1

# Matching Engine Weights
MATCH_WEIGHT_VISUAL=0.40
MATCH_WEIGHT_SEMANTIC=0.25
MATCH_WEIGHT_LOCATION=0.20
MATCH_WEIGHT_TIME=0.10
MATCH_WEIGHT_CATEGORY=0.05
```

---

# 15. Project Directory Structure

```text
campusfind-ai/
├── docs/
│   ├── PRD.md
│   ├── TRD.md
│   ├── APP_FLOW.md
│   ├── UI_UX_DESIGN.md
│   ├── BACKEND_SCHEMA.md
│   └── IMPLEMENTATION_PLAN.md
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── report/
│   │   │   ├── lost/page.tsx
│   │   │   └── found/page.tsx
│   │   ├── reports/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── matches/
│   │   │   └── [reportId]/page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── api/
│   │       ├── auth/
│   │       ├── reports/
│   │       │   ├── route.ts
│   │       │   ├── [id]/route.ts
│   │       │   └── [id]/matches/route.ts
│   │       ├── analyze/route.ts
│   │       └── claims/route.ts
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   ├── reports/
│   │   │   ├── ReportCard.tsx
│   │   │   ├── ReportForm.tsx
│   │   │   └── ReportFilters.tsx
│   │   ├── matches/
│   │   │   ├── MatchBadge.tsx
│   │   │   ├── MatchBreakdown.tsx
│   │   │   └── ComparisonModal.tsx
│   │   └── claims/
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── client.ts
│   │   │   ├── admin.ts
│   │   │   ├── firestore.ts
│   │   │   └── storage.ts
│   │   ├── ai/
│   │   │   ├── gemini.ts
│   │   │   └── prompts.ts
│   │   ├── matching/
│   │   │   ├── engine.ts
│   │   │   ├── visual-matcher.ts
│   │   │   ├── semantic-matcher.ts
│   │   │   ├── location-matcher.ts
│   │   │   ├── temporal-matcher.ts
│   │   │   └── explainer.ts
│   │   ├── validations/
│   │   │   ├── report.schema.ts
│   │   │   └── claim.schema.ts
│   │   └── utils/
│   ├── types/
│   │   └── index.ts
│   └── hooks/
├── tests/
│   ├── unit/
│   │   ├── matching-engine.test.ts
│   │   ├── validation.test.ts
│   │   └── ai-parser.test.ts
│   └── integration/
│       └── reports-flow.test.ts
├── public/
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

# 16. Testing Strategy

* **Framework:** Vitest with strict TypeScript testing.
* **Test Suites:**
  1. `validation.test.ts`: Zod schema bounds, bad MIME types, missing fields.
  2. `matching-engine.test.ts`: Multi-signal weighting calculations, spatial proximity math, temporal bounds, explainability output.
  3. `ai-parser.test.ts`: Gemini JSON schema parsing and fallback resilience.
  4. `reports-flow.test.ts`: End-to-end report lifecycle (creation $\rightarrow$ candidate retrieval $\rightarrow$ matching $\rightarrow$ claim).

---

# 17. Security & Efficiency Matrix

| Risk / Metric | Mitigation Technique |
| :--- | :--- |
| **Secret Exposure** | `.env.example` committed; actual credentials strictly in local `.env` or Vercel Environment Variables. Server-only keys never prefixed with `NEXT_PUBLIC_`. |
| **Spoofed Ownership** | Server verifies Firebase Auth ID token and compares `uid` against document `userId`. |
| **AI Over-billing** | AI extraction runs once per report; results are cached in Firestore document. |
| **Unbounded Queries** | Candidate retrieval enforces pagination (`limit(20)`), indexed compound queries, and category pruning. |
| **Malicious Uploads** | Strict MIME type validation, file size limit (5MB), and UUID filename randomization. |
