# UI/UX Design Specification

## CampusFind AI — Smart Campus Lost & Found

- **Document Version:** 1.0.0
- **Path:** `/docs/UI_UX_DESIGN.md`
- **Status:** Active Architectural Source of Truth

---

# 1. Visual Direction & Design Philosophy

CampusFind AI delivers a **premium, trustworthy, high-performance, dark-first technology experience** engineered for campus environments.

### Design Principles
- **Inspiration:** The precision of *Linear*, the elegance of *Vercel*, the structured density of *Raycast*, and the functional clarity of *Notion*.
- **Clean & Minimal:** High information density where useful, generous whitespace where needed, zero decorative clutter.
- **Fast & Tactile:** Snappy UI transitions ($<150\text{ms}$), subtle micro-interactions, purposeful feedback.
- **Restrained AI Visuals:** AI features should feel intelligent, transparent, and integral to the product—never like an over-gimmicky particle effect.

---

# 2. Design System & Token Foundation

## 2.1 Color Palette (Dark-First Theme)

```css
:root {
  /* Canvas & Surfaces */
  --bg-primary: #090A0F;        /* Near-black deep charcoal canvas */
  --bg-surface: #12141C;        /* Elevated card & container surface */
  --bg-surface-hover: #1A1D28;  /* Interactive hover surface */
  --bg-overlay: #1F2232;        /* Modals, drawers, and popovers */
  --border-subtle: #26293B;     /* Card & divider borders */
  --border-active: #3D425E;     /* Active, focused, or selected borders */

  /* Text & Content */
  --text-primary: #F8FAFC;      /* Crisp high-contrast near-white */
  --text-secondary: #94A3B8;    /* Muted Slate-400 for metadata & body */
  --text-tertiary: #64748B;     /* Slate-500 for timestamps & hints */

  /* Brand & Accents */
  --primary: #6366F1;           /* Electric Indigo (Primary CTA & Brand) */
  --primary-hover: #4F46E5;     /* Darker Indigo for active states */
  --primary-subtle: rgba(99, 102, 241, 0.12); /* Subtle glow & pill fills */

  --secondary: #06B6D4;         /* Cool Cyan (Secondary indicators) */
  
  /* Semantic Status Colors */
  --success: #10B981;           /* Emerald Green (High confidence match / Resolved) */
  --success-subtle: rgba(16, 185, 129, 0.12);
  
  --warning: #F59E0B;           /* Amber (Medium match / Pending Claim) */
  --warning-subtle: rgba(245, 158, 11, 0.12);
  
  --danger: #EF4444;            /* Crimson Red (Lost item pill / Error / Rejection) */
  --danger-subtle: rgba(239, 68, 68, 0.12);
}
```

## 2.2 Typography Hierarchy
- **Primary Typeface:** `Inter` / `Geist Sans` (Modern sans-serif with tabular numeric figures for clean data alignment).
- **Scale & Weights:**
  - `H1 / Display`: 32px / 2rem, SemiBold (600), Tracking `-0.02em`
  - `H2 / Page Title`: 24px / 1.5rem, SemiBold (600), Tracking `-0.015em`
  - `H3 / Section Title`: 18px / 1.125rem, Medium (500)
  - `Body / Lead`: 15px / 0.9375rem, Regular (400), Leading `1.5`
  - `Caption / Metadata`: 13px / 0.8125rem, Medium (500), Leading `1.3`
  - `Code / Numeric Badges`: 12px / 0.75rem, Mono, SemiBold (600)

---

# 3. Key Component Design Specifications

## 3.1 Match Result Card (`MatchCard`)
The visual centerpiece of CampusFind AI. It must convey the match score, visual proof, and reason at a glance.

```text
┌────────────────────────────────────────────────────────────────────────┐
│ [IMAGE]   Sony WH-1000XM4 Headphones           ┌──────────────────────┐ │
│ 80x80px   Category: Electronics                │   94% MATCH          │ │
│ Rounded   Found at: Central Library (2nd Fl)   │   ● Strong Match     │ │
│           Reported: Today at 2:15 PM           └──────────────────────┘ │
├────────────────────────────────────────────────────────────────────────┤
│ Visual: 92% │ Semantic: 89% │ Location: 97% │ Time: 91% │ Category: 100%│
├────────────────────────────────────────────────────────────────────────┤
│ ✨ WHY THIS MATCHES                                                    │
│ "Both reports describe a black Sony wireless headphone with a visible  │
│  white mark on the left ear cup found near Library within 2 hours."     │
├────────────────────────────────────────────────────────────────────────┤
│ [ View Full Report ]                         [ Initiate Safe Claim -> ] │
└────────────────────────────────────────────────────────────────────────┘
```

## 3.2 AI Status & Match Badges
- **High Match ($\ge 80\%$):** Emerald border, `bg-emerald-950/40 text-emerald-400`, bold score label.
- **Moderate Match ($50\% - 79\%$):** Amber border, `bg-amber-950/40 text-amber-400`.
- **Low Match ($< 50\%$):** Slate border, `bg-slate-900 text-slate-400`.
- **AI Processing State:** Subtle indigo pulsing dot with text *"AI Analyzing Report & Extracting Attributes..."*.

## 3.3 Report Card (`ReportCard`)
- Clean surface card with 1px border (`--border-subtle`).
- Badges for report type:
  - `LOST`: Crimson pill (`bg-red-500/10 text-red-400 border border-red-500/20`)
  - `FOUND`: Cool Emerald pill (`bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`)
- Hover elevation: Slight border brightness increase (`--border-active`) and $2\text{px}$ subtle lift.
- Structured AI tags pill list (e.g. `#black`, `#wireless`, `#sony`, `#matte`).

## 3.4 Upload & Drop Zone (`ImageDropzone`)
- Accessible file input with drag-and-drop support.
- Live thumbnail preview with instant remove/replace actions.
- Supported format pill indicator: `JPEG, PNG, WebP (Max 5MB)`.
- Accessible error toast if invalid file is dropped.

---

# 4. Responsive Layout Strategy

```text
+-------------------------------------------------------------------------+
| Desktop (>= 1024px):                                                    |
| [ Top Navigation Bar (Logo | Search | Reports | Dashboard | User Menu) ]|
| ┌────────────────────────────────────┬────────────────────────────────┐ │
| │ Left Column (60%): Main Report     │ Right Column (40%):            │ │
| │ Details, Photo Gallery, Metadata   │ Ranked AI Matches Feed &       │ │
| │ and Proof Inputs                   │ Match Confidence Breakdown     │ │
| └────────────────────────────────────┴────────────────────────────────┘ │
+-------------------------------------------------------------------------+
| Tablet (768px - 1023px):                                                |
| Stacked 2-Column layout with sticky match summary drawer                |
+-------------------------------------------------------------------------+
| Mobile (< 768px):                                                       |
| Full-width vertical single-column stack. Sticky bottom action bar for   |
| [ Claim / Contact ] and tab toggle between [ Details ] & [ AI Matches ] |
+-------------------------------------------------------------------------+
```

### Mobile Optimization Rules:
- Touch targets must be at least $44 \times 44\text{px}$.
- Bottom navigation or slide-out sheet for mobile filters.
- Image uploads support direct mobile camera capture via standard file inputs.
- Zero loss of functionality: Search, filters, match breakdowns, and claim flows are 100% accessible on mobile.

---

# 5. Accessibility (WCAG 2.1 AA Compliance)

1. **Color Contrast:** All body text meets at least $4.5:1$ contrast ratio against dark backgrounds (`#F8FAFC` on `#090A0F` provides $>15:1$).
2. **Keyboard Navigation:** Full tab order across forms, filters, modals, and report lists with visible focus rings (`ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900`).
3. **Screen Reader Semantics:**
   - ARIA live regions (`aria-live="polite"`) for async AI analysis updates.
   - Distinct labels for image upload zones and dialog close triggers.
   - Descriptive `alt` tags on item photos and match candidate thumbnails.
4. **Form Validation:** Error messages explicitly linked to input fields via `aria-describedby` and `aria-invalid="true"`.
