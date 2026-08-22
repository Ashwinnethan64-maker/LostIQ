import { ReportForm } from "@/components/reports/ReportForm";
import { RouteGuard } from "@/lib/auth/RouteGuard";
import { Search } from "lucide-react";

export default function ReportLostPage() {
  return (
    <RouteGuard>
      <div className="max-w-4xl mx-auto space-y-6 py-4">
        
        {/* Editorial Poster Header (Urgent Hot Red Theme) */}
        <div className="border-8 border-black bg-[#FF6B6B] text-white p-6 sm:p-10 shadow-neo-lg space-y-2">
          <div className="inline-flex items-center gap-2 border-3 border-black bg-white text-black px-3 py-1 text-xs font-black uppercase shadow-neo-sm">
            <Search className="h-4 w-4 text-[#FF6B6B]" />
            <span>URGENT CAMPUS RECOVERY</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter uppercase leading-none text-white">
            REPORT <span className="bg-black text-white px-2 py-0.5 inline-block -rotate-1 border-2 border-white">WHAT</span> YOU LOST.
          </h1>
          <p className="font-bold text-sm sm:text-base text-white/90 max-w-xl">
            Tell LostIQ what went missing and we&apos;ll search active found reports for potential matches.
          </p>
        </div>

        <ReportForm initialType="LOST" />
      </div>
    </RouteGuard>
  );
}
