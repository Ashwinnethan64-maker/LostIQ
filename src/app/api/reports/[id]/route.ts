import { NextRequest, NextResponse } from "next/server";
import { getReportByIdFromDb } from "@/lib/supabase/repository";
import { verifyServerSession } from "@/lib/auth/server-auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const report = await getReportByIdFromDb(params.id);

    if (!report) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    // Check if requester is the genuine creator of this report
    const session = await verifyServerSession(req);
    const isOwner = session && session.uid.toLowerCase() === report.userId.toLowerCase();

    // Zero-knowledge privacy invariant: Strip private ownership proof if not the genuine owner
    const safeReport = {
      ...report,
      privateOwnershipProof: isOwner ? report.privateOwnershipProof : undefined,
    };

    return NextResponse.json({ success: true, report: safeReport });
  } catch (err: any) {
    logger.error("Error fetching report details", "ReportDetailsAPI", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to fetch report" }, { status: 500 });
  }
}
