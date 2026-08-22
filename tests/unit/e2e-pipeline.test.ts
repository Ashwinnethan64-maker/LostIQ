import { describe, it, expect } from "vitest";
import { MatchingEngine } from "@/lib/matching/engine";
import { Report } from "@/types";

describe("E2E Integration & Edge Pipeline", () => {
  const engine = new MatchingEngine();

  const lostReport: Report = {
    id: "rep-e2e-lost",
    reportType: "LOST",
    userId: "firebase-uid-101",
    title: "Silver Macbook Air M2",
    description: "Lost silver Apple MacBook Air M2 in leather sleeve on dining hall table",
    category: "electronics",
    imageUrl: "https://firebasestorage.googleapis.com/v0/b/app/macbook.jpg",
    location: {
      name: "Dining Commons Table 12",
      zone: "Student Center & Dining Hall",
    },
    reportedAt: "2026-08-22T12:00:00Z",
    status: "OPEN",
    ai: {
      summary: "Silver Apple MacBook Air laptop in leather case",
      category: "electronics",
      objectType: "laptop",
      brand: "Apple",
      color: "silver",
      attributes: ["macbook", "apple", "laptop", "silver", "m2"],
      keywords: ["apple", "macbook", "laptop", "dining"],
      extractedAt: "2026-08-22T12:00:00Z",
    },
    createdAt: "2026-08-22T12:00:00Z",
    updatedAt: "2026-08-22T12:00:00Z",
  };

  const foundReport: Report = {
    id: "rep-e2e-found",
    reportType: "FOUND",
    userId: "firebase-uid-202",
    title: "Found Apple Laptop at Dining Hall",
    description: "Turned in silver Apple laptop found at dining hall booth",
    category: "electronics",
    imageUrl: "https://firebasestorage.googleapis.com/v0/b/app/found-macbook.jpg",
    location: {
      name: "Dining Commons Counter",
      zone: "Student Center & Dining Hall",
    },
    reportedAt: "2026-08-22T12:30:00Z",
    status: "OPEN",
    ai: {
      summary: "Silver Apple laptop turned in at dining hall",
      category: "electronics",
      objectType: "laptop",
      brand: "Apple",
      color: "silver",
      attributes: ["apple", "laptop", "silver"],
      keywords: ["apple", "laptop", "dining"],
      extractedAt: "2026-08-22T12:30:00Z",
    },
    createdAt: "2026-08-22T12:30:00Z",
    updatedAt: "2026-08-22T12:30:00Z",
  };

  it("completes deterministic end-to-end matching evaluation", () => {
    const comparison = engine.compareReports(lostReport, foundReport);
    expect(comparison.scores.overall).toBeGreaterThanOrEqual(80);
    expect(comparison.scores.category).toBe(100);
    expect(comparison.scores.location).toBeGreaterThanOrEqual(85);
    expect(comparison.explanation).toContain("Apple");
  });

  it("handles empty candidate lists safely", () => {
    const candidates = engine.evaluateCandidates(lostReport, []);
    expect(candidates).toEqual([]);
  });

  it("does not match reports of identical types (LOST to LOST)", () => {
    const duplicateLost = { ...lostReport, id: "rep-lost-another" };
    const candidates = engine.evaluateCandidates(lostReport, [duplicateLost]);
    expect(candidates).toEqual([]);
  });
});
