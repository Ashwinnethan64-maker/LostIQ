import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession } from "@/lib/auth/server-auth";
import {
  getClaimByIdFromDb,
  getReportByIdFromDb,
  getRecoveryEventsForClaim,
} from "@/lib/supabase/repository";
import { RecoveryReceipt } from "@/types";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await verifyServerSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const claim = await getClaimByIdFromDb(params.id);
    if (!claim) {
      return NextResponse.json({ success: false, error: "Claim record not found" }, { status: 404 });
    }

    const isOwner = claim.claimantId.toLowerCase() === session.uid.toLowerCase();
    const isFinder = claim.finderId.toLowerCase() === session.uid.toLowerCase();
    const isAdmin = session.role === "admin";

    if (!isOwner && !isFinder && !isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden: Not authorized to view this claim" }, { status: 403 });
    }

    const targetFound = await getReportByIdFromDb(claim.reportId);
    const sourceLost = await getReportByIdFromDb(claim.lostReportId);
    const events = await getRecoveryEventsForClaim(claim.id);

    let receipt: RecoveryReceipt | null = null;
    if (claim.status === "COMPLETED") {
      receipt = {
        receiptId: `LIQ-${claim.id.slice(-6).toUpperCase()}`,
        claimId: claim.id,
        itemTitle: targetFound?.title || sourceLost?.title || "Recovered Item",
        lostReportId: claim.lostReportId,
        foundReportId: claim.reportId,
        matchScore: 94,
        ownerVerified: true,
        finderConfirmed: true,
        ownerReceiptConfirmed: true,
        recoveredAt: claim.updatedAt,
        status: "RECOVERED",
      };
    }

    return NextResponse.json({
      success: true,
      claim,
      foundReport: targetFound,
      lostReport: sourceLost,
      events,
      receipt,
      userRole: isOwner ? "OWNER" : isFinder ? "FINDER" : "ADMIN",
    }, { status: 200 });
  } catch (err: any) {
    logger.error("Error fetching claim details", "ClaimDetailAPI", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to fetch claim" }, { status: 500 });
  }
}
