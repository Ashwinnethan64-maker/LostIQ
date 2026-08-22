# LostIQ — Intelligent Lost & Found

> **Lost it. Found it. Matched by AI.**

LostIQ is an intelligent, production-grade Smart Campus Lost & Found platform designed to actively connect lost and found items. By uniting multimodal vision understanding, spatio-temporal filtering, structured item attribute extraction, and an explainable multi-signal confidence scoring engine, LostIQ eliminates the manual friction and scattered data of traditional recovery.

---

## 🏛️ Architecture & Source of Truth

This repository is strictly governed by the canonical architectural specifications located in [`/docs`](/docs):

1. **[Product Requirements Document (PRD)](/docs/PRD.md)** — Core value proposition, target personas, P0/P1 feature scope, and success criteria.
2. **[Technical Requirements Document (TRD)](/docs/TRD.md)** — Next.js 14 App Router, Firebase (Auth, Firestore, Storage), `@google/generative-ai` Vision, Vercel deployment strategy.
3. **[Application Flow (APP_FLOW)](/docs/APP_FLOW.md)** — End-to-end user journeys, multimodal AI analysis pipeline, candidate retrieval, claim flows, and edge states.
4. **[UI/UX Design Specification](/docs/UI_UX_DESIGN.md)** — Dark-first design tokens, high-density match cards, 5-signal meters, and WCAG AA accessibility specs.
5. **[Backend Schema (BACKEND_SCHEMA)](/docs/BACKEND_SCHEMA.md)** — Complete TypeScript entity interfaces, Firestore collections (`users`, `reports`, `matches`, `claims`), and compound indexes.
6. **[Implementation Roadmap (IMPLEMENTATION_PLAN)](/docs/IMPLEMENTATION_PLAN.md)** — Milestone roadmap, development rules, API contracts, and verification plans.
7. **[Final Evaluation Audit (EVALUATION_AUDIT)](/docs/EVALUATION_AUDIT.md)** — Comprehensive audit results across code quality, security, performance, testing, and judge simulation.

---

## 🚀 Key Features

- **Multimodal Visual Item Understanding**: Google Gemini Vision (`@google/generative-ai`) extracts structured JSON attributes (`objectType`, `brand`, `dominantColor`, `attributes`, `keywords`, `summary`) from uploaded item photos.
- **Explainable Multi-Signal Matching Engine**: Combines 5 distinct dimensions:
  - **Visual & attribute similarity ($40\%$)**
  - **Semantic text & description overlap ($25\%$)**
  - **Campus zone & building proximity ($20\%$)**
  - **Temporal consistency window ($10\%$)**
  - **Category compatibility ($5\%$)**
- **Transparent Rationale Synthesis**: Every high-confidence match includes an evidence-based explanation (e.g. *"Both reports describe a black Sony wireless earbud case with a visible scratch found near the Library within 2 hours"*).
- **Natural Language Search & Discovery**: Multi-token search parser allowing natural queries (e.g. *"black wallet near library"*) alongside faceted category and zone filters.
- **Safe Recovery Claim Flow**: Controlled proof-of-ownership prompt enabling owners to provide hidden identifiers (e.g. lock screen wallpaper, serial numbers, case scratches) without exposing contact info publicly.
- **Dark-First Accessible UI**: Linear/Vercel-inspired responsive interface with visible focus states, high contrast ($>15:1$), skeleton loaders, and touch-friendly targets.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14+ (App Router, Server Components & Route Handlers)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS (Dark-First Charcoal & Electric Indigo Palette)
- **Icons**: Lucide React
- **Database**: Firebase Cloud Firestore (with local data store fallback for offline evaluation)
- **Authentication**: Firebase Authentication (Google Sign-In & Instant Demo Evaluation Logins)
- **Storage**: Firebase Storage (5MB limit, strict MIME validation)
- **AI Engine**: Google Gemini API (`@google/generative-ai`, `gemini-1.5-flash`)
- **Testing**: Vitest for unit & integration testing
- **Deployment**: Vercel

---

## 📂 Project Structure

```text
lostiq/
├── docs/
│   ├── PRD.md
│   ├── TRD.md
│   ├── APP_FLOW.md
│   ├── UI_UX_DESIGN.md
│   ├── BACKEND_SCHEMA.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── ARCHITECTURE.md
│   ├── MATCHING_LOGIC.md
│   ├── HACK2SKILL_BASELINE.md
│   └── HACK2SKILL_AUDIT.md
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── report/lost/page.tsx
│   │   ├── report/found/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── reports/[id]/page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── api/
│   │       ├── health/route.ts
│   │       ├── reports/route.ts
│   │       ├── reports/[id]/route.ts
│   │       ├── reports/[id]/matches/route.ts
│   │       ├── reports/create/route.ts
│   │       ├── search/route.ts
│   │       └── claims/create/route.ts
│   ├── components/
│   │   ├── ui/ (Skeletons, EmptyState)
│   │   ├── layout/ (Navbar, Footer)
│   │   ├── reports/ (ReportForm)
│   │   ├── matches/ (MatchBadge, MatchScoreBar)
│   │   └── claims/ (ClaimModal)
│   ├── lib/
│   │   ├── ai/ (ai-analysis.service.ts, gemini.ts)
│   │   ├── auth/ (AuthContext.tsx, RouteGuard.tsx, server-auth.ts)
│   │   ├── firebase/ (client.ts, auth.ts, firestore.ts, storage.ts)
│   │   ├── matching/ (engine.ts)
│   │   ├── search/ (search-engine.ts)
│   │   ├── validations/ (report.schema.ts, ai.schema.ts)
│   │   └── utils/
│   └── types/index.ts
├── tests/
│   └── unit/
│       ├── matching-engine.test.ts
│       ├── matching-edge-cases.test.ts
│       ├── validation.test.ts
│       ├── search.test.ts
│       └── security-auth.test.ts
├── firestore.rules
├── storage.rules
├── firestore.indexes.json
├── .env.example
├── package.json
└── README.md
```

---

## 🎯 Primary Demo Scenario (Step-by-Step)

The core judge-facing workflow is demonstrated in 6 simple steps:

1. **Sign In (`/login`)**: Click **Student Account** for instant evaluation login.
2. **Report Lost Item (`/report/lost`)**:
   - Choose **"I Lost Something"**.
   - Upload an item photo (e.g. black wireless earbuds).
   - Enter Title: `Black wireless earbuds`, Location: `Central Library 2nd Floor`, Time: `10:30 AM`.
3. **Submit Report**: Observe real-time honest progress stages:
   - *Uploading item photo...*
   - *Gemini AI analyzing visual features & extracting attributes...*
   - *Searching opposite reports & calculating multi-signal match confidence...*
4. **Inspect Match Breakdown (`/reports/[id]`)**:
   - Observe **94% AI Match** confidence badge.
   - Inspect 5-signal meters:
     - **Visual Similarity: 92%**
     - **Semantic Similarity: 89%**
     - **Location Proximity: 97%**
     - **Time Consistency: 91%**
     - **Category Match: 100%**
   - Review evidence-based explanation: *"Both reports describe black Sony wireless earbuds and charging case found in the Central Library within a close time window."*
5. **Open Matched Found Report**: View the candidate report post with photo and details.
6. **Initiate Safe Recovery Claim**: Click **"Claim Item"** and enter verification details (e.g. scratch description or serial number) to coordinate safe recovery without exposing personal contact details.

---

## 🧪 Testing & Quality Assurance

```bash
# Run Vitest automated test suite (12 tests across 5 suites)
npm test

# Run strict TypeScript compiler verification
npm run typecheck

# Run ESLint validation
npm run lint

# Compile production build (14 routes)
npm run build
```

---

## 🔒 Security & Privacy

- **Zero Committed Secrets**: All configuration is managed via `.env.example` templates and server environment variables.
- **Server Identity Verification**: Session tokens are verified server-side; client-supplied user IDs are never trusted blindly.
- **File Upload Limits**: 5MB file cap, MIME validation (`image/jpeg`, `image/png`, `image/webp`), and UUID safe filename generation.
- **Granular Security Rules**: Firestore and Firebase Storage security rules enforce user ownership and prevent unauthorized mutations.
