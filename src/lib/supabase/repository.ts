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
  if (localReportsStore.size === 0) {
    const savedReports = loadReportsFromFile();
    for (const r of savedReports) localReportsStore.set(r.id, r);
  }

  if (localUsersStore.size === 0) {
    const savedUsers = loadUsersFromFile();
    for (const u of savedUsers) localUsersStore.set(u.id, u);
  }

  if (localClaimsStore.size === 0) {
    const savedClaims = loadClaimsFromFile();
    for (const c of savedClaims) localClaimsStore.set(c.id, c);
  }

  if (localTokensStore.size === 0) {
    const savedTokens = loadTokensFromFile();
    for (const t of savedTokens) localTokensStore.set(t.id, t);
  }

  if (localEventsStore.size === 0) {
    const savedEvents = loadEventsFromFile();
    for (const e of savedEvents) localEventsStore.set(e.id, e);
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

// 1. Sync User Profile
export async function syncUserProfileInDb(profile: UserProfile): Promise<UserProfile> {
  const supabase = getSupabaseClient();
  localUsersStore.set(profile.id, profile);
  saveUsersToFile(Array.from(localUsersStore.values()));

  if (supabase) {
    try {
      await supabase.from("users").upsert({
        id: profile.id,
        email: profile.email,
        display_name: profile.displayName,
        photo_url: profile.photoURL || null,
        role: profile.role || "user",
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      logger.warn("Supabase user sync error fallback", "SupabaseDb", err);
    }
  }

  return profile;
}

// 2. Create Report
export async function createReportInDb(report: Report): Promise<Report> {
  const supabase = getSupabaseClient();
  localReportsStore.set(report.id, report);
  saveReportsToFile(Array.from(localReportsStore.values()));

  if (supabase) {
    try {
      await supabase.from("reports").insert({
        id: report.id,
        report_type: report.reportType,
        user_id: report.userId,
        title: report.title,
        description: report.description,
        category: report.category,
        brand: report.brand || null,
        model: report.model || null,
        color: report.color || null,
        material: report.material || null,
        distinctive_features: report.distinctiveFeatures || null,
        private_ownership_proof: report.privateOwnershipProof || null,
        image_url: report.imageUrl || null,
        location: report.location,
        reported_at: report.reportedAt,
        status: report.status || "OPEN",
        ai: report.ai || null,
        created_at: report.createdAt || new Date().toISOString(),
        updated_at: report.updatedAt || new Date().toISOString(),
      });
    } catch (err) {
      logger.warn("Supabase report insert fallback", "SupabaseDb", err);
    }
  }

  return report;
}

// 3. Update Report Status
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
      await supabase.from("reports").update({ status, updated_at: new Date().toISOString() }).eq("id", reportId);
    } catch (err) {
      logger.warn("Supabase status update error", "SupabaseDb", err);
    }
  }

  return true;
}

// 4. Get Report by ID
export async function getReportByIdFromDb(reportId: string): Promise<Report | null> {
  initStoreFromPersistence();
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase.from("reports").select("*").eq("id", reportId).single();
      if (data && !error) return mapDbRowToReport(data);
    } catch (err) {
      logger.warn("Supabase fetch report error", "SupabaseDb", err);
    }
  }

  return localReportsStore.get(reportId) || null;
}

// 5. Get Reports with Filters
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
      if (filters?.userId) query = query.ilike("user_id", filters.userId);

      query = query.order("reported_at", { ascending: false }).limit(maxLimit);
      const { data, error } = await query;
      if (data && !error && data.length > 0) return data.map(mapDbRowToReport);
    } catch (err) {
      logger.warn("Supabase reports query error", "SupabaseDb", err);
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

// 6. Create / Update Claims
export async function createClaimInDb(claim: Claim): Promise<Claim> {
  const supabase = getSupabaseClient();
  localClaimsStore.set(claim.id, claim);
  saveClaimsToFile(Array.from(localClaimsStore.values()));

  if (supabase) {
    try {
      await supabase.from("claims").insert({
        id: claim.id,
        report_id: claim.reportId,
        lost_report_id: claim.lostReportId || null,
        claimant_id: claim.claimantId,
        finder_id: claim.finderId || null,
        proof_details: claim.proofDetails,
        status: claim.status,
        created_at: claim.createdAt,
        updated_at: claim.updatedAt,
      });
    } catch (err) {
      logger.warn("Supabase claim insert fallback", "SupabaseDb", err);
    }
  }

  return claim;
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
      await supabase.from("claims").update({
        status: updated.status,
        updated_at: updated.updatedAt,
        proof_details: updated.proofDetails,
      }).eq("id", claimId);
    } catch (err) {
      logger.warn("Supabase claim update error", "SupabaseDb", err);
    }
  }

  return updated;
}

export async function getClaimByIdFromDb(claimId: string): Promise<Claim | null> {
  initStoreFromPersistence();
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
    } catch (err) {
      logger.warn("Supabase get claim by ID error", "SupabaseDb", err);
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
  const targetClaimant = claimantId.toLowerCase();
  for (const c of Array.from(localClaimsStore.values())) {
    if (c.reportId === reportId && c.claimantId.toLowerCase() === targetClaimant && c.status !== "CANCELLED" && c.status !== "REJECTED") {
      return true;
    }
  }
  return false;
}

// 7. Recovery Token Management
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

// 8. Audit Event Logging
export async function logRecoveryEvent(event: Omit<RecoveryEvent, "id" | "createdAt">): Promise<RecoveryEvent> {
  initStoreFromPersistence();
  const newEvent: RecoveryEvent = {
    ...event,
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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
