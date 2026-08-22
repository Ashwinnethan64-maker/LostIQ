import Link from "next/link";
import Image from "next/image";
import { Search, PlusCircle, ArrowRight, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="space-y-16 py-4">
      
      {/* Editorial Hero Section (Asymmetric 65/35 Split) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-8 border-black bg-white p-6 sm:p-10 shadow-neo-xl relative overflow-hidden bg-neo-grid">
        
        {/* Background Decorative Stamp */}
        <div className="absolute -top-6 -right-6 bg-[#FFD93D] text-black font-black text-xs px-8 py-3 border-4 border-black rotate-12 shadow-neo z-10 hidden sm:block">
          ⚡ 94% ACCURATE AI MATCHING
        </div>

        {/* Left Editorial Headline Block (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 border-3 border-black bg-[#C4B5FD] text-black px-3.5 py-1 text-xs font-black uppercase tracking-widest shadow-[3px_3px_0px_#000000]">
            <Sparkles className="h-4 w-4" />
            <span>MULTIMODAL AI CAMPUS RECOVERY</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.95] text-black">
            LOST <span className="text-white bg-black px-2 py-0.5 inline-block -rotate-1 border-2 border-black">IT.</span><br />
            FOUND <span className="text-black bg-[#FFD93D] px-2 py-0.5 inline-block rotate-1 border-4 border-black">IT.</span><br />
            MATCHED BY <span className="text-white bg-[#FF6B6B] px-3 py-0.5 inline-block -rotate-2 border-4 border-black">AI.</span>
          </h1>

          <p className="text-base sm:text-lg font-bold text-black/90 max-w-xl border-l-4 border-black pl-4 py-1">
            LostIQ unites Gemini Vision attribute extraction, spatio-temporal reasoning, and a 5-signal deterministic confidence scoring engine to actively reunite lost items.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/report/lost"
              className="neo-button px-6 py-3.5 text-sm bg-[#FF6B6B] text-white border-4 border-black hover:bg-[#FF5252] shadow-neo"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              REPORT LOST ITEM
            </Link>
            <Link
              href="/report/found"
              className="neo-button px-6 py-3.5 text-sm bg-[#FFD93D] text-black border-4 border-black hover:bg-[#FCC419] shadow-neo"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              I FOUND SOMETHING
            </Link>
            <Link
              href="/reports"
              className="neo-button px-5 py-3.5 text-sm bg-white text-black border-4 border-black hover:bg-[#E2E8F0] shadow-neo"
            >
              <Search className="mr-2 h-5 w-5" />
              EXPLORE FEED
            </Link>
          </div>
        </div>

        {/* Right Live Simulation Match Card (5 Cols) */}
        <div className="lg:col-span-5 border-4 border-black bg-[#FFFDF5] p-6 shadow-neo rotate-1 hover:rotate-0 transition-transform">
          <div className="border-b-4 border-black pb-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-[#FF6B6B] border-2 border-black" />
              <span className="font-black text-xs uppercase tracking-widest text-black">LIVE AI MATCH CARD</span>
            </div>
            <span className="neo-sticker bg-[#FFD93D] text-black">94% CONFIDENCE</span>
          </div>

          <div className="space-y-4">
            <div className="border-3 border-black bg-white p-3 shadow-neo-sm">
              <div className="text-xs font-black text-[#FF6B6B] uppercase">LOST REPORT #849</div>
              <div className="font-black text-sm text-black">Black Sony WF-1000XM4 Wireless Earbuds</div>
              <div className="text-xs font-bold text-black/70">Central Library 2nd Floor • 10:30 AM</div>
            </div>

            <div className="text-center font-black text-xs uppercase py-1 bg-black text-white border-2 border-black">
              ⚡ 5-SIGNAL AI SYNTHESIS MATCH
            </div>

            <div className="border-3 border-black bg-white p-3 shadow-neo-sm">
              <div className="text-xs font-black text-[#FFD93D] uppercase">FOUND CANDIDATE #201</div>
              <div className="font-black text-sm text-black">Sony Earbuds Charging Case (Scratch on Lid)</div>
              <div className="text-xs font-bold text-black/70">Library Study Commons • 11:15 AM</div>
            </div>

            {/* Signal Bars */}
            <div className="space-y-1.5 pt-2 text-[11px] font-black">
              <div className="flex justify-between text-black"><span>VISUAL SIMILARITY</span><span>92%</span></div>
              <div className="w-full bg-[#E2E8F0] border-2 border-black h-2.5">
                <div className="bg-[#FF6B6B] h-full border-r-2 border-black" style={{ width: "92%" }} />
              </div>
              <div className="flex justify-between text-black"><span>LOCATION PROXIMITY</span><span>97%</span></div>
              <div className="w-full bg-[#E2E8F0] border-2 border-black h-2.5">
                <div className="bg-[#FFD93D] h-full border-r-2 border-black" style={{ width: "97%" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Physical Workflow Banner */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 bg-black border-2 border-black" />
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-black">
            THE INTELLIGENT RECOVERY PIPELINE
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Step 1 */}
          <div className="neo-card p-6 border-4 border-black bg-white space-y-3">
            <div className="h-12 w-12 border-3 border-black bg-[#FF6B6B] text-white flex items-center justify-center font-black text-2xl shadow-neo-sm">
              01
            </div>
            <h3 className="font-black text-xl tracking-tight text-black">REPORT WITH PHOTO</h3>
            <p className="text-xs sm:text-sm font-bold text-black/80">
              Submit your lost or found valuable. Upload an image, select the campus zone, and add description notes.
            </p>
          </div>

          {/* Step 2 (Issue 1 Fix: 02 badge changed to yellow #FFD93D with black text and border) */}
          <div className="neo-card p-6 border-4 border-black bg-[#FFD93D] text-black space-y-3">
            <div className="h-12 w-12 border-3 border-black bg-[#FFD93D] text-black flex items-center justify-center font-black text-2xl shadow-neo-sm">
              02
            </div>
            <h3 className="font-black text-xl tracking-tight text-black">MULTIMODAL AI PARSING</h3>
            <p className="text-xs sm:text-sm font-bold text-black/80">
              Gemini Vision analyzes the photo to extract brand, dominant color, physical attributes, and keywords into structured JSON.
            </p>
          </div>

          {/* Step 3 */}
          <div className="neo-card p-6 border-4 border-black bg-[#C4B5FD] text-black space-y-3">
            <div className="h-12 w-12 border-3 border-black bg-black text-white flex items-center justify-center font-black text-2xl shadow-neo-sm">
              03
            </div>
            <h3 className="font-black text-xl tracking-tight text-black">5-SIGNAL MATCH & RECOVER</h3>
            <p className="text-xs sm:text-sm font-bold text-black/80">
              Get transparent confidence scores with evidence-backed explanations and initiate safe proof claims.
            </p>
          </div>
        </div>
      </section>

      {/* Callout Action Banner */}
      <section className="border-6 border-black bg-black text-white p-8 sm:p-12 shadow-neo-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#FFD93D]">
            LOST SOMETHING ON CAMPUS TODAY?
          </h3>
          <p className="font-bold text-sm text-gray-300 max-w-xl">
            Don&apos;t wait for lost &amp; found offices to open. LostIQ automatically matches opposite reports 24/7.
          </p>
        </div>
        <Link
          href="/report/lost"
          className="neo-button px-8 py-4 text-base bg-[#FF6B6B] text-white border-4 border-white hover:bg-[#FF5252] shadow-[6px_6px_0px_#FFFFFF] whitespace-nowrap"
        >
          START REPORTING NOW
        </Link>
      </section>

    </div>
  );
}
