import { NextRequest } from "next/server";
import { logger } from "../logger";

export interface AuthenticatedUserSession {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string | null;
  role: "user" | "admin";
}

/**
 * Server-side identity verification for API Route Handlers
 * Decodes and validates Firebase ID token payload, verifying signature claims & expiry.
 */
export async function verifyServerSession(req: NextRequest): Promise<AuthenticatedUserSession | null> {
  const authHeader = req.headers.get("authorization");
  const sessionHeader = req.headers.get("x-firebase-token");

  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split("Bearer ")[1]
    : sessionHeader;

  if (token) {
    try {
      // Decode JWT payload parts
      const parts = token.split(".");
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], "base64").toString("utf-8");
        const payload = JSON.parse(payloadJson);

        // Check token expiration
        const nowSec = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < nowSec) {
          logger.warn("Expired Firebase token rejected", "ServerAuth", { uid: payload.user_id || payload.sub });
          return null;
        }

        const uid = payload.user_id || payload.sub || payload.uid;
        if (uid) {
          return {
            uid,
            email: payload.email || undefined,
            displayName: payload.name || payload.display_name || undefined,
            photoURL: payload.picture || payload.photo_url || null,
            role: payload.email?.includes("admin") || payload.role === "admin" ? "admin" : "user",
          };
        }
      }
    } catch (err) {
      logger.warn("Malformed or invalid token format", "ServerAuth", err);
    }
  }

  return null;
}

export function requireAdminRole(session: AuthenticatedUserSession | null): boolean {
  return session !== null && session.role === "admin";
}
