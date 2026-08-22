"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/lib/auth/AuthContext";

function LoginForm() {
  const { user, signInGoogle, status, errorMessage } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Only redirect when authentication AND server bootstrap are 100% complete
    if (status === "AUTHORIZED" && user) {
      router.push(callbackUrl);
    }
  }, [status, user, router, callbackUrl]);

  const handleGoogleSignIn = async () => {
    try {
      setSubmitting(true);
      setLocalError(null);
      await signInGoogle();
      // Router redirection is triggered by the useEffect when status becomes 'AUTHORIZED'
    } catch (err: any) {
      // Ignore user-cancelled popup closes gracefully
      if (err.code === "auth/popup-closed-by-user") {
        setLocalError("Sign-in window closed before completing authentication.");
      } else {
        setLocalError(err.message || "Failed to sign in with Google.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isVerifying = status === "AUTHENTICATING" || status === "BOOTSTRAPPING";

  return (
    <div className="w-full max-w-lg mx-auto border-8 border-black bg-white p-8 sm:p-12 shadow-neo-xl space-y-8">
      
      {/* Brand & Editorial Header */}
      <div className="text-center space-y-3 flex flex-col items-center">
        <div className="p-2 border-4 border-black bg-[#FFD93D] shadow-neo-sm rotate-[-2deg]">
          <Image
            src="/brand/logo/lostiq-mark.webp"
            alt="LostIQ"
            width={64}
            height={64}
            priority
          />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black leading-none">
          SIGN IN TO <span className="bg-[#FF6B6B] text-white px-2 py-0.5 border-3 border-black inline-block rotate-1">LOSTIQ</span>
        </h1>
        <p className="text-xs sm:text-sm font-bold text-black/80 max-w-sm">
          Access automated Gemini AI matching, report management, and secure item claims.
        </p>
      </div>

      {/* Error Displays */}
      {(localError || errorMessage) && (
        <div className="border-4 border-black bg-[#FF6B6B] text-white p-4 font-black text-xs uppercase flex items-center gap-3 shadow-neo-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{localError || errorMessage}</span>
        </div>
      )}

      {/* Auth State In-Flight Banner */}
      {isVerifying && (
        <div className="border-4 border-black bg-[#FFD93D] text-black p-4 space-y-2 text-center shadow-neo-sm">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-black" />
          <div className="font-black text-xs uppercase tracking-wider">
            {status === "AUTHENTICATING"
              ? "AUTHENTICATING WITH GOOGLE..."
              : "VERIFYING SESSION & BOOTSTRAPPING USER..."}
          </div>
          <div className="text-[10px] font-bold text-black/70 uppercase">
            EXCHANGING VERIFIED FIREBASE CREDENTIALS
          </div>
        </div>
      )}

      {/* Google OAuth Action */}
      <div className="space-y-4">
        <button
          onClick={handleGoogleSignIn}
          disabled={submitting || isVerifying}
          className="neo-button w-full py-4 text-sm font-black bg-white text-black border-4 border-black hover:bg-[#FFD93D] shadow-neo transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting || isVerifying ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2 inline" />
          ) : (
            <svg className="h-5 w-5 mr-3 inline" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.8l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
              />
            </svg>
          )}
          CONTINUE WITH GOOGLE
        </button>
      </div>

      {/* Real Security Enforcement Banner */}
      <div className="border-3 border-black bg-[#FFFDF5] p-3 text-[11px] font-black uppercase text-center space-y-1">
        <div className="text-black">⚡ REAL-TIME IDENTITY VERIFICATION</div>
        <div className="text-black/60 text-[10px]">
          SESSIONS ARE VALIDATED SERVER-SIDE WITH GOOGLE &amp; SUPABASE POSTGRESQL
        </div>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-8">
      <Suspense fallback={<div className="border-4 border-black p-8 font-black uppercase">LOADING AUTH...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
