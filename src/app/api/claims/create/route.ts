import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession } from "@/lib/auth/server-auth";
import {
  getReportByIdFromDb,
  createClaimInDb,
  hasExistingClaim,
  logRecoveryEvent,
} from "@/lib/supabase/repository";
import { verifyOwnershipProof } from "@/lib/recovery/verification";
import { Claim } from "@/types";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await verifyServerSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication failure: Missing or invalid credentials" },
        { status: 401 }
      );
    }

    const claimantUid = session.uid;
    const body = await req.json().catch(() => ({}));

    if (!body.reportId || !body.proofDetails || !body.proofDetails.trim()) {
      return NextResponse.json(
        { success: false, error: "Validation failure: Missing required claim fields" },
        { status: 400 }
      );
    }

    // 1. Verify Target FOUND report
    const targetFound = await getReportByIdFromDb(body.reportId);
    if (!targetFound) {
      return NextResponse.json(
        { success: false, error: "Target found report does not exist" },
        { status: 404 }
      );
    }

    if (targetFound.reportType !== "FOUND") {
      return NextResponse.json(
        { success: false, error: "Only FOUND reports can receive ownership claims" },
        { status: 403 }
      );
    }

    // 2. Prevent Finder from claiming own item
    if (targetFound.userId && targetFound.userId.toLowerCase() === claimantUid.toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: "You are registered as the finder for this item. Ownership claims can only be submitted by the owner who lost it.",
        },
        { status: 403 }
      );
    }

    // 3. Verify Source LOST report ownership (if lostReportId provided)
    let expectedProof = targetFound.distinctiveFeatures || targetFound.description;
    let sourceLostId = body.lostReportId || null;

    if (body.lostReportId) {
      const sourceLost = await getReportByIdFromDb(body.lostReportId);
      if (!sourceLost) {
        return NextResponse.json(
          { success: false, error: "Linked lost report does not exist" },
          { status: 404 }
        );
      }

      if (sourceLost.userId.toLowerCase() !== claimantUid.toLowerCase()) {
        return NextResponse.json(
          { success: false, error: "You do not own the linked lost report for this claim" },
          { status: 403 }
        );
      }

      expectedProof = sourceLost.privateOwnershipProof || sourceLost.distinctiveFeatures || sourceLost.description;
    }

    // 4. Duplicate Claim check
    const alreadyClaimed = await hasExistingClaim(body.reportId, claimantUid);
    if (alreadyClaimed) {
      return NextResponse.json(
        { success: false, error: "You have already submitted an active ownership claim for this item" },
        { status: 409 }
      );
    }

    // 5. Server-side Private Proof Verification
    const verificationResult = verifyOwnershipProof(expectedProof, body.proofDetails);
    const claimId = `claim-${Date.now()}`;

    await logRecoveryEvent({
      claimId,
      eventType: "OWNER_VERIFICATION_STARTED",
      actorUserId: claimantUid,
      metadata: { targetFoundId: targetFound.id, sourceLostId },
    });

    if (!verificationResult.passed && body.lostReportId) {
      await logRecoveryEvent({
        claimId,
        eventType: "OWNER_VERIFICATION_FAILED",
        actorUserId: claimantUid,
        metadata: { score: verificationResult.score },
      });

      return NextResponse.json(
        {
          success: false,
          error: "Ownership verification failed: The identifying details provided did not sufficiently match the private proof recorded on your lost report.",
        },
        { status: 400 }
      );
    }

    // 6. Create Verified Claim
    const claim: Claim = {
      id: claimId,
      reportId: targetFound.id,
      lostReportId: sourceLostId || "",
      claimantId: claimantUid,
      finderId: targetFound.userId,
      proofDetails: body.proofDetails.trim(),
      verificationAttempts: 1,
      verificationStatus: "PASSED",
      handoverStatus: "NONE",
      status: "VERIFIED",
      verifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const savedClaim = await createClaimInDb(claim);

    await logRecoveryEvent({
      claimId: savedClaim.id,
      eventType: "OWNER_VERIFICATION_PASSED",
      actorUserId: claimantUid,
      metadata: { score: verificationResult.score },
    });

    await logRecoveryEvent({
      claimId: savedClaim.id,
      eventType: "CLAIM_CREATED",
      actorUserId: claimantUid,
    });

    logger.info("Ownership claim verified & created successfully", "ClaimsAPI", {
      id: savedClaim.id,
      reportId: savedClaim.reportId,
      claimantId: savedClaim.claimantId,
    });

    return NextResponse.json({ success: true, claim: savedClaim }, { status: 201 });
  } catch (err: any) {
    logger.error("Error creating verified claim", "ClaimsAPI", err);
    return NextResponse.json({ success: false, error: err.message || "Internal server error" }, { status: 500 });
  }
}
