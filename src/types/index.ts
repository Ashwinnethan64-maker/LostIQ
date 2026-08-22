export type ReportType = "LOST" | "FOUND";

export type ReportStatus = "OPEN" | "MATCHED" | "CLAIMED" | "RESOLVED" | "CLOSED";

export type ItemCategory =
  | "electronics"
  | "id_cards"
  | "keys"
  | "bags_backpacks"
  | "bottles_tumblers"
  | "clothing_apparel"
  | "books_stationery"
  | "jewelry_watches"
  | "other";

export interface LocationData {
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  zone?: string | null;
}

export interface AIRawAttributes {
  summary: string;
  category: string;
  attributes: string[];
  keywords: string[];
  color: string;
  brand: string;
  objectType: string;
  extractedAt: string;
}

export interface Report {
  id: string;
  reportType: ReportType;
  userId: string;
  title: string;
  description: string;
  category: ItemCategory;
  imageUrl?: string | null;
  location: LocationData;
  reportedAt: string;
  status: ReportStatus;
  ai?: AIRawAttributes | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  role: "user" | "admin";
  createdAt: string;
  updatedAt: string;
}

export interface MatchScores {
  visual: number;     // 0 - 100
  semantic: number;   // 0 - 100
  attribute: number;  // 0 - 100
  location: number;   // 0 - 100
  time: number;       // 0 - 100
  category: number;   // 0 - 100
  overall: number;    // Weighted composite (0 - 100)
}

export interface MatchCandidate {
  id: string;
  sourceReportId: string;
  targetReportId: string;
  targetReport: Report;
  scores: MatchScores;
  explanation: string;
  status: "ACTIVE" | "DISMISSED" | "VERIFIED";
  createdAt: string;
  updatedAt: string;
}

export interface Claim {
  id: string;
  reportId: string;
  claimantId: string;
  proofDetails: string;
  proofImageUrl?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  reviewerId?: string | null;
  reviewNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalReports: number;
  lostReports: number;
  foundReports: number;
  potentialMatches: number;
  resolvedReports: number;
}
