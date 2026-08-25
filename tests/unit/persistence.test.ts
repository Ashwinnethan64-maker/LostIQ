import { describe, it, expect } from "vitest";
import { syncUserProfileInDb, createReportInDb, getReportsFromDb, getReportByIdFromDb } from "@/lib/supabase/repository";
import { Report, UserProfile } from "@/types";

describe("User Identity Mapping & Persistence Architecture", () => {
  const userA: UserProfile = {
    id: "firebase-uid-user-a-12345",
    email: "user.a@campus.edu",
    displayName: "User Alpha",
    role: "user",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const userB: UserProfile = {
    id: "firebase-uid-user-b-67890",
    email: "user.b@campus.edu",
    displayName: "User Beta",
    role: "user",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("stores and syncs user profiles using canonical Firebase Auth UID", async () => {
    const profileA = await syncUserProfileInDb(userA);
    expect(profileA.id).toBe("firebase-uid-user-a-12345");
    expect(profileA.displayName).toBe("User Alpha");

    const profileB = await syncUserProfileInDb(userB);
    expect(profileB.id).toBe("firebase-uid-user-b-67890");
  });

  it("links reports permanently to the authenticated user's Firebase UID", async () => {
    const reportA: Report = {
      id: "rep-user-a-watch",
      reportType: "LOST",
      userId: userA.id,
      title: "Lost Casio Watch",
      description: "Lost black Casio watch",
      category: "jewelry_watches",
      brand: "Casio",
      model: "G-Shock",
      color: "Black",
      location: { name: "Quad Bench", zone: "Central Academic Quad" },
      reportedAt: new Date().toISOString(),
      status: "OPEN",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const reportB: Report = {
      id: "rep-user-b-bag",
      reportType: "FOUND",
      userId: userB.id,
      title: "Found Backpack",
      description: "Found blue backpack",
      category: "bags_backpacks",
      location: { name: "Library 1st floor", zone: "Central Library & Study Commons" },
      reportedAt: new Date().toISOString(),
      status: "OPEN",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await createReportInDb(reportA);
    await createReportInDb(reportB);

    // Verify User A only gets User A's reports
    const userAReports = await getReportsFromDb({ userId: userA.id });
    expect(userAReports.some((r) => r.id === "rep-user-a-watch")).toBe(true);
    expect(userAReports.some((r) => r.id === "rep-user-b-bag")).toBe(false);

    // Verify User B only gets User B's reports
    const userBReports = await getReportsFromDb({ userId: userB.id });
    expect(userBReports.some((r) => r.id === "rep-user-b-bag")).toBe(true);
    expect(userBReports.some((r) => r.id === "rep-user-a-watch")).toBe(false);
  });

  it("preserves report history after simulated session restart or refresh", async () => {
    // Re-query without frontend state
    const report = await getReportByIdFromDb("rep-user-a-watch");
    expect(report).not.toBeNull();
    expect(report?.userId).toBe(userA.id);
    expect(report?.brand).toBe("Casio");
  });

  it("queries reports directly via getReportsForUser authoritative function", async () => {
    const userAReports = await getReportsFromDb({ userId: userA.id });
    expect(userAReports.length).toBeGreaterThan(0);
    expect(userAReports.every((r) => r.userId.toLowerCase() === userA.id.toLowerCase())).toBe(true);
  });

  it("generates a canonical UUID when report ID is omitted", async () => {
    const newReport = await createReportInDb({
      reportType: "LOST",
      userId: userA.id,
      title: "Silver MacBook Pro",
      description: "Left in physics auditorium",
      category: "electronics",
      location: { name: "Auditorium A", zone: "Science & Engineering Complex" },
    });

    expect(newReport.id).toBeDefined();
    expect(typeof newReport.id).toBe("string");
    // Standard UUID pattern (36 chars with hyphens)
    expect(newReport.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    // Verify it is retrievable by its exact UUID
    const fetched = await getReportByIdFromDb(newReport.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(newReport.id);
    expect(fetched?.title).toBe("Silver MacBook Pro");
  });

  it("ensures public explore visibility returns reports from all users while control desk query isolates user data", async () => {
    // 1. Explore query (no userId filter) returns reports from both User A and User B
    const allPublicReports = await getReportsFromDb({});
    const hasUserAReport = allPublicReports.some((r) => r.userId.toLowerCase() === userA.id.toLowerCase());
    const hasUserBReport = allPublicReports.some((r) => r.userId.toLowerCase() === userB.id.toLowerCase());
    expect(hasUserAReport).toBe(true);
    expect(hasUserBReport).toBe(true);

    // 2. Control Desk query for User A returns ONLY User A reports
    const controlDeskUserA = await getReportsFromDb({ userId: userA.id });
    expect(controlDeskUserA.every((r) => r.userId.toLowerCase() === userA.id.toLowerCase())).toBe(true);
    expect(controlDeskUserA.some((r) => r.userId.toLowerCase() === userB.id.toLowerCase())).toBe(false);

    // 3. Control Desk query for User B returns ONLY User B reports
    const controlDeskUserB = await getReportsFromDb({ userId: userB.id });
    expect(controlDeskUserB.every((r) => r.userId.toLowerCase() === userB.id.toLowerCase())).toBe(true);
    expect(controlDeskUserB.some((r) => r.userId.toLowerCase() === userA.id.toLowerCase())).toBe(false);
  });
});
