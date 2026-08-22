"use client";

import { useAuth } from "./AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";

interface RouteGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function RouteGuard({ children, requireAdmin = false }: RouteGuardProps) {
  const { user, status, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect if auth initialization has completed and user is strictly unauthenticated
    if (!loading && status === "UNAUTHENTICATED" && !user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [user, status, loading, router, pathname]);

  // Render branded Loading State while auth or server bootstrap is in progress
  if (loading || status === "INITIALIZING" || status === "AUTHENTICATING" || status === "BOOTSTRAPPING") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 py-12">
        <div className="border-6 border-black bg-[#FFD93D] p-8 shadow-neo-lg text-center space-y-3 max-w-sm w-full">
          <Loader2 className="h-10 w-10 animate-spin text-black mx-auto" />
          <h3 className="text-sm font-black uppercase tracking-widest text-black">
            VERIFYING YOUR LOSTIQ SESSION...
          </h3>
          <p className="text-[11px] font-bold text-black/70 uppercase">
            EXCHANGING AUTHENTICATED CREDENTIALS
          </p>
        </div>
      </div>
    );
  }

  // Not authorized / unauthenticated
  if (!user || status !== "AUTHORIZED") {
    return null;
  }

  // Admin role check
  if (requireAdmin && !isAdmin) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center px-4 max-w-md mx-auto space-y-4 py-12">
        <div className="border-6 border-black bg-[#FF6B6B] text-white p-8 shadow-neo-lg space-y-4">
          <ShieldAlert className="h-12 w-12 text-white mx-auto" />
          <h2 className="text-2xl font-black uppercase tracking-tight text-white">ACCESS DENIED</h2>
          <p className="text-xs font-bold text-white/90">
            Account ({user.email}) does not possess administrative clearance.
          </p>
          <Link
            href="/dashboard"
            className="neo-button px-6 py-3 text-xs bg-black text-white border-3 border-black hover:bg-[#FFD93D] hover:text-black inline-block"
          >
            RETURN TO CONTROL DESK
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
