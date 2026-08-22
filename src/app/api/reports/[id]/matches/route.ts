import { NextRequest, NextResponse } from "next/server";
import { getReportByIdFromDb, getReportsFromDb } from "@/lib/supabase/repository";
import { matchingEngine } from "@/lib/matching/engine";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const report = await getReportByIdFromDb(params.id);

    if (!report) {
      return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
    }

    // Opposite report type candidates with smart candidate filtering
    const oppositeType = report.reportType === "LOST" ? "FOUND" : "LOST";
    
    // Retrieve candidates scoped by opposite type, open status, and reasonable limit
    const candidates = await getReportsFromDb({
      reportType: oppositeType,
      status: "OPEN",
      limitCount: 30, // Targeted candidate retrieval
    });

    // Run deterministic multi-signal matching engine
    const matches = matchingEngine.evaluateCandidates(report, candidates);

    logger.info("Generated ranked matches for report", "MatchesAPI", {
      reportId: report.id,
      matchCount: matches.length,
    });

    return NextResponse.json({ success: true, count: matches.length, matches });
  } catch (err: any) {
    logger.error("Error evaluating report matches", "MatchesAPI", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to calculate matches" }, { status: 500 });
  }
}
