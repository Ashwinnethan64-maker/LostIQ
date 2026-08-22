import { NextRequest, NextResponse } from "next/server";
import { verifyServerSession } from "@/lib/auth/server-auth";
import { getClaimsFromDb } from "@/lib/supabase/repository";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await verifyServerSession(req);
    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get("reportId");
    const userId = searchParams.get("userId") || session?.uid;

    const claims = await getClaimsFromDb({
      reportId: reportId || undefined,
      claimantId: userId || undefined,
    });

    return NextResponse.json({ success: true, count: claims.length, claims });
  } catch (err: any) {
    logger.error("Error fetching claims", "ClaimsAPI", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to fetch claims" }, { status: 500 });
  }
}
