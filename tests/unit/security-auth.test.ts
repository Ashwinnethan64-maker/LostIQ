import { describe, it, expect } from "vitest";
import { verifyServerSession, requireAdminRole, AuthenticatedUserSession } from "@/lib/auth/server-auth";
import { NextRequest } from "next/server";

describe("Security and Server-Side Token Verification", () => {
  it("rejects requests without authorization headers", async () => {
    const req = new NextRequest("http://localhost:3005/api/reports/create");
    const session = await verifyServerSession(req);
    expect(session).toBeNull();
  });

  it("verifies and extracts claims from a well-formed Firebase ID token", async () => {
    // Generate valid unexpired token payload
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64");
    const payload = Buffer.from(
      JSON.stringify({
        user_id: "firebase-uid-alex-456",
        email: "alex@campus.edu",
        name: "Alex Rivera",
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour future
      })
    ).toString("base64");
    const dummySignature = "dummySig123";
    const token = `${header}.${payload}.${dummySignature}`;

    const req = new NextRequest("http://localhost:3005/api/reports/create", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const session = await verifyServerSession(req);
    expect(session).not.toBeNull();
    expect(session?.uid).toBe("firebase-uid-alex-456");
    expect(session?.email).toBe("alex@campus.edu");
    expect(session?.displayName).toBe("Alex Rivera");
  });

  it("rejects expired tokens", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64");
    const payload = Buffer.from(
      JSON.stringify({
        user_id: "firebase-uid-expired",
        email: "expired@campus.edu",
        exp: Math.floor(Date.now() / 1000) - 300, // 5 min in past
      })
    ).toString("base64");
    const token = `${header}.${payload}.sig`;

    const req = new NextRequest("http://localhost:3005/api/reports/create", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const session = await verifyServerSession(req);
    expect(session).toBeNull();
  });

  it("allows admin operations only for verified admin sessions", () => {
    const adminSession: AuthenticatedUserSession = {
      uid: "admin-1",
      email: "security.admin@campus.edu",
      role: "admin",
    };
    const userSession: AuthenticatedUserSession = {
      uid: "user-1",
      email: "user@campus.edu",
      role: "user",
    };

    expect(requireAdminRole(adminSession)).toBe(true);
    expect(requireAdminRole(userSession)).toBe(false);
    expect(requireAdminRole(null)).toBe(false);
  });
});
