import { Report, ReportType, ReportStatus, UserProfile, Claim } from "@/types";
import { getSupabaseClient } from "./client";
import { logger } from "../logger";
import {
  loadReportsFromFile,
  saveReportsToFile,
  loadUsersFromFile,
  saveUsersToFile,
  loadClaimsFromFile,
  saveClaimsToFile,
} from "../db/persistence";

// Persistent store across Next.js dev server hot-reloads and API route requests
const globalForReports = globalThis as unknown as {
  localReportsStore?: Map<string, Report>;
  localUsersStore?: Map<string, UserProfile>;
  localClaimsStore?: Map<string, Claim>;
};

const localReportsStore = globalForReports.localReportsStore || new Map<string, Report>();
const localUsersStore = globalForReports.localUsersStore || new Map<string, UserProfile>();
const localClaimsStore = globalForReports.localClaimsStore || new Map<string, Claim>();

if (!globalForReports.localReportsStore) globalForReports.localReportsStore = localReportsStore;
if (!globalForReports.localUsersStore) globalForReports.localUsersStore = localUsersStore;
if (!globalForReports.localClaimsStore) globalForReports.localClaimsStore = localClaimsStore;

function initStoreFromPersistence() {
  if (localReportsStore.size === 0) {
    const savedReports = loadReportsFromFile();
    for (const r of savedReports) {
      localReportsStore.set(r.id, r);
    }
  }

  if (localUsersStore.size === 0) {
    const savedUsers = loadUsersFromFile();
    for (const u of savedUsers) {
      localUsersStore.set(u.id, u);
    }
  }

  if (localClaimsStore.size === 0) {
    const savedClaims = loadClaimsFromFile();
    for (const c of savedClaims) {
      localClaimsStore.set(c.id, c);
    }
  }
}

initStoreFromPersistence();

// Helper to map Supabase database row to Report TypeScript entity
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
    imageUrl: row.image_url || null,
    location: typeof row.location === "string" ? JSON.parse(row.location) : row.location,
    reportedAt: row.reported_at,
    status: row.status as ReportStatus,
    ai: typeof row.ai === "string" ? JSON.parse(row.ai) : row.ai,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// 1. Sync / Upsert User Profile using Firebase Auth UID
export async function syncUserProfileInDb(profile: UserProfile): Promise<UserProfile> {
  const supabase = getSupabaseClient();
  localUsersStore.set(profile.id, profile);
  saveUsersToFile(Array.from(localUsersStore.values()));

  if (supabase) {
    try {
      const { error } = await supabase.from("users").upsert({
        id: profile.id, // Canonical Firebase Auth UID
        email: profile.email,
        display_name: profile.displayName,
        photo_url: profile.photoURL || null,
        role: profile.role || "user",
        updated_at: new Date().toISOString(),
      });

      if (error) {
        logger.warn("Supabase user sync error. Stored safely in persistent layer.", "SupabaseDb", error.message);
      } else {
        logger.info("User profile synced in Supabase PostgreSQL", "SupabaseDb", { uid: profile.id });
      }
    } catch (err) {
      logger.warn("Supabase user upsert exception", "SupabaseDb", err);
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
      const { error } = await supabase.from("reports").insert({
        id: report.id,
        report_type: report.reportType,
        user_id: report.userId, // Foreign Key referencing users.id (Firebase Auth UID)
        title: report.title,
        description: report.description,
        category: report.category,
        brand: report.brand || null,
        model: report.model || null,
        color: report.color || null,
        material: report.material || null,
        distinctive_features: report.distinctiveFeatures || null,
        image_url: report.imageUrl || null,
        location: report.location,
        reported_at: report.reportedAt,
        status: report.status || "OPEN",
        ai: report.ai || null,
        created_at: report.createdAt || new Date().toISOString(),
        updated_at: report.updatedAt || new Date().toISOString(),
      });

      if (error) {
        logger.warn("Supabase report insert fallback to persistent store", "SupabaseDb", error.message);
      } else {
        logger.info("Report successfully stored in Supabase PostgreSQL", "SupabaseDb", { id: report.id });
      }
    } catch (err) {
      logger.warn("Supabase report insert exception", "SupabaseDb", err);
    }
  }

  return report;
}

// 3. Get Report by ID
export async function getReportByIdFromDb(reportId: string): Promise<Report | null> {
  initStoreFromPersistence();
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", reportId)
        .single();

      if (data && !error) {
        return mapDbRowToReport(data);
      }
    } catch (err) {
      logger.warn("Error fetching report from Supabase. Falling back to persistent local store.", "SupabaseDb", err);
    }
  }

  return localReportsStore.get(reportId) || null;
}

// 4. Get Reports with Filters (Permanent UID matching)
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
      if (data && !error && data.length > 0) {
        return data.map(mapDbRowToReport);
      }
    } catch (err) {
      logger.warn("Supabase query failed. Falling back to local data store.", "SupabaseDb", err);
    }
  }

  // Local filtered fallback
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

// 5. Create & Query Claims
export async function createClaimInDb(claim: Claim): Promise<Claim> {
  const supabase = getSupabaseClient();
  localClaimsStore.set(claim.id, claim);
  saveClaimsToFile(Array.from(localClaimsStore.values()));

  if (supabase) {
    try {
      const { error } = await supabase.from("claims").insert({
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

      if (error) {
        logger.warn("Supabase claim insert fallback to persistent layer", "SupabaseDb", error.message);
      } else {
        logger.info("Claim successfully stored in Supabase PostgreSQL", "SupabaseDb", { id: claim.id });
      }
    } catch (err) {
      logger.warn("Supabase claim insert exception", "SupabaseDb", err);
    }
  }

  return claim;
}

export async function getClaimsFromDb(filters?: {
  reportId?: string;
  lostReportId?: string;
  claimantId?: string;
  finderId?: string;
}): Promise<Claim[]> {
  initStoreFromPersistence();
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      let query = supabase.from("claims").select("*");
      if (filters?.reportId) query = query.eq("report_id", filters.reportId);
      if (filters?.lostReportId) query = query.eq("lost_report_id", filters.lostReportId);
      if (filters?.claimantId) query = query.ilike("claimant_id", filters.claimantId);
      if (filters?.finderId) query = query.ilike("finder_id", filters.finderId);

      const { data, error } = await query;
      if (data && !error && data.length > 0) {
        return data.map((c: any) => ({
          id: c.id,
          reportId: c.report_id,
          lostReportId: c.lost_report_id,
          claimantId: c.claimant_id,
          finderId: c.finder_id,
          proofDetails: c.proof_details,
          status: c.status,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }));
      }
    } catch (err) {
      logger.warn("Supabase claims query fallback to local data store", "SupabaseDb", err);
    }
  }

  let items = Array.from(localClaimsStore.values());
  if (filters?.reportId) items = items.filter((c) => c.reportId === filters.reportId);
  if (filters?.lostReportId) items = items.filter((c) => c.lostReportId === filters.lostReportId);
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
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("claims")
        .select("id")
        .eq("report_id", reportId)
        .ilike("claimant_id", claimantId)
        .limit(1);

      if (data && data.length > 0) return true;
    } catch (err) {
      logger.warn("Error checking existing claim in Supabase", "SupabaseDb", err);
    }
  }

  const targetClaimant = claimantId.toLowerCase();
  for (const c of Array.from(localClaimsStore.values())) {
    if (c.reportId === reportId && c.claimantId.toLowerCase() === targetClaimant) {
      return true;
    }
  }

  return false;
}
