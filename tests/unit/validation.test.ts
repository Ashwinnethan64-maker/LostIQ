import { describe, it, expect } from "vitest";
import { AIAttributesSchema } from "@/lib/validations/ai.schema";
import { ReportSubmissionSchema } from "@/lib/validations/report.schema";

describe("Validation Schemas", () => {
  it("validates well-formed AI attributes output", () => {
    const raw = {
      summary: "Black Sony wireless earbuds in charging case",
      category: "electronics",
      objectType: "wireless earbuds",
      brand: "Sony",
      color: "black",
      attributes: ["matte finish", "small scratch"],
      keywords: ["sony", "earbuds", "case"],
      extractedAt: new Date().toISOString(),
    };

    const res = AIAttributesSchema.safeParse(raw);
    expect(res.success).toBe(true);
  });

  it("validates report submission input constraints", () => {
    const validReport = {
      reportType: "LOST",
      title: "Blue Hydro Flask 32oz",
      description: "Lost my blue water bottle near the central library second floor quiet zone",
      category: "bottles_tumblers",
      locationName: "Library 2nd Floor",
      reportedDate: "2026-08-22",
      reportedTime: "14:30",
    };

    const res = ReportSubmissionSchema.safeParse(validReport);
    expect(res.success).toBe(true);
  });

  it("rejects short titles and missing descriptions", () => {
    const invalidReport = {
      reportType: "LOST",
      title: "Hi",
      description: "Too short",
      category: "electronics",
      locationName: "",
      reportedDate: "2026-08-22",
      reportedTime: "14:30",
    };

    const res = ReportSubmissionSchema.safeParse(invalidReport);
    expect(res.success).toBe(false);
  });
});
