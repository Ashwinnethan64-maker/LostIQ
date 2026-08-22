"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { RouteGuard } from "@/lib/auth/RouteGuard";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  ShieldCheck,
  CheckCircle2,
  QrCode,
  ArrowLeft,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle,
  FileText,
  UserCheck,
} from "lucide-react";
import { Claim, Report, RecoveryReceipt, RecoveryEvent } from "@/types";

export default function RecoveryHubPage({ params }: { params: { claimId: string } }) {
  const { user, getFreshToken } = useAuth();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [foundReport, setFoundReport] = useState<Report | null>(null);
  const [lostReport, setLostReport] = useState<Report | null>(null);
  const [events, setEvents] = useState<RecoveryEvent[]>([]);
  const [receipt, setReceipt] = useState<RecoveryReceipt | null>(null);
  const [userRole, setUserRole] = useState<"OWNER" | "FINDER" | "ADMIN">("OWNER");
  const [loading, setLoading] = useState(true);

  // Recovery Pass QR State
  const [passData, setPassData] = useState<{ token: string; qrPayload: string; expiresAt: string } | null>(null);
  const [passLoading, setPassLoading] = useState(false);
  const [confirmingReceipt, setConfirmingReceipt] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClaimData() {
      if (!user) return;
      try {
        const token = await getFreshToken();
        const res = await fetch(`/api/claims/${params.claimId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.success) {
          setClaim(data.claim);
          setFoundReport(data.foundReport);
          setLostReport(data.lostReport);
          setEvents(data.events || []);
          setReceipt(data.receipt);
          setUserRole(data.userRole);
        }
      } catch (err) {
        console.error("Error loading recovery hub data", err);
      } finally {
        setLoading(false);
      }
    }

    fetchClaimData();
  }, [params.claimId, user, getFreshToken]);

  const handleGeneratePass = async () => {
    setPassLoading(true);
    setActionError(null);
    try {
      const token = await getFreshToken();
      const res = await fetch("/api/claims/pass/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ claimId: params.claimId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate recovery pass");
      }

      setPassData(data.pass);
    } catch (err: any) {
      setActionError(err.message || "Could not generate recovery pass.");
    } finally {
      setPassLoading(false);
    }
  };

  const handleConfirmOwnerReceipt = async () => {
    setConfirmingReceipt(true);
    setActionError(null);
    try {
      const token = await getFreshToken();
      const res = await fetch("/api/claims/receipt/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ claimId: params.claimId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to confirm receipt");
      }

      setClaim(data.claim);
      setReceipt(data.receipt);
    } catch (err: any) {
      setActionError(err.message || "Failed to complete recovery.");
    } finally {
      setConfirmingReceipt(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-black mx-auto" />
        <div className="font-black uppercase tracking-wider text-sm">
          LOADING VERIFIED RECOVERY PROTOCOL...
        </div>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="max-w-xl mx-auto border-8 border-black bg-white p-10 text-center space-y-4 shadow-neo-xl my-8">
        <h3 className="text-2xl font-black uppercase text-black">RECOVERY CLAIM NOT FOUND</h3>
        <p className="text-xs font-bold text-black/70">
          The requested claim record could not be found or you do not have permission to view it.
        </p>
        <Link href="/dashboard" className="neo-button px-6 py-2.5 text-xs bg-[#FFD93D] text-black border-3 border-black">
          RETURN TO CONTROL DESK
        </Link>
      </div>
    );
  }

  const isOwner = userRole === "OWNER";
  const isFinder = userRole === "FINDER";
  const isCompleted = claim.status === "COMPLETED";
  const isFinderConfirmed = claim.handoverStatus === "FINDER_CONFIRMED" || claim.status === "FINDER_CONFIRMED";

  return (
    <RouteGuard>
      <div className="max-w-4xl mx-auto space-y-8 py-4">
        
        {/* Navigation Breadcrumb */}
        <Link
          href="/dashboard"
          className="neo-button px-4 py-2 text-xs bg-white text-black border-3 border-black hover:bg-[#E2E8F0]"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4 inline" /> BACK TO CONTROL DESK
        </Link>

        {/* Primary Status Banner */}
        <div className="border-8 border-black bg-white p-6 sm:p-8 shadow-neo-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1.5 border-3 border-black bg-[#C4B5FD] text-black px-3 py-1 text-xs font-black uppercase shadow-neo-sm">
              <ShieldCheck className="h-4 w-4" />
              <span>LOSTIQ VERIFIED RECOVERY PROTOCOL</span>
            </div>
            <div className="inline-flex items-center gap-1.5 border-3 border-black bg-[#FFD93D] text-black px-3 py-1 text-xs font-black uppercase shadow-neo-sm">
              <UserCheck className="h-3.5 w-3.5" />
              <span>{isOwner ? "LOGGED IN AS VERIFIED OWNER" : "LOGGED IN AS FINDER CUSTODIAN"}</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            RECOVERY STATUS: <span className={isCompleted ? "bg-black text-white px-2 py-0.5" : "bg-[#FF6B6B] text-white px-2 py-0.5"}>
              {claim.status}
            </span>
          </h1>

          <p className="text-sm font-bold text-black/80 max-w-2xl">
            Item: <strong>{foundReport?.title || lostReport?.title || "Valuable"}</strong> • Claim Ref: #{claim.id.slice(-6).toUpperCase()}
          </p>
        </div>

        {actionError && (
          <div className="border-4 border-black bg-[#FF6B6B] text-white p-4 font-black text-xs uppercase flex items-center gap-3 shadow-neo-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* 5-Step Protocol Tracker */}
        <div className="border-6 border-black bg-white p-6 shadow-neo-lg space-y-4">
          <h3 className="font-black text-base uppercase text-black border-b-3 border-black pb-2">
            SECURE HANDOVER LIFECYCLE
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs font-black uppercase text-center">
            
            {/* Step 1: AI Match */}
            <div className="border-3 border-black bg-[#FFD93D] p-3 space-y-1 shadow-neo-sm">
              <div className="text-[10px] text-black/70">STEP 1</div>
              <div className="flex items-center justify-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> AI MATCH
              </div>
              <div className="text-[9px] bg-black text-white px-1 py-0.5">COMPLETED</div>
            </div>

            {/* Step 2: Owner Proved */}
            <div className="border-3 border-black bg-[#FFD93D] p-3 space-y-1 shadow-neo-sm">
              <div className="text-[10px] text-black/70">STEP 2</div>
              <div className="flex items-center justify-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> ZERO-KNOWLEDGE
              </div>
              <div className="text-[9px] bg-black text-white px-1 py-0.5">VERIFIED</div>
            </div>

            {/* Step 3: Recovery Pass */}
            <div className={`border-3 border-black p-3 space-y-1 shadow-neo-sm ${
              passData || isFinderConfirmed || isCompleted ? "bg-[#FFD93D]" : "bg-[#FFFDF5]"
            }`}>
              <div className="text-[10px] text-black/70">STEP 3</div>
              <div className="flex items-center justify-center gap-1">
                <QrCode className="h-4 w-4" /> 10-MIN PASS
              </div>
              <div className="text-[9px] bg-black text-white px-1 py-0.5">
                {passData || isFinderConfirmed || isCompleted ? "GENERATED" : "READY"}
              </div>
            </div>

            {/* Step 4: Finder Handover */}
            <div className={`border-3 border-black p-3 space-y-1 shadow-neo-sm ${
              isFinderConfirmed || isCompleted ? "bg-[#FFD93D]" : "bg-[#FFFDF5]"
            }`}>
              <div className="text-[10px] text-black/70">STEP 4</div>
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-4 w-4" /> FINDER HANDOVER
              </div>
              <div className="text-[9px] bg-black text-white px-1 py-0.5">
                {isFinderConfirmed || isCompleted ? "CONFIRMED" : "PENDING"}
              </div>
            </div>

            {/* Step 5: Owner Receipt */}
            <div className={`border-3 border-black p-3 space-y-1 shadow-neo-sm ${
              isCompleted ? "bg-[#FF6B6B] text-white" : "bg-[#FFFDF5]"
            }`}>
              <div className="text-[10px] opacity-70">STEP 5</div>
              <div className="flex items-center justify-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> OWNER RECEIPT
              </div>
              <div className={`text-[9px] px-1 py-0.5 ${isCompleted ? "bg-white text-black" : "bg-black text-white"}`}>
                {isCompleted ? "RECOVERED" : "AWAITING"}
              </div>
            </div>

          </div>
        </div>

        {/* Dynamic Action Section based on Lifecycle State */}
        {isCompleted && receipt ? (
          /* State A: Recovery Complete & Official Printable Receipt */
          <div className="border-8 border-black bg-white p-8 sm:p-10 shadow-neo-xl space-y-6">
            <div className="flex items-center justify-between border-b-4 border-black pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-black text-white px-3 py-1 text-xs font-black uppercase">
                  <FileText className="h-3.5 w-3.5" />
                  <span>OFFICIAL AUDIT PROOF</span>
                </div>
                <h2 className="text-3xl font-black uppercase text-black mt-2">
                  LOSTIQ RECOVERY RECEIPT
                </h2>
              </div>
              <div className="text-right">
                <div className="text-xs font-black uppercase text-black/60">RECEIPT NO.</div>
                <div className="text-xl font-black text-black">{receipt.receiptId}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-black uppercase">
              <div className="border-2 border-black p-3 bg-[#FFFDF5]">
                <span className="text-[9px] text-black/60 block">ITEM TITLE</span>
                <span className="truncate block">{receipt.itemTitle}</span>
              </div>
              <div className="border-2 border-black p-3 bg-[#FFFDF5]">
                <span className="text-[9px] text-black/60 block">MATCH CONFIDENCE</span>
                <span>{receipt.matchScore}% 5-SIGNAL</span>
              </div>
              <div className="border-2 border-black p-3 bg-[#FFFDF5]">
                <span className="text-[9px] text-black/60 block">OWNER PROOF</span>
                <span className="text-[#FF6B6B]">✓ ZERO-KNOWLEDGE</span>
              </div>
              <div className="border-2 border-black p-3 bg-[#FFFDF5]">
                <span className="text-[9px] text-black/60 block">TIMESTAMP</span>
                <span>{new Date(receipt.recoveredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>

            <div className="border-4 border-black bg-[#FFD93D] p-5 text-center font-black uppercase text-sm space-y-1 shadow-neo-sm">
              <div>✓ ITEM OFFICIALLY RECOVERED &amp; SAFE HANDOVER CERTIFIED</div>
              <p className="text-xs font-bold text-black/75">
                Both reports have been updated to RECOVERED status in Supabase.
              </p>
            </div>
          </div>
        ) : isOwner ? (
          /* State B: Owner View -> Generate Pass & Confirm Receipt */
          <div className="border-6 border-black bg-white p-6 sm:p-8 shadow-neo-lg space-y-6">
            <h3 className="text-2xl font-black uppercase text-black border-b-4 border-black pb-2">
              RECOVERY PASS &amp; PHYSICAL HANDOVER
            </h3>

            {isFinderConfirmed ? (
              <div className="border-4 border-black bg-[#FFD93D] p-6 space-y-4 shadow-neo-sm">
                <div className="flex items-center gap-2 font-black text-base text-black">
                  <CheckCircle2 className="h-6 w-6 text-black" />
                  <span>THE FINDER HAS CONFIRMED HANDOVER!</span>
                </div>
                <p className="text-xs font-bold text-black/85 leading-relaxed">
                  Please verify you are in physical possession of your valuable, then click below to finalize recovery and generate your official receipt.
                </p>
                <button
                  onClick={handleConfirmOwnerReceipt}
                  disabled={confirmingReceipt}
                  className="neo-button w-full py-4 text-sm font-black bg-[#FF6B6B] text-white border-4 border-black hover:bg-[#FF5252] shadow-neo"
                >
                  {confirmingReceipt ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    "CONFIRM I RECEIVED THE ITEM (FINALIZE RECOVERY) ✓"
                  )}
                </button>
              </div>
            ) : passData ? (
              <div className="space-y-6">
                <div className="border-4 border-black bg-[#FFFDF5] p-6 text-center space-y-4 shadow-neo">
                  <div className="inline-flex items-center gap-1.5 bg-[#FF6B6B] text-white px-3 py-1 text-xs font-black uppercase">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>ONE-TIME 10-MINUTE RECOVERY PASS</span>
                  </div>

                  {/* Visual QR Card Representation */}
                  <div className="p-6 bg-white border-4 border-black max-w-xs mx-auto shadow-neo-sm space-y-3">
                    <div className="h-44 w-44 mx-auto border-4 border-black bg-[#FFD93D] flex flex-col items-center justify-center p-3 text-center space-y-1">
                      <QrCode className="h-20 w-20 text-black" />
                      <span className="text-[10px] font-black uppercase text-black break-all">
                        {passData.token}
                      </span>
                    </div>
                    <div className="text-[11px] font-black uppercase text-black">
                      SHOW TO FINDER TO SCAN &amp; VERIFY
                    </div>
                  </div>

                  <div className="text-xs font-bold text-black/70 max-w-md mx-auto">
                    Direct Finder URL: <code className="bg-[#E2E8F0] px-2 py-0.5 border border-black">{`/recovery/verify/${passData.token}`}</code>
                  </div>

                  <p className="text-[11px] font-bold text-[#FF6B6B]">
                    ⏱ Pass automatically expires at {new Date(passData.expiresAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="border-4 border-black bg-[#FFFDF5] p-6 space-y-4 shadow-neo-sm">
                <p className="text-xs font-bold text-black/85 leading-relaxed">
                  Your ownership proof has been verified. When meeting the finder on campus, click below to generate your secure, single-use 10-minute recovery QR pass.
                </p>
                <button
                  onClick={handleGeneratePass}
                  disabled={passLoading}
                  className="neo-button w-full py-4 text-sm font-black bg-[#FFD93D] text-black border-4 border-black hover:bg-[#FCC419] shadow-neo"
                >
                  {passLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    "SHOW ONE-TIME RECOVERY PASS (QR) →"
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* State C: Finder View */
          <div className="border-6 border-black bg-white p-6 sm:p-8 shadow-neo-lg space-y-4">
            <h3 className="text-2xl font-black uppercase text-black border-b-4 border-black pb-2">
              FINDER CUSTODY &amp; HANDOVER VERIFICATION
            </h3>
            <p className="text-xs font-bold text-black/85 leading-relaxed">
              The owner has passed zero-knowledge ownership verification. To confirm the physical return of this valuable, ask the owner to show their 10-minute Recovery Pass QR, then scan it or open the verification link.
            </p>
            <div className="border-3 border-black bg-[#FFD93D] p-4 text-xs font-black uppercase">
              STATUS: WAITING FOR PHYSICAL MEETUP &amp; SCAN
            </div>
          </div>
        )}

        {/* Audit Log Events Timeline */}
        {events.length > 0 && (
          <div className="border-4 border-black bg-white p-6 shadow-neo space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-black border-b-2 border-black pb-1">
              RECOVERY AUDIT TRAIL ({events.length} EVENTS)
            </h4>
            <div className="space-y-2">
              {events.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between text-[11px] font-bold border-b border-black/10 py-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 bg-black inline-block" />
                    <span className="font-black uppercase">{ev.eventType.replace(/_/g, " ")}</span>
                  </div>
                  <span className="text-black/60">{new Date(ev.createdAt).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </RouteGuard>
  );
}
