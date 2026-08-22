"use client";

import { useState, useEffect } from "react";
import { X, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

interface ClaimModalProps {
  reportId: string;
  reportTitle: string;
  isOpen: boolean;
  onClose: () => void;
  isUnauthorizedFinder?: boolean;
}

export function ClaimModal({
  reportId,
  reportTitle,
  isOpen,
  onClose,
  isUnauthorizedFinder = false,
}: ClaimModalProps) {
  const { user, getFreshToken } = useAuth();
  const [proofDetails, setProofDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
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
    if (isUnauthorizedFinder) return;
    if (!proofDetails.trim()) {
      setError("Please describe proof of ownership details.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getFreshToken();
      if (!token) {
        throw new Error("You must be logged in with Google to file an ownership claim.");
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
          proofDetails: proofDetails.trim(),
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
        throw new Error(data.error || "Failed to submit claim request.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit claim.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
      style={{ margin: 0 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-[10000] w-full max-w-lg border-8 border-black bg-white p-6 sm:p-8 shadow-neo-xl space-y-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b-4 border-black pb-4 gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 border-2 border-black bg-[#C4B5FD] text-black px-2.5 py-0.5 text-[10px] font-black uppercase shadow-neo-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>OWNERSHIP VERIFICATION</span>
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-black">
              {isUnauthorizedFinder ? "OWNERSHIP CLAIM NOT AVAILABLE" : "CLAIM THIS VALUABLE"}
            </h3>
            <p className="text-xs font-bold text-black/70">
              TARGET CASE: {reportTitle}
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

        {/* State 1: Unauthorized Finder View */}
        {isUnauthorizedFinder ? (
          <div className="border-4 border-black bg-[#FFD93D] p-6 text-center space-y-4 shadow-neo-sm">
            <div className="h-12 w-12 border-3 border-black bg-black text-white mx-auto flex items-center justify-center font-black text-xl shadow-neo-sm">
              !
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-black uppercase text-black">FINDER CUSTODY STATUS</h4>
              <p className="text-xs font-bold text-black/85 leading-relaxed">
                You&apos;re listed as the finder for this item. The ownership claim can only be submitted by the person who reported it lost.
              </p>
            </div>
            <button
              onClick={onClose}
              className="neo-button px-6 py-2.5 text-xs bg-black text-white border-3 border-black hover:bg-[#FF6B6B]"
            >
              CLOSE
            </button>
          </div>
        ) : success ? (
          /* State 2: Success Confirmation */
          <div className="border-4 border-black bg-[#FFD93D] p-6 text-center space-y-4 shadow-neo-sm">
            <div className="h-12 w-12 border-3 border-black bg-black text-white mx-auto flex items-center justify-center font-black text-2xl shadow-neo-sm">
              ✓
            </div>
            <h4 className="text-xl font-black uppercase text-black">CLAIM FILED SUCCESSFULLY</h4>
            <p className="text-xs font-bold text-black/85 leading-relaxed">
              Your hidden verification details have been recorded. The reporter or campus lost &amp; found officer will verify and coordinate return.
            </p>
            <button
              onClick={onClose}
              className="neo-button px-6 py-2.5 text-xs bg-black text-white border-3 border-black hover:bg-[#FF6B6B]"
            >
              CLOSE WINDOW
            </button>
          </div>
        ) : (
          /* State 3: Authorized Claim Form */
          <form onSubmit={handleClaimSubmit} className="space-y-5">
            {error && (
              <div className="border-3 border-black bg-[#FF6B6B] text-white p-3 font-black text-xs uppercase flex items-center gap-2 shadow-neo-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-black">
                PROVIDE HIDDEN IDENTIFIERS / UNIQUE PROOF *
              </label>
              <textarea
                required
                rows={4}
                placeholder="DESCRIBE LOCKSCREEN WALLPAPER, CASE SCRATCHES, SERIAL NUMBERS, OR CONTENTS NOT SHOWN IN PUBLIC PHOTO..."
                value={proofDetails}
                onChange={(e) => setProofDetails(e.target.value)}
                disabled={loading}
                className="neo-input w-full p-3 text-xs font-black uppercase placeholder:text-black/40"
              />
              <p className="text-[11px] font-bold text-black/60">
                🔒 Protected verification: Never publicly visible.
              </p>
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
                disabled={loading || !proofDetails.trim()}
                className={`neo-button flex-1 py-3 text-xs font-black border-3 border-black shadow-neo-sm ${
                  !proofDetails.trim() || loading
                    ? "bg-[#FF6B6B]/60 text-white cursor-not-allowed"
                    : "bg-[#FF6B6B] text-white hover:bg-[#FF5252]"
                }`}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "SUBMIT OWNERSHIP CLAIM"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
