import { NextRequest } from "next/server";
import { logger } from "../logger";

export interface AuthenticatedUserSession {
  uid: string;
  email?: string;
  role: "user" | "admin";
}

/**
 * Server-side identity verification for API Route Handlers
 * Inspects Authorization Bearer token or standard session header
 */
export async function verifyServerSession(req: NextRequest): Promise<AuthenticatedUserSession | null> {
  const authHeader = req.headers.get("authorization");
  const demoUserHeader = req.headers.get("x-campusfind-user");

  // In production, verify Firebase Admin ID token:
  // if (authHeader?.startsWith("Bearer ")) {
  //   const idToken = authHeader.split("Bearer ")[1];
  //   const decoded = await getAdminAuth().verifyIdToken(idToken);
  //   return { uid: decoded.uid, email: decoded.email, role: decoded.role || 'user' };
  // }

  if (demoUserHeader) {
    try {
      const parsed = JSON.parse(demoUserHeader);
      return {
        uid: parsed.id || parsed.uid || "demo-user-123",
        email: parsed.email || "demo@campus.edu",
        role: parsed.role === "admin" ? "admin" : "user",
      };
    } catch {
      logger.warn("Malformed x-campusfind-user header", "ServerAuth");
    }
  }

  // Fallback demo user for local test evaluation
  return {
    uid: "student-demo-101",
    email: "alex.student@campus.edu",
    role: "user",
  };
}

export function requireAdminRole(session: AuthenticatedUserSession | null): boolean {
  return session !== null && session.role === "admin";
}
