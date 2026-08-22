"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Search, MapPin, ArrowRight, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Report, ReportType, ItemCategory } from "@/types";

const CATEGORIES: { value: ItemCategory | "all"; label: string }[] = [
  { value: "all", label: "ALL CATEGORIES" },
  { value: "electronics", label: "📱 ELECTRONICS" },
  { value: "id_cards", label: "💳 ID & WALLETS" },
  { value: "keys", label: "🔑 KEYS" },
  { value: "bags_backpacks", label: "🎒 BAGS" },
  { value: "bottles_tumblers", label: "🥤 BOTTLES" },
  { value: "clothing_apparel", label: "🧥 CLOTHING" },
  { value: "books_stationery", label: "📚 BOOKS" },
  { value: "jewelry_watches", label: "⌚ JEWELRY" },
  { value: "other", label: "📦 OTHER" },
];

export default function ReportsDirectoryPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<ReportType | "ALL">("ALL");
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | "all">("all");

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchReports = useCallback(async () => {
    // Cancel any in-flight request to prevent race-condition stale overwrites
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setErrorMessage(null);

    try {
      const queryParams = new URLSearchParams();
      if (searchQuery.trim()) queryParams.set("q", searchQuery.trim());
      if (selectedType !== "ALL") queryParams.set("type", selectedType);
      if (selectedCategory !== "all") queryParams.set("category", selectedCategory);

      const endpoint = searchQuery.trim()
        ? `/api/search?${queryParams.toString()}`
        : `/api/reports?${queryParams.toString()}`;

      const res = await fetch(endpoint, {
        signal: controller.signal,
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        setReports(data.reports || []);
      } else {
        throw new Error(data.error || "Failed to retrieve reports from server");
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        return; // Normal cancellation on fast typing/filter switching
      }
      console.error("Directory fetch error", err);
      setErrorMessage("Unable to load reports from database. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedType, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(fetchReports, 200);
    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchReports]);

  return (
    <div className="space-y-10 py-4">
      
      {/* Editorial Header */}
      <div className="border-8 border-black bg-white p-6 sm:p-10 shadow-neo-lg space-y-4">
        <div className="inline-flex items-center gap-2 border-3 border-black bg-[#FFD93D] text-black px-3 py-1 text-xs font-black uppercase shadow-neo-sm">
          <Search className="h-4 w-4" />
          <span>REAL-TIME CAMPUS DISCOVERY</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter uppercase text-black leading-none">
          EXPLORE <span className="bg-[#FF6B6B] text-white px-2 py-0.5 border-4 border-black inline-block -rotate-1">WHAT&apos;S</span> MISSING.
        </h1>
        <p className="font-bold text-sm sm:text-base text-black/80 max-w-xl">
          Search with keywords, natural language, or filter by category and campus zone to discover stored items.
        </p>

        {/* Search Input Bar */}
        <div className="pt-2">
          <div className="relative">
            <input
              type="text"
              placeholder="SEARCH: 'BLACK SONY EARBUDS' OR 'BROWN WALLET IN DINING'..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="neo-input w-full px-5 py-4 text-sm sm:text-base font-black uppercase placeholder:text-black/40 pr-12"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-black pointer-events-none" />
          </div>
        </div>

        {/* Filter Controls (Type Toggles & Category Select) */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <div className="flex items-center border-3 border-black bg-white shadow-neo-sm overflow-hidden">
            <button
              onClick={() => setSelectedType("ALL")}
              className={`px-4 py-2 text-xs font-black uppercase transition-colors ${
                selectedType === "ALL" ? "bg-black text-white" : "text-black hover:bg-[#E2E8F0]"
              }`}
            >
              ALL ITEMS
            </button>
            <button
              onClick={() => setSelectedType("LOST")}
              className={`px-4 py-2 text-xs font-black uppercase border-l-3 border-black transition-colors ${
                selectedType === "LOST" ? "bg-[#FF6B6B] text-white" : "text-black hover:bg-[#FF6B6B]/20"
              }`}
            >
              LOST ONLY
            </button>
            <button
              onClick={() => setSelectedType("FOUND")}
              className={`px-4 py-2 text-xs font-black uppercase border-l-3 border-black transition-colors ${
                selectedType === "FOUND" ? "bg-[#FFD93D] text-black" : "text-black hover:bg-[#FFD93D]/40"
              }`}
            >
              FOUND ONLY
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="neo-input px-4 py-2 text-xs font-black uppercase bg-white text-black cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value} className="bg-white text-black">
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b-4 border-black pb-2">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
            ACTIVE REPORTS ({loading ? "..." : reports.length})
          </h2>
        </div>

        {errorMessage ? (
          <div className="border-4 border-black bg-[#FF6B6B] text-white p-6 shadow-neo space-y-3">
            <div className="flex items-center gap-2 font-black text-base uppercase">
              <AlertCircle className="h-6 w-6" />
              <span>UNABLE TO LOAD DIRECTORY</span>
            </div>
            <p className="text-xs font-bold text-white/90">
              {errorMessage}
            </p>
            <button
              onClick={fetchReports}
              className="neo-button px-4 py-2 text-xs bg-white text-black border-2 border-black hover:bg-black hover:text-white font-black"
            >
              <RefreshCw className="h-3.5 w-3.5 inline mr-1" /> RETRY SEARCH
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border-4 border-black bg-white p-5 shadow-neo space-y-4 animate-pulse">
                <div className="h-44 bg-[#E2E8F0] border-3 border-black" />
                <div className="h-6 bg-[#E2E8F0] border-2 border-black w-3/4" />
                <div className="h-4 bg-[#E2E8F0] border-2 border-black w-1/2" />
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="border-6 border-black bg-white p-12 text-center space-y-4 shadow-neo-lg">
            <div className="h-16 w-16 border-4 border-black bg-[#FFD93D] text-black mx-auto flex items-center justify-center font-black text-3xl shadow-neo-sm">
              ?
            </div>
            <h3 className="text-2xl font-black uppercase text-black">NO REPORTS FOUND</h3>
            <p className="font-bold text-sm text-black/70 max-w-md mx-auto">
              No active reports match your current search or category filters.
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => {
              const isLost = report.reportType === "LOST";
              return (
                <div
                  key={report.id}
                  className="neo-card flex flex-col justify-between overflow-hidden bg-white border-4 border-black"
                >
                  {/* Top Image & Badge */}
                  <div className="relative border-b-4 border-black bg-[#E2E8F0] h-48 overflow-hidden">
                    {report.imageUrl ? (
                      <img
                        src={report.imageUrl}
                        alt={report.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[#E2E8F0] text-black font-black text-xs uppercase p-4 text-center">
                        <span>NO PHOTO ATTACHED</span>
                        <span className="text-[10px] text-black/60">AI TEXT PARSED ONLY</span>
                      </div>
                    )}

                    {/* Sticker Badge */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`neo-sticker ${
                          isLost ? "bg-[#FF6B6B] text-white" : "bg-[#FFD93D] text-black"
                        } rotate-[-2deg]`}
                      >
                        {report.reportType}
                      </span>
                    </div>

                    {report.ai?.brand && (
                      <div className="absolute top-3 right-3">
                        <span className="neo-sticker bg-white text-black">
                          {report.ai.brand}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px] font-black uppercase text-black/70">
                        <MapPin className="h-3.5 w-3.5 text-[#FF6B6B]" />
                        <span className="truncate">{report.location?.name || "Campus Location"}</span>
                      </div>
                      <h3 className="font-black text-lg text-black tracking-tight line-clamp-1">
                        {report.title}
                      </h3>
                      <p className="text-xs font-bold text-black/80 line-clamp-2">
                        {report.description}
                      </p>
                    </div>

                    {/* AI Structured Tags */}
                    {report.ai?.keywords && report.ai.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {report.ai.keywords.slice(0, 3).map((kw, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black bg-[#C4B5FD]/40 text-black"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bottom CTA */}
                    <div className="pt-3 border-t-3 border-black flex items-center justify-between">
                      <span className="text-[11px] font-bold text-black/60 uppercase">
                        {new Date(report.reportedAt).toLocaleDateString()}
                      </span>
                      <Link
                        href={`/reports/${report.id}`}
                        className="neo-button px-3.5 py-1.5 text-xs bg-[#FFD93D] text-black border-2 border-black hover:bg-black hover:text-white"
                      >
                        VIEW CASE FILE <ArrowRight className="ml-1 h-3.5 w-3.5 inline" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
