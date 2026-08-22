import { NextRequest, NextResponse } from "next/server";
import { getReportsFromDb } from "@/lib/supabase/repository";
import { searchAndRankReports } from "@/lib/search/search-engine";
import { ReportType } from "@/types";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const reportType = searchParams.get("type") as ReportType | null;
    const category = searchParams.get("category") || undefined;
    const zone = searchParams.get("zone") || undefined;

    // Fetch candidate reports from database
    const allReports = await getReportsFromDb({
      reportType: reportType || undefined,
      category,
      status: "OPEN",
      limitCount: 100,
    });

    // Execute natural language & multi-token relevance search
    const results = searchAndRankReports(allReports, {
      query,
      reportType: reportType || undefined,
      category,
      zone,
    });

    logger.info("Search executed successfully", "SearchAPI", { query, resultCount: results.length });

    return NextResponse.json({ success: true, count: results.length, reports: results });
  } catch (err: any) {
    logger.error("Search API failed", "SearchAPI", err);
    return NextResponse.json({ success: false, error: err.message || "Search failed" }, { status: 500 });
  }
}
