import { NextRequest, NextResponse } from "next/server";
import { createReportInDb } from "@/lib/supabase/repository";
import { aiAnalysisService } from "@/lib/ai/ai-analysis.service";
import { verifyServerSession } from "@/lib/auth/server-auth";
import { Report, AIRawAttributes } from "@/types";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    // Verify server session
    const session = await verifyServerSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.title || !body.description || !body.reportType) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Preserve client-provided user ID (e.g. Firebase Auth UID)
    const effectiveUserId = body.userId || session.uid || "demo-student-101";
    const reportId = body.id || `rep-${Date.now()}`;

    // Step 1: Execute Gemini Multimodal Analysis with Graceful Fallback
    let aiAttributes: AIRawAttributes | null = null;
    try {
      aiAttributes = await aiAnalysisService.analyzeItem({
        title: body.title,
        description: body.description,
        category: body.category || "other",
        imageBase64OrUrl: body.imageUrl,
      });
    } catch (aiErr) {
      logger.warn("AI Analysis experienced an error. Continuing with basic report persistence.", "ReportsCreateAPI", aiErr);
      aiAttributes = {
        summary: body.description.slice(0, 120),
        category: body.category || "other",
        objectType: body.title,
        brand: "Unknown",
        color: "unspecified",
        attributes: [body.category || "other"],
        keywords: [body.title.toLowerCase(), body.category || "item"],
        extractedAt: new Date().toISOString(),
      };
    }

    // Step 2: Build complete Report record
    const newReport: Report = {
      id: reportId,
      reportType: body.reportType,
      userId: effectiveUserId, // Uses canonical client/session UID
      title: body.title,
      description: body.description,
      category: body.category || "other",
      imageUrl: body.imageUrl || null,
      location: body.location || { name: "Campus Area", zone: "Central Academic Quad" },
      reportedAt: body.reportedAt || new Date().toISOString(),
      status: "OPEN",
      ai: aiAttributes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Step 3: Persist in Supabase PostgreSQL & Global in-memory map
    const savedReport = await createReportInDb(newReport);
    logger.info("Report created & persisted successfully", "ReportsCreateAPI", { id: savedReport.id, userId: savedReport.userId });

    return NextResponse.json({ success: true, report: savedReport }, { status: 201 });
  } catch (err: any) {
    logger.error("Error creating report", "ReportsCreateAPI", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to create report" }, { status: 500 });
  }
}
