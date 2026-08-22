"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Report, MatchCandidate } from "@/types";
import { MatchBadge, MatchScoreBar } from "@/components/matches/MatchBadge";
import { ClaimModal } from "@/components/claims/ClaimModal";
import { ArrowLeft, MapPin, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  const [report, setReport] = useState<Report | null>(null);
  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  useEffect(() => {
    async function fetchReportAndMatches() {
      try {
        const res = await fetch(`/api/reports/${params.id}`);
        const data = await res.json();
        if (data.success) {
          setReport(data.report);

          // Fetch matches
          const matchRes = await fetch(`/api/reports/${params.id}/matches`);
          const matchData = await matchRes.json();
          if (matchData.success) {
            setMatches(matchData.matches || []);
          }
        }
      } catch (err) {
        console.error("Error fetching report details", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReportAndMatches();
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 py-12">
        <div className="border-4 border-black bg-white p-8 text-center space-y-3 animate-pulse shadow-neo">
          <div className="h-8 bg-[#E2E8F0] w-1/3 mx-auto border-2 border-black" />
          <div className="h-4 bg-[#E2E8F0] w-1/4 mx-auto border-2 border-black" />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-2xl mx-auto border-8 border-black bg-white p-12 text-center space-y-4 shadow-neo-xl my-8">
        <h2 className="text-3xl font-black uppercase text-black">CASE FILE NOT FOUND</h2>
        <p className="font-bold text-sm text-black/70">
          The requested report ID ({params.id}) could not be located in Supabase.
        </p>
        <Link href="/reports" className="neo-button px-6 py-3 text-xs bg-[#FFD93D] text-black border-3 border-black">
          RETURN TO DIRECTORY
        </Link>
      </div>
    );
  }

  const isLost = report.reportType === "LOST";

  return (
    <div className="space-y-10 py-4 max-w-6xl mx-auto">
      
      {/* Navigation Breadcrumb */}
      <Link
        href="/reports"
        className="neo-button px-4 py-2 text-xs bg-white text-black border-3 border-black hover:bg-[#E2E8F0]"
      >
        <ArrowLeft className="mr-1.5 h-4 w-4 inline" /> BACK TO DIRECTORY
      </Link>

      {/* Primary Case File Dossier (2-Col Layout) */}
      <div className="border-8 border-black bg-white p-6 sm:p-10 shadow-neo-xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Col: Photo & Main Identifiers (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative border-4 border-black bg-[#E2E8F0] h-72 overflow-hidden shadow-neo-sm">
            {report.imageUrl ? (
              <img src={report.imageUrl} alt={report.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center font-black text-xs uppercase p-4 text-center text-black">
                <span>NO IMAGE ATTACHED</span>
                <span className="text-[10px] text-black/60">ANALYZED BY TEXT EMBEDDING</span>
              </div>
            )}

            <div className="absolute top-3 left-3">
              <span
                className={`neo-sticker ${
                  isLost ? "bg-[#FF6B6B] text-white" : "bg-[#FFD93D] text-black"
                } rotate-[-2deg]`}
              >
                {report.reportType} VALUABLE
              </span>
            </div>
          </div>

          {/* Action Trigger */}
          <button
            onClick={() => setIsClaimModalOpen(true)}
            className="neo-button w-full py-4 text-sm font-black bg-[#FF6B6B] text-white border-4 border-black hover:bg-[#FF5252] shadow-neo"
          >
            <ShieldCheck className="mr-2 h-5 w-5 inline" />
            INITIATE RECOVERY CLAIM
          </button>
        </div>

        {/* Right Col: Details & AI Structured Attributes (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2 border-b-4 border-black pb-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-black/70">
              <MapPin className="h-4 w-4 text-[#FF6B6B]" />
              <span>{report.location?.name || "Campus Location"} ({report.location?.zone})</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
              {report.title}
            </h1>
            <div className="text-xs font-bold uppercase text-black/60">
              DATE: {new Date(report.reportedAt).toLocaleDateString()} • STATUS: {report.status}
            </div>
          </div>

          {/* Detailed Notes */}
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-widest text-black/70">
              USER DESCRIPTION:
            </h4>
            <p className="text-sm font-bold text-black border-l-4 border-black pl-3 py-1 bg-[#FFFDF5]">
              {report.description}
            </p>
          </div>

          {/* Gemini AI Vision Breakdown */}
          {report.ai && (
            <div className="border-4 border-black bg-[#FFD93D] text-black p-5 space-y-3 shadow-neo-sm">
              <div className="flex items-center gap-2 font-black text-xs uppercase border-b-2 border-black pb-1.5">
                <Sparkles className="h-4 w-4" />
                <span>GEMINI VISION AI EXTRACTED ATTRIBUTES</span>
              </div>
              <p className="text-xs font-bold text-black/90">
                {report.ai.summary}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-black uppercase pt-1">
                {report.ai.brand && (
                  <div className="bg-white text-black p-2 border-2 border-black">
                    <span className="text-[9px] block text-black/60">BRAND:</span>
                    {report.ai.brand}
                  </div>
                )}
                {report.ai.color && (
                  <div className="bg-white text-black p-2 border-2 border-black">
                    <span className="text-[9px] block text-black/60">COLOR:</span>
                    {report.ai.color}
                  </div>
                )}
                {report.ai.objectType && (
                  <div className="bg-white text-black p-2 border-2 border-black">
                    <span className="text-[9px] block text-black/60">TYPE:</span>
                    {report.ai.objectType}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ranked AI Match Dossier Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b-4 border-black pb-2">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
              POTENTIAL AI MATCHES ({matches.length})
            </h2>
            <p className="text-xs font-bold uppercase text-black/70">
              EVALUATED BY 5-SIGNAL DETERMINISTIC ENGINE
            </p>
          </div>
          <span className="neo-sticker bg-[#C4B5FD] text-black hidden sm:inline-flex">
            OPPOSITE-TYPE CANDIDATES
          </span>
        </div>

        {matches.length === 0 ? (
          <div className="border-4 border-black bg-white p-8 text-center space-y-3 shadow-neo">
            <h4 className="text-lg font-black uppercase text-black">NO HIGH-CONFIDENCE MATCHES YET</h4>
            <p className="text-xs font-bold text-black/70 max-w-md mx-auto">
              Our 5-signal matching engine is actively scanning new reports. You will see candidate matches as soon as they are submitted.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {matches.map((candidate) => (
              <div
                key={candidate.id}
                className="border-6 border-black bg-white p-6 sm:p-8 shadow-neo-lg space-y-6"
              >
                {/* Match Header Pill & Title */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b-4 border-black pb-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="neo-sticker bg-black text-white text-[10px]">
                        CANDIDATE #{candidate.targetReport.id.slice(-4)}
                      </span>
                      <span className="text-xs font-black uppercase text-black/70">
                        {candidate.targetReport.reportType} VALUABLE
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-black">
                      {candidate.targetReport.title}
                    </h3>
                  </div>

                  <MatchBadge score={candidate.scores.overall} size="lg" />
                </div>

                {/* 2-Col Breakdown: Evidence Rationale & 5-Signal Progress Meters */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left: Why this Matches Rationale */}
                  <div className="lg:col-span-6 space-y-3">
                    <div className="border-4 border-black bg-[#C4B5FD] text-black p-5 shadow-neo-sm space-y-2">
                      <h4 className="text-xs font-black uppercase tracking-widest text-black flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4" />
                        <span>WHY THIS MATCHES (EVIDENCE-BACKED RATIONALE)</span>
                      </h4>
                      <p className="text-sm font-bold text-black leading-relaxed">
                        {candidate.explanation}
                      </p>
                    </div>

                    <div className="border-3 border-black bg-[#FFFDF5] text-black p-4 text-xs font-bold space-y-1">
                      <div><strong>LOCATION:</strong> {candidate.targetReport.location?.name}</div>
                      <div><strong>TIME REPORTED:</strong> {new Date(candidate.targetReport.reportedAt).toLocaleString()}</div>
                      <div><strong>SUMMARY:</strong> {candidate.targetReport.description}</div>
                    </div>
                  </div>

                  {/* Right: 5-Signal Meter Bars */}
                  <div className="lg:col-span-6">
                    <MatchScoreBar scores={candidate.scores} />
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-4 border-t-3 border-black flex flex-wrap items-center justify-between gap-3">
                  <Link
                    href={`/reports/${candidate.targetReport.id}`}
                    className="neo-button px-4 py-2 text-xs bg-white text-black border-3 border-black hover:bg-[#E2E8F0]"
                  >
                    INSPECT TARGET DOSSIER <ArrowRight className="ml-1.5 h-4 w-4 inline" />
                  </Link>

                  <button
                    onClick={() => setIsClaimModalOpen(true)}
                    className="neo-button px-5 py-2 text-xs bg-[#FF6B6B] text-white border-3 border-black hover:bg-[#FF5252] shadow-neo-sm"
                  >
                    CLAIM &amp; RECOVER ITEM
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Claim Dialog */}
      <ClaimModal
        reportId={report.id}
        reportTitle={report.title}
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
      />

    </div>
  );
}
