# Product Requirements Document (PRD)

## Project Overview
- **App Name:** LostIQ
- **Tagline:** Intelligent Lost & Found
- **Repository Path:** `/docs/PRD.md`
- **Version:** 1.0.0
- **Status:** Active / Source of Truth

---

## 1. Executive Summary & Core Problem
Students, faculty, and campus staff regularly lose valuable items (e.g., student IDs, wireless earbuds, laptops, water bottles, keys, backpacks). Recovering these items through traditional campus lost-and-found boards or physical desks is notoriously inefficient because:
1. **Disparate Terminology:** One student calls an item a "black laptop sleeve" while the finder reports a "dark gray Dell case".
2. **Incomplete Information:** Reports often omit brand names, key tags, or exact timestamps.
3. **Information Asymmetry & Manual Overload:** Users must manually comb through hundreds of text posts or physical ledgers across multiple buildings.

**CampusFind AI** solves this by uniting multimodal visual AI understanding, structured attribute extraction, spatio-temporal filtering, and an explainable multi-signal matching engine that actively connects lost and found reports automatically.

---

## 2. Target Personas & Use Cases

### 2.1 The Student (Owner / Loser)
- **Profile:** A student who misplaced their personal property (e.g., left headphones at the central library).
- **Core Need:** Quickly file a "LOST" report with an optional photo, description, time, and location; immediately receive ranked, AI-analyzed candidate "FOUND" reports with clear match explanations rather than manually searching.
- **Key Flow:** Report Lost Item $\rightarrow$ AI Auto-Tagging & Visual Analysis $\rightarrow$ Ranked Match Feed $\rightarrow$ View Match Breakdown $\rightarrow$ Initiate Secure Recovery/Claim.

### 2.2 The Finder (Good Samaritan / Campus Staff)
- **Profile:** A student, lecturer, or janitorial staff member who discovers an unattended item.
- **Core Need:** Snap a photo of the item, select the campus location, add a brief note, and submit a "FOUND" report.
- **Key Flow:** Report Found Item $\rightarrow$ AI Visual Identification $\rightarrow$ Instant candidate check for existing "LOST" reports $\rightarrow$ Notify/Connect safely.

### 2.3 Campus Administrator / Security Desk
- **Profile:** Campus help desk, security officer, or student affairs admin.
- **Core Need:** Oversee reports, verify claims, resolve recovered items, moderate spam, and view recovery metrics.

---

## 3. Core Value Proposition
Rather than serving as a passive digital bulletin board, CampusFind AI acts as an **active matchmaking intelligence engine**:
- **Multimodal Image Understanding:** Extracts color, brand, model, condition, shape, and unique identifying marks.
- **Semantic Understanding:** Matches intent and descriptive synonyms across disparate phrasing.
- **Spatio-Temporal Proximity:** Weighs campus geographic zones and chronological validity (e.g., item cannot be found before it was lost).
- **Explainable Match Scoring:** Every recommendation provides a transparent breakdown across visual, semantic, location, time, and category dimensions.

---

## 4. Feature Requirements

### 4.1 MUST-HAVE Features (P0 - Core Hackathon Scope)

| Feature Area | Requirements | Acceptance Criteria |
| :--- | :--- | :--- |
| **Authentication & Sessions** | • Google Sign-In & persistent auth state.<br>• Protected application routes & API endpoints.<br>• Secure token verification server-side.<br>• User profile session state & safe logout. | Unauthorized users cannot access private recovery flows or submit forged user IDs. |
| **Report Submission** | • Support both **LOST** and **FOUND** reports.<br>• Image upload with preview & MIME validation.<br>• Mandatory fields: Title, Category, Location, Date, Time, Description.<br>• Optional fields: Distinguishing features, serial numbers / identifiers. | Reports are validated via strict schema and persisted with timestamps and user ownership. |
| **AI Multimodal Item Analysis** | • Analyze uploaded photo & text via Gemini Vision/Multimodal.<br>• Extract structured attributes: Object Type, Category, Dominant Colors, Brand, Shape, Visible Features, Keywords, Semantic Summary.<br>• Persist structured AI metadata on the report record.<br>• Do not repeat AI calls on static report reads. | AI output is cleanly parsed into structured JSON and stored to avoid redundant token costs. |
| **Candidate Retrieval & Matching** | • For a LOST report, retrieve candidate FOUND reports (and vice versa).<br>• Filter out invalid candidates (e.g., item found months prior to lost date).<br>• Compute similarity across 5 core signals:<br>&nbsp;&nbsp;1. Visual/Image Similarity (0-100)<br>&nbsp;&nbsp;2. Text/Description Semantic Similarity (0-100)<br>&nbsp;&nbsp;3. Category Exact/Sub-category Match (0-100)<br>&nbsp;&nbsp;4. Campus Location Proximity (0-100)<br>&nbsp;&nbsp;5. Date & Time Window Consistency (0-100) | Deterministic candidate selection + weighted multi-signal algorithm producing an overall score (0-100%). |
| **Explainable Match Breakdown** | • Display overall match percentage.<br>• Display visual, descriptive, location, and temporal signal scores.<br>• Generate a human-readable justification explaining *why* the reports match (e.g., *"Both describe a navy-blue Hydro Flask with a mountain sticker found near Science Hall within 2 hours of being lost"*).<br>• No hardcoded or manufactured scores. | Match explanation directly reflects the underlying signal values and extracted traits. |
| **Discovery & Search** | • Keyword search over title, description, and AI-extracted tags.<br>• Multi-faceted filtering by type (`LOST` / `FOUND`), category, campus zone/building, date range, and status (`ACTIVE`, `RESOLVED`, `CLAIMED`).<br>• Results sorted by relevance or recency. | Search responds rapidly with paginated/bounded datasets. |
| **Report Details View** | • Showcase full report details, image gallery, structured AI tags, and matched candidates tab.<br>• Live comparison viewer between lost and found items. | Clean, accessible UI displaying both user-entered and AI-derived metadata. |
| **Safe Contact / Recovery Action** | • Controlled claim initiation preventing identity leakage.<br>• Verification question / proof-of-ownership prompt.<br>• Status transition (`OPEN` $\rightarrow$ `MATCHED` $\rightarrow$ `CLAIM_PENDING` $\rightarrow$ `RESOLVED`). | Owners can securely request item recovery without exposing personal telephone or email publicly. |

---

### 4.2 Nice-To-Have Features (P1 - Implemented after P0 is verified)
1. **Interactive Campus Map:** Visual pin mapping of lost and found spots across campus zones.
2. **Instant Pre-submission AI Auto-tagger:** As the user uploads a photo, AI automatically suggests category and title.
3. **Claim Review Workflow:** In-app claim approval/rejection modal for finders and admins.
4. **Activity & Audit Timeline:** Chronological history of matches, claims, and status updates for each item.
5. **Admin Moderation Portal:** Dashboard to mark duplicates, flag spam, or mark items handed to Campus Security.

---

### 4.3 Out of Scope for V1
- Blockchain / Web3 proof-of-ownership.
- Complex peer-to-peer real-time video chat.
- Multi-campus federation or off-campus geographical routing.
- Financial rewards, bounty escrow, or payment processing.
- 3D spatial scanning / AR object placement.

---

## 5. Multi-Signal Match Scoring Specification

$$\text{FinalScore} = (w_v \times S_{\text{visual}}) + (w_d \times S_{\text{description}}) + (w_c \times S_{\text{category}}) + (w_l \times S_{\text{location}}) + (w_t \times S_{\text{time}})$$

### Signal Weights ($w$):
- **Visual Similarity ($w_v = 0.35$):** Extracted features, colors, shape, brand logos, tags.
- **Description / Semantic ($w_d = 0.25$):** Keyword overlap, synonyms, distinguishing features.
- **Category Compatibility ($w_c = 0.15$):** Exact match = 100, compatible parent/child = 70, mismatch = 0.
- **Location Proximity ($w_l = 0.15$):** Same building = 100, same campus quadrant/zone = 75, adjacent zone = 50, disparate = 20.
- **Temporal Consistency ($w_t = 0.10$):** Found 0-24h after lost = 100, 1-3 days = 85, 4-7 days = 60, found before lost = 0 (disqualification/penalty).

---

## 6. End-to-End Success Criteria & Verification Matrix

| Step | Action | Expected System Behavior | Success Verification |
| :---: | :--- | :--- | :--- |
| **1** | User logs in & uploads lost-item photo. | System previews image, validates MIME/size, and preps form. | Image successfully accepted ($\le 5\text{MB}$, JPEG/PNG/WebP). |
| **2** | User inputs description, location, date/time, and submits. | Record saved; async AI pipeline triggered. | Report persisted with `ACTIVE` status. |
| **3** | AI Multimodal Analysis runs. | Gemini analyzes visual + text data; extracts structured JSON attributes. | AI attributes stored on document; no runtime crash. |
| **4** | Candidate Retrieval runs. | Queries opposite-type active reports in database. | Bounded candidate set retrieved efficiently. |
| **5** | Multi-Signal Scoring calculates matches. | Generates scores for visual, text, category, location, time, plus weighted total. | Dynamic scores calculated; zero hardcoded values. |
| **6** | Human-Readable Explanation generated. | Clear explanation synthesized detailing matching traits. | Formatted rationale shown in UI. |
| **7** | User views Ranked Matches. | Ranked candidates list rendered with match score badges and comparison modal. | Items sorted from highest to lowest confidence. |
| **8** | Claim / Recovery flow executed. | User initiates claim; proof-of-ownership prompt handled safely. | Safe contact initiated; state transitioned correctly. |
