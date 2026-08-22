import { describe, it, expect } from "vitest";
import { searchAndRankReports } from "@/lib/search/search-engine";
import { Report } from "@/types";

describe("Search and Relevance Engine", () => {
  const reports: Report[] = [
    {
      id: "r1",
      reportType: "LOST",
      userId: "u1",
      title: "Black Leather Wallet",
      description: "Lost black leather Calvin Klein wallet near library quiet study",
      category: "id_cards",
      location: { name: "Central Library 2nd Floor", zone: "Central Academic Quad" },
      reportedAt: "2026-08-22T08:00:00Z",
      status: "OPEN",
      ai: {
        summary: "Black leather wallet with cards",
        category: "id_cards",
        objectType: "wallet",
        brand: "Calvin Klein",
        color: "black",
        attributes: ["leather", "black"],
        keywords: ["wallet", "leather", "cards"],
        extractedAt: "2026-08-22T08:00:00Z",
      },
      createdAt: "2026-08-22T08:00:00Z",
      updatedAt: "2026-08-22T08:00:00Z",
    },
    {
      id: "r2",
      reportType: "FOUND",
      userId: "u2",
      title: "Hydro Flask Water Bottle",
      description: "Found blue Hydro Flask at gym",
      category: "bottles_tumblers",
      location: { name: "Athletics Gym", zone: "Athletics Complex" },
      reportedAt: "2026-08-21T08:00:00Z",
      status: "OPEN",
      ai: {
        summary: "Blue Hydro Flask bottle",
        category: "bottles_tumblers",
        objectType: "water bottle",
        brand: "Hydro Flask",
        color: "blue",
        attributes: ["bottle"],
        keywords: ["flask", "bottle", "gym"],
        extractedAt: "2026-08-21T08:00:00Z",
      },
      createdAt: "2026-08-21T08:00:00Z",
      updatedAt: "2026-08-21T08:00:00Z",
    },
  ];

  it("finds reports by natural language query tokens", () => {
    const results = searchAndRankReports(reports, { query: "black wallet near library" });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("r1");
  });

  it("filters correctly by report type and category", () => {
    const lostOnly = searchAndRankReports(reports, { reportType: "LOST" });
    expect(lostOnly.length).toBe(1);
    expect(lostOnly[0].id).toBe("r1");

    const foundOnly = searchAndRankReports(reports, { reportType: "FOUND" });
    expect(foundOnly.length).toBe(1);
    expect(foundOnly[0].id).toBe("r2");
  });
});
