import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="w-full border-t-8 border-black bg-black text-white py-12 px-4 sm:px-6 mt-16">
      <div className="container mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Brand Block (6 Cols) */}
        <div className="md:col-span-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-1 border-2 border-white bg-[#FFD93D] rotate-[-3deg]">
              <Image
                src="/brand/logo/lostiq-mark.webp"
                alt="LostIQ"
                width={28}
                height={28}
              />
            </div>
            <span className="font-black text-2xl tracking-tighter text-white">
              Lost<span className="bg-[#FF6B6B] text-white px-1.5 py-0.5 border border-white ml-1">IQ</span>
            </span>
          </div>
          <p className="text-base font-black text-white max-w-md">
            Lost it. Found it. Matched by AI.
          </p>
          <p className="text-xs font-bold text-gray-400 max-w-md">
            Intelligent campus lost &amp; found engineered for faster recovery and community reunions.
          </p>
        </div>

        {/* Navigation Links (3 Cols) */}
        <div className="md:col-span-3 space-y-2">
          <h4 className="font-black text-xs uppercase tracking-widest text-[#FFD93D] border-b-2 border-white/40 pb-1">
            NAVIGATION
          </h4>
          <ul className="space-y-2 text-xs font-bold">
            <li>
              <Link href="/reports" className="hover:text-[#FFD93D] transition-colors">
                EXPLORE DIRECTORY
              </Link>
            </li>
            <li>
              <Link href="/report/lost" className="hover:text-[#FF6B6B] transition-colors">
                REPORT LOST VALUABLE
              </Link>
            </li>
            <li>
              <Link href="/report/found" className="hover:text-[#FFD93D] transition-colors">
                REPORT FOUND ITEM
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-[#C4B5FD] transition-colors">
                CONTROL DESK
              </Link>
            </li>
          </ul>
        </div>

        {/* Product Mission Statement (3 Cols) */}
        <div className="md:col-span-3 space-y-2">
          <h4 className="font-black text-xs uppercase tracking-widest text-[#C4B5FD] border-b-2 border-white/40 pb-1">
            LOSTIQ
          </h4>
          <p className="text-xs font-bold text-gray-300 leading-relaxed">
            Built for safer, smarter campus recovery across student centers, libraries, and academic complexes.
          </p>
        </div>

      </div>

      {/* Bottom Copyright Bar */}
      <div className="container mx-auto max-w-7xl border-t-2 border-white/20 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-gray-400">
        <p>© {new Date().getFullYear()} LostIQ. Intelligent Lost &amp; Found.</p>
        <p>Built for Campus Recovery.</p>
      </div>
    </footer>
  );
}
