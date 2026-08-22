import { NextRequest, NextResponse } from "next/server";
import { getReportsFromDb } from "@/lib/supabase/repository";
import { searchAndRankReports } from "@/lib/search/search-engine";
import { ReportType, ReportStatus } from "@/types";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const reportType = (searchParams.get("type") || searchParams.get("reportType")) as ReportType | null;
    const category = searchParams.get("category") || undefined;
    const zone = searchParams.get("zone") || undefined;
    const status = (searchParams.get("status") as ReportStatus) || undefined;

    // Fetch candidate reports from database
    const allReports = await getReportsFromDb({
      reportType: reportType && (reportType as any) !== "ALL" ? reportType : undefined,
      category: category && category !== "all" ? category : undefined,
      status: status,
      limitCount: 100,
    });

    // Execute natural language & multi-token relevance search
    const results = searchAndRankReports(allReports, {
      query,
      reportType: reportType && (reportType as any) !== "ALL" ? reportType : undefined,
      category: category && category !== "all" ? category : undefined,
      zone,
    });

    // Zero-knowledge privacy invariant: Strip private ownership proof from search results
    const sanitizedResults = results.map((r) => ({
      ...r,
      privateOwnershipProof: undefined,
    }));

    logger.info("Search executed successfully", "SearchAPI", { query, resultCount: sanitizedResults.length });

    return NextResponse.json({ success: true, count: sanitizedResults.length, reports: sanitizedResults });
  } catch (err: any) {
    logger.error("Search API failed", "SearchAPI", err);
    return NextResponse.json({ success: false, error: err.message || "Search failed" }, { status: 500 });
  }
}
