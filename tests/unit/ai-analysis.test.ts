import { describe, it, expect } from "vitest";
import { aiAnalysisService } from "@/lib/ai/ai-analysis.service";

describe("AI Heuristic Extraction & Fallback Robustness", () => {
  it("extracts brand and color accurately from title and description", async () => {
    const res = await aiAnalysisService.analyzeItem({
      title: "Lost Black Sony WF-1000XM4",
      description: "Lost my wireless noise canceling black earbuds near the campus quad table",
      category: "electronics",
      imageBase64OrUrl: null,
    });

    expect(res.brand).toBe("Sony");
    expect(res.color).toBe("black");
    expect(res.category).toBe("electronics");
    expect(res.keywords.length).toBeGreaterThan(0);
  });

  it("handles obscure items gracefully with generic category fallbacks", async () => {
    const res = await aiAnalysisService.analyzeItem({
      title: "Custom Metal Water Bottle with Stickers",
      description: "Silver stainless container with graduation stickers on side",
      category: "bottles_tumblers",
      imageBase64OrUrl: null,
    });

    expect(res.color).toBe("silver");
    expect(res.category).toBe("bottles_tumblers");
    expect(res.summary).toContain("Custom Metal Water Bottle");
  });
});
