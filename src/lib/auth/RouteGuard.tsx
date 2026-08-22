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
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4">
        <div className="border-4 border-black bg-[#FFD93D] p-6 shadow-neo text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-black mx-auto" />
          <p className="text-xs font-black uppercase tracking-widest text-black">
            VERIFYING AUTHENTICATION SESSION...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center px-4 max-w-md mx-auto space-y-4">
        <div className="border-4 border-black bg-[#FF6B6B] text-white p-8 shadow-neo-lg space-y-4">
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
