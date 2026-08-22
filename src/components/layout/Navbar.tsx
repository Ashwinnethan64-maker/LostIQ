"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search, PlusCircle, LayoutDashboard, LogIn, LogOut, Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { getFirstName } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/reports", label: "EXPLORE", icon: Search },
    { href: "/report/lost", label: "REPORT LOST", icon: PlusCircle, highlight: "lost" },
    { href: "/report/found", label: "REPORT FOUND", icon: PlusCircle, highlight: "found" },
    ...(user ? [{ href: "/dashboard", label: "CONTROL DESK", icon: LayoutDashboard }] : []),
  ];

  const firstName = getFirstName(user);

  return (
    <header className="sticky top-0 z-50 w-full border-b-4 border-black bg-white shadow-neo-sm">
      <div className="container mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        
        {/* Brand Logo Sticker */}
        <Link href="/" className="flex items-center gap-3 transition-transform hover:-translate-y-0.5">
          <div className="p-1.5 border-3 border-black bg-[#FFD93D] shadow-[3px_3px_0px_#000000] rotate-[-2deg] hover:rotate-0 transition-transform">
            <Image
              src="/brand/logo/lostiq-mark.webp"
              alt="LostIQ"
              width={34}
              height={34}
              className="rounded-none"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-2xl tracking-tighter text-black flex items-center gap-1.5">
              Lost<span className="bg-[#FF6B6B] text-white px-1.5 py-0.5 border-2 border-black rotate-1 inline-block">IQ</span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-black/80 -mt-1 hidden sm:inline">
              INTELLIGENT LOST &amp; FOUND
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-3">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            let bgClass = "bg-white text-black hover:bg-[#FFD93D]";
            if (isActive) {
              bgClass = "bg-[#FFD93D] text-black shadow-neo-sm -translate-y-0.5";
            }
            if (link.highlight === "lost") {
              bgClass = isActive ? "bg-[#FF6B6B] text-white shadow-neo-sm" : "bg-white text-black hover:bg-[#FF6B6B] hover:text-white";
            } else if (link.highlight === "found") {
              bgClass = isActive ? "bg-[#FFD93D] text-black shadow-neo-sm" : "bg-white text-black hover:bg-[#FFD93D]";
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`neo-button px-4 py-2 text-xs font-black border-3 border-black ${bgClass} transition-all`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Auth Section (Issues 9, 10, 11, 21 Fix: Render First Name & Avatar, no raw UID/email) */}
        <div className="hidden lg:flex items-center gap-3">
          {loading ? (
            <div className="h-10 w-24 border-3 border-black bg-muted animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 border-3 border-black bg-[#FFFDF5] px-3 py-1.5 shadow-[3px_3px_0px_#000000] hover:bg-[#FFD93D] transition-colors"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={firstName}
                    className="h-6 w-6 border-2 border-black object-cover"
                  />
                ) : user.role === "admin" ? (
                  <Shield className="h-4 w-4 text-[#FF6B6B]" />
                ) : (
                  <div className="h-6 w-6 bg-[#FFD93D] border-2 border-black flex items-center justify-center font-black text-xs text-black">
                    {firstName.charAt(0)}
                  </div>
                )}
                <span className="text-xs font-black uppercase max-w-[130px] truncate text-black">
                  {firstName}
                </span>
              </Link>
              <button
                onClick={() => logout()}
                className="neo-button px-3 py-1.5 text-xs bg-[#E2E8F0] text-black hover:bg-[#FF6B6B] hover:text-white border-3 border-black"
                title="Sign Out and Return to Home"
              >
                <LogOut className="h-4 w-4 mr-1" />
                EXIT
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="neo-button px-5 py-2 text-xs bg-[#FF6B6B] text-white border-3 border-black hover:bg-[#FF5252] shadow-neo-sm"
            >
              <LogIn className="h-4 w-4 mr-1.5" />
              SIGN IN
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden neo-button p-2 bg-[#FFD93D] text-black border-3 border-black"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t-4 border-black bg-[#FFFDF5] p-6 space-y-4 shadow-neo-lg">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`neo-button w-full py-3 text-sm font-black border-4 border-black ${
                  pathname === link.href ? "bg-[#FFD93D] text-black" : "bg-white text-black hover:bg-[#FFD93D]"
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            {user ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="neo-button w-full py-3 text-sm bg-[#FF6B6B] text-white border-4 border-black mt-2"
              >
                LOGOUT ({firstName})
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="neo-button w-full py-3 text-sm bg-[#FF6B6B] text-white border-4 border-black mt-2"
              >
                SIGN IN / REGISTER
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
