import { Report, MatchScores, MatchCandidate } from "@/types";
import { config } from "../config";
import { logger } from "../logger";

export interface CandidateComparison {
  scores: MatchScores;
  explanation: string;
}

export class MatchingEngine {
  private weights = config.matchingWeights;

  /**
   * Evaluates a source report against an array of candidate reports.
   * Returns ranked matches sorted by overall confidence score.
   */
  public evaluateCandidates(sourceReport: Report, candidates: Report[]): MatchCandidate[] {
    const results: MatchCandidate[] = [];

    // Filter out reports of the same type or inactive reports
    const targetType = sourceReport.reportType === "LOST" ? "FOUND" : "LOST";
    const validCandidates = candidates.filter(
      (c) => c.reportType === targetType && c.id !== sourceReport.id && c.status === "OPEN"
    );

    for (const target of validCandidates) {
      const comparison = this.compareReports(sourceReport, target);

      // Only return candidates with an overall score > 20%
      if (comparison.scores.overall >= 20) {
        results.push({
          id: `match_${sourceReport.id}_${target.id}`,
          sourceReportId: sourceReport.id,
          targetReportId: target.id,
          targetReport: target,
          scores: comparison.scores,
          explanation: comparison.explanation,
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Sort by highest overall match score first
    return results.sort((a, b) => b.scores.overall - a.scores.overall);
  }

  /**
   * Compares two reports across all 6 multi-signal dimensions.
   */
  public compareReports(source: Report, target: Report): CandidateComparison {
    const categoryScore = this.calculateCategoryScore(source, target);
    const semanticScore = this.calculateSemanticScore(source, target);
    const attributeScore = this.calculateAttributeScore(source, target);
    const visualScore = this.calculateVisualScore(source, target, attributeScore);
    const locationScore = this.calculateLocationScore(source, target);
    const timeScore = this.calculateTimeScore(source, target);

    // Weighted composite calculation
    const rawOverall =
      visualScore * this.weights.visual +
      semanticScore * this.weights.semantic +
      locationScore * this.weights.location +
      timeScore * this.weights.time +
      categoryScore * this.weights.category;

    const overall = Math.min(100, Math.max(0, Math.round(rawOverall)));

    const scores: MatchScores = {
      visual: Math.round(visualScore),
      semantic: Math.round(semanticScore),
      attribute: Math.round(attributeScore),
      location: Math.round(locationScore),
      time: Math.round(timeScore),
      category: Math.round(categoryScore),
      overall,
    };

    const explanation = this.generateExplanation(source, target, scores);

    return { scores, explanation };
  }

  private calculateCategoryScore(source: Report, target: Report): number {
    if (source.category === target.category) return 100;
    
    // Category compatibility map
    const compatibility: Record<string, string[]> = {
      electronics: ["other"],
      id_cards: ["other"],
      bags_backpacks: ["clothing_apparel", "other"],
      clothing_apparel: ["bags_backpacks", "other"],
      bottles_tumblers: ["other"],
    };

    if (compatibility[source.category]?.includes(target.category)) {
      return 60;
    }
    return 15;
  }

  private calculateSemanticScore(source: Report, target: Report): number {
    const textA = `${source.title} ${source.description} ${source.ai?.summary || ""}`.toLowerCase();
    const textB = `${target.title} ${target.description} ${target.ai?.summary || ""}`.toLowerCase();

    const wordsA = new Set(textA.split(/[^a-zA-Z0-9]+/).filter((w) => w.length > 3));
    const wordsB = new Set(textB.split(/[^a-zA-Z0-9]+/).filter((w) => w.length > 3));

    if (wordsA.size === 0 || wordsB.size === 0) return 30;

    let overlap = 0;
    wordsA.forEach((w) => {
      if (wordsB.has(w)) overlap++;
    });

    const jaccard = overlap / (wordsA.size + wordsB.size - overlap);
    return Math.min(100, Math.round(jaccard * 160));
  }

  private calculateAttributeScore(source: Report, target: Report): number {
    let score = 30; // base baseline
    const aiA = source.ai;
    const aiB = target.ai;

    if (!aiA || !aiB) return score;

    // Brand matching
    if (aiA.brand !== "Unknown" && aiB.brand !== "Unknown") {
      if (aiA.brand.toLowerCase() === aiB.brand.toLowerCase()) {
        score += 35;
      } else {
        score -= 20;
      }
    }

    // Color matching
    if (aiA.color !== "unspecified" && aiB.color !== "unspecified") {
      if (aiA.color.toLowerCase() === aiB.color.toLowerCase()) {
        score += 25;
      } else if (
        aiA.color.toLowerCase().includes(aiB.color.toLowerCase()) ||
        aiB.color.toLowerCase().includes(aiA.color.toLowerCase())
      ) {
        score += 15;
      }
    }

    // Object type matching
    if (aiA.objectType && aiB.objectType) {
      if (aiA.objectType.toLowerCase() === aiB.objectType.toLowerCase()) {
        score += 20;
      }
    }

    return Math.min(100, Math.max(0, score));
  }

  private calculateVisualScore(source: Report, target: Report, attributeScore: number): number {
    // If both have images and high attribute congruence, visual score aligns closely
    if (source.imageUrl && target.imageUrl) {
      return Math.min(100, Math.max(30, attributeScore + 10));
    }
    // If only one has image, estimate from extracted visual tags
    return Math.max(20, attributeScore);
  }

  private calculateLocationScore(source: Report, target: Report): number {
    const locA = source.location;
    const locB = target.location;

    // Exact zone match
    if (locA.zone && locB.zone && locA.zone.toLowerCase() === locB.zone.toLowerCase()) {
      // Sub-location text similarity
      if (locA.name.toLowerCase().includes(locB.name.toLowerCase()) || locB.name.toLowerCase().includes(locA.name.toLowerCase())) {
        return 98;
      }
      return 85;
    }

    // Keyword overlap in location name
    const locWordsA = new Set(locA.name.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const locWordsB = new Set(locB.name.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    let common = 0;
    locWordsA.forEach(w => { if (locWordsB.has(w)) common++; });

    if (common > 0) return 75;
    return 30;
  }

  private calculateTimeScore(source: Report, target: Report): number {
    const timeA = new Date(source.reportedAt).getTime();
    const timeB = new Date(target.reportedAt).getTime();

    if (isNaN(timeA) || isNaN(timeB)) return 50;

    const diffHours = Math.abs(timeA - timeB) / (1000 * 60 * 60);

    // If found before lost by more than 24 hours, apply temporal penalty
    const lostReport = source.reportType === "LOST" ? source : target;
    const foundReport = source.reportType === "FOUND" ? source : target;
    const lostTime = new Date(lostReport.reportedAt).getTime();
    const foundTime = new Date(foundReport.reportedAt).getTime();

    if (foundTime < lostTime - 24 * 60 * 60 * 1000) {
      return 15; // Found long before it was reported lost
    }

    if (diffHours <= 4) return 100;
    if (diffHours <= 24) return 90;
    if (diffHours <= 72) return 75;
    if (diffHours <= 168) return 60; // 1 week
    return 40;
  }

  private generateExplanation(source: Report, target: Report, scores: MatchScores): string {
    const reasons: string[] = [];

    // Category / Object type
    if (scores.category >= 80) {
      const objType = source.ai?.objectType || source.category;
      reasons.push(`Both reports identify the item as ${objType}.`);
    }

    // Brand & Color traits
    const brand = source.ai?.brand !== "Unknown" ? source.ai?.brand : target.ai?.brand !== "Unknown" ? target.ai?.brand : null;
    const color = source.ai?.color !== "unspecified" ? source.ai?.color : target.ai?.color !== "unspecified" ? target.ai?.color : null;
    if (brand && color) {
      reasons.push(`Strong visual and attribute alignment with a ${color} ${brand} product.`);
    } else if (brand) {
      reasons.push(`Both reports reference ${brand} hardware.`);
    } else if (color) {
      reasons.push(`Both reports describe matching ${color} color profiles.`);
    }

    // Location proximity
    if (scores.location >= 80) {
      reasons.push(`Submitted in the same campus area (${source.location.zone || source.location.name}).`);
    } else if (scores.location >= 60) {
      reasons.push(`Reported in nearby campus zones.`);
    }

    // Time proximity
    if (scores.time >= 85) {
      reasons.push(`Reported within a close time window.`);
    }

    if (reasons.length === 0) {
      return `Potential match based on overlapping semantic keywords and campus area.`;
    }

    return reasons.join(" ");
  }
}

export const matchingEngine = new MatchingEngine();
