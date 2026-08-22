# CampusFind AI — Multi-Signal Matching Logic & Scoring Specification

- **Document Version:** 1.0.0
- **Path:** `/docs/MATCHING_LOGIC.md`
- **Status:** Official Matching Specification

---

# 1. Matching Formula & Weights

The overall match confidence is computed as a normalized weighted composite score:

$$\text{OverallScore} = (w_v \times S_v) + (w_s \times S_s) + (w_l \times S_l) + (w_t \times S_t) + (w_c \times S_c)$$

| Signal Dimension | Variable | Default Weight | Range | Evaluation Method |
| :--- | :---: | :---: | :---: | :--- |
| **Visual / Attribute Similarity** | $S_v$ | **40%** (`0.40`) | 0 – 100 | Image presence, dominant color match, brand alignment, and physical attribute overlap. |
| **Semantic / Description Overlap** | $S_s$ | **25%** (`0.25`) | 0 – 100 | Jaccard word token similarity across title, description, and AI keywords. |
| **Campus Location Proximity** | $S_l$ | **20%** (`0.20`) | 0 – 100 | Campus zone equality ($85-100$), room/building text overlap ($75$), or disparate area ($30$). |
| **Temporal Consistency Window** | $S_t$ | **10%** (`0.10`) | 0 – 100 | Hours difference ($0-4\text{h} \rightarrow 100$, $4-24\text{h} \rightarrow 90$, $1-3\text{d} \rightarrow 75$, $>1\text{w} \rightarrow 40$). Penalty if found long before lost. |
| **Category Compatibility** | $S_c$ | **5%** (`0.05`) | 0 – 100 | Exact category match ($100$), compatible parent/child ($60$), or disparate ($15$). |

---

# 2. Transparent Explainability Builder

Every match candidate displays a synthesized reason derived directly from signal metrics:
- **Object Type**: Identifies common category or object noun.
- **Hardware & Brand**: Flags brand match (e.g. *Sony*, *Apple*, *Hydro Flask*).
- **Color Profile**: Highlights matching dominant color.
- **Location Zone**: Cites specific campus area.
- **Time Horizon**: Highlights chronological closeness.

Zero manufactured or hardcoded strings are used.
