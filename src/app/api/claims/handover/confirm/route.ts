import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession } from "@/lib/auth/server-auth";
import {
  getClaimByIdFromDb,
  updateClaimInDb,
  getRecoveryTokenByHash,
  markRecoveryTokenUsed,
  logRecoveryEvent,
} from "@/lib/supabase/repository";
import { hashRecoveryToken } from "@/lib/recovery/verification";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await verifyServerSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    if (!body.claimId) {
      return NextResponse.json({ success: false, error: "Missing claimId" }, { status: 400 });
    }

    const claim = await getClaimByIdFromDb(body.claimId);
    if (!claim) {
      return NextResponse.json({ success: false, error: "Claim not found" }, { status: 404 });
    }

    // Only Finder can confirm physical handover
    if (claim.finderId.toLowerCase() !== session.uid.toLowerCase()) {
      return NextResponse.json({ success: false, error: "Forbidden: Only the finder in custody can confirm handover" }, { status: 403 });
    }

    if (claim.status === "COMPLETED" || claim.handoverStatus === "FINDER_CONFIRMED") {
      return NextResponse.json({ success: false, error: "Handover has already been confirmed" }, { status: 409 });
    }

    // If token passed, consume single-use token
    if (body.token) {
      const tokenHash = hashRecoveryToken(body.token);
      await markRecoveryTokenUsed(tokenHash);
      await logRecoveryEvent({
        claimId: claim.id,
        eventType: "RECOVERY_PASS_USED",
        actorUserId: session.uid,
      });
    }

    const updatedClaim = await updateClaimInDb(claim.id, {
      handoverStatus: "FINDER_CONFIRMED",
      status: "FINDER_CONFIRMED",
      finderConfirmedAt: new Date().toISOString(),
    });

    await logRecoveryEvent({
      claimId: claim.id,
      eventType: "FINDER_CONFIRMED",
      actorUserId: session.uid,
      metadata: { finderConfirmedAt: new Date().toISOString() },
    });

    logger.info("Finder handover confirmed successfully", "HandoverAPI", { claimId: claim.id, finderId: session.uid });

    return NextResponse.json({ success: true, claim: updatedClaim }, { status: 200 });
  } catch (err: any) {
    logger.error("Error confirming handover", "HandoverAPI", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to confirm handover" }, { status: 500 });
  }
}
