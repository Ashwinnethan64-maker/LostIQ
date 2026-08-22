import { describe, it, expect } from "vitest";
import { MatchingEngine } from "@/lib/matching/engine";
import { Report } from "@/types";

describe("Item Attributes Precedence & Manual Matching Integration", () => {
  const engine = new MatchingEngine();

  it("prioritizes explicit manual user inputs over generic AI extractions", () => {
    // Report A: User explicitly entered brand = "Casio", color = "Black", model = "G-Shock"
    const lostWatch: Report = {
      id: "rep-lost-watch-1",
      reportType: "LOST",
      userId: "user-a",
      title: "Lost Watch",
      description: "Lost my watch in central quad",
      category: "jewelry_watches",
      brand: "Casio",
      model: "G-Shock",
      color: "Black",
      material: "Rubber",
      location: { name: "Central Academic Quad", zone: "Central Academic Quad" },
      reportedAt: "2026-08-22T10:00:00Z",
      status: "OPEN",
      ai: {
        summary: "Digital wristwatch",
        category: "jewelry_watches",
        objectType: "watch",
        brand: "Casio",
        model: "G-Shock",
        color: "Black",
        brandSource: "USER",
        colorSource: "USER",
        attributes: ["Casio", "Black", "Rubber"],
        keywords: ["watch", "casio", "g-shock"],
        extractedAt: "2026-08-22T10:00:00Z",
      },
      createdAt: "2026-08-22T10:00:00Z",
      updatedAt: "2026-08-22T10:00:00Z",
    };

    // Report B: Matching Found Casio G-Shock
    const foundCasioWatch: Report = {
      id: "rep-found-watch-1",
      reportType: "FOUND",
      userId: "user-b",
      title: "Black Digital Watch Found",
      description: "Found black digital watch on bench",
      category: "jewelry_watches",
      brand: "Casio",
      model: "G-Shock",
      color: "Black",
      material: "Rubber",
      location: { name: "Quad Bench #3", zone: "Central Academic Quad" },
      reportedAt: "2026-08-22T10:30:00Z",
      status: "OPEN",
      ai: {
        summary: "Black Casio digital watch",
        category: "jewelry_watches",
        objectType: "watch",
        brand: "Casio",
        model: "G-Shock",
        color: "Black",
        attributes: ["Casio", "Black", "Rubber"],
        keywords: ["watch", "casio"],
        extractedAt: "2026-08-22T10:30:00Z",
      },
      createdAt: "2026-08-22T10:30:00Z",
      updatedAt: "2026-08-22T10:30:00Z",
    };

    // Report C: Incompatible Timex Analog Watch
    const foundTimexWatch: Report = {
      id: "rep-found-watch-2",
      reportType: "FOUND",
      userId: "user-c",
      title: "Silver Timex Watch",
      description: "Found silver metal analog watch",
      category: "jewelry_watches",
      brand: "Timex",
      model: "Expedition",
      color: "Silver",
      material: "Metal",
      location: { name: "Quad Bench #3", zone: "Central Academic Quad" },
      reportedAt: "2026-08-22T10:30:00Z",
      status: "OPEN",
      ai: {
        summary: "Silver Timex watch",
        category: "jewelry_watches",
        objectType: "watch",
        brand: "Timex",
        color: "Silver",
        attributes: ["Timex", "Silver", "Metal"],
        keywords: ["watch", "timex"],
        extractedAt: "2026-08-22T10:30:00Z",
      },
      createdAt: "2026-08-22T10:30:00Z",
      updatedAt: "2026-08-22T10:30:00Z",
    };

    const comparisonMatching = engine.compareReports(lostWatch, foundCasioWatch);
    const comparisonMismatch = engine.compareReports(lostWatch, foundTimexWatch);

    // Attribute score should strongly favor the matching brand & color
    expect(comparisonMatching.scores.attribute).toBeGreaterThan(comparisonMismatch.scores.attribute);
    expect(comparisonMatching.scores.overall).toBeGreaterThanOrEqual(75);
    expect(comparisonMatching.explanation).toContain("Casio");

    const matches = engine.evaluateCandidates(lostWatch, [foundCasioWatch, foundTimexWatch]);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].targetReportId).toBe(foundCasioWatch.id);
  });
});
