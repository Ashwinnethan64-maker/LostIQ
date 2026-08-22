"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Report, MatchCandidate } from "@/types";
import { MatchBadge, MatchScoreBar } from "@/components/matches/MatchBadge";
import { ClaimModal } from "@/components/claims/ClaimModal";
import { ArrowLeft, MapPin, Sparkles, ShieldCheck, ArrowRight, UserCheck, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimTarget, setClaimTarget] = useState<{ id: string; title: string } | null>(null);

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
  const isFound = report.reportType === "FOUND";
  const currentUid = user?.id ? user.id.toLowerCase() : "";
  const reportUid = report.userId ? report.userId.toLowerCase() : "";
  const isCreator = currentUid !== "" && reportUid !== "" && currentUid === reportUid;

  return (
    <div className="space-y-10 py-4 max-w-6xl mx-auto">
      
      {/* Navigation Breadcrumb */}
      <Link
        href="/reports"
        className="neo-button px-4 py-2 text-xs bg-white text-black border-3 border-black hover:bg-[#E2E8F0]"
      >
        <ArrowLeft className="mr-1.5 h-4 w-4 inline" /> BACK TO DIRECTORY
      </Link>

      {/* Primary Case File Dossier */}
      <div className="border-8 border-black bg-white p-6 sm:p-10 shadow-neo-xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Col: Photo & Role Badge */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative border-4 border-black bg-[#E2E8F0] h-72 overflow-hidden shadow-neo-sm">
            {report.imageUrl ? (
              <img src={report.imageUrl} alt={report.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center font-black text-xs uppercase p-4 text-center text-black">
                <span>NO IMAGE ATTACHED</span>
                <span className="text-[10px] text-black/60">ANALYZED BY STRUCTURED ATTRIBUTES</span>
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

          {/* Context-Aware Action / Status Trigger */}
          {isFound ? (
            <div className="border-4 border-black bg-[#FFD93D]/30 p-4 text-center space-y-1 shadow-neo-sm">
              <div className="flex items-center justify-center gap-1.5 font-black text-xs uppercase text-black">
                <Clock className="h-4 w-4" />
                <span>COMMUNITY TURN-IN / FINDER CUSTODY</span>
              </div>
              <p className="text-[11px] font-bold text-black/70">
                {isCreator
                  ? "You're registered as the finder of this valuable. Ownership claims can only be filed by the legitimate owner who reported it lost."
                  : "This item was turned in by the campus community. Verified owners may claim matching items below."}
              </p>
            </div>
          ) : isCreator ? (
            <div className="border-4 border-black bg-[#FF6B6B]/20 p-4 text-center space-y-1 shadow-neo-sm">
              <div className="flex items-center justify-center gap-1.5 font-black text-xs uppercase text-black">
                <UserCheck className="h-4 w-4 text-[#FF6B6B]" />
                <span>YOUR ACTIVE MISSING REPORT</span>
              </div>
              <p className="text-[11px] font-bold text-black/70">
                Review any AI-matched turn-in reports below to submit private ownership verification and claim your item.
              </p>
            </div>
          ) : (
            <div className="border-4 border-black bg-white p-4 text-center space-y-1 shadow-neo-sm">
              <div className="font-black text-xs uppercase text-black">ACTIVE LOST TICKET</div>
              <p className="text-[11px] font-bold text-black/70">
                Filed by campus member. If you found this item, file a Found Report to trigger match reconciliation.
              </p>
            </div>
          )}
        </div>

        {/* Right Col: Details & Structured/AI Attributes */}
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

          {/* Structured Attributes Panel with Transparent Origin (User Provided vs AI) */}
          <div className="border-4 border-black bg-[#FFD93D] text-black p-5 space-y-3 shadow-neo-sm">
            <div className="flex items-center justify-between font-black text-xs uppercase border-b-2 border-black pb-1.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>STRUCTURED ATTRIBUTES &amp; VISION RECOGNITION</span>
              </div>
              <span className="text-[10px] bg-black text-white px-2 py-0.5">AUTHORITATIVE</span>
            </div>

            {report.ai?.summary && (
              <p className="text-xs font-bold text-black/90">
                {report.ai.summary}
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px] font-black uppercase pt-1">
              {/* Brand */}
              <div className="bg-white text-black p-2.5 border-2 border-black space-y-0.5">
                <span className="text-[9px] block text-black/60">BRAND:</span>
                <div className="text-xs font-black truncate">{report.ai?.brand && report.ai.brand !== "Unknown" ? report.ai.brand : report.brand || "UNKNOWN"}</div>
                <span className="text-[8px] font-bold block text-black/50">
                  {report.ai?.brandSource === "USER" || report.brand ? "USER PROVIDED" : report.ai?.brand !== "Unknown" ? "AI DETECTED" : "UNSPECIFIED"}
                </span>
              </div>

              {/* Color */}
              <div className="bg-white text-black p-2.5 border-2 border-black space-y-0.5">
                <span className="text-[9px] block text-black/60">COLOR:</span>
                <div className="text-xs font-black truncate">{report.ai?.color && report.ai.color !== "unspecified" ? report.ai.color : report.color || "UNSPECIFIED"}</div>
                <span className="text-[8px] font-bold block text-black/50">
                  {report.ai?.colorSource === "USER" || report.color ? "USER PROVIDED" : report.ai?.color !== "unspecified" ? "AI DETECTED" : "UNSPECIFIED"}
                </span>
              </div>

              {/* Model / Type */}
              <div className="bg-white text-black p-2.5 border-2 border-black space-y-0.5">
                <span className="text-[9px] block text-black/60">MODEL / TYPE:</span>
                <div className="text-xs font-black truncate">{report.ai?.model || report.model || report.ai?.objectType || report.title}</div>
                <span className="text-[8px] font-bold block text-black/50">
                  {report.model || report.ai?.modelSource === "USER" ? "USER PROVIDED" : "AI DETECTED"}
                </span>
              </div>

              {/* Material */}
              {(report.material || report.ai?.material) && (
                <div className="bg-white text-black p-2.5 border-2 border-black space-y-0.5">
                  <span className="text-[9px] block text-black/60">MATERIAL:</span>
                  <div className="text-xs font-black truncate">{report.material || report.ai?.material}</div>
                  <span className="text-[8px] font-bold block text-black/50">
                    {report.material ? "USER PROVIDED" : "AI DETECTED"}
                  </span>
                </div>
              )}

              {/* Distinguishing Features */}
              {report.distinctiveFeatures && (
                <div className="bg-white text-black p-2.5 border-2 border-black space-y-0.5 sm:col-span-2">
                  <span className="text-[9px] block text-black/60">UNIQUE IDENTIFIERS:</span>
                  <div className="text-xs font-black truncate">{report.distinctiveFeatures}</div>
                  <span className="text-[8px] font-bold block text-black/50">USER PROVIDED</span>
                </div>
              )}
            </div>
          </div>
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
              EVALUATED BY 5-SIGNAL STRICT DETERMINISTIC ENGINE
            </p>
          </div>
          <span className="neo-sticker bg-[#C4B5FD] text-black hidden sm:inline-flex">
            OPPOSITE-TYPE CANDIDATES ONLY
          </span>
        </div>

        {matches.length === 0 ? (
          <div className="border-4 border-black bg-white p-8 text-center space-y-3 shadow-neo">
            <h4 className="text-lg font-black uppercase text-black">NO MATCHES YET</h4>
            <p className="text-xs font-bold text-black/70 max-w-md mx-auto">
              We&apos;ll keep this report active and check against relevant opposite-type reports as they arrive.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {matches.map((candidate) => {
              // Exact Business Rule:
              // For every match pair (LOST report <-> FOUND report):
              // - lostReport.userId = OWNER CANDIDATE (Only user who can submit ownership claim)
              // - foundReport.userId = FINDER (Waiting for owner)
              const lostReportUser = isLost ? report.userId : candidate.targetReport.userId;
              const foundReportUser = isFound ? report.userId : candidate.targetReport.userId;

              const lostUid = lostReportUser ? lostReportUser.toLowerCase() : "";
              const foundUid = foundReportUser ? foundReportUser.toLowerCase() : "";

              const isLostOwner = currentUid !== "" && currentUid === lostUid;
              const isFinder = currentUid !== "" && currentUid === foundUid;

              return (
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
                    
                    {/* Left: Evidence-backed Rationale */}
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

                  {/* Bottom Action Footer: Context-Aware Authorization at Source */}
                  <div className="pt-4 border-t-3 border-black flex flex-wrap items-center justify-between gap-3">
                    <Link
                      href={`/reports/${candidate.targetReport.id}`}
                      className="neo-button px-4 py-2 text-xs bg-white text-black border-3 border-black hover:bg-[#E2E8F0]"
                    >
                      INSPECT TARGET DOSSIER <ArrowRight className="ml-1.5 h-4 w-4 inline" />
                    </Link>

                    {isLostOwner ? (
                      <button
                        onClick={() => {
                          const targetFoundId = isFound ? report.id : candidate.targetReport.id;
                          const targetFoundTitle = isFound ? report.title : candidate.targetReport.title;
                          setClaimTarget({ id: targetFoundId, title: targetFoundTitle });
                          setIsClaimModalOpen(true);
                        }}
                        className="neo-button px-5 py-2 text-xs bg-[#FF6B6B] text-white border-3 border-black hover:bg-[#FF5252] shadow-neo-sm font-black"
                      >
                        <ShieldCheck className="mr-1.5 h-4 w-4 inline" />
                        CLAIM &amp; RECOVER ITEM
                      </button>
                    ) : isFinder ? (
                      <span className="border-3 border-black bg-[#FFD93D] text-black px-4 py-2 text-xs font-black uppercase shadow-neo-sm">
                        WAITING FOR OWNER
                      </span>
                    ) : (
                      <span className="border-3 border-black bg-[#E2E8F0] text-black/70 px-4 py-2 text-xs font-black uppercase">
                        MATCH IDENTIFIED
                      </span>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ownership Claim Dialog: Only mounted for authorized claimant */}
      {claimTarget && (
        <ClaimModal
          reportId={claimTarget.id}
          reportTitle={claimTarget.title}
          isOpen={isClaimModalOpen}
          onClose={() => {
            setIsClaimModalOpen(false);
            setClaimTarget(null);
          }}
        />
      )}

    </div>
  );
}
