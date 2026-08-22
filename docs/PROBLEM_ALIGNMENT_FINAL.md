# LOSTIQ — PROBLEM STATEMENT ALIGNMENT & VERIFICATION MATRIX

> **Hack2Skill Problem Statement**: Campus Intelligent Lost & Found Platform with Multimodal AI Recognition & Deterministic Multi-Signal Matching  
> **Evaluation Status**: 100% COMPLETE & VERIFIED

---

## 1. Requirement-to-Implementation Matrix

| # | Hack2Skill Requirement | UI Component | API Route | Core Service | Database / Schema | Automated Test Proof |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Lost Item Reporting** | `src/app/report/lost/page.tsx`<br>`ReportForm.tsx` (Hot Red Theme) | `POST /api/reports/create` | `reportRepository.ts`<br>`aiAnalysisService.ts` | `public.reports`<br>`report_type = 'LOST'` | `tests/unit/validation.test.ts`<br>`tests/unit/e2e-pipeline.test.ts` |
| **2** | **Found Item Reporting** | `src/app/report/found/page.tsx`<br>`ReportForm.tsx` (Cyber Yellow Theme) | `POST /api/reports/create` | `reportRepository.ts`<br>`aiAnalysisService.ts` | `public.reports`<br>`report_type = 'FOUND'` | `tests/unit/validation.test.ts`<br>`tests/unit/e2e-pipeline.test.ts` |
| **3** | **Photo Upload & Downscale** | `ReportForm.tsx` (Section 02)<br>Instant Client-Side Preview | Client Direct Upload + DataURL Fallback | `src/lib/firebase/storage.ts`<br>`optimizeImageClientSide()` | `image_url` attribute in PostgreSQL | `tests/unit/storage-validation.test.ts` |
| **4** | **Location & Campus Zones** | `ReportForm.tsx` (Section 04)<br>Zone dropdown + Room input | `POST /api/reports/create` | `MatchingEngine.calculateLocationScore()` | `location` JSON column (`name`, `zone`) | `tests/unit/matching-engine.test.ts` |
| **5** | **Date & Temporal Window** | `ReportForm.tsx` (Section 04)<br>Date/Time Pickers | `POST /api/reports/create` | `MatchingEngine.calculateTimeScore()` | `reported_at` ISO Timestamp | `tests/unit/matching-edge-cases.test.ts` |
| **6** | **Gemini Multimodal AI** | Dossier AI Attribute Card (`src/app/reports/[id]/page.tsx`) | `POST /api/reports/create` | `src/lib/ai/ai-analysis.service.ts` | `ai` structured JSON column | `tests/unit/ai-analysis.test.ts` |
| **7** | **Deterministic Matching** | Match Candidate Feed (`src/app/reports/[id]/page.tsx`) | `GET /api/reports/[id]/matches` | `src/lib/matching/engine.ts` (6 Signals) | Indexed candidate querying | `tests/unit/matching-engine.test.ts`<br>`tests/unit/matching-edge-cases.test.ts` |
| **8** | **Transparent Confidence Scores** | `MatchBadge.tsx`<br>`MatchScoreBar.tsx` | `GET /api/reports/[id]/matches` | `MatchingEngine.compareReports()` | `MatchScores` composite | `tests/unit/matching-engine.test.ts` |
| **9** | **Evidence-Backed AI Explanations** | Dossier Why-Matches Card (`src/app/reports/[id]/page.tsx`) | `GET /api/reports/[id]/matches` | `MatchingEngine.generateExplanation()` | `explanation` text property | `tests/unit/e2e-pipeline.test.ts` |
| **10** | **Search & Real-time Discovery** | `src/app/reports/page.tsx`<br>(Live Keyword & Zone Filters) | `GET /api/search`<br>`GET /api/reports` | `src/lib/search/search-engine.ts` | PostgreSQL Full-text & Metadata scan | `tests/unit/search.test.ts` |
| **11** | **Ownership & Recovery Claims** | `ClaimModal.tsx` (`src/components/claims/ClaimModal.tsx`) | `POST /api/claims/create` | `src/app/api/claims/create/route.ts` | `public.claims` table | `tests/unit/security-auth.test.ts` |

---

## 2. Deterministic 6-Signal Math Verification

LostIQ employs a purely mathematical scoring model without non-deterministic hallucinations:

$$\text{Overall Match Score} = \sum_{i=1}^{5} w_i \cdot S_i$$

Where:
- $w_{\text{visual}} = 0.40$: Multimodal visual similarity and extracted attributes (Brand, Color, Hardware form factor)
- $w_{\text{semantic}} = 0.25$: Jaccard token overlap between item titles, distinguishing features, and Gemini keywords
- $w_{\text{location}} = 0.20$: Campus zone equivalence and spatial sub-area proximity
- $w_{\text{time}} = 0.10$: Temporal decay and causal validation (penalizes items turned in prior to reported loss)
- $w_{\text{category}} = 0.05$: Hard taxonomic classification match
