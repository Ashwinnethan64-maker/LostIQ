import { describe, it, expect } from "vitest";
import { verifyServerSession, requireAdminRole, AuthenticatedUserSession } from "@/lib/auth/server-auth";
import { NextRequest } from "next/server";
import { POST as createClaimHandler } from "@/app/api/claims/create/route";
import { createReportInDb } from "@/lib/supabase/repository";
import { Report } from "@/types";

describe("Security and Server-Side Token Verification", () => {
  it("rejects requests without authorization headers", async () => {
    const req = new NextRequest("http://localhost:3005/api/reports/create");
    const session = await verifyServerSession(req);
    expect(session).toBeNull();
  });

  it("verifies and extracts claims from a well-formed Firebase ID token", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64");
    const payload = Buffer.from(
      JSON.stringify({
        user_id: "firebase-uid-alex-456",
        email: "alex@campus.edu",
        name: "Alex Rivera",
        exp: Math.floor(Date.now() / 1000) + 3600,
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
        exp: Math.floor(Date.now() / 1000) - 300,
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

describe("Claims Authorization and Ownership Verification", () => {
  it("rejects unauthenticated claim requests with 401", async () => {
    const req = new NextRequest("http://localhost:3005/api/claims/create", {
      method: "POST",
      body: JSON.stringify({
        reportId: "rep-seed-001",
        proofDetails: "Has engraving #492 on backside.",
      }),
    });

    const res = await createClaimHandler(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("authorizes valid claims from authenticated claimants with 201", async () => {
    const uniqueClaimantId = `claimant-uid-${Date.now()}`;
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64");
    const payload = Buffer.from(
      JSON.stringify({
        user_id: uniqueClaimantId,
        email: "sam@campus.edu",
        name: "Sam Lee",
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    ).toString("base64");
    const token = `${header}.${payload}.sig`;

    const req = new NextRequest("http://localhost:3005/api/claims/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reportId: "rep-seed-001",
        proofDetails: "Distinctive serial number ending in 8421 and sticker on case.",
      }),
    });

    const res = await createClaimHandler(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.claim.claimantId).toBe(uniqueClaimantId);
  });

  it("prevents finders from claiming their own found items with 403", async () => {
    // rep-seed-001 has userId 'campus-security-officer'
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64");
    const payload = Buffer.from(
      JSON.stringify({
        user_id: "campus-security-officer",
        email: "security@campus.edu",
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    ).toString("base64");
    const token = `${header}.${payload}.sig`;

    const req = new NextRequest("http://localhost:3005/api/claims/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reportId: "rep-seed-001",
        proofDetails: "Attempting to claim own item.",
      }),
    });

    const res = await createClaimHandler(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("finder for this item");
  });

  it("prevents users from claiming with a lost report they do not own with 403", async () => {
    // Create an explicit lost report owned by 'user-owner-alpha'
    const testLostReport: Report = {
      id: "rep-test-lost-wallet-444",
      reportType: "LOST",
      userId: "user-owner-alpha",
      title: "Lost Leather Wallet",
      description: "Lost brown wallet",
      category: "id_cards",
      location: { name: "Quad" },
      reportedAt: new Date().toISOString(),
      status: "OPEN",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await createReportInDb(testLostReport);

    // Unrelated User C tries to pass lostReportId owned by user-owner-alpha
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64");
    const payload = Buffer.from(
      JSON.stringify({
        user_id: "unrelated-user-c",
        email: "user.c@campus.edu",
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    ).toString("base64");
    const token = `${header}.${payload}.sig`;

    const req = new NextRequest("http://localhost:3005/api/claims/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reportId: "rep-seed-002",
        lostReportId: "rep-test-lost-wallet-444", // Owned by user-owner-alpha
        proofDetails: "Trying to claim without owning the lost report.",
      }),
    });

    const res = await createClaimHandler(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("You do not own the linked lost report");
  });
});
