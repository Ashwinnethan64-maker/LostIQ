"use client";

import { useState } from "react";
import { X, ShieldCheck, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

interface ClaimModalProps {
  reportId: string;
  reportTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ClaimModal({ reportId, reportTitle, isOpen, onClose }: ClaimModalProps) {
  const { user } = useAuth();
  const [proofDetails, setProofDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofDetails.trim()) {
      setError("Please describe proof of ownership details.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/claims/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          claimantId: user?.id || "demo-claimant-101",
          proofDetails: proofDetails.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit claim request");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit claim.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-none">
      <div className="relative w-full max-w-lg border-8 border-black bg-white p-6 sm:p-8 shadow-neo-xl space-y-6">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b-4 border-black pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 border-2 border-black bg-secondary px-2.5 py-0.5 text-[10px] font-black uppercase">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>OWNERSHIP VERIFICATION</span>
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-black">
              CLAIM THIS VALUABLE
            </h3>
            <p className="text-xs font-bold text-black/70">
              TARGET CASE: {reportTitle}
            </p>
          </div>

          <button
            onClick={onClose}
            className="neo-button p-1.5 bg-muted hover:bg-primary hover:text-white border-3 border-black"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="border-4 border-black bg-secondary p-6 text-center space-y-4 shadow-neo-sm">
            <div className="h-12 w-12 border-3 border-black bg-black text-white mx-auto flex items-center justify-center font-black text-2xl">
              ✓
            </div>
            <h4 className="text-xl font-black uppercase">CLAIM FILED SUCCESSFULLY</h4>
            <p className="text-xs font-bold text-black/80">
              Your hidden verification details have been recorded. The reporter or campus lost &amp; found officer will verify and coordinate return.
            </p>
            <button
              onClick={onClose}
              className="neo-button px-6 py-2.5 text-xs bg-black text-white border-3 border-black hover:bg-primary"
            >
              CLOSE WINDOW
            </button>
          </div>
        ) : (
          <form onSubmit={handleClaimSubmit} className="space-y-5">
            {error && (
              <div className="border-3 border-black bg-primary text-white p-3 font-black text-xs uppercase flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
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
                className="neo-button flex-1 py-3 text-xs bg-muted border-3 border-black hover:bg-black hover:text-white"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={loading}
                className="neo-button flex-1 py-3 text-xs bg-primary text-white border-3 border-black hover:bg-primary-hover shadow-neo-sm"
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
