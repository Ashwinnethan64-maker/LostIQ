import crypto from "crypto";
import {
  Report,
  ReportType,
  ReportStatus,
  UserProfile,
  Claim,
  ClaimStatus,
  RecoveryToken,
  RecoveryEvent,
  RecoveryEventType,
  RecoveryReceipt,
} from "@/types";
import { getSupabaseClient } from "./client";
import { logger } from "../logger";
import {
  loadReportsFromFile,
  saveReportsToFile,
  loadUsersFromFile,
  saveUsersToFile,
  loadClaimsFromFile,
  saveClaimsToFile,
  loadTokensFromFile,
  saveTokensToFile,
  loadEventsFromFile,
  saveEventsToFile,
} from "../db/persistence";

// Persistent store across Next.js dev server hot-reloads and API route requests
const globalForReports = globalThis as unknown as {
  localReportsStore?: Map<string, Report>;
  localUsersStore?: Map<string, UserProfile>;
  localClaimsStore?: Map<string, Claim>;
  localTokensStore?: Map<string, RecoveryToken>;
  localEventsStore?: Map<string, RecoveryEvent>;
};

const localReportsStore = globalForReports.localReportsStore || new Map<string, Report>();
const localUsersStore = globalForReports.localUsersStore || new Map<string, UserProfile>();
const localClaimsStore = globalForReports.localClaimsStore || new Map<string, Claim>();
const localTokensStore = globalForReports.localTokensStore || new Map<string, RecoveryToken>();
const localEventsStore = globalForReports.localEventsStore || new Map<string, RecoveryEvent>();

if (!globalForReports.localReportsStore) globalForReports.localReportsStore = localReportsStore;
if (!globalForReports.localUsersStore) globalForReports.localUsersStore = localUsersStore;
if (!globalForReports.localClaimsStore) globalForReports.localClaimsStore = localClaimsStore;
if (!globalForReports.localTokensStore) globalForReports.localTokensStore = localTokensStore;
if (!globalForReports.localEventsStore) globalForReports.localEventsStore = localEventsStore;

function initStoreFromPersistence() {
  const savedReports = loadReportsFromFile();
  for (const r of savedReports) {
    if (!localReportsStore.has(r.id)) {
      localReportsStore.set(r.id, r);
    }
  }

  const savedUsers = loadUsersFromFile();
  for (const u of savedUsers) {
    if (!localUsersStore.has(u.id)) {
      localUsersStore.set(u.id, u);
    }
  }

  const savedClaims = loadClaimsFromFile();
  for (const c of savedClaims) {
    if (!localClaimsStore.has(c.id)) {
      localClaimsStore.set(c.id, c);
    }
  }

  const savedTokens = loadTokensFromFile();
  for (const t of savedTokens) {
    if (!localTokensStore.has(t.id)) {
      localTokensStore.set(t.id, t);
    }
  }

  const savedEvents = loadEventsFromFile();
  for (const e of savedEvents) {
    if (!localEventsStore.has(e.id)) {
      localEventsStore.set(e.id, e);
    }
  }
}

initStoreFromPersistence();

function mapDbRowToReport(row: any): Report {
  return {
    id: row.id,
    reportType: row.report_type as ReportType,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    category: row.category,
    brand: row.brand || undefined,
    model: row.model || undefined,
    color: row.color || undefined,
    material: row.material || undefined,
    distinctiveFeatures: row.distinctive_features || undefined,
    privateOwnershipProof: row.private_ownership_proof || undefined,
    imageUrl: row.image_url || null,
    location: typeof row.location === "string" ? JSON.parse(row.location) : row.location,
    reportedAt: row.reported_at,
    status: row.status as ReportStatus,
    ai: typeof row.ai === "string" ? JSON.parse(row.ai) : row.ai,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// 1. Sync User Profile (Canonical Firebase UID bridge)
export async function syncUserProfileInDb(profile: UserProfile): Promise<UserProfile> {
  initStoreFromPersistence();
  const canonicalUser: UserProfile = {
    ...profile,
    id: profile.id,
    email: profile.email || "",
    displayName: profile.displayName || "Campus User",
    photoURL: profile.photoURL || null,
    role: profile.role || "user",
    createdAt: profile.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  localUsersStore.set(canonicalUser.id, canonicalUser);
  saveUsersToFile(Array.from(localUsersStore.values()));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from("users").upsert({
        id: canonicalUser.id,
        email: canonicalUser.email,
        display_name: canonicalUser.displayName,
        photo_url: canonicalUser.photoURL,
        role: canonicalUser.role,
        updated_at: canonicalUser.updatedAt,
      });
      if (error) {
        logger.warn("Supabase user sync error fallback", "SupabaseDb", error.message);
      }
    } catch (err: any) {
      logger.warn("Supabase user sync exception fallback", "SupabaseDb", err);
    }
  }

  return canonicalUser;
}

// 2. Create Report with Canonical UUID
export async function createReportInDb(report: Partial<Report> & { title: string; description: string; reportType: ReportType; userId: string }): Promise<Report> {
  initStoreFromPersistence();

  // Guarantee canonical UUID
  const canonicalId = report.id && report.id.trim().length > 0 ? report.id : crypto.randomUUID();
  const nowIso = new Date().toISOString();

  const finalReport: Report = {
    id: canonicalId,
    reportType: report.reportType,
    userId: report.userId,
    title: report.title,
    description: report.description,
    category: report.category || "other",
    brand: report.brand || null,
    model: report.model || null,
    color: report.color || null,
    material: report.material || null,
    distinctiveFeatures: report.distinctiveFeatures || null,
    privateOwnershipProof: report.privateOwnershipProof || null,
    imageUrl: report.imageUrl || null,
    location: report.location || { name: "Campus Area", zone: "Central Academic Quad" },
    reportedAt: report.reportedAt || nowIso,
    status: report.status || "OPEN",
    ai: report.ai || null,
    createdAt: report.createdAt || nowIso,
    updatedAt: nowIso,
  };

  localReportsStore.set(finalReport.id, finalReport);
  saveReportsToFile(Array.from(localReportsStore.values()));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from("reports").insert({
        id: finalReport.id,
        report_type: finalReport.reportType,
        user_id: finalReport.userId,
        title: finalReport.title,
        description: finalReport.description,
        category: finalReport.category,
        brand: finalReport.brand,
        model: finalReport.model,
        color: finalReport.color,
        material: finalReport.material,
        distinctive_features: finalReport.distinctiveFeatures,
        private_ownership_proof: finalReport.privateOwnershipProof,
        image_url: finalReport.imageUrl,
        location: finalReport.location,
        reported_at: finalReport.reportedAt,
        status: finalReport.status,
        ai: finalReport.ai,
        created_at: finalReport.createdAt,
        updated_at: finalReport.updatedAt,
      }).select("*").single();

      if (data && !error) {
        return mapDbRowToReport(data);
      }
      if (error) {
        logger.warn("Supabase report insert fallback", "SupabaseDb", error.message);
      }
    } catch (err: any) {
      logger.warn("Supabase report insert exception fallback", "SupabaseDb", err);
    }
  }

  return finalReport;
}

// 3. Authoritative Query for User Reports
export async function getReportsForUser(userId: string): Promise<Report[]> {
  initStoreFromPersistence();
  if (!userId) return [];

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", userId)
        .order("reported_at", { ascending: false });

      if (data && !error) {
        return data.map(mapDbRowToReport);
      }
      if (error) {
        logger.warn("Supabase user reports query error fallback", "SupabaseDb", error.message);
      }
    } catch (err: any) {
      logger.warn("Supabase user reports exception fallback", "SupabaseDb", err);
    }
  }

  // Authoritative fallback: filter by user_id from persistent store
  const targetUid = userId.toLowerCase();
  return Array.from(localReportsStore.values())
    .filter((r) => r.userId && r.userId.toLowerCase() === targetUid)
    .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
}

// 4. Update Report Status
export async function updateReportStatusInDb(reportId: string, status: ReportStatus): Promise<boolean> {
  initStoreFromPersistence();
  const report = localReportsStore.get(reportId);
  if (report) {
    report.status = status;
    report.updatedAt = new Date().toISOString();
    localReportsStore.set(report.id, report);
    saveReportsToFile(Array.from(localReportsStore.values()));
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from("reports").update({ status, updated_at: new Date().toISOString() }).eq("id", reportId);
      if (error) {
        logger.warn("Supabase status update error", "SupabaseDb", error.message);
      }
    } catch (err: any) {
      logger.warn("Supabase status update exception", "SupabaseDb", err);
    }
  }

  return true;
}

// 5. Get Report by ID
export async function getReportByIdFromDb(reportId: string): Promise<Report | null> {
  initStoreFromPersistence();
  if (!reportId) return null;

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from("reports").select("*").eq("id", reportId).single();
      if (data && !error) return mapDbRowToReport(data);
      if (error && error.code !== "PGRST116" && error.code !== "PGRST205") {
        logger.warn("Supabase fetch report error", "SupabaseDb", error.message);
      }
    } catch (err: any) {
      logger.warn("Supabase fetch report exception", "SupabaseDb", err);
    }
  }

  return localReportsStore.get(reportId) || null;
}

// 6. Get Reports with Filters
export async function getReportsFromDb(filters?: {
  reportType?: ReportType;
  category?: string;
  status?: ReportStatus;
  search?: string;
  userId?: string;
  limitCount?: number;
}): Promise<Report[]> {
  initStoreFromPersistence();
  const supabase = getSupabaseClient();
  const maxLimit = filters?.limitCount || 50;

  if (supabase) {
    try {
      let query = supabase.from("reports").select("*");
      if (filters?.reportType) query = query.eq("report_type", filters.reportType);
      if (filters?.category) query = query.eq("category", filters.category);
      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.userId) query = query.eq("user_id", filters.userId);

      query = query.order("reported_at", { ascending: false }).limit(maxLimit);
      const { data, error } = await query;
      if (data && !error) return data.map(mapDbRowToReport);
      if (error) {
        logger.warn("Supabase reports query error fallback", "SupabaseDb", error.message);
      }
    } catch (err: any) {
      logger.warn("Supabase reports query exception fallback", "SupabaseDb", err);
    }
  }

  let items = Array.from(localReportsStore.values());
  if (filters?.reportType) items = items.filter((r) => r.reportType === filters.reportType);
  if (filters?.category) items = items.filter((r) => r.category === filters.category);
  if (filters?.status) items = items.filter((r) => r.status === filters.status);

  if (filters?.userId) {
    const targetUid = filters.userId.toLowerCase();
    items = items.filter((r) => r.userId?.toLowerCase() === targetUid);
  }

  if (filters?.search) {
    const term = filters.search.toLowerCase();
    items = items.filter(
      (r) =>
        r.title.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term) ||
        r.location.name.toLowerCase().includes(term) ||
        r.ai?.keywords?.some((k) => k.toLowerCase().includes(term))
    );
  }

  return items.slice(0, maxLimit);
}

// 7. Create / Update Claims
export async function createClaimInDb(claim: Partial<Claim> & { reportId: string; claimantId: string; proofDetails: string }): Promise<Claim> {
  initStoreFromPersistence();
  const canonicalId = claim.id && claim.id.trim().length > 0 ? claim.id : crypto.randomUUID();
  const nowIso = new Date().toISOString();

  const finalClaim: Claim = {
    id: canonicalId,
    reportId: claim.reportId,
    lostReportId: claim.lostReportId || "",
    matchId: claim.matchId || null,
    claimantId: claim.claimantId,
    finderId: claim.finderId || "",
    proofDetails: claim.proofDetails,
    proofImageUrl: claim.proofImageUrl || null,
    verificationAttempts: claim.verificationAttempts || 1,
    verificationStatus: claim.verificationStatus || "PASSED",
    handoverStatus: claim.handoverStatus || "NONE",
    status: claim.status || "VERIFIED",
    reviewerId: claim.reviewerId || null,
    reviewNote: claim.reviewNote || null,
    verifiedAt: claim.verifiedAt || nowIso,
    finderConfirmedAt: claim.finderConfirmedAt || null,
    ownerReceivedAt: claim.ownerReceivedAt || null,
    createdAt: claim.createdAt || nowIso,
    updatedAt: nowIso,
  };

  localClaimsStore.set(finalClaim.id, finalClaim);
  saveClaimsToFile(Array.from(localClaimsStore.values()));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from("claims").insert({
        id: finalClaim.id,
        report_id: finalClaim.reportId,
        lost_report_id: finalClaim.lostReportId || null,
        claimant_id: finalClaim.claimantId,
        finder_id: finalClaim.finderId || null,
        proof_details: finalClaim.proofDetails,
        status: finalClaim.status,
        created_at: finalClaim.createdAt,
        updated_at: finalClaim.updatedAt,
      });
      if (error) {
        logger.warn("Supabase claim insert fallback", "SupabaseDb", error.message);
      }
    } catch (err: any) {
      logger.warn("Supabase claim insert exception fallback", "SupabaseDb", err);
    }
  }

  return finalClaim;
}

export async function updateClaimInDb(claimId: string, updates: Partial<Claim>): Promise<Claim | null> {
  initStoreFromPersistence();
  const existing = localClaimsStore.get(claimId);
  if (!existing) return null;

  const updated: Claim = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  localClaimsStore.set(claimId, updated);
  saveClaimsToFile(Array.from(localClaimsStore.values()));

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from("claims").update({
        status: updated.status,
        updated_at: updated.updatedAt,
        proof_details: updated.proofDetails,
      }).eq("id", claimId);
      if (error) {
        logger.warn("Supabase claim update error", "SupabaseDb", error.message);
      }
    } catch (err: any) {
      logger.warn("Supabase claim update exception", "SupabaseDb", err);
    }
  }

  return updated;
}

export async function getClaimByIdFromDb(claimId: string): Promise<Claim | null> {
  initStoreFromPersistence();
  if (!claimId) return null;

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from("claims").select("*").eq("id", claimId).single();
      if (data && !error) {
        return {
          id: data.id,
          reportId: data.report_id,
          lostReportId: data.lost_report_id || "",
          claimantId: data.claimant_id,
          finderId: data.finder_id || "",
          proofDetails: data.proof_details,
          status: data.status,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (err: any) {
      logger.warn("Supabase get claim exception fallback", "SupabaseDb", err);
    }
  }

  return localClaimsStore.get(claimId) || null;
}

export async function getClaimsFromDb(filters?: {
  reportId?: string;
  lostReportId?: string;
  claimantId?: string;
  finderId?: string;
  status?: ClaimStatus;
}): Promise<Claim[]> {
  initStoreFromPersistence();
  let items = Array.from(localClaimsStore.values());
  if (filters?.reportId) items = items.filter((c) => c.reportId === filters.reportId);
  if (filters?.lostReportId) items = items.filter((c) => c.lostReportId === filters.lostReportId);
  if (filters?.status) items = items.filter((c) => c.status === filters.status);
  if (filters?.claimantId) {
    const target = filters.claimantId.toLowerCase();
    items = items.filter((c) => c.claimantId.toLowerCase() === target);
  }
  if (filters?.finderId) {
    const target = filters.finderId.toLowerCase();
    items = items.filter((c) => c.finderId?.toLowerCase() === target);
  }

  return items;
}

export async function hasExistingClaim(reportId: string, claimantId: string): Promise<boolean> {
  initStoreFromPersistence();
  const targetClaimant = claimantId.toLowerCase();
  for (const c of Array.from(localClaimsStore.values())) {
    if (c.reportId === reportId && c.claimantId.toLowerCase() === targetClaimant && c.status !== "CANCELLED" && c.status !== "REJECTED") {
      return true;
    }
  }
  return false;
}

// 8. Recovery Token Management
export async function saveRecoveryTokenInDb(tokenRecord: RecoveryToken): Promise<RecoveryToken> {
  initStoreFromPersistence();
  localTokensStore.set(tokenRecord.tokenHash, tokenRecord);
  saveTokensToFile(Array.from(localTokensStore.values()));
  return tokenRecord;
}

export async function getRecoveryTokenByHash(tokenHash: string): Promise<RecoveryToken | null> {
  initStoreFromPersistence();
  return localTokensStore.get(tokenHash) || null;
}

export async function markRecoveryTokenUsed(tokenHash: string): Promise<boolean> {
  initStoreFromPersistence();
  const tokenRecord = localTokensStore.get(tokenHash);
  if (tokenRecord) {
    tokenRecord.usedAt = new Date().toISOString();
    localTokensStore.set(tokenHash, tokenRecord);
    saveTokensToFile(Array.from(localTokensStore.values()));
    return true;
  }
  return false;
}

// 9. Audit Event Logging
export async function logRecoveryEvent(event: Omit<RecoveryEvent, "id" | "createdAt">): Promise<RecoveryEvent> {
  initStoreFromPersistence();
  const newEvent: RecoveryEvent = {
    ...event,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  localEventsStore.set(newEvent.id, newEvent);
  saveEventsToFile(Array.from(localEventsStore.values()));
  return newEvent;
}

export async function getRecoveryEventsForClaim(claimId: string): Promise<RecoveryEvent[]> {
  initStoreFromPersistence();
  return Array.from(localEventsStore.values())
    .filter((e) => e.claimId === claimId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

