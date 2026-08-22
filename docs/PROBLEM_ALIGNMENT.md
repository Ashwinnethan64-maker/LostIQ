# LOSTIQ — PROBLEM STATEMENT ALIGNMENT TRACEABILITY

| Requirement | Implementation Feature | Code Location | UI Location | Test Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **Lost Item Reporting** | Photo upload, category selection, campus zone assignment, description. | [`src/components/reports/ReportForm.tsx`](file:///z:/Campus%20Not%20Found%20ai/src/components/reports/ReportForm.tsx) | `/report/lost` | `tests/unit/validation.test.ts` |
| **Found Item Reporting** | Community turn-in flow with separate accent theming and location mapping. | [`src/components/reports/ReportForm.tsx`](file:///z:/Campus%20Not%20Found%20ai/src/components/reports/ReportForm.tsx) | `/report/found` | `tests/unit/validation.test.ts` |
| **Multimodal AI Analysis** | Gemini 1.5 Vision structured attribute extraction (brand, color, object type, tags). | [`src/lib/ai/gemini.ts`](file:///z:/Campus%20Not%20Found%20ai/src/lib/ai/gemini.ts) | `/reports/[id]` | `tests/unit/matching-engine.test.ts` |
| **Deterministic Matching Engine** | 5-signal weighted evaluation (Visual: 40%, Semantic: 25%, Location: 20%, Time: 10%, Category: 5%). | [`src/lib/matching/engine.ts`](file:///z:/Campus%20Not%20Found%20ai/src/lib/matching/engine.ts) | `/reports/[id]` | `tests/unit/matching-engine.test.ts`, `tests/unit/matching-edge-cases.test.ts` |
| **Evidence-Backed Explanations** | Contextual natural language explanations describing WHY two items match. | [`src/lib/matching/engine.ts`](file:///z:/Campus%20Not%20Found%20ai/src/lib/matching/engine.ts) | `/reports/[id]` | `tests/unit/e2e-pipeline.test.ts` |
| **Directory Search & Filtering** | Keyword search, type toggle (LOST/FOUND/ALL), category dropdown, zone filter. | [`src/app/api/search/route.ts`](file:///z:/Campus%20Not%20Found%20ai/src/app/api/search/route.ts) | `/reports` | `tests/unit/search.test.ts` |
| **Proof-of-Ownership Claims** | Hidden verification detail submission for authorized claim processing. | [`src/components/claims/ClaimModal.tsx`](file:///z:/Campus%20Not%20Found%20ai/src/components/claims/ClaimModal.tsx) | `/reports/[id]` modal | `tests/unit/security-auth.test.ts` |
