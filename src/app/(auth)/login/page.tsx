"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, User, Loader2, Sparkles, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/lib/auth/AuthContext";

function LoginForm() {
  const { user, signInGoogle, signInDemoUser, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [authError, setAuthError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (user) {
    router.push(callbackUrl);
    return null;
  }

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setAuthError(null);
      await signInGoogle();
      router.push(callbackUrl);
    } catch (err: any) {
      setAuthError(err.message || "Failed to sign in with Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDemoSignIn = (role: "user" | "admin") => {
    signInDemoUser(role);
    router.push(callbackUrl);
  };

  return (
    <div className="w-full max-w-lg mx-auto border-8 border-black bg-white p-8 sm:p-12 shadow-neo-xl space-y-8">
      
      {/* Brand & Editorial Header */}
      <div className="text-center space-y-3 flex flex-col items-center">
        <div className="p-2 border-4 border-black bg-secondary shadow-neo-sm rotate-[-2deg]">
          <Image
            src="/brand/logo/lostiq-mark.webp"
            alt="LostIQ"
            width={64}
            height={64}
            priority
          />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black leading-none">
          SIGN IN TO <span className="bg-primary text-white px-2 py-0.5 border-3 border-black inline-block rotate-1">LOSTIQ</span>
        </h1>
        <p className="text-xs sm:text-sm font-bold text-black/80 max-w-sm">
          Access automated Gemini AI matching, report management, and secure item claims.
        </p>
      </div>

      {authError && (
        <div className="border-4 border-black bg-primary text-white p-4 font-black text-xs uppercase shadow-neo-sm">
          {authError}
        </div>
      )}

      {/* Google OAuth Action */}
      <div className="space-y-4">
        <button
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="neo-button w-full py-4 text-sm font-black bg-white text-black border-4 border-black hover:bg-secondary shadow-neo"
        >
          {googleLoading ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
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

      {/* Evaluator Instant Access Buttons */}
      <div className="space-y-3 pt-6 border-t-4 border-black">
        <div className="flex items-center justify-between text-xs font-black uppercase text-black/70">
          <span>HACKATHON EVALUATOR INSTANT LOGIN:</span>
          <span className="text-[10px] bg-secondary px-1.5 border border-black">1-CLICK</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleDemoSignIn("user")}
            className="neo-button py-3 text-xs font-black bg-secondary text-black border-3 border-black hover:bg-secondary-hover shadow-neo-sm"
          >
            <User className="h-4 w-4 mr-1.5 inline" />
            STUDENT ACCOUNT
          </button>
          <button
            onClick={() => handleDemoSignIn("admin")}
            className="neo-button py-3 text-xs font-black bg-tertiary text-black border-3 border-black hover:bg-tertiary-hover shadow-neo-sm"
          >
            <Shield className="h-4 w-4 mr-1.5 inline" />
            CAMPUS ADMIN
          </button>
        </div>
      </div>

      {/* Security Note */}
      <div className="border-3 border-black bg-canvas p-3 text-[11px] font-black uppercase text-center">
        ⚡ SECURED BY FIREBASE AUTH &amp; SUPABASE POSTGRESQL
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
