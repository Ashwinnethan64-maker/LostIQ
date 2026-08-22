export type ReportType = "LOST" | "FOUND";

export type ReportStatus = "OPEN" | "MATCHED" | "CLAIMED" | "RESOLVED" | "RECOVERED" | "CLOSED";

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
  model?: string;
  material?: string;
  objectType: string;
  extractedAt: string;
  // Transparent origin tracking
  brandSource?: "USER" | "AI";
  colorSource?: "USER" | "AI";
  modelSource?: "USER" | "AI";
  materialSource?: "USER" | "AI";
}

export interface Report {
  id: string;
  reportType: ReportType;
  userId: string;
  title: string;
  description: string;
  category: ItemCategory;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
  material?: string | null;
  distinctiveFeatures?: string | null;
  privateOwnershipProof?: string | null; // Protected zero-knowledge owner proof
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
  status: "ACTIVE" | "DISMISSED" | "VERIFIED" | "RECOVERED";
  createdAt: string;
  updatedAt: string;
}

export type ClaimStatus =
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "PENDING_HANDOVER"
  | "FINDER_CONFIRMED"
  | "COMPLETED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export interface Claim {
  id: string;
  reportId: string;             // Target FOUND report ID
  lostReportId: string;         // Originating LOST report ID
  matchId?: string | null;
  claimantId: string;           // Authenticated user who created the LOST report
  finderId: string;             // User who created the FOUND report
  proofDetails: string;         // Submitted verification answers
  proofImageUrl?: string | null;
  verificationAttempts?: number;
  verificationStatus?: "PENDING" | "PASSED" | "FAILED" | "LOCKED";
  handoverStatus?: "NONE" | "FINDER_CONFIRMED" | "COMPLETED";
  status: ClaimStatus;
  reviewerId?: string | null;
  reviewNote?: string | null;
  verifiedAt?: string | null;
  finderConfirmedAt?: string | null;
  ownerReceivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecoveryToken {
  id: string;
  claimId: string;
  token: string;                // Cryptographic opaque token
  tokenHash: string;
  expiresAt: string;
  usedAt?: string | null;
  createdAt: string;
}

export type RecoveryEventType =
  | "CLAIM_CREATED"
  | "OWNER_VERIFICATION_STARTED"
  | "OWNER_VERIFICATION_PASSED"
  | "OWNER_VERIFICATION_FAILED"
  | "RECOVERY_PASS_CREATED"
  | "RECOVERY_PASS_USED"
  | "QR_SCAN_DETECTED"
  | "QR_TOKEN_VERIFIED"
  | "FINDER_CONFIRMED"
  | "OWNER_CONFIRMED"
  | "RECOVERY_COMPLETED"
  | "CLAIM_CANCELLED"
  | "RECOVERY_EXPIRED";

export interface RecoveryEvent {
  id: string;
  claimId: string;
  eventType: RecoveryEventType;
  actorUserId: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface RecoveryReceipt {
  receiptId: string; // LIQ-XXXXXX format
  claimId: string;
  itemTitle: string;
  lostReportId: string;
  foundReportId: string;
  matchScore: number;
  ownerVerified: boolean;
  finderConfirmed: boolean;
  ownerReceiptConfirmed: boolean;
  recoveredAt: string;
  status: "RECOVERED";
}

export interface DashboardStats {
  totalReports: number;
  lostReports: number;
  foundReports: number;
  potentialMatches: number;
  resolvedReports: number;
  recoveryRequests: number;
}
