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

    // Extract manual structured user inputs
    const manualBrand = body.brand && body.brand.trim() && body.brand !== "Unknown" && body.brand !== "No brand" ? body.brand.trim() : null;
    const manualModel = body.model && body.model.trim() ? body.model.trim() : null;
    const manualColor = body.color && body.color.trim() && body.color !== "unspecified" && body.color !== "Unknown" ? body.color.trim() : null;
    const manualMaterial = body.material && body.material.trim() && body.material !== "Unknown" ? body.material.trim() : null;
    const manualDistinctiveFeatures = body.distinctiveFeatures && body.distinctiveFeatures.trim() ? body.distinctiveFeatures.trim() : null;

    // Step 1: Execute Gemini Multimodal Analysis with Graceful Fallback
    let rawAiAttributes: AIRawAttributes | null = null;
    try {
      rawAiAttributes = await aiAnalysisService.analyzeItem({
        title: body.title,
        description: body.description,
        category: body.category || "other",
        imageBase64OrUrl: body.imageUrl,
      });
    } catch (aiErr) {
      logger.warn("AI Analysis experienced an error. Continuing with basic report persistence.", "ReportsCreateAPI", aiErr);
      rawAiAttributes = {
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

    // Step 2: Deterministic Precedence Merge: MANUAL USER DATA > AI INFERENCE
    const finalBrand = manualBrand || (rawAiAttributes?.brand && rawAiAttributes.brand !== "Unknown" ? rawAiAttributes.brand : "Unknown");
    const finalColor = manualColor || (rawAiAttributes?.color && rawAiAttributes.color !== "unspecified" ? rawAiAttributes.color : "unspecified");
    const finalModel = manualModel || rawAiAttributes?.model || null;
    const finalMaterial = manualMaterial || rawAiAttributes?.material || null;

    const mergedAiAttributes: AIRawAttributes = {
      summary: rawAiAttributes?.summary || body.description.slice(0, 120),
      category: body.category || rawAiAttributes?.category || "other",
      objectType: rawAiAttributes?.objectType || body.title,
      brand: finalBrand,
      color: finalColor,
      model: finalModel || undefined,
      material: finalMaterial || undefined,
      attributes: Array.from(new Set([
        ...(rawAiAttributes?.attributes || []),
        ...(manualBrand ? [manualBrand] : []),
        ...(manualColor ? [manualColor] : []),
        ...(manualMaterial ? [manualMaterial] : []),
      ])),
      keywords: Array.from(new Set([
        ...(rawAiAttributes?.keywords || []),
        body.title.toLowerCase(),
        body.category?.toLowerCase() || "item",
        ...(manualBrand ? [manualBrand.toLowerCase()] : []),
        ...(manualColor ? [manualColor.toLowerCase()] : []),
      ])),
      extractedAt: new Date().toISOString(),
      brandSource: manualBrand ? "USER" : (rawAiAttributes?.brand && rawAiAttributes.brand !== "Unknown" ? "AI" : undefined),
      colorSource: manualColor ? "USER" : (rawAiAttributes?.color && rawAiAttributes.color !== "unspecified" ? "AI" : undefined),
      modelSource: manualModel ? "USER" : undefined,
      materialSource: manualMaterial ? "USER" : undefined,
    };

    // Step 3: Build complete Report record
    const newReport: Report = {
      id: reportId,
      reportType: body.reportType,
      userId: effectiveUserId, // Canonical client/session UID
      title: body.title,
      description: body.description,
      category: body.category || "other",
      brand: manualBrand || (finalBrand !== "Unknown" ? finalBrand : null),
      model: finalModel,
      color: manualColor || (finalColor !== "unspecified" ? finalColor : null),
      material: finalMaterial,
      distinctiveFeatures: manualDistinctiveFeatures,
      imageUrl: body.imageUrl || null,
      location: body.location || { name: "Campus Area", zone: "Central Academic Quad" },
      reportedAt: body.reportedAt || new Date().toISOString(),
      status: "OPEN",
      ai: mergedAiAttributes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Step 4: Persist in Supabase PostgreSQL & Global in-memory store
    const savedReport = await createReportInDb(newReport);
    logger.info("Report created & persisted successfully with authoritative attributes", "ReportsCreateAPI", {
      id: savedReport.id,
      userId: savedReport.userId,
      brand: savedReport.brand,
      color: savedReport.color,
    });

    return NextResponse.json({ success: true, report: savedReport }, { status: 201 });
  } catch (err: any) {
    logger.error("Error creating report", "ReportsCreateAPI", err);
    return NextResponse.json({ success: false, error: err.message || "Failed to create report" }, { status: 500 });
  }
}
