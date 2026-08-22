import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession } from "@/lib/auth/server-auth";
import {
  getClaimByIdFromDb,
  saveRecoveryTokenInDb,
  logRecoveryEvent,
} from "@/lib/supabase/repository";
import { generateRecoveryToken } from "@/lib/recovery/verification";
import { RecoveryToken } from "@/types";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const TOKEN_EXPIRY_MINUTES = 10;

export async function POST(req: NextRequest) {
  try {
    const session = await verifyServerSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    if (!body.claimId) {
      return NextResponse.json({ success: false, error: "Missing claimId" }, { status: 400 });
    }

    const claim = await getClaimByIdFromDb(body.claimId);
    if (!claim) {
      return NextResponse.json({ success: false, error: "Claim not found" }, { status: 404 });
    }

    // Only Verified Lost Item Owner can generate the recovery pass
    if (claim.claimantId.toLowerCase() !== session.uid.toLowerCase()) {
      return NextResponse.json({ success: false, error: "Forbidden: You are not the verified owner for this claim" }, { status: 403 });
    }

    if (claim.status !== "VERIFIED" && claim.status !== "PENDING_HANDOVER") {
      return NextResponse.json({ success: false, error: "Claim is not in a valid state for pass generation" }, { status: 400 });
    }

    // Generate cryptographic token
    const { token, hash } = generateRecoveryToken();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000).toISOString();

    const tokenRecord: RecoveryToken = {
      id: `tok-${Date.now()}`,
      claimId: claim.id,
      token,
      tokenHash: hash,
      expiresAt,
      createdAt: new Date().toISOString(),
    };

    await saveRecoveryTokenInDb(tokenRecord);

    await logRecoveryEvent({
      claimId: claim.id,
      eventType: "RECOVERY_PASS_CREATED",
      actorUserId: session.uid,
      metadata: { expiresAt },
    });

    // Derive canonical verification URL for QR payload
    const origin = req.nextUrl.origin || "https://campus-not-found-ai.vercel.app";
    const verificationUrl = `${origin}/recovery/verify/${token}`;

    logger.info("Recovery pass generated successfully", "RecoveryPassAPI", {
      claimId: claim.id,
      token,
      expiresAt,
      verificationUrl,
    });

    return NextResponse.json({
      success: true,
      pass: {
        token,
        claimId: claim.id,
        expiresAt,
        verificationUrl,
        qrPayload: verificationUrl,
      },
    }, { status: 200 });
  } catch (err: any) {
    logger.error("Error generating recovery pass", "RecoveryPassAPI", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to generate recovery pass" }, { status: 500 });
  }
}
