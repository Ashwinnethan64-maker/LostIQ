"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import { ReportType, ItemCategory } from "@/types";
import { UploadCloud, Sparkles, AlertCircle, ArrowRight, X, Lock, ShieldCheck } from "lucide-react";
import { uploadReportImage, optimizeImageClientSide, validateImageUpload } from "@/lib/firebase/storage";
import { logger } from "@/lib/logger";

interface ReportFormProps {
  initialType: ReportType;
}

const CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: "electronics", label: "📱 ELECTRONICS (HEADPHONES, PHONES, LAPTOPS)" },
  { value: "id_cards", label: "💳 ID CARDS & WALLETS" },
  { value: "keys", label: "🔑 KEYS & KEYCHAINS" },
  { value: "bags_backpacks", label: "🎒 BAGS & BACKPACKS" },
  { value: "bottles_tumblers", label: "🥤 BOTTLES & TUMBLERS" },
  { value: "clothing_apparel", label: "🧥 CLOTHING & JACKETS" },
  { value: "books_stationery", label: "📚 BOOKS & NOTEBOOKS" },
  { value: "jewelry_watches", label: "⌚ JEWELRY & WATCHES" },
  { value: "other", label: "📦 OTHER MISCELLANEOUS" },
];

const COLORS = [
  "Black",
  "White",
  "Blue",
  "Red",
  "Green",
  "Yellow",
  "Brown",
  "Grey",
  "Silver",
  "Gold",
  "Purple",
  "Pink",
  "Orange",
  "Multicolor",
  "Transparent",
  "Other",
  "Unknown",
];

const MATERIALS = [
  "Leather",
  "Plastic",
  "Metal",
  "Fabric",
  "Canvas",
  "Rubber",
  "Wood",
  "Glass",
  "Mixed",
  "Other",
];

const CAMPUS_ZONES = [
  "Central Academic Quad",
  "Central Library & Study Commons",
  "Science & Engineering Complex",
  "Student Center & Dining Hall",
  "Athletics & Recreation Center",
  "North Campus Dormitories",
  "South Campus Dormitories",
  "Campus Bus Transit Stop",
];

export function ReportForm({ initialType }: ReportFormProps) {
  const { user, getFreshToken } = useAuth();
  const router = useRouter();

  const reportType: ReportType = initialType;
  const isLost = reportType === "LOST";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ItemCategory>("electronics");
  
  // Structured manual attributes
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("Black");
  const [material, setMaterial] = useState("Plastic");
  const [distinctiveFeatures, setDistinctiveFeatures] = useState("");
  const [privateOwnershipProof, setPrivateOwnershipProof] = useState("");

  const [locationName, setLocationName] = useState("");
  const [selectedZone, setSelectedZone] = useState(CAMPUS_ZONES[0]);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [reportTime, setReportTime] = useState("10:30");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageSizeFormatted, setImageSizeFormatted] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [submissionStage, setSubmissionStage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      const validation = validateImageUpload({
        type: file.type,
        size: file.size,
        name: file.name,
      });

      if (!validation.valid) {
        setErrorMessage(validation.error || "Invalid image file");
        return;
      }

      setErrorMessage(null);
      setImageFile(file);
      setImageSizeFormatted((file.size / (1024 * 1024)).toFixed(2) + " MB");
      
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageSizeFormatted("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMessage(null);

    if (!title.trim() || !description.trim() || !locationName.trim()) {
      setErrorMessage("Please fill in Title, Description, and Specific Location.");
      return;
    }

    if (isLost && !privateOwnershipProof.trim()) {
      setErrorMessage("Please provide Private Ownership Proof to protect your valuable.");
      return;
    }

    setSubmitting(true);

    try {
      let uploadedImageUrl: string | null = null;
      const tempReportId = `rep-${Date.now()}`;
      const effectiveUserId = user?.id || "demo-student-101";

      if (imageFile) {
        setSubmissionStage("OPTIMIZING & UPLOADING PHOTO...");
        const optimizedBlob = await optimizeImageClientSide(imageFile);
        uploadedImageUrl = await uploadReportImage(
          effectiveUserId,
          tempReportId,
          optimizedBlob,
          imageFile.name
        );
      } else if (imagePreview && imagePreview.startsWith("data:image/")) {
        uploadedImageUrl = imagePreview;
      }

      setSubmissionStage("STORING REPORT & INITIALIZING AI MATCHING...");

      const payload = {
        id: tempReportId,
        reportType,
        userId: effectiveUserId,
        title: title.trim(),
        description: description.trim(),
        category,
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        color: color !== "Unknown" ? color : undefined,
        material: material !== "Other" ? material : undefined,
        distinctiveFeatures: distinctiveFeatures.trim() || undefined,
        privateOwnershipProof: isLost ? privateOwnershipProof.trim() : undefined,
        imageUrl: uploadedImageUrl,
        location: {
          name: locationName.trim(),
          zone: selectedZone,
        },
        reportedAt: `${reportDate}T${reportTime}:00.000Z`,
      };

      const token = await getFreshToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/reports/create", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit report");
      }

      logger.info("Report created successfully with structured attributes & private proof", "ReportForm", { id: data.report.id });
      router.push(`/reports/${data.report.id}`);
    } catch (err: any) {
      logger.error("Submission error", "ReportForm", err);
      setErrorMessage(err.message || "An unexpected error occurred during submission.");
      setSubmitting(false);
    }
  };

  return (
    <div className={`border-8 border-black bg-white shadow-neo-xl overflow-hidden transition-colors ${
      isLost ? "border-t-[#FF6B6B]" : "border-t-[#FFD93D]"
    }`}>
      
      {/* Mode Banner */}
      <div className={`p-4 sm:p-5 border-b-6 border-black font-black text-xs sm:text-sm uppercase flex items-center justify-between gap-3 ${
        isLost ? "bg-[#FF6B6B] text-white" : "bg-[#FFD93D] text-black"
      }`}>
        <div className="flex items-center gap-2">
          <Sparkles className={`h-5 w-5 ${isLost ? "text-white" : "text-black"}`} />
          <span className="tracking-wider">
            {isLost ? "I LOST SOMETHING" : "I FOUND SOMETHING"}
          </span>
        </div>
        <span className={`border-2 border-black px-2.5 py-0.5 text-[11px] font-black uppercase ${
          isLost ? "bg-white text-black" : "bg-black text-white"
        }`}>
          {isLost ? "URGENT RECOVERY MODE" : "COMMUNITY RETURN MODE"}
        </span>
      </div>

      {/* Purpose Banner */}
      <div className={`p-4 sm:p-5 border-b-4 border-black font-black text-xs uppercase flex items-center justify-between gap-3 ${
        isLost ? "bg-[#FF6B6B]/15 text-black" : "bg-[#FFD93D]/30 text-black"
      }`}>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 bg-black inline-block" />
          <span>
            {isLost
              ? "Tell LostIQ what went missing. We will automatically match opposite turn-in reports 24/7."
              : "Help reconnect this item with its owner. We will automatically find matching lost tickets."}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">
        
        {errorMessage && (
          <div className="border-4 border-black bg-[#FF6B6B] text-white p-4 font-black text-xs uppercase flex items-center gap-3 shadow-neo-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SECTION 01: PHOTO */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b-2 border-black pb-1">
            <label className="text-xs font-black uppercase tracking-widest text-black flex items-center gap-2">
              <span className="bg-black text-white px-1.5 py-0.5 text-[10px]">01</span>
              <span>ITEM PHOTO (INSTANT PREVIEW &amp; AI MULTIMODAL PARSING)</span>
            </label>
            <span className="text-[10px] font-black uppercase bg-[#FFD93D] px-2 py-0.5 border-2 border-black">
              MAX 5MB
            </span>
          </div>

          <div className="relative border-4 border-dashed border-black bg-[#FFFDF5] p-5 text-center hover:bg-[#E2E8F0] transition-colors group">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              disabled={submitting}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            />

            {imagePreview ? (
              <div className="space-y-3">
                <div className="relative h-44 max-w-xs mx-auto border-4 border-black bg-white overflow-hidden shadow-neo-sm">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-[#FF6B6B] text-white p-1 border-2 border-black hover:bg-black z-20"
                    title="Remove Photo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs font-black uppercase text-black">
                  <span className="neo-sticker bg-[#FFD93D] text-black">
                    READY ({imageSizeFormatted})
                  </span>
                  <span className="text-[11px] text-black/70">CLICK TO CHANGE PHOTO</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 py-3">
                <div className="h-11 w-11 border-3 border-black bg-white mx-auto flex items-center justify-center shadow-neo-sm group-hover:-translate-y-0.5 transition-transform">
                  <UploadCloud className="h-5 w-5 text-black" />
                </div>
                <div className="font-black text-xs sm:text-sm uppercase">DROP ITEM PHOTO OR CLICK TO BROWSE</div>
                <div className="text-[11px] font-bold text-black/60 uppercase">JPEG, PNG, OR WEBP (CLIENT OPTIMIZED)</div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 02: IDENTIFICATION */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-black pb-1">
            <span className="bg-black text-white px-1.5 py-0.5 text-[10px] font-black">02</span>
            <span className="text-xs font-black uppercase tracking-widest text-black">ITEM IDENTIFICATION</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-black">
                ITEM TITLE / WHAT IS IT? *
              </label>
              <input
                type="text"
                required
                placeholder={isLost ? "E.G. BLACK SONY WF-1000XM4 EARBUDS" : "E.G. SONY WIRELESS EARBUDS IN BLACK CASE"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
                className="neo-input w-full px-4 py-3 text-sm font-black uppercase placeholder:text-black/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-black">
                CATEGORY *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                disabled={submitting}
                className="neo-input w-full px-4 py-3 text-sm font-black uppercase bg-white text-black cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value} className="bg-white text-black">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Structured Attributes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-black">
                BRAND (OPTIONAL)
              </label>
              <input
                type="text"
                placeholder="E.G. SONY, APPLE, CASIO, NIKE"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                disabled={submitting}
                className="neo-input w-full px-3 py-2.5 text-xs font-black uppercase placeholder:text-black/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-black">
                MODEL / PRODUCT NAME
              </label>
              <input
                type="text"
                placeholder="E.G. WF-1000XM4, G-SHOCK"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={submitting}
                className="neo-input w-full px-3 py-2.5 text-xs font-black uppercase placeholder:text-black/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-black">
                PRIMARY COLOR
              </label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={submitting}
                className="neo-input w-full px-3 py-2.5 text-xs font-black uppercase bg-white text-black cursor-pointer"
              >
                {COLORS.map((c) => (
                  <option key={c} value={c}>{c.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-black">
                MATERIAL
              </label>
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                disabled={submitting}
                className="neo-input w-full px-3 py-2.5 text-xs font-black uppercase bg-white text-black cursor-pointer"
              >
                {MATERIALS.map((m) => (
                  <option key={m} value={m}>{m.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 03: LOCATION & TIME */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-black pb-1">
            <span className="bg-black text-white px-1.5 py-0.5 text-[10px] font-black">03</span>
            <span className="text-xs font-black uppercase tracking-widest text-black">CAMPUS LOCATION &amp; TIME</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-black">
                SPECIFIC ROOM / AREA / TABLE *
              </label>
              <input
                type="text"
                required
                placeholder="E.G. 2ND FLOOR STUDY COMMONS TABLE #4"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                disabled={submitting}
                className="neo-input w-full px-4 py-3 text-sm font-black uppercase placeholder:text-black/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-black">
                CAMPUS ZONE *
              </label>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                disabled={submitting}
                className="neo-input w-full px-4 py-3 text-sm font-black uppercase bg-white text-black cursor-pointer"
              >
                {CAMPUS_ZONES.map((zone) => (
                  <option key={zone} value={zone} className="bg-white text-black">
                    {zone}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-black">
                DATE {isLost ? "LOST" : "FOUND"} *
              </label>
              <input
                type="date"
                required
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                disabled={submitting}
                className="neo-input w-full px-4 py-3 text-sm font-black uppercase bg-white text-black"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-black">
                APPROXIMATE TIME *
              </label>
              <input
                type="time"
                required
                value={reportTime}
                onChange={(e) => setReportTime(e.target.value)}
                disabled={submitting}
                className="neo-input w-full px-4 py-3 text-sm font-black uppercase bg-white text-black"
              />
            </div>
          </div>
        </div>

        {/* SECTION 04: DESCRIPTION & PRIVATE OWNERSHIP PROOF */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-black pb-1">
            <span className="bg-black text-white px-1.5 py-0.5 text-[10px] font-black">04</span>
            <label className="text-xs font-black uppercase tracking-widest text-black">
              DISTINGUISHING FEATURES &amp; PRIVATE PROOF *
            </label>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-black">
              PUBLIC DESCRIPTION / SUMMARY *
            </label>
            <textarea
              required
              rows={3}
              placeholder={
                isLost
                  ? "DESCRIBE WHERE YOU LOST IT, GENERAL SITUATION, AND SUMMARY..."
                  : "DESCRIBE WHERE ITEM WAS FOUND AND CURRENT CUSTODY STATE..."
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              className="neo-input w-full px-4 py-3 text-sm font-black uppercase placeholder:text-black/40"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-black">
              VISIBLE DISTINGUISHING FEATURES (OPTIONAL)
            </label>
            <input
              type="text"
              placeholder="E.G. STICKER ON REAR, WEAR ON STRAP..."
              value={distinctiveFeatures}
              onChange={(e) => setDistinctiveFeatures(e.target.value)}
              disabled={submitting}
              className="neo-input w-full px-4 py-2.5 text-xs font-black uppercase placeholder:text-black/40"
            />
          </div>

          {/* Dedicated Zero-Knowledge Private Ownership Proof for LOST reports */}
          {isLost && (
            <div className="border-4 border-black bg-[#FFD93D]/30 p-4 space-y-2 shadow-neo-sm">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-[#FF6B6B]" />
                  <span>PRIVATE OWNERSHIP PROOF (ZERO-KNOWLEDGE VERIFIER) *</span>
                </label>
                <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5">
                  NEVER PUBLIC
                </span>
              </div>
              <p className="text-[11px] font-bold text-black/75">
                🔒 Specify private identifiers (hidden scratch, serial fragment, lockscreen wallpaper, or pocket contents). When recovering your item, you will be asked to confirm these details.
              </p>
              <textarea
                required
                rows={2}
                placeholder="E.G. SMALL SCRATCH NEAR 3 O'CLOCK POSITION, BLUE KEYCHAIN INSIDE FRONT POCKET..."
                value={privateOwnershipProof}
                onChange={(e) => setPrivateOwnershipProof(e.target.value)}
                disabled={submitting}
                className="neo-input w-full px-4 py-2.5 text-xs font-black uppercase placeholder:text-black/40 bg-white"
              />
            </div>
          )}
        </div>

        {/* SECTION 05: SUBMISSION */}
        <div className="space-y-4 pt-4 border-t-4 border-black">
          {submitting && (
            <div className="border-4 border-black bg-[#FFD93D] text-black p-4 space-y-2 shadow-neo-sm">
              <div className="flex items-center gap-2 font-black text-xs uppercase">
                <Sparkles className="h-4 w-4 animate-spin text-black" />
                <span>{submissionStage}</span>
              </div>
              <div className="w-full bg-white border-2 border-black h-2.5 overflow-hidden">
                <div className="bg-[#FF6B6B] h-full w-full animate-marquee" />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={submitting}
              className={`neo-button flex-1 py-4 text-sm sm:text-base font-black border-4 border-black shadow-neo transition-all ${
                isLost
                  ? "bg-[#FF6B6B] text-white hover:bg-[#FF5252]"
                  : "bg-[#FFD93D] text-black hover:bg-[#FCC419]"
              } ${submitting ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {submitting ? (
                "SUBMITTING CASE FILE..."
              ) : (
                <>
                  {isLost ? "SUBMIT LOST ITEM REPORT" : "SUBMIT FOUND ITEM REPORT"}{" "}
                  <ArrowRight className="ml-2 h-5 w-5 inline" />
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
