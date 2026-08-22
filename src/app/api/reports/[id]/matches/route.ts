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

    // Opposite report type candidates: STRICT ENFORCEMENT
    const oppositeType = report.reportType === "LOST" ? "FOUND" : "LOST";
    
    // Retrieve candidates scoped by opposite type and open status at DB layer
    const candidates = await getReportsFromDb({
      reportType: oppositeType,
      status: "OPEN",
      limitCount: 50,
    });

    // Run deterministic multi-signal matching engine with hard gates and threshold filter
    const matches = matchingEngine.evaluateCandidates(report, candidates);

    logger.info("Generated filtered matches for report", "MatchesAPI", {
      reportId: report.id,
      reportCategory: report.category,
      oppositeType,
      candidatePoolSize: candidates.length,
      qualifiedMatches: matches.length,
    });

    return NextResponse.json({ success: true, count: matches.length, matches });
  } catch (err: any) {
    logger.error("Error evaluating report matches", "MatchesAPI", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to calculate matches" }, { status: 500 });
  }
}
