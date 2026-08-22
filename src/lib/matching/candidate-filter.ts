import { Report } from "@/types";
import { areCategoriesCompatible } from "./category-compatibility";

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
}

/**
 * Validates whether a candidate report is eligible to be scored against the source report.
 * Hard Gates enforced before any multi-signal calculation:
 * 1. Self-match rejection (source.id !== candidate.id)
 * 2. Mandatory opposite report type (LOST <-> FOUND only)
 * 3. Active status requirement (candidate.status === "OPEN")
 * 4. Item category compatibility (Bags cannot match Earbuds/Wallets)
 * 5. Minimum object identity relevance (checks title/ai objectType for distinct incompatibility)
 */
export function checkCandidateEligibility(source: Report, candidate: Report): EligibilityResult {
  // 1. Self-match gate
  if (source.id === candidate.id) {
    return { eligible: false, reason: "Self-match rejected" };
  }

  // 2. Opposite report type gate
  const expectedTargetType = source.reportType === "LOST" ? "FOUND" : "LOST";
  if (candidate.reportType !== expectedTargetType) {
    return { eligible: false, reason: `Invalid report type: expected ${expectedTargetType}, got ${candidate.reportType}` };
  }

  // 3. Status gate
  if (source.status !== "OPEN") {
    return { eligible: false, reason: `Source report is not OPEN (${source.status})` };
  }
  if (candidate.status !== "OPEN") {
    return { eligible: false, reason: `Candidate report is not OPEN (${candidate.status})` };
  }

  // 4. Category compatibility hard gate
  if (!areCategoriesCompatible(source.category, candidate.category)) {
    return {
      eligible: false,
      reason: `Category mismatch: ${source.category} is incompatible with ${candidate.category}`,
    };
  }

  // 5. Object family / keyword hard gate if categories are 'other' or broad
  if (source.category === "other" || candidate.category === "other") {
    const sourceText = `${source.title} ${source.description} ${source.ai?.objectType || ""}`.toLowerCase();
    const candText = `${candidate.title} ${candidate.description} ${candidate.ai?.objectType || ""}`.toLowerCase();

    // Check strongly disjoint keywords
    const isSourceBag = /\b(bag|backpack|purse|duffel|tote|handbag)\b/.test(sourceText);
    const isCandEarbuds = /\b(earbuds|airpods|headphones|headset|earphones|sony wf|wf-1000)\b/.test(candText);
    const isCandWallet = /\b(wallet|bifold|purse|cardholder)\b/.test(candText);

    if (isSourceBag && (isCandEarbuds || isCandWallet)) {
      return { eligible: false, reason: "Incompatible object family (Bag vs Electronics/Wallet)" };
    }

    const isSourceEarbuds = /\b(earbuds|airpods|headphones|headset|earphones)\b/.test(sourceText);
    const isCandBag = /\b(bag|backpack|purse|duffel|tote)\b/.test(candText);
    if (isSourceEarbuds && (isCandBag || isCandWallet)) {
      return { eligible: false, reason: "Incompatible object family (Earbuds vs Bag/Wallet)" };
    }
  }

  return { eligible: true };
}
