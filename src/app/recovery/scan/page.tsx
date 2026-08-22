"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RouteGuard } from "@/lib/auth/RouteGuard";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  Camera,
  Upload,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  QrCode,
  Zap,
} from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

export default function RecoveryScanPage() {
  const { user, getFreshToken } = useAuth();
  const router = useRouter();

  const [scannerStarted, setScannerStarted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [handoverSubmitting, setHandoverSubmitting] = useState(false);
  const [handoverCompleted, setHandoverCompleted] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize camera scanner
  const startCameraScanner = async () => {
    setCameraError(null);
    setVerificationError(null);
    setScanResult(null);

    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current.clear();
      }

      const qrScanner = new Html5Qrcode("lostIQ-reader", {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      html5QrCodeRef.current = qrScanner;

      await qrScanner.start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleTokenScanned(decodedText);
        },
        (errorMessage) => {
          // Ignore transient scan frame errors
        }
      );

      setScannerStarted(true);
    } catch (err: any) {
      console.error("Camera start failed", err);
      setCameraError(
        err?.message?.includes("Permission")
          ? "Camera permission denied. Please allow camera access in your browser settings or upload a QR image below."
          : "Unable to access your device camera. Please check permissions or use image upload."
      );
      setScannerStarted(false);
    }
  };

  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner", err);
      }
      setScannerStarted(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, []);

  // Handle scanned QR payload
  const handleTokenScanned = async (decodedText: string) => {
    stopCameraScanner();
    setVerifying(true);
    setVerificationError(null);

    try {
      const res = await fetch("/api/recovery/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: decodedText,
          finderUserId: user?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.valid) {
        throw new Error(data.message || "This is not a valid LostIQ recovery pass.");
      }

      setScanResult(data);
    } catch (err: any) {
      setVerificationError(err.message || "Verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  // Handle QR image file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVerifying(true);
      setVerificationError(null);
      setCameraError(null);

      try {
        const qrScanner = new Html5Qrcode("lostIQ-reader-temp", {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });

        const decodedText = await qrScanner.scanFile(file, true);
        qrScanner.clear();
        await handleTokenScanned(decodedText);
      } catch (err: any) {
        setVerifying(false);
        setVerificationError("No valid LostIQ QR code detected in the uploaded image.");
      }
    }
  };

  // Confirm Handover
  const handleConfirmHandover = async () => {
    if (!scanResult?.claim?.id || !scanResult?.token) return;
    setHandoverSubmitting(true);
    setVerificationError(null);

    try {
      const token = await getFreshToken();
      const res = await fetch("/api/claims/handover/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          claimId: scanResult.claim.id,
          token: scanResult.token,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to confirm handover");
      }

      setHandoverCompleted(true);
    } catch (err: any) {
      setVerificationError(err.message || "Could not confirm handover.");
    } finally {
      setHandoverSubmitting(false);
    }
  };

  return (
    <RouteGuard>
      <div className="max-w-xl mx-auto space-y-6 py-6 px-4">
        
        {/* Navigation Breadcrumb */}
        <Link
          href="/dashboard"
          className="neo-button px-4 py-2 text-xs bg-white text-black border-3 border-black hover:bg-[#E2E8F0]"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4 inline" /> BACK TO CONTROL DESK
        </Link>

        {/* Scanner Card Container */}
        <div className="border-8 border-black bg-white p-6 sm:p-8 shadow-neo-xl space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b-4 border-black pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 border-2 border-black bg-[#FFD93D] text-black px-2.5 py-0.5 text-[10px] font-black uppercase shadow-neo-sm">
                <QrCode className="h-3.5 w-3.5" />
                <span>IN-APP QR VERIFIER</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
                SCAN RECOVERY QR
              </h1>
            </div>
            <span className="neo-sticker bg-[#C4B5FD] text-black text-[10px]">
              FINDER CUSTODIAN
            </span>
          </div>

          {/* Result State 1: Handover Confirmed */}
          {handoverCompleted ? (
            <div className="border-4 border-black bg-[#FFD93D] p-6 text-center space-y-4 shadow-neo-sm">
              <div className="h-14 w-14 border-4 border-black bg-black text-white mx-auto flex items-center justify-center font-black text-3xl shadow-neo-sm">
                ✓
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black uppercase text-black">HANDOVER RECORDED!</h3>
                <p className="text-xs font-bold text-black/85 leading-relaxed">
                  You have confirmed handing this valuable over to the verified owner. The owner will confirm receipt on their device to close the case file.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href={`/recovery/${scanResult.claim.id}`}
                  className="neo-button w-full py-3.5 text-xs bg-black text-white border-3 border-black hover:bg-[#FF6B6B] font-black shadow-neo"
                >
                  VIEW RECOVERY HUB &amp; CASE STATUS →
                </Link>
              </div>
            </div>
          ) : scanResult ? (
            /* Result State 2: QR Verified -> Handover Action */
            <div className="space-y-6">
              <div className="border-4 border-black bg-[#FFD93D] p-5 space-y-3 shadow-neo-sm">
                <div className="flex items-center gap-2 font-black text-base uppercase text-black">
                  <CheckCircle2 className="h-6 w-6 text-black" />
                  <span>RECOVERY PASS VERIFIED!</span>
                </div>
                <p className="text-xs font-bold text-black/85">
                  The recovery token is genuine and active. Confirm item details below before handing it to the claimant.
                </p>
              </div>

              <div className="border-4 border-black bg-[#FFFDF5] p-5 space-y-3 shadow-neo-sm">
                <div className="text-[10px] font-black uppercase text-black/60">
                  TARGET VALUABLE FOR HANDOVER:
                </div>
                <h3 className="text-2xl font-black uppercase text-black">
                  {scanResult.item?.title}
                </h3>
                
                <div className="grid grid-cols-2 gap-2 text-xs font-black uppercase pt-1">
                  <div className="border-2 border-black p-2 bg-white">
                    <span className="text-[9px] text-black/60 block">COLOR:</span>
                    <span>{scanResult.item?.color || "UNSPECIFIED"}</span>
                  </div>
                  <div className="border-2 border-black p-2 bg-white">
                    <span className="text-[9px] text-black/60 block">BRAND:</span>
                    <span>{scanResult.item?.brand || "UNSPECIFIED"}</span>
                  </div>
                </div>

                <div className="text-[11px] font-bold text-black/70 flex items-center justify-between pt-1 border-t-2 border-black/10">
                  <span>EXPIRATION TIME:</span>
                  <span className="font-black text-[#FF6B6B]">
                    {new Date(scanResult.expiresAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {verificationError && (
                <div className="border-4 border-black bg-[#FF6B6B] text-white p-4 font-black text-xs uppercase flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{verificationError}</span>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleConfirmHandover}
                  disabled={handoverSubmitting}
                  className="neo-button w-full py-4 text-sm font-black bg-[#FF6B6B] text-white border-4 border-black hover:bg-[#FF5252] shadow-neo"
                >
                  {handoverSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    "CONFIRM PHYSICAL HANDOVER TO OWNER ✓"
                  )}
                </button>
                <button
                  onClick={() => {
                    setScanResult(null);
                    startCameraScanner();
                  }}
                  className="neo-button w-full py-2.5 text-xs bg-white text-black border-3 border-black hover:bg-[#E2E8F0]"
                >
                  SCAN ANOTHER PASS
                </button>
              </div>
            </div>
          ) : (
            /* State 3: Active Scanner / Upload View */
            <div className="space-y-6">
              
              {verificationError && (
                <div className="border-4 border-black bg-[#FF6B6B] text-white p-4 font-black text-xs uppercase flex items-center gap-3 shadow-neo-sm">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{verificationError}</span>
                </div>
              )}

              {cameraError && (
                <div className="border-4 border-black bg-[#FFD93D] text-black p-4 font-black text-xs uppercase flex items-center gap-3 shadow-neo-sm">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Viewport for Live Camera Scanning */}
              <div className="relative border-4 border-black bg-black min-h-[300px] flex items-center justify-center overflow-hidden shadow-neo">
                <div id="lostIQ-reader" className="w-full h-full" />
                <div id="lostIQ-reader-temp" className="hidden" />

                {!scannerStarted && !verifying && (
                  <div className="absolute inset-0 bg-[#FFFDF5] flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <div className="h-16 w-16 border-4 border-black bg-[#FFD93D] flex items-center justify-center shadow-neo-sm">
                      <Camera className="h-8 w-8 text-black" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-black text-base uppercase text-black">
                        READY TO SCAN RECOVERY QR
                      </h4>
                      <p className="text-xs font-bold text-black/70 max-w-xs">
                        Point your camera at the owner&apos;s 10-minute Recovery Pass QR to verify ownership.
                      </p>
                    </div>
                    <button
                      onClick={startCameraScanner}
                      className="neo-button px-6 py-3 text-xs bg-[#FF6B6B] text-white border-3 border-black hover:bg-[#FF5252] shadow-neo font-black"
                    >
                      <Zap className="mr-1.5 h-4 w-4 inline" /> START CAMERA SCANNER
                    </button>
                  </div>
                )}

                {verifying && (
                  <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <Loader2 className="h-10 w-10 animate-spin text-black" />
                    <div className="font-black text-xs uppercase tracking-wider text-black">
                      VERIFYING ONE-TIME PASS WITH SUPABASE...
                    </div>
                  </div>
                )}
              </div>

              {/* Action Controls (Stop Scanner / Upload Image Fallback) */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {scannerStarted && (
                  <button
                    onClick={stopCameraScanner}
                    className="neo-button flex-1 py-3 text-xs bg-white text-black border-3 border-black hover:bg-[#E2E8F0]"
                  >
                    PAUSE CAMERA
                  </button>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="neo-button flex-1 py-3 text-xs bg-[#C4B5FD] text-black border-3 border-black hover:bg-[#B39DFB] font-black shadow-neo-sm"
                >
                  <Upload className="mr-1.5 h-4 w-4 inline" /> UPLOAD QR IMAGE
                </button>
              </div>

              <div className="border-3 border-black bg-[#FFFDF5] p-3 text-[11px] font-bold text-black/80 space-y-1">
                <div><strong>HOW IT WORKS:</strong></div>
                <div>1. The owner opens their Recovery Pass on LostIQ.</div>
                <div>2. Scan their QR with this camera or upload a photo of it.</div>
                <div>3. Our server validates the 10-minute token and unlocks the handover confirmation button.</div>
              </div>

            </div>
          )}

        </div>

      </div>
    </RouteGuard>
  );
}
