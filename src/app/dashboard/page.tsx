"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { RouteGuard } from "@/lib/auth/RouteGuard";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  PlusCircle,
  Search,
  LayoutDashboard,
  ArrowRight,
  ShieldCheck,
  Inbox,
  Loader2,
  QrCode,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Report, Claim } from "@/types";
import { getFirstName } from "@/lib/utils";

type DashboardStatus = "AUTH_LOADING" | "DATA_LOADING" | "DATA_READY" | "DATA_ERROR" | "NOT_AUTHENTICATED";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [status, setStatus] = useState<DashboardStatus>("AUTH_LOADING");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    if (!user) {
      if (!authLoading) setStatus("NOT_AUTHENTICATED");
      return;
    }

    setStatus("DATA_LOADING");
    setErrorMessage(null);

    try {
      const [repRes, claimRes] = await Promise.all([
        fetch(`/api/reports?userId=${encodeURIComponent(user.id)}`, { cache: "no-store" }),
        fetch(`/api/claims?userId=${encodeURIComponent(user.id)}`, { cache: "no-store" }),
      ]);

      if (!repRes.ok || !claimRes.ok) {
        throw new Error("Failed to load your records from the server.");
      }

      const repData = await repRes.json();
      const claimData = await claimRes.json();

      if (repData.success && claimData.success) {
        setReports(repData.reports || []);
        setClaims(claimData.claims || []);
        setStatus("DATA_READY");
      } else {
        throw new Error(repData.error || claimData.error || "Failed to load database records.");
      }
    } catch (err: any) {
      console.error("Dashboard fetch error", err);
      setErrorMessage(err.message || "Unable to load your reports. Please check your connection.");
      setStatus("DATA_ERROR");
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (authLoading) {
      setStatus("AUTH_LOADING");
    } else if (!user) {
      setStatus("NOT_AUTHENTICATED");
    } else {
      fetchUserData();
    }
  }, [user, authLoading, fetchUserData]);

  const lostCount = reports.filter((r) => r.reportType === "LOST").length;
  const foundCount = reports.filter((r) => r.reportType === "FOUND").length;
  const recoveredCount = reports.filter((r) => r.status === "RECOVERED" || r.status === "RETURNED" || r.status === "RESOLVED").length;
  const pendingRecoveryCount = claims.filter((c) => c.status !== "COMPLETED" && c.status !== "CANCELLED").length;

  const firstName = getFirstName(user);
  const isLoading = status === "AUTH_LOADING" || status === "DATA_LOADING";

  return (
    <RouteGuard>
      <div className="space-y-10 py-4">
        
        {/* Editorial Header */}
        <div className="border-8 border-black bg-white p-6 sm:p-10 shadow-neo-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 border-3 border-black bg-[#C4B5FD] text-black px-3.5 py-1 text-xs font-black uppercase shadow-neo-sm">
              <LayoutDashboard className="h-4 w-4" />
              <span>CONTROL DESK • {user?.role === "admin" ? "ADMIN ACCESS" : "STUDENT PORTAL"}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 border-3 border-black bg-[#FFD93D] px-3 py-1 text-xs font-black uppercase shadow-neo-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>AUTHENTICATED AS {firstName.toUpperCase()}</span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter uppercase text-black leading-none">
            LOSTIQ <span className="bg-black text-white px-2 py-0.5 inline-block -rotate-1">CONTROL</span> DESK.
          </h1>
          <p className="font-bold text-sm sm:text-base text-black/80 max-w-xl">
            Welcome back, {firstName}. Manage your active cases, track AI-matched items, generate QR recovery passes, and confirm handovers.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/report/lost"
              className="neo-button px-5 py-3 text-xs sm:text-sm bg-[#FF6B6B] text-white border-3 border-black hover:bg-[#FF5252] shadow-neo"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              REPORT LOST VALUABLE
            </Link>
            <Link
              href="/report/found"
              className="neo-button px-5 py-3 text-xs sm:text-sm bg-[#FFD93D] text-black border-3 border-black hover:bg-[#FCC419] shadow-neo"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              REPORT FOUND ITEM
            </Link>
            <Link
              href="/reports"
              className="neo-button px-5 py-3 text-xs sm:text-sm bg-white text-black border-3 border-black hover:bg-[#E2E8F0] shadow-neo"
            >
              <Search className="mr-2 h-4 w-4" />
              SEARCH DIRECTORY
            </Link>
          </div>
        </div>

        {/* 4 Bold Metric Blocks */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="neo-card p-5 border-4 border-black bg-[#FF6B6B] text-white">
            <div className="text-xs font-black uppercase tracking-widest text-white/90">MY LOST REPORTS</div>
            <div className="text-4xl sm:text-5xl font-black mt-2">
              {isLoading ? <Loader2 className="h-8 w-8 animate-spin my-1" /> : lostCount}
            </div>
            <div className="text-[10px] font-bold uppercase mt-1 text-white/90">ACTIVE MISSING TICKETS</div>
          </div>

          <div className="neo-card p-5 border-4 border-black bg-[#FFD93D] text-black">
            <div className="text-xs font-black uppercase tracking-widest text-black/80">MY FOUND REPORTS</div>
            <div className="text-4xl sm:text-5xl font-black mt-2">
              {isLoading ? <Loader2 className="h-8 w-8 animate-spin my-1" /> : foundCount}
            </div>
            <div className="text-[10px] font-bold uppercase mt-1 text-black/80">COMMUNITY TURN-INS</div>
          </div>

          <div className="neo-card p-5 border-4 border-black bg-[#C4B5FD] text-black">
            <div className="text-xs font-black uppercase tracking-widest text-black/80">ACTIVE RECOVERIES</div>
            <div className="text-4xl sm:text-5xl font-black mt-2">
              {isLoading ? <Loader2 className="h-8 w-8 animate-spin my-1" /> : pendingRecoveryCount}
            </div>
            <div className="text-[10px] font-bold uppercase mt-1 text-black/80">HANDOVER PASSES IN FLIGHT</div>
          </div>

          <div className="neo-card p-5 border-4 border-black bg-white text-black">
            <div className="text-xs font-black uppercase tracking-widest text-black/70">RECOVERED ITEMS</div>
            <div className="text-4xl sm:text-5xl font-black mt-2 text-[#FF6B6B]">
              {isLoading ? <Loader2 className="h-8 w-8 animate-spin my-1" /> : recoveredCount}
            </div>
            <div className="text-[10px] font-bold uppercase mt-1 text-black/70">CONFIRMED HANDOVERS</div>
          </div>

        </div>

        {/* Database Error State */}
        {status === "DATA_ERROR" && (
          <div className="border-4 border-black bg-[#FF6B6B] text-white p-6 shadow-neo space-y-3">
            <div className="flex items-center gap-2 font-black text-base uppercase">
              <AlertCircle className="h-6 w-6" />
              <span>UNABLE TO LOAD YOUR REPORTS</span>
            </div>
            <p className="text-xs font-bold text-white/90">
              {errorMessage || "There was an error communicating with the database. Your reports have not been lost."}
            </p>
            <button
              onClick={fetchUserData}
              className="neo-button px-4 py-2 text-xs bg-white text-black border-2 border-black hover:bg-black hover:text-white font-black"
            >
              <RefreshCw className="h-3.5 w-3.5 inline mr-1" /> RETRY LOADING
            </button>
          </div>
        )}

        {/* Active Recovery Passes Section (if any claims active) */}
        {status === "DATA_READY" && claims.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b-4 border-black pb-2">
              <h2 className="text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
                <QrCode className="h-6 w-6 text-[#FF6B6B]" />
                <span>ACTIVE RECOVERY CLAIMS &amp; HANDOVERS ({claims.length})</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {claims.map((claim) => {
                const isOwner = claim.claimantId.toLowerCase() === user?.id?.toLowerCase();
                return (
                  <div
                    key={claim.id}
                    className="border-4 border-black bg-white p-5 shadow-neo space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="neo-sticker bg-[#FFD93D] text-black text-[10px]">
                        {isOwner ? "YOU ARE OWNER" : "YOU ARE FINDER"}
                      </span>
                      <span className={`text-xs font-black uppercase px-2 py-0.5 border-2 border-black ${
                        claim.status === "COMPLETED" ? "bg-black text-white" : "bg-[#C4B5FD] text-black"
                      }`}>
                        STATUS: {claim.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="font-black text-base text-black">
                        CLAIM REF: #{claim.id.slice(-6).toUpperCase()}
                      </div>
                      <p className="text-xs font-bold text-black/70">
                        {isOwner
                          ? "Ownership verified. Present your one-time recovery pass QR to the finder to confirm handover."
                          : "Verified owner claim received. Scan the owner's recovery pass to confirm physical handover."}
                      </p>
                    </div>

                    <div className="pt-2 border-t-2 border-black flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase text-black/60">
                        {new Date(claim.createdAt).toLocaleDateString()}
                      </span>
                      <Link
                        href={`/recovery/${claim.id}`}
                        className="neo-button px-4 py-1.5 text-xs bg-[#FF6B6B] text-white border-2 border-black hover:bg-[#FF5252] font-black"
                      >
                        RECOVERY HUB →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* User Activity & Cases Feed */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b-4 border-black pb-2">
            <h2 className="text-2xl font-black uppercase tracking-tight text-black">
              YOUR SUBMITTED REPORTS {isLoading ? "" : `(${reports.length})`}
            </h2>
            <span className="text-xs font-bold uppercase tracking-widest text-black/70">
              CLICK TO VIEW MATCH CONFIDENCE
            </span>
          </div>

          {isLoading ? (
            <div className="border-4 border-black bg-white p-12 text-center space-y-4 shadow-neo">
              <Loader2 className="h-8 w-8 animate-spin text-black mx-auto" />
              <div className="font-black text-sm uppercase tracking-wider text-black">
                LOADING YOUR LOSTIQ SUBMISSIONS FROM SUPABASE...
              </div>
            </div>
          ) : status === "DATA_READY" && reports.length === 0 ? (
            <div className="border-6 border-black bg-white p-10 sm:p-12 text-center space-y-4 shadow-neo-lg">
              <div className="h-16 w-16 border-4 border-black bg-[#FFD93D] text-black mx-auto flex items-center justify-center shadow-neo-sm">
                <Inbox className="h-8 w-8 text-black" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black uppercase text-black">NO ACTIVE SUBMISSIONS (0)</h3>
                <p className="font-bold text-sm text-black/70 max-w-md mx-auto">
                  You haven&apos;t filed any lost or found reports yet under this account.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <Link href="/report/lost" className="neo-button px-5 py-2.5 text-xs bg-[#FF6B6B] text-white border-3 border-black hover:bg-[#FF5252]">
                  REPORT LOST VALUABLE
                </Link>
                <Link href="/report/found" className="neo-button px-5 py-2.5 text-xs bg-[#FFD93D] text-black border-3 border-black hover:bg-[#FCC419]">
                  REPORT FOUND ITEM
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((rep) => {
                const isLost = rep.reportType === "LOST";
                return (
                  <div
                    key={rep.id}
                    className="neo-card p-5 border-4 border-black bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`neo-sticker text-[10px] ${
                            isLost ? "bg-[#FF6B6B] text-white" : "bg-[#FFD93D] text-black"
                          }`}
                        >
                          {rep.reportType}
                        </span>
                        <span className="text-xs font-bold uppercase text-black/70">
                          {rep.location?.name} • {new Date(rep.reportedAt).toLocaleDateString()}
                        </span>
                        {(rep.status === "RECOVERED" || rep.status === "RETURNED" || rep.status === "RESOLVED") && (
                          <span className="neo-sticker bg-black text-white text-[10px]">
                            ✓ {rep.status}
                          </span>
                        )}
                      </div>
                      <h3 className="font-black text-lg text-black">{rep.title}</h3>
                      <p className="text-xs font-bold text-black/80 max-w-xl line-clamp-1">
                        {rep.description}
                      </p>
                    </div>

                    <Link
                      href={`/reports/${rep.id}`}
                      className="neo-button px-4 py-2 text-xs bg-[#FFD93D] text-black border-3 border-black hover:bg-black hover:text-white whitespace-nowrap"
                    >
                      VIEW CASE FILE & MATCHES <ArrowRight className="ml-1.5 h-3.5 w-3.5 inline" />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </RouteGuard>
  );
}
