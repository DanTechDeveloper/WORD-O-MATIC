---
target: @resources/js/Pages/Student/SplashScreen.jsx
total_score: 24
p0_count: 2
p1_count: 2
timestamp: 2026-07-12T22-34-59Z
slug: resources-js-pages-student-splashscreen-jsx
---
# Critique — SplashScreen.jsx

## Method
Dual-agent: A: ses_0a78992c8ffeRs0v0juCCmPop5 · B: ses_0a7898b8bffeEDBV5T17b9o5Rz. Browser visualization skipped (no browser automation in this environment); Assessment B ran the CLI detector only.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | Tap/click fires router.visit with no loading/"starting" state |
| 2 | Match System / Real World | 3 | Game words + "Play" intuitive |
| 3 | User Control and Freedom | 3 | Entry screen, no undo needed |
| 4 | Consistency and Standards | 2 | text-slate-950, blurred glow, gradient vignette violate design bans |
| 5 | Error Prevention | 2 | Whole screen clickable, no guard against accidental start |
| 6 | Recognition Rather Than Recall | 4 | Minimal, self-evident intent |
| 7 | Flexibility and Efficiency | 2 | No keyboard activation; button not Enter/Space reachable |
| 8 | Aesthetic and Minimalist | 2 | 4-color words + glow + pulse + vignette compete with CTA |
| 9 | Help Recognize/Diagnose Errors | 3 | n/a at this screen |
| 10 | Help and Documentation | 2 | Text-only cue; non-reader K-5 gets no non-text start signal |
| **Total** | | **24/40** | **Acceptable** |

## Anti-Patterns Verdict

**LLM assessment:** Reads as a default centered-stack hero — big title, centered pill, small pulsing hint, vertical gap-10, everything items-center. Zero console/game identity beyond the wordmark color. The kinetic falling-word background is the only personality and it's a thin, easily-generated effect. The brand brief says "game console, not a worksheet," but this is a quiet generic entry screen.

**Deterministic scan:** Detector returned 0 findings on the file. Assessment A's flagged items (raw slate-950, blurred text-shadow glow, radial-gradient vignette) are inline-style/JSX patterns the detector does not currently flag — so the scanner under-reports here. No false positives.

## Overall Impression
A competent, token-correct skeleton with one good tactile button and proper reduced-motion handling, but it plays it safe and generic. The single biggest opportunity: own the "arcade" personality with a mascot/character and make the start affordance unmistakable and accessible — instead of a quiet hero that could belong to any vocab app.

## What's Working
- On-system tactile button: `shadow-[0_6px_0_0_#4c1d95]` matches `.tactile-button` exactly — correct hard, zero-blur, single-color offset.
- Token-driven accent: uses `bg-accent`/`text-accent` (promoted `#a3e635` token), not raw `lime-400`.
- Reduced-motion handled for real: inline `@media (prefers-reduced-motion)` kills word/shard animation; `motion-reduce:animate-none` covers the pulse.
- Material Symbols icon (`play_arrow`) honors the emoji ban.

## Priority Issues

**[P0] Decorative multi-color falling words dilute the CTA & break the One Pop Color Rule**
- Why: DESIGN reserves lime for action only; lime words + lime title + lime button = three lime shouters, and floods a 6yo with competing motion.
- Fix: Render background words in chrome only (violet #7000ff, magenta #ff3bc0, lavender #d1bcff) — never lime.

**[P0] No status feedback, accidental-start risk, no keyboard path**
- Why: Root `onClick` navigates with no loading state; button has no Enter/Space handler; whole screen is a trap for stray taps (kids). Violates Nielsen #1/#7.
- Fix: Make the button the sole real control, add a magenta (`secondary-container`) focus ring + `onKeyDown` (Enter/Space), and show a brief "Starting…"/disabled state during `router.visit`.

**[P1] Blurred glow shadows violate the tactile ban**
- Why: `textShadow: 0 0 12px ${color}66` is a soft blurred shadow; DESIGN bans soft shadows, depth must be hard offset.
- Fix: Remove the blur glow; flat color or a hard tactile offset only.

**[P1] Radial-gradient vignette is a banned gradient effect**
- Why: DESIGN bans gradient decoration; only solid token surfaces / hard shadows allowed.
- Fix: Replace with a flat token scrim (`bg-background/40` or a `surface` overlay).

**[P2] Raw `slate-950` on the button label**
- Why: Violates the Token-Only Rule; button spec calls for near-black `#0c0c1f`.
- Fix: Use `text-surface-container-lowest` token.

## Persona Red Flags
- **Jordan (first-timer):** Giant lime title looks interactive-but-isn't; falling words look tappable; only a small Play chip is the real affordance.
- **Casey (distracted mobile):** `cursor-pointer` is desktop noise; whole-screen `onClick` means a stray thumb-tap starts the session with zero confirmation; no tap acknowledgment.
- **K-5 pre-/low-literacy student (project):** Everything is text — "WORD-O-MATIC" and "Tap anywhere to start" unreadable to a non-reader. No mascot/character/pictogram signaling "press here to play."
- **Teacher (project):** Splash offers zero teacher affordance — no class/assignment context, no quick exit/handoff.

## Minor Observations
- Hint uses `font-bold` (body) instead of the Lexend-900 uppercase HUD label voice the system mandates for small UI text.
- `animate-pulse` on the hint is generic; an on-brand `bounce-slow` nudge fits better.
- `gap-10` + `md:text-8xl` title risks clipping on short landscape phones.
- The word "explosion" shard burst is the only delight moment but fires on a background word, likely unseen behind the static title.

## Questions to Consider
- Should the splash carry a mascot/character to own the "game console" personality, or is the kinetic wordmark enough?
- Is the "tap anywhere" + dedicated Play button redundancy worth the accidental-start risk, or should the button become the single, unmistakable, icon-led start target?
- Does making the wordmark lime undermine the One Pop Color Rule enough to recolor it (lavender/white), or is logo-lime a deliberate exception?
