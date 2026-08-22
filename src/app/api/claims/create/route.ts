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

    const currentUserId = session.uid;
    const body = await req.json().catch(() => ({}));

    if (!body.reportId || !body.proofDetails || !body.proofDetails.trim()) {
      return NextResponse.json(
        { success: false, error: "Validation failure: Missing required claim fields" },
        { status: 400 }
      );
    }

    // Step 1: Load Target FOUND report from database
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

    // Step 2: Strict Invariant: Prevent Finder from claiming own item
    if (targetFound.userId && targetFound.userId.toLowerCase() === currentUserId.toLowerCase()) {
      logger.warn("Finder attempted to claim own found item", "ClaimsAPI", {
        currentUserId,
        foundReportId: targetFound.id,
        finderUserId: targetFound.userId,
      });
      return NextResponse.json(
        {
          success: false,
          error: "You are registered as the finder for this item. Ownership claims can only be submitted by the owner who lost it.",
        },
        { status: 403 }
      );
    }

    // Step 3: Load & Validate Source LOST report (if provided)
    let sourceLost = null;
    let expectedProof = targetFound.distinctiveFeatures || targetFound.description;

    if (body.lostReportId) {
      sourceLost = await getReportByIdFromDb(body.lostReportId);
      if (!sourceLost) {
        return NextResponse.json(
          { success: false, error: "Linked lost report does not exist" },
          { status: 404 }
        );
      }

      if (sourceLost.reportType !== "LOST") {
        return NextResponse.json(
          { success: false, error: "The linked source report must be of type LOST" },
          { status: 400 }
        );
      }

      // Check that the authenticated user actually owns the lost report
      const lostOwnerUserId = sourceLost.userId;
      if (lostOwnerUserId.toLowerCase() !== currentUserId.toLowerCase()) {
        logger.warn("User attempted to claim with a lost report they do not own", "ClaimsAPI", {
          currentUserId,
          lostReportId: sourceLost.id,
          lostOwnerUserId,
        });
        return NextResponse.json(
          { success: false, error: "You do not own the linked lost report for this claim" },
          { status: 403 }
        );
      }

      expectedProof = sourceLost.privateOwnershipProof || sourceLost.distinctiveFeatures || sourceLost.description;
    }

    // Step 4: Validate proof details
    const verificationResult = verifyOwnershipProof(expectedProof, body.proofDetails);
    const claimId = `claim-${Date.now()}`;

    // Debug logging for verified recovery traceability
    logger.info("Evaluating ownership claim proof", "ClaimsAPI", {
      currentUserId,
      lostReportId: sourceLost?.id,
      lostOwnerUserId: sourceLost?.userId,
      foundReportId: targetFound.id,
      foundFinderUserId: targetFound.userId,
      resolvedRole: "OWNER",
      verificationScore: verificationResult.score,
      verificationPassed: verificationResult.passed,
    });

    await logRecoveryEvent({
      claimId,
      eventType: "OWNER_VERIFICATION_STARTED",
      actorUserId: currentUserId,
      metadata: { targetFoundId: targetFound.id, sourceLostId: sourceLost?.id },
    });

    // Check verification score
    if (!verificationResult.passed && sourceLost) {
      await logRecoveryEvent({
        claimId,
        eventType: "OWNER_VERIFICATION_FAILED",
        actorUserId: currentUserId,
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

    // Step 5: Create Verified Claim Record
    const claim: Claim = {
      id: claimId,
      reportId: targetFound.id,
      lostReportId: sourceLost?.id || "",
      claimantId: currentUserId,
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
      actorUserId: currentUserId,
      metadata: { score: verificationResult.score },
    });

    await logRecoveryEvent({
      claimId: savedClaim.id,
      eventType: "CLAIM_CREATED",
      actorUserId: currentUserId,
    });

    return NextResponse.json({ success: true, claim: savedClaim }, { status: 201 });
  } catch (err: any) {
    logger.error("Error creating verified claim", "ClaimsAPI", err);
    return NextResponse.json({ success: false, error: err.message || "Internal server error" }, { status: 500 });
  }
}
