"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { RouteGuard } from "@/lib/auth/RouteGuard";
import { useAuth } from "@/lib/auth/AuthContext";
import { PlusCircle, Search, LayoutDashboard, ArrowRight, Shield } from "lucide-react";
import { Report } from "@/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserReports() {
      if (!user) return;
      try {
        const res = await fetch(`/api/reports?userId=${user.id}`);
        const data = await res.json();
        if (data.success) {
          setReports(data.reports || []);
        }
      } catch (err) {
        console.error("Failed to fetch user reports", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUserReports();
  }, [user]);

  const lostCount = reports.filter((r) => r.reportType === "LOST").length;
  const foundCount = reports.filter((r) => r.reportType === "FOUND").length;

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
            <span className="neo-sticker bg-[#FFD93D] text-black">
              USER ID: {user?.id}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter uppercase text-black leading-none">
            LOSTIQ <span className="bg-black text-white px-2 py-0.5 inline-block -rotate-1">CONTROL</span> DESK.
          </h1>
          <p className="font-bold text-sm sm:text-base text-black/80 max-w-xl">
            Welcome back, {user?.displayName || "Campus User"}. Manage your submissions, monitor active AI matches, and process recovery claims.
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
            <div className="text-xs font-black uppercase tracking-widest text-white/80">LOST REPORTS</div>
            <div className="text-4xl sm:text-5xl font-black mt-2">{lostCount}</div>
            <div className="text-[10px] font-bold uppercase mt-1 text-white/80">ACTIVE VALUABLES</div>
          </div>

          <div className="neo-card p-5 border-4 border-black bg-[#FFD93D] text-black">
            <div className="text-xs font-black uppercase tracking-widest text-black/70">FOUND REPORTS</div>
            <div className="text-4xl sm:text-5xl font-black mt-2">{foundCount}</div>
            <div className="text-[10px] font-bold uppercase mt-1 text-black/70">COMMUNITY TURN-INS</div>
          </div>

          <div className="neo-card p-5 border-4 border-black bg-[#C4B5FD] text-black">
            <div className="text-xs font-black uppercase tracking-widest text-black/70">TOTAL SUBMISSIONS</div>
            <div className="text-4xl sm:text-5xl font-black mt-2">{reports.length}</div>
            <div className="text-[10px] font-bold uppercase mt-1 text-black/70">PERSISTED IN SUPABASE</div>
          </div>

          <div className="neo-card p-5 border-4 border-black bg-white text-black">
            <div className="text-xs font-black uppercase tracking-widest text-black/60">AI MATCH STATUS</div>
            <div className="text-4xl sm:text-5xl font-black mt-2 text-[#FF6B6B]">LIVE</div>
            <div className="text-[10px] font-bold uppercase mt-1 text-black/60">5-SIGNAL ACTIVE SCORING</div>
          </div>

        </div>

        {/* User Activity & Cases Feed */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b-4 border-black pb-2">
            <h2 className="text-2xl font-black uppercase tracking-tight text-black">
              YOUR ACTIVE SUBMISSIONS ({reports.length})
            </h2>
            <span className="text-xs font-bold uppercase tracking-widest text-black/70">
              CLICK TO VIEW MATCH CONFIDENCE
            </span>
          </div>

          {loading ? (
            <div className="border-4 border-black bg-white p-8 text-center space-y-3 animate-pulse shadow-neo">
              <div className="h-6 bg-[#E2E8F0] w-1/3 mx-auto border-2 border-black" />
              <div className="h-4 bg-[#E2E8F0] w-1/4 mx-auto border-2 border-black" />
            </div>
          ) : reports.length === 0 ? (
            <div className="border-6 border-black bg-white p-12 text-center space-y-4 shadow-neo-lg">
              <div className="h-16 w-16 border-4 border-black bg-[#FFD93D] text-black mx-auto flex items-center justify-center font-black text-3xl shadow-neo-sm">
                0
              </div>
              <h3 className="text-2xl font-black uppercase text-black">NO ACTIVE SUBMISSIONS</h3>
              <p className="font-bold text-sm text-black/70 max-w-md mx-auto">
                You haven&apos;t filed any lost or found reports yet. Get started by reporting an item below.
              </p>
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
