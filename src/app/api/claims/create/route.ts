import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession } from "@/lib/auth/server-auth";
import { getReportByIdFromDb, createClaimInDb, hasExistingClaim } from "@/lib/supabase/repository";
import { Claim } from "@/types";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const hasAuthHeader = Boolean(req.headers.get("authorization") || req.headers.get("x-firebase-token"));
  logger.info("Claim request received", "ClaimsAPI", { tokenPresent: hasAuthHeader });

  try {
    // 1. Verify token & resolve authenticated Firebase UID
    const session = await verifyServerSession(req);
    if (!session) {
      logger.warn("Claim request rejected: unauthenticated or invalid token", "ClaimsAPI", {
        tokenPresent: hasAuthHeader,
        tokenVerified: false,
      });
      return NextResponse.json(
        { success: false, error: "Authentication failure: Missing or invalid credentials" },
        { status: 401 }
      );
    }

    const claimantUid = session.uid;
    logger.info("Claim token verified", "ClaimsAPI", {
      tokenPresent: true,
      tokenVerified: true,
      firebaseUidResolved: true,
      claimantUid,
    });

    const body = await req.json().catch(() => ({}));

    // 2. Validate input parameters
    if (!body.reportId || !body.proofDetails || !body.proofDetails.trim()) {
      return NextResponse.json(
        { success: false, error: "Validation failure: Missing reportId or proofDetails" },
        { status: 400 }
      );
    }

    // 3. Verify target report existence & type in Supabase
    const targetReport = await getReportByIdFromDb(body.reportId);
    if (!targetReport) {
      logger.warn("Claim rejected: target report not found", "ClaimsAPI", {
        reportId: body.reportId,
        reportFound: false,
      });
      return NextResponse.json(
        { success: false, error: "Validation failure: Target report does not exist" },
        { status: 404 }
      );
    }

    logger.info("Target report located", "ClaimsAPI", {
      reportFound: true,
      reportType: targetReport.reportType,
      finderUid: targetReport.userId,
    });

    // 4. Authorization Rule: Only FOUND reports can be claimed
    if (targetReport.reportType !== "FOUND") {
      logger.warn("Claim rejected: report is not a FOUND item", "ClaimsAPI", {
        reportId: body.reportId,
        authorizationResult: "denied",
      });
      return NextResponse.json(
        { success: false, error: "Authorization error: Only FOUND reports can receive ownership claims" },
        { status: 403 }
      );
    }

    // 5. Authorization Rule: The finder cannot claim their own found report
    if (targetReport.userId && targetReport.userId.toLowerCase() === claimantUid.toLowerCase()) {
      logger.warn("Claim rejected: finder attempting to claim their own found report", "ClaimsAPI", {
        reportId: body.reportId,
        claimantUid,
        authorizationResult: "denied",
      });
      return NextResponse.json(
        { success: false, error: "Authorization error: You cannot file an ownership claim on an item you reported found" },
        { status: 403 }
      );
    }

    // 6. Duplicate Claim Prevention
    const alreadyClaimed = await hasExistingClaim(body.reportId, claimantUid);
    if (alreadyClaimed) {
      logger.warn("Duplicate claim prevented", "ClaimsAPI", {
        reportId: body.reportId,
        claimantUid,
      });
      return NextResponse.json(
        { success: false, error: "You have already submitted an active ownership claim for this item" },
        { status: 409 }
      );
    }

    // 7. Create and persist Claim record
    const claim: Claim = {
      id: `claim-${Date.now()}`,
      reportId: body.reportId,
      claimantId: claimantUid, // Guaranteed derived from verified token
      proofDetails: body.proofDetails.trim(),
      status: "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const savedClaim = await createClaimInDb(claim);
    logger.info("Claim authorized & created successfully", "ClaimsAPI", {
      id: savedClaim.id,
      reportId: savedClaim.reportId,
      claimantId: savedClaim.claimantId,
      authorizationResult: "allowed",
    });

    return NextResponse.json({ success: true, claim: savedClaim }, { status: 201 });
  } catch (err: any) {
    logger.error("Error creating claim", "ClaimsAPI", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
