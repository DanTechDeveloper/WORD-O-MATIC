---
target: resources/js/Pages/Student/Dashboard.jsx
total_score: 19
p0_count: 2
p1_count: 2
timestamp: 2026-07-12T23-20-16Z
slug: resources-js-pages-student-dashboard-jsx
---
# Critique: resources/js/Pages/Student/Dashboard.jsx

**Method:** dual-agent (A: ses_0a7602e8fffeTlyTYLmBSr8v72 · B: ses_0a7601f4fffeO7xjclUuVHSfmC)
**Score:** 19/40 (Poor)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Silent 4s auto-rotate, no mode indicator beyond dots |
| 2 | Match System ↔ Real World | 3 | Game vocabulary decent |
| 3 | User Control and Freedom | 1 | Click-anywhere advances; forced rotation; no undo |
| 4 | Consistency and Standards | 1 | Emoji, raw tokens, lime-on-blue, blur everywhere |
| 5 | Error Prevention | 3 | Divide-by-zero guarded |
| 6 | Recognition Rather Than Recall | 2 | Dual redundant entries to same modes |
| 7 | Flexibility & Efficiency | 2 | — |
| 8 | Aesthetic & Minimalist | 1 | Blur blobs, duplication, no tactile restraint |
| 9 | Help Recognize/Recover Errors | 3 | — |
| 10 | Help & Documentation | 1 | None |
| **Total** | | **19/40** | **Poor** |

## Anti-Patterns Verdict
LLM: clearly AI-generated and generic; uses brand words (lime, quest) but none of the brand grammar (no hard shadows, no Material Symbols, no token discipline). Reads as "a dashboard," not "a game console."

Deterministic: detector exit 2, but only border-accent-on-rounded (x3) and gray-on-color (x2) — BOTH FALSE POSITIVES (border-b-2 is intentional tactile press-depth; text-slate-950 on lime is high-contrast dark-on-bright). The real violations — emoji icons (L8/19/81/109/144), backdrop-blur-sm (L80), soft shadow-lg (L74), decorative blur orbs (57-58/106/141), raw slate-950/text-white, and the lime-on-blue mode breach (L74/92) — are invisible to the detector because it ignores Tailwind class context and emoji. Manual review is what caught the actual drift.

## Overall Impression
A flat, blobby, templated quiz-screen wearing the brand's color names. Carousel + grid present the same two games twice; hero forces motion on K-5; Story Quest (blue) is broken by a lime CTA. Biggest opportunity: kill the carousel, rebuild both cards on the tactile system, let each mode own its color.

## What's Working
- Grid two-mode color split conceptually correct (lime read / blue speak).
- Material Symbols PLAY with FILL 1 on-brief.
- Reasonable spacing rhythm.

## Priority Issues
[P0] Two-mode color breach (carousel): L74 & L92 hardcode bg-lime-400 for PLAY + active dot regardless of s.mode. Story Quest is blue; lime CTA teaches wrong mapping. Fix: bind to s.mode (accent read / quest speak). cmd: colorize
[P0] Emoji as icons (absolute ban): L8/19/81/109/144 use 📖/🎤. Replace with menu_book / mic Material Symbols. cmd: adapt
[P1] Banned surface treatments: backdrop-blur-sm (L80), blur-3xl orbs (57-58/106/141), shadow-lg shadow-lime-400/20 (L74). Delete; use hard tactile shadow. cmd: harden
[P1] No tactile shadows; raw tokens everywhere: zero .tactile-card/.tactile-button; slate-950/lime-*/text-white scattered (13/74/126/161). Apply .tactile-card; use background/surface/on-surface/accent/quest tokens. cmd: audit → harden
[P2] Auto-rotate + click-anywhere-advances trap: setInterval(next,4000) (38-42) + onClick={next} on section (55). Drop auto-rotate or gate behind toggle + motion-reduce; advance only via dots/arrows. cmd: quieter
[P2] Redundant carousel duplicates grid: same two modes + PLAY + points twice. Cut carousel; keep one entry. cmd: distill
[P3] Missing focus rings, dot aria-labels, display typography: no focus-visible (magenta mandated); dots unlabeled (L88); headline not italic/tracked (L65). cmd: harden / typeset

## Persona Red Flags
Jordan (first-timer K-5): hero auto-flips every 4s; tapping PLAY also advances slide; lime PLAY on blue screen causes unsure which game; no stable start anchor.
Sam (screen reader): hero swaps every 4s with no aria-live; emoji announce as "book"/"microphone" clashing with icon system; dots unlabeled; no focus ring = invisible keyboard nav.
Casey (mobile one-handed): full-width click-to-advance trap; only safe tappable is small PLAY chip; decorative blur blob adds nothing for a thumb.

## Minor Observations
- border-b-2 undersells DESIGN border-b-[6px] press spec.
- hover:-translate-y-1 (104/139) floats cards instead of pressing them.
- Magic-number 168px (L48) couples layout to undeclared header height.
- transition-all duration-500 (L52) animates color too.
- "Points" label vague for a child; "Stars earned" or mode framing better.

## Questions to Consider
1. Why present each game mode twice (auto-carousel + static grid) — earning its screen or filling space?
2. If brand is hard offset zero-blur tactile shadows, why does this screen use only soft blur?
3. Is forced 4s auto-rotation right for K-5 needing a stable home, or motion for motion's sake?
