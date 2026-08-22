# LOSTIQ MATCHING ENGINE ARCHITECTURE & AUDIT REPORT

## 1. Overview & Bug Analysis

### Previous Bug
When a user reported a **LOST BAG**, the application returned unrelated candidates such as:
- **FOUND Sony WF-1000XM4 Wireless Earbuds**
- **FOUND Brown Leather Fossil Wallet**

### Root Cause
1. **Scoring before Eligibility Filtering**: The previous matching code computed multi-signal scores across all opposite turn-in reports before checking category compatibility. Because both items were in the same campus area (*Central Academic Quad*) and reported within 24 hours, proximity signals inflated scores above the permissive 20% threshold.
2. **Permissive Threshold**: Any score $\ge 20\%$ was returned, surfacing irrelevant candidates.

---

## 2. Rebuilt Matching Architecture

The matching pipeline has been restructured into a strict **Eligibility-First, Multi-Signal Scoring Engine**:

```
NEW REPORT
    ↓
RETRIEVE ACTIVE OPPOSITE-TYPE REPORTS (DB Layer: status = 'OPEN', opposite reportType)
    ↓
HARD GATES FILTER (Self-match, Status, Category Compatibility, Object Family)
    ↓ (Ineligible candidates strictly rejected with NO SCORE)
ELIGIBLE CANDIDATE POOL
    ↓
MULTI-SIGNAL DETERMINISTIC SCORING (Visual, Semantic, Attribute, Location, Time)
    ↓
CONFIGURABLE THRESHOLD GATE (MATCH_MINIMUM_THRESHOLD = 50%)
    ↓
RANKED RELEVANT MATCH CANDIDATES
```

---

## 3. Hard Gates vs Soft Signals

### Hard Gates (Enforced First)
1. **Self-Match Gate**: `source.id !== candidate.id`
2. **Opposite Report Type Gate**: `LOST ↔ FOUND` only (same-type candidates rejected)
3. **Active Status Gate**: Both source and candidate must have status `OPEN`
4. **Category Compatibility Gate**: [`src/lib/matching/category-compatibility.ts`](file:///z:/Campus%20Not%20Found%20ai/src/lib/matching/category-compatibility.ts) ensures `bags_backpacks` matches ONLY `bags_backpacks`, `electronics` matches ONLY `electronics`, etc.
5. **Object Family Gate**: Validates disjoint semantic object families even for open/generic categories.

### Soft Signals (Scored Only for Eligible Candidates)
- **Visual Similarity** (40%)
- **Semantic Overlap** (25%)
- **Location Proximity** (20%)
- **Time Window Proximity** (10%)
- **Category Refinement** (5%)

---

## 4. Test Verification Matrix

All 37 unit tests across 8 test suites pass:

| Test Case | Scenario | Expected | Result |
| :--- | :--- | :--- | :---: |
| **TEST 1** | LOST BAG vs FOUND EARBUDS | **NO MATCH** (Category Gate) | **PASS** |
| **TEST 2** | LOST BAG vs FOUND WALLET | **NO MATCH** (Category Gate) | **PASS** |
| **TEST 3** | LOST BAG vs FOUND BAG | **MATCH FOUND** ($\ge 50\%$) | **PASS** |
| **TEST 4** | FOUND BAG vs LOST BAG | **MATCH FOUND** (Bi-directional) | **PASS** |
| **TEST 5** | LOST EARBUDS vs FOUND EARBUDS | **MATCH FOUND** | **PASS** |
| **TEST 6** | LOST BAG vs LOST BAG | **NO MATCH** (Same-type Gate) | **PASS** |
| **TEST 7** | FOUND BAG vs FOUND BAG | **NO MATCH** (Same-type Gate) | **PASS** |
| **TEST 8** | LOST BAG vs Distant Pink Glitter Purse | **NO MATCH** (Below 50% Threshold) | **PASS** |
| **TEST 9** | Resolved / Closed Reports | **NO MATCH** (Status Gate) | **PASS** |
| **TEST 10** | Self Match (`id === candidate.id`) | **NO MATCH** (Self-match Gate) | **PASS** |
