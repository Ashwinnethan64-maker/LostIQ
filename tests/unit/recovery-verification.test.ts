import { describe, it, expect } from "vitest";
import { verifyOwnershipProof, generateRecoveryToken, hashRecoveryToken } from "@/lib/recovery/verification";
import {
  createReportInDb,
  getReportByIdFromDb,
  createClaimInDb,
  getClaimByIdFromDb,
  updateClaimInDb,
  updateReportStatusInDb,
  saveRecoveryTokenInDb,
  getRecoveryTokenByHash,
  markRecoveryTokenUsed,
  logRecoveryEvent,
  getRecoveryEventsForClaim,
} from "@/lib/supabase/repository";
import { Report, Claim, RecoveryToken } from "@/types";
import { POST as verifyClaimHandler } from "@/app/api/claims/create/route";
import { POST as generatePassHandler } from "@/app/api/claims/pass/generate/route";
import { GET as validatePassHandler } from "@/app/api/claims/pass/validate/route";
import { POST as verifyRecoveryQrHandler } from "@/app/api/recovery/verify/route";
import { POST as confirmHandoverHandler } from "@/app/api/claims/handover/confirm/route";
import { POST as confirmReceiptHandler } from "@/app/api/claims/receipt/confirm/route";
import { NextRequest } from "next/server";

describe("LostIQ Verified Recovery & Safe Handover System", () => {
  describe("Server-Side Ownership Proof Verification Engine", () => {
    it("passes with exact match", () => {
      const stored = "small scratch near 3 o'clock position";
      const submitted = "small scratch near 3 o'clock position";
      const result = verifyOwnershipProof(stored, submitted);
      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
    });

    it("passes with normalized distinctive keyword overlap", () => {
      const stored = "small black scratch near the zipper";
      const submitted = "black scratch near zipper";
      const result = verifyOwnershipProof(stored, submitted);
      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(50);
    });

    it("fails when submitted answers contradict registered proof", () => {
      const stored = "blue keychain inside front pocket";
      const submitted = "red sticker on backside";
      const result = verifyOwnershipProof(stored, submitted);
      expect(result.passed).toBe(false);
      expect(result.score).toBeLessThan(50);
    });
  });

  describe("End-to-End Handover & Recovery Lifecycle Protocol", () => {
    const ownerUid = `owner-uid-${Date.now()}`;
    const finderUid = `finder-uid-${Date.now()}`;
    const intruderUid = `intruder-uid-${Date.now()}`;

    let lostReportId: string;
    let foundReportId: string;

    it("creates matching lost report with private proof and found report", async () => {
      lostReportId = `rep-lost-${Date.now()}`;
      foundReportId = `rep-found-${Date.now()}`;

      const lostReport: Report = {
        id: lostReportId,
        reportType: "LOST",
        userId: ownerUid,
        title: "Lost Casio Watch",
        description: "Lost black watch near quad",
        category: "jewelry_watches",
        brand: "Casio",
        color: "Black",
        distinctiveFeatures: "Minor surface wear",
        privateOwnershipProof: "small scratch near 3 o'clock position",
        location: { name: "Quad Bench" },
        reportedAt: new Date().toISOString(),
        status: "OPEN",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const foundReport: Report = {
        id: foundReportId,
        reportType: "FOUND",
        userId: finderUid,
        title: "Found Casio Watch",
        description: "Found black watch near quad benches",
        category: "jewelry_watches",
        brand: "Casio",
        color: "Black",
        location: { name: "Quad Bench" },
        reportedAt: new Date().toISOString(),
        status: "OPEN",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createReportInDb(lostReport);
      await createReportInDb(foundReport);

      const fetchedLost = await getReportByIdFromDb(lostReportId);
      expect(fetchedLost?.privateOwnershipProof).toBe("small scratch near 3 o'clock position");
    });

    it("rejects finder attempting to claim their own found report with 403", async () => {
      const finderToken = Buffer.from(
        JSON.stringify({ user_id: finderUid, email: "finder@campus.edu", exp: Math.floor(Date.now() / 1000) + 3600 })
      ).toString("base64");
      const jwt = `eyJhbGciOiJSUzI1NiJ9.${finderToken}.sig`;

      const req = new NextRequest("http://localhost:3005/api/claims/create", {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: foundReportId,
          lostReportId,
          proofDetails: "small scratch near 3 o'clock",
        }),
      });

      const res = await verifyClaimHandler(req);
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toContain("finder");
    });

    it("rejects intruder trying to use owner's lost report with 403", async () => {
      const intruderToken = Buffer.from(
        JSON.stringify({ user_id: intruderUid, email: "intruder@campus.edu", exp: Math.floor(Date.now() / 1000) + 3600 })
      ).toString("base64");
      const jwt = `eyJhbGciOiJSUzI1NiJ9.${intruderToken}.sig`;

      const req = new NextRequest("http://localhost:3005/api/claims/create", {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: foundReportId,
          lostReportId, // Owned by ownerUid
          proofDetails: "small scratch near 3 o'clock",
        }),
      });

      const res = await verifyClaimHandler(req);
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toContain("You do not own the linked lost report");
    });

    it("rejects verification when owner submits incorrect proof with 400", async () => {
      const ownerToken = Buffer.from(
        JSON.stringify({ user_id: ownerUid, email: "owner@campus.edu", exp: Math.floor(Date.now() / 1000) + 3600 })
      ).toString("base64");
      const jwt = `eyJhbGciOiJSUzI1NiJ9.${ownerToken}.sig`;

      const req = new NextRequest("http://localhost:3005/api/claims/create", {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: foundReportId,
          lostReportId,
          proofDetails: "red sticker on bottom", // Completely incorrect
        }),
      });

      const res = await verifyClaimHandler(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("Ownership verification failed");
    });

    let verifiedClaimId: string;
    let generatedPassToken: string;
    let generatedQrPayload: string;

    it("verifies owner and creates active claim with 201 when proof is correct", async () => {
      const ownerToken = Buffer.from(
        JSON.stringify({ user_id: ownerUid, email: "owner@campus.edu", exp: Math.floor(Date.now() / 1000) + 3600 })
      ).toString("base64");
      const jwt = `eyJhbGciOiJSUzI1NiJ9.${ownerToken}.sig`;

      const req = new NextRequest("http://localhost:3005/api/claims/create", {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: foundReportId,
          lostReportId,
          proofDetails: "scratch near 3 o'clock position on bezel",
        }),
      });

      const res = await verifyClaimHandler(req);
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.claim.status).toBe("VERIFIED");
      verifiedClaimId = body.claim.id;
    });

    it("generates a 10-minute cryptographic recovery pass token with valid QR payload", async () => {
      const ownerToken = Buffer.from(
        JSON.stringify({ user_id: ownerUid, email: "owner@campus.edu", exp: Math.floor(Date.now() / 1000) + 3600 })
      ).toString("base64");
      const jwt = `eyJhbGciOiJSUzI1NiJ9.${ownerToken}.sig`;

      const req = new NextRequest("http://localhost:3005/api/claims/pass/generate", {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
        body: JSON.stringify({ claimId: verifiedClaimId }),
      });

      const res = await generatePassHandler(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.pass.token).toBeDefined();
      expect(body.pass.qrPayload).toContain("/recovery/verify/");
      generatedPassToken = body.pass.token;
      generatedQrPayload = body.pass.qrPayload;
    });

    it("verifies the scanned QR payload with the in-app verification API (/api/recovery/verify)", async () => {
      const req = new NextRequest("http://localhost:3005/api/recovery/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: generatedQrPayload, // Full QR verification URL string
          finderUserId: finderUid,
        }),
      });

      const res = await verifyRecoveryQrHandler(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.valid).toBe(true);
      expect(body.status).toBe("READY_FOR_HANDOVER");
      expect(body.recoveryId).toBe(verifiedClaimId);
      expect(body.itemLabel).toContain("Casio Watch");
    });

    it("validates recovery pass token for finder direct URL", async () => {
      const req = new NextRequest(`http://localhost:3005/api/claims/pass/validate?token=${generatedPassToken}`);
      const res = await validatePassHandler(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.valid).toBe(true);
      expect(body.claim.id).toBe(verifiedClaimId);
      expect(body.item.title).toContain("Casio Watch");
    });

    it("allows finder to confirm handover and consumes token", async () => {
      const finderToken = Buffer.from(
        JSON.stringify({ user_id: finderUid, email: "finder@campus.edu", exp: Math.floor(Date.now() / 1000) + 3600 })
      ).toString("base64");
      const jwt = `eyJhbGciOiJSUzI1NiJ9.${finderToken}.sig`;

      const req = new NextRequest("http://localhost:3005/api/claims/handover/confirm", {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
        body: JSON.stringify({ claimId: verifiedClaimId, token: generatedPassToken }),
      });

      const res = await confirmHandoverHandler(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.claim.handoverStatus).toBe("FINDER_CONFIRMED");

      // Verify token cannot be reused via in-app verify endpoint
      const replayReq = new NextRequest("http://localhost:3005/api/recovery/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: generatedPassToken }),
      });
      const replayRes = await verifyRecoveryQrHandler(replayReq);
      expect(replayRes.status).toBe(409);
      const replayBody = await replayRes.json();
      expect(replayBody.reason).toBe("ALREADY_USED");
    });

    it("allows owner to confirm receipt, transitions reports to RECOVERED, and generates receipt", async () => {
      const ownerToken = Buffer.from(
        JSON.stringify({ user_id: ownerUid, email: "owner@campus.edu", exp: Math.floor(Date.now() / 1000) + 3600 })
      ).toString("base64");
      const jwt = `eyJhbGciOiJSUzI1NiJ9.${ownerToken}.sig`;

      const req = new NextRequest("http://localhost:3005/api/claims/receipt/confirm", {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
        body: JSON.stringify({ claimId: verifiedClaimId }),
      });

      const res = await confirmReceiptHandler(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.claim.status).toBe("COMPLETED");
      expect(body.receipt).toBeDefined();
      expect(body.receipt.receiptId).toContain("LIQ-");
      expect(body.receipt.status).toBe("RECOVERED");

      // Verify reports in DB are marked RECOVERED (lost) and RETURNED (found)
      const updatedLost = await getReportByIdFromDb(lostReportId);
      const updatedFound = await getReportByIdFromDb(foundReportId);
      expect(updatedLost?.status).toBe("RECOVERED");
      expect(updatedFound?.status).toBe("RETURNED");
    });
  });
});
