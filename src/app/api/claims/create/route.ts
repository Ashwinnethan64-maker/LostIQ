import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession } from "@/lib/auth/server-auth";
import { Claim } from "@/types";
import { logger } from "@/lib/logger";

const localClaims: Claim[] = [];

export async function POST(req: NextRequest) {
  try {
    const session = await verifyServerSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.reportId || !body.proofDetails) {
      return NextResponse.json({ success: false, error: "Missing required claim fields" }, { status: 400 });
    }

    const claim: Claim = {
      id: `claim-${Date.now()}`,
      reportId: body.reportId,
      claimantId: session.uid || body.claimantId,
      proofDetails: body.proofDetails,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localClaims.push(claim);
    logger.info("Claim created successfully", "ClaimsAPI", { id: claim.id, reportId: claim.reportId });

    return NextResponse.json({ success: true, claim }, { status: 201 });
  } catch (err: any) {
    logger.error("Error submitting claim", "ClaimsAPI", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
