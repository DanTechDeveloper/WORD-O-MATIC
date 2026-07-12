---
target: /opt/lampp/htdocs/WordOMatic/my-app/resources/js/Pages/Teacher
total_score: 22
p0_count: 2
p1_count: 2
timestamp: 2026-07-12T22-43-12Z
slug: resources-js-pages-teacher
---
# Critique — Teacher surface (Pages + Components)

## Method
Dual-agent: A: ses_0a7825b31ffeRNDuTMKPYn7mKU · B: ses_0a782553cffek6FPu6H4DbV0u3. Browser visualization skipped (no browser automation); B ran the CLI detector only.

## Design Health Score — 22/40 (Acceptable)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | No loading/skeleton states; dead pages give no "coming soon" signal |
| 2 | Match System / Real World | 2 | Forced arcade jargon ("Fleet Command", "Arsenal") obscures admin tasks |
| 3 | User Control and Freedom | 2 | `window.confirm` delete; no Escape/focus-trap on modals |
| 4 | Consistency and Standards | 1 | Raw slate/lime-400/purple/sky tokens; tactile shadow color drifts per file |
| 5 | Error Prevention | 3 | PIN auto-gen good; delete unguarded |
| 6 | Recognition Rather Than Recall | 2 | Sidebar active = exact URL match, so sub-pages don't highlight nav |
| 7 | Flexibility and Efficiency | 3 | Reports multi-select good; no bulk student actions/shortcuts |
| 8 | Aesthetic and Minimalist | 1 | Emoji content, glassmorphism modals, soft glow shadows (all banned) |
| 9 | Help Recognize/Diagnose Errors | 2 | Errors rendered but tiny `text-[10px]` rose; silent success closes |
| 10 | Help and Documentation | 3 | No inline help; deadline gating discoverable only by trial |
| **Total** | | **22/40** | **Acceptable** |

## Anti-Patterns Verdict
**LLM:** Reads as AI-generated admin scaffolding with a thin arcade skin. Three tells: (1) every surface ignores the named tokens (`accent`, `surface-container-*`, `secondary-container`) and reaches for raw `slate-*`/`lime-400`/`purple-500`/`sky-400`; (2) the tactile shadow color drifts per file (`#4c1d95`, `#020617`, `#1e1b4b`, `#075985`, `#7f1d1d`) — exactly the DESIGN.md #1 defect; (3) multi-metaphor sci-fi word-salad ("Sector 7 monitoring active", "Back to Fleet Command", "Badge Arsenal", "Initialize Deployment") that PRODUCT.md explicitly warns against. The student-side Level Card — the strongest on-brand component — is never echoed here, and Word (lime) vs Paragraph (sky/amber) look like two different apps.

**Deterministic scan:** 64 findings (20 warning, 44 advisory). Dominant families: `design-system-font-size` (39, mostly `10px`), `gray-on-color` (17), `design-system-color` (5 hex literals in Dashboard charts), `ai-color-palette` (2 purple text), `side-tab` (1). **False positives:** most `text-slate-950 on bg-lime-400` are dark-on-bright and correct (high contrast) — the detector mislabels them; the real washouts are `text-slate-500` on `bg-sky-900`/`bg-pink-900`. Browser overlay not available; findings are static only.

## Overall Impression
Competent where it matters (Students roster: tactile cards, risk dots, fast filters) but punctuated by broken promises (3 nav entries are empty/unreachable) and inconsistent chrome that makes the tool feel unfinished rather than playful. Biggest opportunity: collapse onto the token system and fix the nav IA.

## What's Working
- Risk/status visual coding in Students.jsx (dot + percentage) survives color-blind reading.
- Lexend-900 uppercase HUD voice is applied consistently — the one intentional piece.
- Reports deadline-gating logic is a real, thoughtful product safeguard.

## Priority Issues

**[P0] Token & shadow drift (consistency — the system's explicit #1 fix).**
- Why: DESIGN.md:138-142 & 181-199 name this as the primary defect; it's what makes the surface look AI-generated and disconnected from the student arcade.
- Fix: Promote `lime-400`→`accent`, `slate-900/950/800/500`→`surface-container-*`/`on-surface`/`outline`; collapse all hard shadows to the single `.tactile-card`/`.tactile-button` color `#4c1d95` (use app.css classes, not inline `shadow-[...]`).

**[P0] Orphaned & dead nav (IA / user control).**
- Why: Sidebar links to Leaderboards (empty void) but omits Badges/Classes/Assignments — a teacher literally cannot reach Badges, and a blank page destroys trust.
- Fix: Add Badges/Classes/Assignments to nav (Badges deserves a slot); or, if unfinished, remove empty routes from nav and show explicit "Coming soon" empty states.

**[P1] Banned primitives shipped: emoji + glassmorphism + soft glow.**
- Why: All three are absolute bans (DESIGN.md:263-276; PRODUCT.md:43-44); emoji also fail screen readers.
- Fix: Replace rank medals with Material Symbols or numbered pills; drop `backdrop-blur-sm` (solid `bg-slate-950/90`); replace glow shadows with hard tactile or flat fills.

**[P1] One Pop Color Rule violated by secondary actions.**
- Why: DESIGN.md:133-136 — lime is the only action color; Edit=`purple-500`, Delete=`rose-600`, Paragraph Manage=`amber-500`/`sky-400` train the eye wrong.
- Fix: Make all primary CTAs lime; demote Edit/Delete to outline/ghost (magenta or slate text); if Story Quest needs a sibling identity, tokenize it deliberately — don't improvise per file.

**[P2] Accessibility: contrast, modal a11y, reduced motion, micro-labels.**
- Why: `text-slate-500` on `bg-slate-900` likely <4.5:1; modals no Escape/focus-trap; `prefers-reduced-motion` not honored; `text-[10px]` micro-labels.
- Fix: Audit label contrast (use `on-surface-variant`); add Escape + focus-trap to modals; gate animations behind `motion-reduce:*`; lift meaningful micro-labels to ≥12px.

## Persona Red Flags
- **Alex (power teacher):** Dead Leaderboards link + unreachable Badges; bulk ops exist in Reports but not Students; per-page status palettes force re-learning.
- **Jordan (less-tech-savvy):** `window.confirm` delete looks like a virus warning; "Initialize Deployment" intimidates vs "Add Student"; Paragraph riddle copy confuses.
- **Sam (accessibility-dependent):** Emoji medals invisible to SR; modal `backdrop-blur` + no focus-trap traps keyboard users; `text-slate-500` micro-copy fails contrast; no reduced-motion path.
- **Non-gamer teacher (project):** Sci-fi nouns ("Sector 7", "Arsenal", "Fleet Command") add cognitive tax with zero gameplay payoff on an admin screen — prefers plain "Students / Reports".
- **Multi-class teacher (project):** Dashboard "Top Performing Students" mixes all sections with no per-section view; the "Classes" page that should host class management is an empty stub — exactly what they need is missing.

## Minor Observations
- Sidebar.jsx:90 stray `m` attribute on Logout `<Link>`; `font-lexend` class is undefined (no-op).
- ParagraphInputModal.jsx:24/:32 Russian comments left in production.
- `border-3` used off the 2/4 token scale; radii `rounded-[2.5rem]`/`[2rem]`/`3xl`/`2xl`/`xl` coexist.
- StudentDetails.jsx:11 hardcoded external Google avatar URL; custom scrollbar utility (product ban).
- Dashboard stat cards use `blue-400`/`yellow-400` — entirely off-system.

## Questions to Consider
- Is the arcade metaphor helping the teacher or performing for a demo? Should the Teacher surface keep only the tactile/shadow language and drop the sci-fi vocabulary?
- Why do Word (lime) and Paragraph (sky/amber) modules look like two different apps — tokenize Story Quest deliberately, or retire `sky-400`?
- Three of the nav entries are empty or unreachable — is the Teacher surface shippable, or a demo shell dressed as a product?
