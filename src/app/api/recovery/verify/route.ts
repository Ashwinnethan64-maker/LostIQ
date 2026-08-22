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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawInput = body.token || "";

    if (!rawInput || typeof rawInput !== "string") {
      return NextResponse.json({
        valid: false,
        reason: "INVALID_TOKEN",
        message: "Missing or malformed recovery token.",
      }, { status: 400 });
    }

    // Extract token if a full URL or LOSTIQ_RECOVERY_TOKEN format was passed
    let token = rawInput.trim();
    if (token.includes("/recovery/verify/")) {
      token = token.split("/recovery/verify/")[1].split("?")[0].split("#")[0].trim();
    } else if (token.includes("token=")) {
      const match = token.match(/token=([^&]+)/);
      if (match) token = match[1].trim();
    } else if (token.startsWith("LOSTIQ_RECOVERY_TOKEN=")) {
      token = token.replace("LOSTIQ_RECOVERY_TOKEN=", "").trim();
    }

    const tokenHash = hashRecoveryToken(token);
    const tokenRecord = await getRecoveryTokenByHash(tokenHash);

    if (!tokenRecord) {
      return NextResponse.json({
        valid: false,
        reason: "QR_NOT_LOSTIQ",
        message: "This is not a valid LostIQ recovery pass.",
      }, { status: 404 });
    }

    // Check expiration
    const isExpired = new Date(tokenRecord.expiresAt).getTime() < Date.now();
    if (isExpired) {
      return NextResponse.json({
        valid: false,
        reason: "EXPIRED",
        message: "Recovery pass has expired. Owner must generate a fresh pass.",
        expiresAt: tokenRecord.expiresAt,
      }, { status: 410 });
    }

    // Check single-use
    if (tokenRecord.usedAt) {
      return NextResponse.json({
        valid: false,
        reason: "ALREADY_USED",
        message: "Recovery pass has already been used and cannot be reused.",
        usedAt: tokenRecord.usedAt,
      }, { status: 409 });
    }

    const claim = await getClaimByIdFromDb(tokenRecord.claimId);
    if (!claim) {
      return NextResponse.json({
        valid: false,
        reason: "NOT_FOUND",
        message: "Linked recovery claim was not found.",
      }, { status: 404 });
    }

    // Optional claim context verification
    if (body.claimId && claim.id !== body.claimId) {
      return NextResponse.json({
        valid: false,
        reason: "WRONG_RECOVERY",
        message: "This recovery pass does not match the current case.",
      }, { status: 400 });
    }

    const foundReport = await getReportByIdFromDb(claim.reportId);
    const lostReport = await getReportByIdFromDb(claim.lostReportId);

    // Audit log scan event
    await logRecoveryEvent({
      claimId: claim.id,
      eventType: "QR_TOKEN_VERIFIED",
      actorUserId: body.finderUserId || "finder-scan",
      metadata: { expiresAt: tokenRecord.expiresAt },
    });

    return NextResponse.json({
      valid: true,
      status: "READY_FOR_HANDOVER",
      recoveryId: claim.id,
      claimId: claim.id,
      itemLabel: foundReport?.title || lostReport?.title || "Item in Custody",
      message: "Recovery pass verified successfully.",
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
      token,
    }, { status: 200 });
  } catch (err: any) {
    logger.error("Error in recovery verification endpoint", "RecoveryVerifyAPI", err);
    return NextResponse.json({
      valid: false,
      reason: "SERVER_ERROR",
      message: "Verification service unavailable — please try again.",
    }, { status: 500 });
  }
}
