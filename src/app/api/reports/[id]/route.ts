import { NextRequest, NextResponse } from "next/server";
import { getReportByIdFromDb } from "@/lib/supabase/repository";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const report = await getReportByIdFromDb(params.id);

    if (!report) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    logger.error("Error fetching report details", "ReportDetailsAPI", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to fetch report" }, { status: 500 });
  }
}
