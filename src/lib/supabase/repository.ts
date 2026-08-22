import { Report, ReportType, ReportStatus, UserProfile } from "@/types";
import { getSupabaseClient } from "./client";
import { logger } from "../logger";

// Seed & Local in-memory store for fallback/offline/testing resilience
// Use globalThis to persist across Next.js dev server hot-reloads and API route requests
const globalForReports = globalThis as unknown as {
  localReportsStore?: Map<string, Report>;
  localUsersStore?: Map<string, UserProfile>;
};

const localReportsStore = globalForReports.localReportsStore || new Map<string, Report>();
const localUsersStore = globalForReports.localUsersStore || new Map<string, UserProfile>();

if (!globalForReports.localReportsStore) globalForReports.localReportsStore = localReportsStore;
if (!globalForReports.localUsersStore) globalForReports.localUsersStore = localUsersStore;

function ensureSeedData() {
  if (localReportsStore.size > 0) return;

  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  const seed1: Report = {
    id: "rep-seed-001",
    reportType: "FOUND",
    userId: "campus-security-officer",
    title: "Black Sony Wireless Earbuds & Case",
    description: "Found black Sony WF-1000XM4 wireless earbuds with charging case near the 2nd floor library study carrels. Case has a minor surface scratch on the top lid.",
    category: "electronics",
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80",
    location: {
      name: "Central Library 2nd Floor Study Commons",
      zone: "Central Library & Study Commons",
    },
    reportedAt: now,
    status: "OPEN",
    ai: {
      summary: "Black Sony wireless earbuds in matte charging case with minor scratch.",
      category: "electronics",
      objectType: "wireless earbuds",
      brand: "Sony",
      color: "black",
      attributes: ["charging case", "matte black finish", "scratch on lid"],
      keywords: ["sony", "earbuds", "wireless", "audio", "case", "black"],
      extractedAt: now,
    },
    createdAt: now,
    updatedAt: now,
  };

  const seed2: Report = {
    id: "rep-seed-002",
    reportType: "FOUND",
    userId: "student-alex",
    title: "Brown Leather Fossil Bi-fold Wallet",
    description: "Found brown leather wallet under a table at Student Center dining hall. Contains student transit pass.",
    category: "id_cards",
    imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80",
    location: {
      name: "Student Dining Center Lower Level",
      zone: "Student Center & Dining Hall",
    },
    reportedAt: yesterday,
    status: "OPEN",
    ai: {
      summary: "Distressed brown leather bifold wallet with visible card slots.",
      category: "id_cards",
      objectType: "wallet",
      brand: "Fossil",
      color: "brown",
      attributes: ["leather", "bifold", "card slots", "distressed finish"],
      keywords: ["wallet", "leather", "brown", "fossil", "cards", "cash"],
      extractedAt: yesterday,
    },
    createdAt: yesterday,
    updatedAt: yesterday,
  };

  localReportsStore.set(seed1.id, seed1);
  localReportsStore.set(seed2.id, seed2);
}

ensureSeedData();

// Helper to map Supabase database row to Report TypeScript entity
function mapDbRowToReport(row: any): Report {
  return {
    id: row.id,
    reportType: row.report_type as ReportType,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    category: row.category,
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
        logger.error("Error syncing user profile in Supabase", "SupabaseDb", error);
      } else {
        logger.info("User profile synced in Supabase PostgreSQL", "SupabaseDb", { uid: profile.id });
      }
    } catch (err) {
      logger.error("Supabase user upsert exception", "SupabaseDb", err);
    }
  }

  return profile;
}

// 2. Create Report
export async function createReportInDb(report: Report): Promise<Report> {
  const supabase = getSupabaseClient();
  localReportsStore.set(report.id, report);

  if (supabase) {
    try {
      const { error } = await supabase.from("reports").insert({
        id: report.id,
        report_type: report.reportType,
        user_id: report.userId, // Foreign Key referencing users.id (Firebase Auth UID)
        title: report.title,
        description: report.description,
        category: report.category,
        image_url: report.imageUrl || null,
        location: report.location,
        reported_at: report.reportedAt,
        status: report.status || "OPEN",
        ai: report.ai || null,
        created_at: report.createdAt || new Date().toISOString(),
        updated_at: report.updatedAt || new Date().toISOString(),
      });

      if (error) {
        logger.error("Error creating report in Supabase. Stored locally in persistent map.", "SupabaseDb", error);
      } else {
        logger.info("Report successfully stored in Supabase PostgreSQL", "SupabaseDb", { id: report.id });
      }
    } catch (err) {
      logger.error("Supabase report insert exception", "SupabaseDb", err);
    }
  }

  return report;
}

// 3. Get Report by ID
export async function getReportByIdFromDb(reportId: string): Promise<Report | null> {
  ensureSeedData();
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

// 4. Get Reports with Filters
export async function getReportsFromDb(filters?: {
  reportType?: ReportType;
  category?: string;
  status?: ReportStatus;
  search?: string;
  userId?: string;
  limitCount?: number;
}): Promise<Report[]> {
  ensureSeedData();
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

  // Local filtered fallback (case-insensitive userId matching)
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
