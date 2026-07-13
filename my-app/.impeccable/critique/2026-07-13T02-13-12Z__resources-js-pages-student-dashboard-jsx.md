---
target: Student Dashboard
total_score: 24
p0_count: 0
p1_count: 3
timestamp: 2026-07-13T02-13-12Z
slug: resources-js-pages-student-dashboard-jsx
---
# Impeccable Critique — Student Dashboard

Method: dual-agent (A: ses_0a6c50373ffeqr9gkkHwMsPM9l · B: ses_0a6c4f24dffeF0Sn5QAp90TyIw)

## Design Health Score (24/40 — Acceptable)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Active nav + progress clear, but no press/loading feedback on card tap; no aria-current |
| 2 | Match System / Real World | 4 | Flawless K-5 arcade voice; zero jargon |
| 3 | User Control and Freedom | 2 | One-tap unconfirmed logout ejects a child to PIN screen, no undo |
| 4 | Consistency and Standards | 2 | Token system broken by raw pink-600, lime-400, red-500, inline #4c1d95 shadow |
| 5 | Error Prevention | 2 | No confirm on destructive logout; points silently coerce to 0 |
| 6 | Recognition Rather Than Recall | 4 | Everything visible and labeled |
| 7 | Flexibility and Efficiency | 2 | No continue-last-level; 3 hops to gameplay; no accelerators |
| 8 | Aesthetic and Minimalist Design | 3 | Focused; minor decorative dot-grid/gradient noise |
| 9 | Error Recovery | 1 | No error state anywhere — failed load/nav/avatar fail silently |
| 10 | Help and Documentation | 1 | No onboarding, tooltips, or read-aloud on a pre-reader home |
| Total | | 24/40 | Acceptable — significant improvements needed |

## Anti-Patterns Verdict
LLM: Low-to-moderate slop. On-brand arcade voice, correct per-mode pop-color separation, genuine tactile shadow. Tells: boilerplate two-up card composition, token drift (raw pink-600 Exit, lime-400 nav, red-500 badge, inline #4c1d95 chip shadow).
Deterministic (B): 47 findings, exit 2. design-system-color x14 (advisory) + ai-color-palette x3 (warning) corroborate token drift (LevelCard.jsx:4,9; BadgeUnlockModal.jsx:43,79; ReadModeMainContent.jsx 83/87/93/109/110/206/269; SpeakModeMainContent.jsx 44/45/148). bounce-easing x10 corroborates dual motion languages (TapToStartOverlay.jsx:26; ReadModeMainContent.jsx:41,122; AvatarSpeechBubble.jsx:64; Microphone.jsx:40; SpeakModeMainContent.jsx:57,75). gradient-text x1 (ReadModeMainContent.jsx:160) hits DESIGN.md ban. border-accent-on-rounded x2 (LevelCard.jsx:109, StudentProfile.jsx:43). gray-on-color x1 + side-tab x1 (StudentFeatures.jsx:32).
False positives: most color hits are intentional rgba overlays/glows; some 9-10px font hits are caption helpers.
Browser overlays: skipped (no browser automation exposed).

## What's Working
1. Brand voice + type on-brief (uppercase italic-black Lexend, HUD labels, per-mode pop separation).
2. Accessibility bones real: aria-label on cards, focus-visible ring, motion-reduce variants everywhere.
3. Tactile principle genuine: tactile-card + compressing play-chip shadow.

## Priority Issues
- [P1] Token system broken by raw utilities (pink-600, lime-400, red-500, inline #4c1d95). Fix: use secondary-container/accent/tokenized alert + tactile-button. Command: colorize (then audit).
- [P1] Loudest element (PLAY chip) is a non-interactive <span> with no own state. Fix: drive pressed+loading from Inertia nav state. Command: shape (then harden).
- [P1] One-tap unconfirmed logout on shared child device. Fix: confirm step or deliberate menu + cancel. Command: harden.
- [P2] No loading/error/meaningful empty states. Fix: nav-in-flight feedback, teaching empty state, avatar fallback. Command: harden.
- [P2] Emotionally flat home — console silent on its own front door. Fix: Continue Level 4, mascot greet, inviting first-run, restrained arrival animation. Command: delight (+ animate).

## Persona Red Flags
- Alex: 3 hops to gameplay, no continue shortcut, no 1/2 accelerators, logout in tab order.
- Sam: decorative icons not aria-hidden (ligature text announced), active nav color-only (no aria-current), badge new dot color-only. Credit: aria-labels, focus ring, motion-reduce correct.
- Mia (K-5): reading-dependent labels with no read-aloud, worksheet first-run copy, small Exit button logout trap.

## Minor Observations
- hasNewBadge reads localStorage at render; move to effect.
- Type tokens diverge (StudentProfile font-headline-md vs Dashboard text-4xl font-black).
- Two motion languages (hover translate vs group-active compress).
- Mixed border weights within one card.

## Questions
- What if home surfaced "Continue Level 4" as one loud button?
- Does a K-5 home need a progress metric at all?
- Why is the console silent on its own front door (AvatarSpeechBubble unused)?
- Should logout be a single unconfirmed tap on a shared classroom device?
- What would a confident, asymmetric game-select look like at zero cognitive load?
