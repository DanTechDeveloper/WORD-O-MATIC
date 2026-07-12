---
target: resources/js/Pages/Student/Dashboard.jsx
total_score: 29
p0_count: 0
p1_count: 0
timestamp: 2026-07-12T23-26-16Z
slug: resources-js-pages-student-dashboard-jsx
---
# Critique: resources/js/Pages/Student/Dashboard.jsx (rebuilt)

**Method:** dual-agent (A: ses_0a75a69c0ffeemZptyGMZqvsuP · B: ses_0a75a5f54ffepGwCt6pidpEJZY)
**Score:** 29/40 (Good) — up from 19/40

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Progress shown, but 0/0 state reads ambiguous |
| 2 | Match System ↔ Real World | 4 | Game metaphors land for K-5 |
| 3 | User Control and Freedom | 3 | Nav out exists; no in-page undo needed |
| 4 | Consistency and Standards | 3 | Colors consistent; card internals asymmetric |
| 5 | Error Prevention | 3 | Safe |
| 6 | Recognition Rather Than Recall | 4 | Icons + labels self-explanatory |
| 7 | Flexibility & Efficiency | 2 | No power-user skip/shortcut |
| 8 | Aesthetic & Minimalist | 4 | Clean, on-system |
| 9 | Help & Documentation | 1 | No help/onboarding cue on screen |
| 10 | Error Recovery | 3 | Safe |
| **Total** | | **29/40** | **Good** |

## Anti-Patterns Verdict
LLM: Largely on-brand now. Removing the emoji carousel was right; the 2-card grid is clean and the pop-color rule is honored. Two small tells remain (asymmetric cards, 0/0 state).

Deterministic: detector exit 0, JSON `[]` — zero findings. Manual review across all 7 rules (NO_EMOJI, RAW_TAILWIND_DEFAULT, GLASS_BAN, SOFT_SHADOW_BAN, BOUNCE_BAN, WORD_BLAST_BREACH, OTHER DRIFT): 0 violations. The hardcoded `#4c1d95` is the intended tactile hard shadow, not a violation.

## Overall Impression
A calm, confident "choose your adventure" screen that finally reads as a game console. The two-mode color split (lime read / blue speak) is executed correctly and the tactile language actually lands. Only minor polish remains.

## What's Working
- Two-mode pop-color rule executed correctly; lime/blue never bleed.
- Accessibility genuinely good: magenta focus ring, motion-reduce on every transform, single semantic Link with aria-label, Material Symbols only.
- Tactile language applied: .tactile-card + pressable Play chip with shadow compression.

## Priority Issues
[P2] Asymmetric progress bars: read uses solid bg-accent, speak uses gradient from-quest to-quest-hover. Breaks "cards are mirrors." Fix: make both fills identical. cmd: fix
[P2] "0/0" empty state: fresh users see "Stars Earned 0/0" which reads like a bug. Fix: show "0 stars" / "Not started" until totals exist. cmd: fix
[P3] Subtitle voice mismatch: "Explore Galaxies" (label) vs "Embark on a narrative journey" (sentence). Parallelize both as short labels. cmd: copy
[P3] Play label color token: text-surface-container-lowest is a surface token, not an on-token. Use text-background (or #0c0c1f) for robust contrast. cmd: fix

## Persona Red Flags
Jordan (first-timer K-5): Play is giant and obvious — pass; the 0/0 Stars Earned bar reads as "nothing works" on first open.
Sam (SR): card is one Link with aria-label — good; inner Play span is redundant but acceptable. Focus + reduced-motion correct.
Casey (mobile): grid stacks cleanly; no failing element.

## Minor Observations
- Card hover lifts but shadow offset stays 8px — deepen on hover to sell the raise.
- Play uses inline shadow-[0_6px_0_0_#4c1d95] instead of the .tactile-button class (works, minor drift risk).
- H2 titles uppercase but not italic/tracked — slight departure from display rule.
- BottomNav uses raw text-lime-400 while this page uses accent token — cross-file inconsistency (not in this file).

## Questions to Consider
1. Should the ENTIRE card be the link, or only the Play chip? Whole-card link invites mis-taps on the description.
2. Why show Stars Earned on the entry dashboard at all — before a mode is chosen it competes with "pick a game" and, at 0/0, undermines confidence.
