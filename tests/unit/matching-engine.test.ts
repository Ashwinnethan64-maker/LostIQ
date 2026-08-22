import { describe, it, expect } from "vitest";
import { MatchingEngine, MATCH_MINIMUM_THRESHOLD } from "@/lib/matching/engine";
import { checkCandidateEligibility } from "@/lib/matching/candidate-filter";
import { areCategoriesCompatible } from "@/lib/matching/category-compatibility";
import { Report } from "@/types";

describe("MatchingEngine Strict Candidate Eligibility & Hard Gates", () => {
  const engine = new MatchingEngine();

  const lostBag: Report = {
    id: "rep-lost-bag-1",
    reportType: "LOST",
    userId: "student-1",
    title: "Black Herschel Backpack",
    description: "Lost black Herschel backpack near library study area with notebook inside",
    category: "bags_backpacks",
    imageUrl: "https://example.com/bag.jpg",
    location: { name: "Central Library", zone: "Central Academic Quad" },
    reportedAt: "2026-08-22T10:00:00Z",
    status: "OPEN",
    ai: {
      summary: "Black Herschel backpack",
      category: "bags_backpacks",
      objectType: "backpack",
      brand: "Herschel",
      color: "black",
      attributes: ["backpack", "black", "zipper"],
      keywords: ["herschel", "backpack", "bag"],
      extractedAt: "2026-08-22T10:00:00Z",
    },
    createdAt: "2026-08-22T10:00:00Z",
    updatedAt: "2026-08-22T10:00:00Z",
  };

  const foundEarbuds: Report = {
    id: "rep-found-earbuds-1",
    reportType: "FOUND",
    userId: "student-2",
    title: "Black Sony Wireless Earbuds",
    description: "Found black Sony WF-1000XM4 earbuds in charging case at library",
    category: "electronics",
    imageUrl: "https://example.com/earbuds.jpg",
    location: { name: "Central Library", zone: "Central Academic Quad" },
    reportedAt: "2026-08-22T10:15:00Z",
    status: "OPEN",
    ai: {
      summary: "Black Sony earbuds in case",
      category: "electronics",
      objectType: "wireless earbuds",
      brand: "Sony",
      color: "black",
      attributes: ["earbuds", "case", "black"],
      keywords: ["sony", "earbuds", "case"],
      extractedAt: "2026-08-22T10:15:00Z",
    },
    createdAt: "2026-08-22T10:15:00Z",
    updatedAt: "2026-08-22T10:15:00Z",
  };

  const foundWallet: Report = {
    id: "rep-found-wallet-1",
    reportType: "FOUND",
    userId: "student-3",
    title: "Brown Fossil Leather Wallet",
    description: "Found brown leather bifold wallet in library study lounge",
    category: "id_cards",
    imageUrl: "https://example.com/wallet.jpg",
    location: { name: "Central Library", zone: "Central Academic Quad" },
    reportedAt: "2026-08-22T10:30:00Z",
    status: "OPEN",
    ai: {
      summary: "Brown leather wallet",
      category: "id_cards",
      objectType: "wallet",
      brand: "Fossil",
      color: "brown",
      attributes: ["wallet", "leather"],
      keywords: ["wallet", "fossil"],
      extractedAt: "2026-08-22T10:30:00Z",
    },
    createdAt: "2026-08-22T10:30:00Z",
    updatedAt: "2026-08-22T10:30:00Z",
  };

  const foundBag: Report = {
    id: "rep-found-bag-1",
    reportType: "FOUND",
    userId: "student-4",
    title: "Black Backpack Found",
    description: "Found black Herschel backpack left at study carrel in central library",
    category: "bags_backpacks",
    imageUrl: "https://example.com/found-bag.jpg",
    location: { name: "Central Library Study Commons", zone: "Central Academic Quad" },
    reportedAt: "2026-08-22T11:00:00Z",
    status: "OPEN",
    ai: {
      summary: "Black Herschel backpack",
      category: "bags_backpacks",
      objectType: "backpack",
      brand: "Herschel",
      color: "black",
      attributes: ["backpack", "black"],
      keywords: ["herschel", "backpack", "bag"],
      extractedAt: "2026-08-22T11:00:00Z",
    },
    createdAt: "2026-08-22T11:00:00Z",
    updatedAt: "2026-08-22T11:00:00Z",
  };

  // TEST 1: LOST BAG + FOUND EARBUDS -> NO MATCH
  it("rejects LOST BAG against FOUND EARBUDS due to category incompatibility", () => {
    expect(areCategoriesCompatible("bags_backpacks", "electronics")).toBe(false);
    const eligibility = checkCandidateEligibility(lostBag, foundEarbuds);
    expect(eligibility.eligible).toBe(false);

    const matches = engine.evaluateCandidates(lostBag, [foundEarbuds]);
    expect(matches.length).toBe(0);
  });

  // TEST 2: LOST BAG + FOUND WALLET -> NO MATCH
  it("rejects LOST BAG against FOUND WALLET due to category incompatibility", () => {
    expect(areCategoriesCompatible("bags_backpacks", "id_cards")).toBe(false);
    const eligibility = checkCandidateEligibility(lostBag, foundWallet);
    expect(eligibility.eligible).toBe(false);

    const matches = engine.evaluateCandidates(lostBag, [foundWallet]);
    expect(matches.length).toBe(0);
  });

  // TEST 3 & 4: LOST BAG + FOUND BAG -> ELIGIBLE & MATCHES
  it("authorizes LOST BAG against FOUND BAG (both directions)", () => {
    const eligibilityLostToFound = checkCandidateEligibility(lostBag, foundBag);
    expect(eligibilityLostToFound.eligible).toBe(true);

    const matchesLost = engine.evaluateCandidates(lostBag, [foundBag]);
    expect(matchesLost.length).toBe(1);
    expect(matchesLost[0].scores.overall).toBeGreaterThanOrEqual(MATCH_MINIMUM_THRESHOLD);
    expect(matchesLost[0].targetReportId).toBe(foundBag.id);

    const eligibilityFoundToLost = checkCandidateEligibility(foundBag, lostBag);
    expect(eligibilityFoundToLost.eligible).toBe(true);

    const matchesFound = engine.evaluateCandidates(foundBag, [lostBag]);
    expect(matchesFound.length).toBe(1);
    expect(matchesFound[0].targetReportId).toBe(lostBag.id);
  });

  // TEST 5: LOST EARBUDS + FOUND EARBUDS -> ELIGIBLE
  it("authorizes LOST EARBUDS against FOUND EARBUDS", () => {
    const lostEarbuds: Report = { ...foundEarbuds, id: "rep-lost-earbuds-1", reportType: "LOST" };
    const eligibility = checkCandidateEligibility(lostEarbuds, foundEarbuds);
    expect(eligibility.eligible).toBe(true);

    const matches = engine.evaluateCandidates(lostEarbuds, [foundEarbuds]);
    expect(matches.length).toBe(1);
    expect(matches[0].targetReportId).toBe(foundEarbuds.id);
  });

  // TEST 6 & 7: SAME-TYPE MATCHING REJECTED (LOST->LOST or FOUND->FOUND)
  it("strictly rejects same-type candidates (LOST->LOST, FOUND->FOUND)", () => {
    const anotherLostBag: Report = { ...lostBag, id: "rep-lost-bag-2" };
    expect(checkCandidateEligibility(lostBag, anotherLostBag).eligible).toBe(false);
    expect(engine.evaluateCandidates(lostBag, [anotherLostBag]).length).toBe(0);

    const anotherFoundBag: Report = { ...foundBag, id: "rep-found-bag-2" };
    expect(checkCandidateEligibility(foundBag, anotherFoundBag).eligible).toBe(false);
    expect(engine.evaluateCandidates(foundBag, [anotherFoundBag]).length).toBe(0);
  });

  // TEST 8: REJECTS WEAK CANDIDATES BELOW THRESHOLD
  it("rejects candidate if score falls below configurable threshold", () => {
    const distantFoundBag: Report = {
      ...foundBag,
      id: "rep-distant-bag",
      title: "Pink Glitter Small Bag",
      description: "Found pink glitter children purse on campus bus",
      location: { name: "South Campus Dorm Bus Stop", zone: "South Campus Dormitories" },
      reportedAt: "2026-07-01T10:00:00Z", // 2 months in past
      ai: {
        summary: "Pink glitter small purse",
        category: "bags_backpacks",
        objectType: "purse",
        brand: "Unknown",
        color: "pink",
        attributes: ["glitter", "pink", "small"],
        keywords: ["purse", "pink"],
        extractedAt: "2026-07-01T10:00:00Z",
      },
    };

    const matches = engine.evaluateCandidates(lostBag, [distantFoundBag]);
    // Distant pink purse should fall below 50% threshold for black Herschel backpack
    expect(matches.length).toBe(0);
  });

  // TEST 10 & 11: CLOSED REPORTS REJECTED
  it("rejects closed / resolved reports from matching", () => {
    const closedFoundBag: Report = { ...foundBag, id: "rep-closed-bag", status: "RESOLVED" };
    expect(checkCandidateEligibility(lostBag, closedFoundBag).eligible).toBe(false);
    expect(engine.evaluateCandidates(lostBag, [closedFoundBag]).length).toBe(0);

    const closedLostBag: Report = { ...lostBag, status: "CLAIMED" };
    expect(checkCandidateEligibility(closedLostBag, foundBag).eligible).toBe(false);
    expect(engine.evaluateCandidates(closedLostBag, [foundBag]).length).toBe(0);
  });

  // TEST 12: SELF-MATCH REJECTED
  it("rejects self-match where candidate.id === source.id", () => {
    expect(checkCandidateEligibility(lostBag, lostBag).eligible).toBe(false);
    expect(engine.evaluateCandidates(lostBag, [lostBag]).length).toBe(0);
  });

  // CURRENT BUG EXACT REPRODUCTION
  it("reproduces screenshot scenario: LOST BAG vs candidate pool with Earbuds + Wallet", () => {
    const candidatePool = [foundEarbuds, foundWallet];
    const matches = engine.evaluateCandidates(lostBag, candidatePool);

    // Must return 0 matches — no earbuds, no wallet!
    expect(matches.length).toBe(0);
  });
});
