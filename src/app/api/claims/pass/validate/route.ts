import { NextRequest, NextResponse } from "next/server";
import {
  getRecoveryTokenByHash,
  getClaimByIdFromDb,
  getReportByIdFromDb,
  logRecoveryEvent,
} from "@/lib/supabase/repository";
import { hashRecoveryToken } from "@/lib/recovery/verification";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ success: false, error: "Missing recovery token parameter" }, { status: 400 });
    }

    const tokenHash = hashRecoveryToken(token);
    const tokenRecord = await getRecoveryTokenByHash(tokenHash);

    if (!tokenRecord) {
      return NextResponse.json({ success: false, error: "Invalid recovery token" }, { status: 404 });
    }

    // Check expiration
    const isExpired = new Date(tokenRecord.expiresAt).getTime() < Date.now();
    if (isExpired) {
      return NextResponse.json({ success: false, error: "Recovery pass has expired. Owner must generate a fresh pass." }, { status: 410 });
    }

    // Check single-use
    if (tokenRecord.usedAt) {
      return NextResponse.json({ success: false, error: "Recovery pass has already been used and cannot be reused." }, { status: 409 });
    }

    const claim = await getClaimByIdFromDb(tokenRecord.claimId);
    if (!claim) {
      return NextResponse.json({ success: false, error: "Linked recovery claim not found" }, { status: 404 });
    }

    const foundReport = await getReportByIdFromDb(claim.reportId);
    const lostReport = await getReportByIdFromDb(claim.lostReportId);

    return NextResponse.json({
      success: true,
      valid: true,
      claim: {
        id: claim.id,
        status: claim.status,
        finderId: claim.finderId,
        claimantId: claim.claimantId,
        handoverStatus: claim.handoverStatus,
      },
      item: {
        id: foundReport?.id,
        title: foundReport?.title || lostReport?.title || "Item in Custody",
        category: foundReport?.category || lostReport?.category,
        brand: foundReport?.brand || lostReport?.brand,
        color: foundReport?.color || lostReport?.color,
        location: foundReport?.location?.name,
        imageUrl: foundReport?.imageUrl || null,
      },
      expiresAt: tokenRecord.expiresAt,
    }, { status: 200 });
  } catch (err: any) {
    logger.error("Error validating recovery pass token", "PassValidateAPI", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to validate recovery pass" }, { status: 500 });
  }
}
