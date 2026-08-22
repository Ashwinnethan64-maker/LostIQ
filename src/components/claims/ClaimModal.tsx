"use client";

import { useState, useEffect } from "react";
import { X, ShieldCheck, AlertCircle, Loader2, Sparkles, CheckCircle2, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";

interface ClaimModalProps {
  reportId: string;           // Target FOUND report ID
  lostReportId?: string;       // Originating LOST report ID
  reportTitle: string;
  isOpen: boolean;
  onClose: () => void;
  isUnauthorizedFinder?: boolean;
  isUnrelatedUser?: boolean;
}

export function ClaimModal({
  reportId,
  lostReportId,
  reportTitle,
  isOpen,
  onClose,
  isUnauthorizedFinder = false,
  isUnrelatedUser = false,
}: ClaimModalProps) {
  const { user, getFreshToken } = useAuth();
  const router = useRouter();

  const [q1Feature, setQ1Feature] = useState("");
  const [q2HiddenDetail, setQ2HiddenDetail] = useState("");
  const [q3IdentifyingMark, setQ3IdentifyingMark] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [successClaimId, setSuccessClaimId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Lock body scroll cleanly and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUnauthorizedFinder || isUnrelatedUser) return;
    
    const combinedProof = `${q1Feature.trim()} ${q2HiddenDetail.trim()} ${q3IdentifyingMark.trim()}`.trim();
    if (!combinedProof) {
      setError("Please answer the verification questions to prove ownership.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getFreshToken();
      if (!token) {
        throw new Error("You must be logged in with Google to complete ownership verification.");
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const res = await fetch("/api/claims/create", {
        method: "POST",
        headers,
        body: JSON.stringify({
          reportId,
          lostReportId,
          proofDetails: combinedProof,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 401) {
          throw new Error("Authentication failure: Your session has expired. Please log in again.");
        }
        if (res.status === 403) {
          throw new Error(data.error || "Authorization error: You cannot claim this item.");
        }
        throw new Error(data.error || "Ownership verification failed. Please check your answers.");
      }

      setSuccessClaimId(data.claim.id);
    } catch (err: any) {
      setError(err.message || "Failed to verify ownership.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      style={{ margin: 0 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-[10000] w-full max-w-xl border-8 border-black bg-white p-6 sm:p-8 shadow-neo-xl space-y-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b-4 border-black pb-4 gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 border-2 border-black bg-[#C4B5FD] text-black px-2.5 py-0.5 text-[10px] font-black uppercase shadow-neo-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>LOSTIQ VERIFIED RECOVERY</span>
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-black">
              {isUnauthorizedFinder
                ? "FINDER CUSTODY STATUS"
                : isUnrelatedUser
                ? "UNAUTHORIZED CLAIM"
                : "PROVE ITEM OWNERSHIP"}
            </h3>
            <p className="text-xs font-bold text-black/70">
              TARGET VALUABLE: {reportTitle}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="neo-button p-1.5 bg-white text-black hover:bg-[#FF6B6B] hover:text-white border-3 border-black flex-shrink-0"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* State 1: Finder Role View */}
        {isUnauthorizedFinder ? (
          <div className="border-4 border-black bg-[#FFD93D] p-6 text-center space-y-4 shadow-neo-sm">
            <div className="h-12 w-12 border-3 border-black bg-black text-white mx-auto flex items-center justify-center font-black text-xl shadow-neo-sm">
              !
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-black uppercase text-black">YOU ARE LISTED AS THE FINDER</h4>
              <p className="text-xs font-bold text-black/85 leading-relaxed">
                You turned in this valuable. Ownership claims can only be submitted by the person who reported it lost. When the verified owner claims it, you will receive a Handover Confirmation request.
              </p>
            </div>
            <button
              onClick={onClose}
              className="neo-button px-6 py-2.5 text-xs bg-black text-white border-3 border-black hover:bg-[#FF6B6B]"
            >
              CLOSE WINDOW
            </button>
          </div>
        ) : isUnrelatedUser ? (
          /* State 2: Unrelated 3rd Party User */
          <div className="border-4 border-black bg-[#E2E8F0] p-6 text-center space-y-4 shadow-neo-sm">
            <div className="h-12 w-12 border-3 border-black bg-black text-white mx-auto flex items-center justify-center font-black text-xl shadow-neo-sm">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-black uppercase text-black">NOT AUTHORIZED TO CLAIM</h4>
              <p className="text-xs font-bold text-black/85 leading-relaxed">
                Only the authenticated user who filed the original matching lost report can initiate recovery for this item.
              </p>
            </div>
            <button
              onClick={onClose}
              className="neo-button px-6 py-2.5 text-xs bg-black text-white border-3 border-black hover:bg-[#FF6B6B]"
            >
              CLOSE
            </button>
          </div>
        ) : successClaimId ? (
          /* State 3: Ownership Verification Success -> Navigate to Recovery Hub */
          <div className="border-4 border-black bg-[#FFD93D] p-6 text-center space-y-4 shadow-neo-sm">
            <div className="h-12 w-12 border-3 border-black bg-black text-white mx-auto flex items-center justify-center font-black text-2xl shadow-neo-sm">
              <CheckCircle2 className="h-7 w-7 text-white" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xl font-black uppercase text-black">OWNERSHIP VERIFIED!</h4>
              <p className="text-xs font-bold text-black/85 leading-relaxed">
                Your identifying details matched the registered private ownership proof. Your recovery request is now active.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => {
                  onClose();
                  router.push(`/recovery/${successClaimId}`);
                }}
                className="neo-button w-full py-3 text-xs bg-[#FF6B6B] text-white border-3 border-black hover:bg-[#FF5252] shadow-neo-sm font-black"
              >
                OPEN RECOVERY PASS &amp; HANDOVER HUB →
              </button>
            </div>
          </div>
        ) : (
          /* State 4: 3-Question Ownership Verification Challenge */
          <form onSubmit={handleClaimSubmit} className="space-y-5">
            {error && (
              <div className="border-3 border-black bg-[#FF6B6B] text-white p-3 font-black text-xs uppercase flex items-center gap-2 shadow-neo-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="border-3 border-black bg-[#FFFDF5] p-3 text-xs font-bold text-black space-y-1">
              <div className="flex items-center gap-1.5 font-black uppercase text-[#FF6B6B]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>ZERO-KNOWLEDGE VERIFICATION CHALLENGE</span>
              </div>
              <p className="text-[11px] text-black/75">
                Answer the identifying questions below. Our server will compare your answers against your recorded lost report proof without exposing details to the finder.
              </p>
            </div>

            {/* Question 1 */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-black">
                QUESTION 1: WHAT UNIQUE IDENTIFYING FEATURE DOES YOUR ITEM HAVE? *
              </label>
              <input
                type="text"
                required
                placeholder="E.G. SCRATCH NEAR 3 O'CLOCK, STICKER ON REAR..."
                value={q1Feature}
                onChange={(e) => setQ1Feature(e.target.value)}
                disabled={loading}
                className="neo-input w-full p-2.5 text-xs font-black uppercase placeholder:text-black/40"
              />
            </div>

            {/* Question 2 */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-black">
                QUESTION 2: WHAT HIDDEN DETAIL OR MARK DID YOU SPECIFY WHEN REPORTING IT LOST? *
              </label>
              <input
                type="text"
                required
                placeholder="E.G. ENGRAVING, CONTENTS INSIDE POCKET, SERIAL FRAGMENT..."
                value={q2HiddenDetail}
                onChange={(e) => setQ2HiddenDetail(e.target.value)}
                disabled={loading}
                className="neo-input w-full p-2.5 text-xs font-black uppercase placeholder:text-black/40"
              />
            </div>

            {/* Question 3 */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-black">
                QUESTION 3: PROVIDE ANOTHER DISTINCTIVE CUSTOMIZATION OR CHARACTERISTIC (OPTIONAL)
              </label>
              <input
                type="text"
                placeholder="E.G. BLUE KEYCHAIN, CUSTOM WALLPAPER, TORN STRAP..."
                value={q3IdentifyingMark}
                onChange={(e) => setQ3IdentifyingMark(e.target.value)}
                disabled={loading}
                className="neo-input w-full p-2.5 text-xs font-black uppercase placeholder:text-black/40"
              />
            </div>

            <div className="flex gap-3 pt-2 border-t-3 border-black">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="neo-button flex-1 py-3 text-xs bg-white text-black border-3 border-black hover:bg-black hover:text-white"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={loading || !q1Feature.trim() || !q2HiddenDetail.trim()}
                className={`neo-button flex-1 py-3 text-xs font-black border-3 border-black shadow-neo-sm ${
                  !q1Feature.trim() || !q2HiddenDetail.trim() || loading
                    ? "bg-[#FF6B6B]/60 text-white cursor-not-allowed"
                    : "bg-[#FF6B6B] text-white hover:bg-[#FF5252]"
                }`}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "VERIFY OWNERSHIP & PROCEED"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
