import fs from "fs";
import path from "path";
import { Report, UserProfile, Claim } from "@/types";
import { logger } from "../logger";

const isTestEnv = process.env.NODE_ENV === "test" || process.env.VITEST === "true";
const DATA_DIR = path.join(process.cwd(), isTestEnv ? ".data_test" : ".data");
const REPORTS_FILE = path.join(DATA_DIR, "reports.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const CLAIMS_FILE = path.join(DATA_DIR, "claims.json");

function ensureDirectoryExists() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    logger.warn("Failed to create persistence directory", "FilePersistence", err);
  }
}

export function loadReportsFromFile(): Report[] {
  ensureDirectoryExists();
  try {
    if (fs.existsSync(REPORTS_FILE)) {
      const data = fs.readFileSync(REPORTS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    logger.warn("Failed to load reports from file cache", "FilePersistence", err);
  }
  return [];
}

export function saveReportsToFile(reports: Report[]) {
  ensureDirectoryExists();
  try {
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2), "utf-8");
  } catch (err) {
    logger.warn("Failed to write reports to file cache", "FilePersistence", err);
  }
}

export function loadUsersFromFile(): UserProfile[] {
  ensureDirectoryExists();
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    logger.warn("Failed to load users from file cache", "FilePersistence", err);
  }
  return [];
}

export function saveUsersToFile(users: UserProfile[]) {
  ensureDirectoryExists();
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    logger.warn("Failed to write users to file cache", "FilePersistence", err);
  }
}

export function loadClaimsFromFile(): Claim[] {
  ensureDirectoryExists();
  try {
    if (fs.existsSync(CLAIMS_FILE)) {
      const data = fs.readFileSync(CLAIMS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    logger.warn("Failed to load claims from file cache", "FilePersistence", err);
  }
  return [];
}

export function saveClaimsToFile(claims: Claim[]) {
  ensureDirectoryExists();
  try {
    fs.writeFileSync(CLAIMS_FILE, JSON.stringify(claims, null, 2), "utf-8");
  } catch (err) {
    logger.warn("Failed to write claims to file cache", "FilePersistence", err);
  }
}
