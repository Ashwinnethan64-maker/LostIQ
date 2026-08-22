import { describe, it, expect } from "vitest";
import { MatchingEngine } from "@/lib/matching/engine";
import { Report } from "@/types";

describe("MatchingEngine Edge & Negative Cases", () => {
  const engine = new MatchingEngine();

  const baseReport: Report = {
    id: "rep-edge-1",
    reportType: "LOST",
    userId: "user-1",
    title: "Black Backpack",
    description: "Lost black backpack with laptop inside near library",
    category: "bags_backpacks",
    imageUrl: null,
    location: { name: "Central Library", zone: "Central Academic Quad" },
    reportedAt: "2026-08-22T10:00:00Z",
    status: "OPEN",
    ai: null,
    createdAt: "2026-08-22T10:00:00Z",
    updatedAt: "2026-08-22T10:00:00Z",
  };

  it("handles missing AI attributes without throwing errors", () => {
    const candidate: Report = {
      ...baseReport,
      id: "rep-edge-2",
      reportType: "FOUND",
      title: "Found Backpack",
      description: "Found black backpack in library commons",
    };

    const comparison = engine.compareReports(baseReport, candidate);
    expect(comparison.scores.overall).toBeGreaterThanOrEqual(20);
    expect(isNaN(comparison.scores.overall)).toBe(false);
    expect(typeof comparison.explanation).toBe("string");
  });

  it("applies penalty for items found before being reported lost", () => {
    const futureFound: Report = {
      ...baseReport,
      id: "rep-edge-3",
      reportType: "FOUND",
      reportedAt: "2026-08-15T10:00:00Z", // 7 days prior to loss
    };

    const comparison = engine.compareReports(baseReport, futureFound);
    expect(comparison.scores.time).toBeLessThanOrEqual(30);
  });

  it("never matches a report against itself or same-type reports", () => {
    const sameTypeReport: Report = {
      ...baseReport,
      id: "rep-edge-4",
      reportType: "LOST",
    };

    const candidates = engine.evaluateCandidates(baseReport, [baseReport, sameTypeReport]);
    expect(candidates.length).toBe(0);
  });
});
