import { Report } from "@/types";

export interface SearchQueryOptions {
  query?: string;
  reportType?: "LOST" | "FOUND" | "ALL";
  category?: string;
  zone?: string;
  status?: string;
}

export function searchAndRankReports(reports: Report[], options: SearchQueryOptions): Report[] {
  let filtered = [...reports];

  // Filter by report type
  if (options.reportType && options.reportType !== "ALL") {
    filtered = filtered.filter((r) => r.reportType === options.reportType);
  }

  // Filter by category
  if (options.category && options.category !== "ALL") {
    filtered = filtered.filter((r) => r.category === options.category);
  }

  // Filter by campus zone
  if (options.zone && options.zone !== "ALL") {
    filtered = filtered.filter((r) => r.location.zone === options.zone || r.location.name.includes(options.zone!));
  }

  // Natural Language & Keyword Scoring
  if (options.query && options.query.trim()) {
    const rawTokens = options.query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

    // Stop words
    const stopWords = new Set(["the", "and", "near", "with", "lost", "found", "item", "please", "yesterday", "today"]);
    const queryTokens = rawTokens.filter((t) => !stopWords.has(t));

    const scored = filtered.map((report) => {
      let score = 0;
      const titleLower = report.title.toLowerCase();
      const descLower = report.description.toLowerCase();
      const locLower = `${report.location.name} ${report.location.zone || ""}`.toLowerCase();
      const aiKeywords = (report.ai?.keywords || []).map((k) => k.toLowerCase());
      const brandLower = (report.ai?.brand || "").toLowerCase();
      const colorLower = (report.ai?.color || "").toLowerCase();

      for (const token of queryTokens.length > 0 ? queryTokens : rawTokens) {
        if (titleLower.includes(token)) score += 15;
        if (brandLower.includes(token)) score += 12;
        if (colorLower.includes(token)) score += 10;
        if (descLower.includes(token)) score += 8;
        if (locLower.includes(token)) score += 10;
        if (aiKeywords.some((k) => k.includes(token))) score += 7;
      }

      return { report, score };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.report);
  }

  // Default sorting: Most recent first
  return filtered.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
}
