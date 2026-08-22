"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { RouteGuard } from "@/lib/auth/RouteGuard";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  MapPin,
  Clock,
} from "lucide-react";

export default function RecoveryVerifyTokenPage({ params }: { params: { token: string } }) {
  const { user, getFreshToken } = useAuth();
  const [tokenData, setTokenData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    async function validateToken() {
      try {
        const res = await fetch(`/api/claims/pass/validate?token=${encodeURIComponent(params.token)}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Recovery pass is invalid or expired");
        }
        setTokenData(data);
      } catch (err: any) {
        setError(err.message || "Failed to validate recovery pass");
      } finally {
        setLoading(false);
      }
    }

    validateToken();
  }, [params.token]);

  const handleConfirmHandover = async () => {
    if (!tokenData?.claim?.id) return;
    setConfirming(true);
    setError(null);
    try {
      const token = await getFreshToken();
      const res = await fetch("/api/claims/handover/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          claimId: tokenData.claim.id,
          token: params.token,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to confirm handover");
      }

      setConfirmed(true);
    } catch (err: any) {
      setError(err.message || "Could not confirm handover.");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-black mx-auto" />
        <div className="font-black uppercase tracking-wider text-xs">
          VALIDATING ONE-TIME RECOVERY PASS...
        </div>
      </div>
    );
  }

  return (
    <RouteGuard>
      <div className="max-w-xl mx-auto space-y-6 py-6 px-4">
        
        {/* Verification Card */}
        <div className="border-8 border-black bg-white p-6 sm:p-8 shadow-neo-xl space-y-6">
          
          <div className="flex items-center justify-between border-b-4 border-black pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 border-2 border-black bg-[#C4B5FD] text-black px-2.5 py-0.5 text-[10px] font-black uppercase shadow-neo-sm">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>HANDOVER VERIFICATION</span>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-black">
                LOSTIQ RECOVERY PASS
              </h2>
            </div>
            <span className={`text-xs font-black uppercase px-2.5 py-1 border-3 border-black ${
              error ? "bg-[#FF6B6B] text-white" : "bg-[#FFD93D] text-black"
            }`}>
              {error ? "INVALID PASS" : "✅ PASS VALID"}
            </span>
          </div>

          {error ? (
            <div className="border-4 border-black bg-[#FF6B6B] text-white p-6 text-center space-y-3 shadow-neo-sm">
              <AlertCircle className="h-10 w-10 mx-auto" />
              <h3 className="font-black text-lg uppercase">RECOVERY PASS EXPIRED OR INVALID</h3>
              <p className="text-xs font-bold text-white/90 leading-relaxed">
                {error}
              </p>
              <div className="pt-2">
                <Link href="/dashboard" className="neo-button px-5 py-2 text-xs bg-black text-white border-2 border-white">
                  RETURN TO CONTROL DESK
                </Link>
              </div>
            </div>
          ) : confirmed ? (
            <div className="border-4 border-black bg-[#FFD93D] p-6 text-center space-y-4 shadow-neo-sm">
              <div className="h-12 w-12 border-3 border-black bg-black text-white mx-auto flex items-center justify-center font-black text-2xl shadow-neo-sm">
                ✓
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black uppercase text-black">HANDOVER CONFIRMED!</h3>
                <p className="text-xs font-bold text-black/85 leading-relaxed">
                  You have confirmed handing this valuable over to the verified owner. The owner will confirm receipt on their device to close the case file.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href={`/recovery/${tokenData.claim.id}`}
                  className="neo-button w-full py-3 text-xs bg-black text-white border-3 border-black hover:bg-[#FF6B6B] font-black"
                >
                  VIEW RECOVERY HUB →
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Item Summary Details */}
              <div className="border-4 border-black bg-[#FFFDF5] p-5 space-y-3 shadow-neo-sm">
                <div className="text-[10px] font-black uppercase text-black/60">
                  CONFIRM YOU ARE HANDING OVER:
                </div>
                <h3 className="text-2xl font-black uppercase text-black">
                  {tokenData.item?.title}
                </h3>
                
                <div className="grid grid-cols-2 gap-2 text-xs font-black uppercase pt-1">
                  <div className="border-2 border-black p-2 bg-white">
                    <span className="text-[9px] text-black/60 block">COLOR:</span>
                    <span>{tokenData.item?.color || "UNSPECIFIED"}</span>
                  </div>
                  <div className="border-2 border-black p-2 bg-white">
                    <span className="text-[9px] text-black/60 block">BRAND:</span>
                    <span>{tokenData.item?.brand || "UNSPECIFIED"}</span>
                  </div>
                </div>

                <div className="text-xs font-bold text-black/70 flex items-center gap-1 pt-1">
                  <MapPin className="h-3.5 w-3.5 text-[#FF6B6B]" />
                  <span>{tokenData.item?.location || "Campus Area"}</span>
                </div>
              </div>

              {/* Action Confirmation Button */}
              <div className="space-y-3">
                <div className="text-xs font-black uppercase text-black">
                  PHYSICAL HANDOVER ATTESTATION:
                </div>
                <p className="text-[11px] font-bold text-black/70">
                  By clicking below, you confirm you are currently in person with the claimant and physically handing over the item.
                </p>
                <button
                  onClick={handleConfirmHandover}
                  disabled={confirming}
                  className="neo-button w-full py-4 text-sm font-black bg-[#FFD93D] text-black border-4 border-black hover:bg-[#FCC419] shadow-neo"
                >
                  {confirming ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    "YES, I AM HANDING OVER THIS ITEM ✓"
                  )}
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </RouteGuard>
  );
}
