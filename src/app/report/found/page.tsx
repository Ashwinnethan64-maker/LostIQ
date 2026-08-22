import { ReportForm } from "@/components/reports/ReportForm";
import { RouteGuard } from "@/lib/auth/RouteGuard";
import { PlusCircle } from "lucide-react";

export default function ReportFoundPage() {
  return (
    <RouteGuard>
      <div className="max-w-4xl mx-auto space-y-6 py-4">
        
        {/* Editorial Poster Header (Helpful Cyber Yellow & Violet Theme) */}
        <div className="border-8 border-black bg-[#FFD93D] text-black p-6 sm:p-10 shadow-neo-lg space-y-2">
          <div className="inline-flex items-center gap-2 border-3 border-black bg-[#C4B5FD] text-black px-3 py-1 text-xs font-black uppercase shadow-neo-sm">
            <PlusCircle className="h-4 w-4" />
            <span>COMMUNITY RECOVERY &amp; RETURN</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter uppercase leading-none text-black">
            FOUND <span className="bg-black text-white px-2 py-0.5 inline-block -rotate-1">SOMETHING?</span>
          </h1>
          <p className="font-bold text-sm sm:text-base text-black/90 max-w-xl">
            Help reconnect this item with its owner by reporting where and when you found it.
          </p>
        </div>

        <ReportForm initialType="FOUND" />
      </div>
    </RouteGuard>
  );
}
