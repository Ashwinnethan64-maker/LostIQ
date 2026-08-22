# CampusFind AI — System Architecture & Component Design

- **Document Version:** 1.0.0
- **Path:** `/docs/ARCHITECTURE.md`
- **Status:** Official Technical Architecture Reference

---

# 1. High-Level Architectural Flow

```text
                  ┌─────────────────────────────────────┐
                  │       Next.js 14 Web Frontend      │
                  │ (TypeScript + Tailwind + shadcn/ui) │
                  └──────────────────┬──────────────────┘
                                     │
                                     ▼
                  ┌─────────────────────────────────────┐
                  │      Route Handlers & Server API    │
                  │  (Zod Validation + Auth Middleware) │
                  └──────────────────┬──────────────────┘
                                     │
                 ┌───────────────────┼───────────────────┐
                 │                   │                   │
                 ▼                   ▼                   ▼
      ┌─────────────────────┐┌───────────────┐┌─────────────────────┐
      │  AIAnalysisService  ││MatchingEngine ││ searchAndRankReports│
      │ (@google/genai API) ││ (Multi-Signal)││  (Natural Language) │
      └──────────┬──────────┘└───────┬───────┘└──────────┬──────────┘
                 │                   │                   │
                 └───────────────────┼───────────────────┘
                                     │
                 ┌───────────────────┼───────────────────┐
                 │                   │                   │
                 ▼                   ▼                   ▼
      ┌─────────────────────┐┌───────────────┐┌─────────────────────┐
      │Firebase Auth (OAuth)││Cloud Firestore││  Firebase Storage   │
      └─────────────────────┘└───────────────┘└─────────────────────┘
```

---

# 2. Key Service Layers

### 1. `AIAnalysisService` (`src/lib/ai/ai-analysis.service.ts`)
- Calls Google Gemini 1.5 Flash via `@google/generative-ai`.
- Enforces strict JSON output schema.
- Extracts `objectType`, `brand`, `dominantColor`, `attributes`, `keywords`, and `summary`.
- Provides heuristic fallback parsing when offline or rate-limited.

### 2. `MatchingEngine` (`src/lib/matching/engine.ts`)
- UI-agnostic matching engine evaluating opposite-type candidate reports.
- Computes normalized scores across visual, semantic, location, temporal, and category dimensions.
- Generates evidence-backed explanations from computed overlap metrics.

### 3. `searchAndRankReports` (`src/lib/search/search-engine.ts`)
- Multi-token natural language and keyword scoring engine.
- Filters by report type (`LOST`/`FOUND`), category, campus zone, and status.

### 4. `Firestore & Storage Layer` (`src/lib/firebase/`)
- Universal data access layer supporting Firebase Cloud Firestore and local data fallback.
- Validates 5MB upload limits and MIME constraints (`image/jpeg`, `image/png`, `image/webp`).
