import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/lib/auth/AuthContext";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005"),
  title: "LostIQ — Intelligent Lost & Found",
  description: "Lost it. Found it. Matched by AI. LostIQ is an intelligent, AI-powered campus lost & found matching platform.",
  keywords: ["LostIQ", "campus lost and found", "AI matching", "smart campus", "lost items", "found items"],
  icons: {
    icon: [
      { url: "/brand/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/brand/favicon/favicon.ico" },
    ],
    apple: "/brand/favicon/apple-touch-icon.png",
  },
  openGraph: {
    title: "LostIQ — Intelligent Lost & Found",
    description: "Lost it. Found it. Matched by AI. Multimodal AI-powered lost & found item matching.",
    images: [{ url: "/brand/social/og-image.png", width: 1200, height: 630, alt: "LostIQ" }],
    siteName: "LostIQ",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body className="min-h-screen flex flex-col bg-[#FFFDF5] text-black font-sans antialiased selection:bg-[#FFD93D] selection:text-black">
        <AuthProvider>
          <div className="bg-[#FFD93D] text-black font-black text-xs py-1.5 px-4 border-b-4 border-black uppercase tracking-widest text-center flex items-center justify-center gap-3 overflow-hidden select-none">
            <span>⚡ AI-POWERED CAMPUS LOST & FOUND INTELLIGENCE</span>
            <span className="hidden sm:inline">★</span>
            <span className="hidden sm:inline">MULTIMODAL VISION RECOGNITION</span>
            <span className="hidden md:inline">★</span>
            <span className="hidden md:inline">REAL-TIME MULTI-SIGNAL MATCHING</span>
          </div>
          <Navbar />
          <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
