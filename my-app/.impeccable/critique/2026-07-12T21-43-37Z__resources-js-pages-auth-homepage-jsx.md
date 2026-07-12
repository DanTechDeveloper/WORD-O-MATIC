---
target: resources/js/Pages/Auth/Homepage.jsx
total_score: 16
p0_count: 2
p1_count: 2
timestamp: 2026-07-12T21-43-37Z
slug: resources-js-pages-auth-homepage-jsx
---
# Critique: Auth/Homepage.jsx — "The Tactile Arcade" vs the Off-System Landing

## Design Health Score

Method: dual-agent (A: ses_0a7b84095ffeYnxST9qN0sCmBl · B: ses_0a7b83851ffebK8XThi092gGV2)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No processing indicator beyond `disabled`; no success state on LOGIN. |
| 2 | Match System / Real World | 2 | "Identification Name..." jargon; PIN hidden as password. |
| 3 | User Control and Freedom | 3 | Smooth-scroll nav + mobile menu work; no destructive action. |
| 4 | Consistency and Standards | 0 | Directly contradicts the app's Material-3 Tactile Arcade tokens (zinc/purple/green vs indigo-lime). |
| 5 | Error Prevention | 1 | No PIN masking, length hint, or format guidance. |
| 6 | Recognition Rather Than Recall | 2 | Teacher/student split clear, but Name/PIN must be recalled from elsewhere. |
| 7 | Flexibility and Efficiency | 2 | No autofocus, no keyboard shortcut, no "Enter to submit" cue. |
| 8 | Aesthetic and Minimalist Design | 1 | Floating orbs + dual blurred glows + gradient vignette = decorative noise. |
| 9 | Help and Documentation | 1 | Zero inline help; no "what is my PIN / ask teacher" path. |
| 10 | Error Recovery | 2 | Errors render but with no recovery guidance. |
| **Total** | | **16/40** | **Poor — major UX overhaul needed** |

## Anti-Patterns Verdict

**LLM assessment:** Yes — textbook generative landing page. Hits the parent skill's DON'Ts: full-screen centered hero with floating orbs + gradient vignette, a 4-card identical emoji grid (`features.map`), tiny uppercase tracked eyebrows repeated on every section, oversized `rounded-[28px]` cards, and a glassmorphic `backdrop-blur` header. The lone redeeming signal: the login card (line 254) actually uses the real `tactile-card` class with a hard violet offset shadow — proof the author touched the system, then abandoned it for raw `zinc-*/purple-500/green-800`.

**Deterministic scan:** detector exit code 2, 5 findings / 4 rules — `gray-on-color` (L188/310, false positive: dark-on-lime is high-contrast), `ai-color-palette` (L55/324, defensible), `design-system-font-size` (L348, 10px off-ramp). Manual grep confirmed the detector's blind spots: 38 hardcoded `zinc-*` usages, raw-hex shadows (`#1e1b4b`, `rgba(163,230,53,0.5)`), `rounded-[28/30/40px]` off-ramp radii, the repeated eyebrow pattern, the identical card grid, and the decorative glass header. The detector reads literal classes, not `DESIGN.md`/token context, so the off-system palette was invisible to it and came only from manual review.

**Visual overlays:** Not available — no browser-automation tool exposed in this harness. Fallback signal = deterministic CLI + manual grep only.

## Overall Impression

The single biggest opportunity: **the file that makes the first impression is the one that breaks the brand.** Everything downstream (Student/Teacher app) is on the indigo-lime Tactile Arcade system; this page cosplays a generic AI landing and then slaps a meaningless "Terminal v1.0.4" label on the footer. The login card proves the right system is achievable here — it just wasn't applied to the rest.

## What's Working

1. **The LOGIN button (L310):** nails the tactile press — `border-b-[8px]` compresses to `[2px]` + `translate-y-1` on `active`. Physically convincing, on-brand.
2. **The login card (L254):** real `tactile-card` + hard `20px 20px 0 0` violet offset. The one element that proves the system could ship here.
3. **Mobile menu (L117–144):** clean, correct `scrollTo` + `setMobileOpen(false)` behavior, low friction.

## Priority Issues

- **[P0] Off-system palette & tokens everywhere.** Raw `zinc-950/900/800/400/500`, `purple-500/600/950`, `green-800`, `lime-400` across header/hero/cards/footer (L48,52,55,81,160,169,254,324,349). Breaks the Token-Only rule; the marketing surface contradicts the product the student then enters. **Fix:** swap to `background`(#111125), `surface-container-high`(#28283d), `outline`(#958da3), `primary`(#d1bcff), and tokenize lime as `accent`. **Command:** `colorize`.

- **[P0] Glassmorphism + decorative orbs contradict brand.** Header `backdrop-blur-md` (L52), gradient vignette (L160), 6 floating orbs + 2 `blur-[160px]` blobs (L162–170,251–252). DESIGN.md forbids both; they add cognitive load on a credential-entry page. **Fix:** flat solid `bg-background` header; delete orbs/blobs; use one hard tactile shadow for depth. **Command:** `quieter`.

- **[P1] Purple "Teacher Login" violates One Pop Color rule.** `bg-purple-600` CTA (L81,139) beside lime "Get Started" — two action colors shout, splitting attention and implying the student may be in the wrong flow. **Fix:** make Teacher Login a ghost/outline (surface-tinted, lime/magenta text); reserve lime for student actions. **Command:** `colorize`.

- **[P1] PIN as `type=password` is hostile.** L291 hides a typically-shown, shared classroom PIN. Causes entry anxiety + errors on a high-stakes field. **Fix:** `type="text"` + `inputMode="numeric"`, or a visibility toggle; add format/length hint. **Command:** `harden`.

- **[P2] Oversized inconsistent radii.** Feature `rounded-[28px]` (L209), login `rounded-[30px]/[40px]` (L254), buttons `rounded-2xl/xl`. DESIGN.md mandates the token scale (`lg`=1rem). **Fix:** standardize cards to `rounded-lg`/`rounded-2xl`. **Command:** `shape`.

- **[P3] "Terminal v1.0.4" with no terminal language (L349).** Hollow label, damages credibility. **Fix:** drop it, or actually build a terminal-styled footer. **Command:** `document`.

## Persona Red Flags

**Jordan (Confused First-Timer):** The orb hero (L174 "Learn / Through / Play") gives no clue this is a *login* page; "Identification Name..." (L274) is opaque jargon; no "what is my PIN / ask your teacher" help (Heuristic #9). Jordan scrolls past the hero unsure what to do.

**Riley (Deliberate Stress Tester):** No input validation/masking (PIN length unbounded); `processing` only disables the button (L310) with no spinner; error copy is scolding `red-500` uppercase (L281) with no recovery path. Riley finds no robustness.

**Casey (Distracted Mobile User):** Hero is `min-h-screen` (L148), pushing login far below the fold; lime "Get Started" (L188) and later "LOGIN" (L310) are both lime with no progress anchor; the mobile menu (L117) adds a tap before the form. Casey abandons before reaching it.

## Minor Observations

- Two `<h1>`s (header L55 + hero L174) — bad for a11y/SEO.
- Emoji icons (L211) instead of Material Symbols Outlined — inconsistent with app iconography.
- `tracking-[0.2em]/[0.3em]` eyebrows tighter than the token `0.1em` label — drift.
- `placeholder:text-zinc-800` (L273/296) is near-invisible on `bg-zinc-950`.
- `active:translate-y-0.5` on Teacher button (L81) but `border-b-[3px]` doesn't compress like the LOGIN button — inconsistent press language.
- Inlined `<style>` keyframes (L150–159) run forever; `prefers-reduced-motion` ignored.

## Questions to Consider

1. The login card (L254) already uses `tactile-card` — was the system applied then abandoned, or never agreed?
2. The hero sells "Play," but the real product is a Name/PIN gate. Is the homepage marketing a feeling the app doesn't deliver?
3. Would deleting the hero+features+about scroll (L147–243) and leading with the on-brand login card *improve* the only real action (student login)?
4. "Terminal v1.0.4" suggests a desired retro/dev identity — is there a better, honest brand voice than a terminal the visuals refuse to become?
