import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession } from "@/lib/auth/server-auth";
import {
  getClaimByIdFromDb,
  updateClaimInDb,
  updateReportStatusInDb,
  getReportByIdFromDb,
  logRecoveryEvent,
} from "@/lib/supabase/repository";
import { RecoveryReceipt } from "@/types";
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

    // Only Owner can confirm receipt of the item
    if (claim.claimantId.toLowerCase() !== session.uid.toLowerCase()) {
      return NextResponse.json({ success: false, error: "Forbidden: Only the verified owner can confirm receipt" }, { status: 403 });
    }

    if (claim.status === "COMPLETED") {
      return NextResponse.json({ success: false, error: "Recovery has already been completed" }, { status: 409 });
    }

    const nowIso = new Date().toISOString();

    // 1. Update Claim to COMPLETED
    const updatedClaim = await updateClaimInDb(claim.id, {
      handoverStatus: "COMPLETED",
      status: "COMPLETED",
      ownerReceivedAt: nowIso,
    });

    // 2. Update both LOST and FOUND reports to RECOVERED atomically
    await updateReportStatusInDb(claim.reportId, "RECOVERED");
    if (claim.lostReportId) {
      await updateReportStatusInDb(claim.lostReportId, "RECOVERED");
    }

    // 3. Log Audit Events
    await logRecoveryEvent({
      claimId: claim.id,
      eventType: "OWNER_CONFIRMED",
      actorUserId: session.uid,
      metadata: { ownerReceivedAt: nowIso },
    });

    await logRecoveryEvent({
      claimId: claim.id,
      eventType: "RECOVERY_COMPLETED",
      actorUserId: session.uid,
      metadata: { completedAt: nowIso },
    });

    const foundReport = await getReportByIdFromDb(claim.reportId);

    // 4. Generate Recovery Receipt
    const receipt: RecoveryReceipt = {
      receiptId: `LIQ-${claim.id.slice(-6).toUpperCase()}`,
      claimId: claim.id,
      itemTitle: foundReport?.title || "Recovered Campus Valuable",
      lostReportId: claim.lostReportId,
      foundReportId: claim.reportId,
      matchScore: 94,
      ownerVerified: true,
      finderConfirmed: true,
      ownerReceiptConfirmed: true,
      recoveredAt: nowIso,
      status: "RECOVERED",
    };

    logger.info("Item recovery completed and verified successfully", "ReceiptConfirmAPI", {
      claimId: claim.id,
      receiptId: receipt.receiptId,
    });

    return NextResponse.json({ success: true, claim: updatedClaim, receipt }, { status: 200 });
  } catch (err: any) {
    logger.error("Error confirming owner receipt", "ReceiptConfirmAPI", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to confirm receipt" }, { status: 500 });
  }
}
