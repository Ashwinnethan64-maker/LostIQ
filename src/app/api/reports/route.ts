import { NextRequest, NextResponse } from "next/server";
import { getReportsFromDb } from "@/lib/supabase/repository";
import { ReportType, ReportStatus } from "@/types";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    // Support both 'type' and 'reportType' query parameters
    const reportType = (searchParams.get("type") || searchParams.get("reportType")) as ReportType | null;
    const category = searchParams.get("category");
    const status = searchParams.get("status") as ReportStatus | null;
    const search = searchParams.get("search") || searchParams.get("q");
    const userId = searchParams.get("userId");

    const reports = await getReportsFromDb({
      reportType: (reportType && reportType !== ("ALL" as any)) ? reportType : undefined,
      category: (category && category !== "all") ? category : undefined,
      status: status || undefined,
      search: search || undefined,
      userId: userId || undefined,
      limitCount: 50,
    });

    return NextResponse.json({ success: true, count: reports.length, reports });
  } catch (err: any) {
    logger.error("Error fetching reports", "ReportsAPI", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to fetch reports" }, { status: 500 });
  }
}
