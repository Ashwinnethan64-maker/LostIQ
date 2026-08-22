import { describe, it, expect } from "vitest";
import { MatchingEngine } from "@/lib/matching/engine";
import { Report } from "@/types";

describe("MatchingEngine Multi-Signal Engine", () => {
  const engine = new MatchingEngine();

  const lostEarbuds: Report = {
    id: "rep-lost-1",
    reportType: "LOST",
    userId: "user-1",
    title: "Black Sony WF-1000XM4 Earbuds",
    description: "Lost black Sony wireless earbuds inside the case near library quiet area",
    category: "electronics",
    imageUrl: "https://example.com/earbuds.jpg",
    location: {
      name: "Central Library 2nd Floor",
      zone: "Central Academic Quad",
    },
    reportedAt: "2026-08-22T10:00:00Z",
    status: "OPEN",
    ai: {
      summary: "Black Sony wireless earbuds in charging case",
      category: "electronics",
      objectType: "wireless earbuds",
      brand: "Sony",
      color: "black",
      attributes: ["wireless", "earbuds", "charging case", "black"],
      keywords: ["sony", "earbuds", "case", "wireless"],
      extractedAt: "2026-08-22T10:00:00Z",
    },
    createdAt: "2026-08-22T10:00:00Z",
    updatedAt: "2026-08-22T10:00:00Z",
  };

  const matchingFoundEarbuds: Report = {
    id: "rep-found-1",
    reportType: "FOUND",
    userId: "user-2",
    title: "Sony Earbuds Found in Case",
    description: "Found black Sony earbuds in a black case left at library 2nd floor desk",
    category: "electronics",
    imageUrl: "https://example.com/found-earbuds.jpg",
    location: {
      name: "Central Library 2nd Floor Study Commons",
      zone: "Central Academic Quad",
    },
    reportedAt: "2026-08-22T11:00:00Z",
    status: "OPEN",
    ai: {
      summary: "Black Sony earbuds and charging case",
      category: "electronics",
      objectType: "wireless earbuds",
      brand: "Sony",
      color: "black",
      attributes: ["sony", "earbuds", "case"],
      keywords: ["sony", "earbuds", "charging case"],
      extractedAt: "2026-08-22T11:00:00Z",
    },
    createdAt: "2026-08-22T11:00:00Z",
    updatedAt: "2026-08-22T11:00:00Z",
  };

  const unrelatedWaterBottle: Report = {
    id: "rep-found-2",
    reportType: "FOUND",
    userId: "user-3",
    title: "Hydro Flask Bottle",
    description: "Found blue Hydro Flask bottle at the gym",
    category: "bottles_tumblers",
    imageUrl: null,
    location: {
      name: "Gym Locker Room",
      zone: "Athletics Complex",
    },
    reportedAt: "2026-08-20T10:00:00Z",
    status: "OPEN",
    ai: {
      summary: "Blue water bottle",
      category: "bottles_tumblers",
      objectType: "water bottle",
      brand: "Hydro Flask",
      color: "blue",
      attributes: ["water bottle", "blue"],
      keywords: ["bottle", "gym"],
      extractedAt: "2026-08-20T10:00:00Z",
    },
    createdAt: "2026-08-20T10:00:00Z",
    updatedAt: "2026-08-20T10:00:00Z",
  };

  it("should calculate high match confidence for closely aligned items", () => {
    const comparison = engine.compareReports(lostEarbuds, matchingFoundEarbuds);
    expect(comparison.scores.overall).toBeGreaterThanOrEqual(75);
    expect(comparison.scores.category).toBe(100);
    expect(comparison.scores.location).toBeGreaterThanOrEqual(85);
    expect(comparison.scores.time).toBeGreaterThanOrEqual(90);
    expect(comparison.explanation).toContain("Sony");
  });

  it("should rank relevant matches first and prune unrelated items", () => {
    const results = engine.evaluateCandidates(lostEarbuds, [matchingFoundEarbuds, unrelatedWaterBottle]);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].targetReportId).toBe(matchingFoundEarbuds.id);
    expect(results[0].scores.overall).toBeGreaterThan(results[1]?.scores?.overall || 0);
  });
});
