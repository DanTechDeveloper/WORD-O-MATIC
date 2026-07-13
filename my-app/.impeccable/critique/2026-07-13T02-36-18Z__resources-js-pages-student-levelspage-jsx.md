---
target: resources/js/Pages/Student/LevelsPage.jsx + LevelCard.jsx
total_score: 27
p0_count: 0
p1_count: 2
timestamp: 2026-07-13T02-36-18Z
slug: resources-js-pages-student-levelspage-jsx
---
# Critique: LevelsPage.jsx + LevelCard.jsx (Student level-select surface)

Method: dual-agent (A: design review · B: detector/browser evidence). Assessments run isolated; synthesized below.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | totalStars bug forces star badge to 0; reward signal lies |
| 2 | Match System / Real World | 4 | Kid-appropriate voice, emojis, PLAY/DONE |
| 3 | User Control and Freedom | 3 | Back button exists; completed cards are inert href="#" |
| 4 | Consistency and Standards | 2 | Token drift + soft-shadow drift contradict the system |
| 5 | Error Prevention | 3 | Locked state blocks premature play — good guardrail |
| 6 | Recognition Rather Than Recall | 3 | Titles/progress visible; star total numeric + bugged |
| 7 | Flexibility and Efficiency | 2 | No keyboard "resume current"; motion-only affordances |
| 8 | Aesthetic and Minimalist | 3 | Loud-clean arcade; docked for soft shadows + raw color noise |
| 9 | Error Recovery | 2 | Empty state gives zero guidance/next action |
| 10 | Help and Documentation | 3 | Only help is the locked hint; no contextual help |
| **Total** | | **27/40** | **Acceptable — strong skeleton, sloppy execution** |

## Anti-Patterns Verdict

**LLM assessment:** Not pure slop — the signature Level Card is reproduced faithfully (gradient covers, state pill, PLAY chip with depth border, progress bar) and state variety is genuine. It does NOT trip the hard absolute bans (no side-stripe, gradient text, glassmorphism, hero-metric, identical dead grid, eyebrow-on-every-section, default numbered markers, text overflow). But three register-level tells persist: (1) soft blurred `shadow-lg` shadows that violate the One Tactile Shadow Rule, (2) token drift to raw `slate-*`/`white/*`/`purple-*`, and (3) decorative motion with no `prefers-reduced-motion` escape. A strong skeleton wearing sloppy clothes.

**Deterministic scan:** 5 warnings (exit 2) — 1 in LevelsPage, 4 in LevelCard. Assessment B confirms ALL FIVE are false positives against this design system:
- `ai-color-palette` (purple/violet gradients) — DESIGN.md §5 explicitly specifies these six preset blends.
- `gray-on-color` (slate-950 on lime-400) — slate-950 is near-black, ~14:1 contrast, excellent.
- `border-accent-on-rounded` (PLAY chip + star badge) — the bottom-depth border IS the intentional tactile language per DESIGN §5.

**Visual overlays:** Browser visualization skipped — no dev server route served (5173 returned 404) and no browser-injection tool available. No overlays observed; no findings fabricated. Fallback signal: static source + detector only.

## Overall Impression

The surface is on-brief and on-brand at the structural level: clean mode ownership (lime = Word Blast, quest = Story Quest), explicit locked/current/complete states, faithful signature card. The problems are execution-level — a real functional bug that makes the global star count read 0, contrast that fails WCAG AA on locked cards, soft shadows that betray the tactile language, and raw-Tailwind token drift the design system explicitly bans. Biggest opportunity: fix the star bug and bring the shadows/tokens onto-system; that alone moves this from "acceptable" to "good."

## What's Working

1. **Faithful signature Level Card** — gradient covers, state pill, emoji, lime PLAY chip with depth border, progress bar; the flagship pattern executed.
2. **Clean mode ownership** — one pop color per mode, honored at header + star badge.
3. **Explicit state language** — locked (dashed + desaturated), current (magenta ring + shimmer), complete (lime border + check) are visually distinct AND text-labeled.

## Priority Issues

- **[P1] Star total is always 0 (functional + visibility bug).** LevelsPage.jsx:14–16 the `reduce` does bare `return` on the locked branch, so the accumulator becomes `undefined`; `|| 0` then forces `totalStars = 0`. The star badge (LevelsPage:42–45) always shows 0. Undermines Visibility of System Status — the kid's earned-star signal silently lies. Fix: `return sum`. → `/impeccable audit the LevelsPage star accumulator`
- **[P1] Locked-state text fails WCAG AA contrast.** LevelCard.jsx:44–45 "Complete previous level first" at `text-on-surface-variant/30` and whole card `opacity-55` (LevelCard:31) drops far below 4.5:1. Low-vision users can't read the only locked guidance. Fix: raise helper text to `on-surface-variant` (no /30); desaturate the cover only, keep text legible. → `/impeccable audit LevelCard locked-text contrast`
- **[P2] Soft blurred shadows violate the One Tactile Shadow Rule.** `shadow-lg` / `shadow-lime-400/20` (LevelsPage:29,42; LevelCard:109) are soft, zero-tactile, color-drifting — the exact "AI default" the system bans. Fix: tokenized hard offset shadow (`8px 8px 0 0 <tactile-shadow>`), one color. → `/impeccable polish hard tactile shadows`
- **[P2] Token drift to raw Tailwind.** `bg-slate-950/40` (LevelCard:118), `bg-white/10`/`border-white/20` (LevelCard:89), untokenized `lime-400`/`lime-700`, raw `purple/pink` gradient stops. Read-mode star badge uses raw `lime-400` while speak-mode uses token `quest` — internally inconsistent. DESIGN.md mandates promote lime → `accent`, swap slate/white → surface tokens. → `/impeccable polish tokenize raw utilities`
- **[P2] No `prefers-reduced-motion` escape.** hover-scale, shimmer, staggered fade-in run unguarded (LevelCard:62,66,74–81). PRODUCT.md requires a calm alternative; vestibular risk for tablet/low-vision users. Fix: wrap motion in `prefers-reduced-motion: no-preference` or global reset. → `/impeccable animate reduced-motion fallbacks`
- **[P2] Cognitive overload: 10 undifferentiated levels.** One grid (LevelsPage:55) with up to 10 choices, no chunking/grouping. Fails cognitive-load #2/#3/#5/#6 for first-timer/distracted kids. Fix: cluster into worlds/chapters of ≤4, or reveal in batches; keep "next up" prominent. → `/impeccable layout chunked level grid`
- **[P2] Icon-only back button has no accessible label.** LevelsPage:27–32 circular Link with `arrow_back` glyph, no `aria-label`. Screen readers announce a bare ligature. Fix: `aria-label="Back to dashboard"`. → `/impeccable clarify a11y labels`

## Persona Red Flags

**Jordan (confused first-timer kid):** 10 cards, ~9 locked → wall of grayscale locks, no cue what to do first; star badge shows 0 (bug) → assumes earned nothing; back button is icon-only, may not parse "go back."

**Casey (distracted tablet kid):** all hover affordances (card lift LevelCard:66, PLAY depth compression LevelCard:109) are hover-only → invisible on touch, the "pressable game piece" feel is lost on the exact device K-5 uses most; unguarded shimmer/scale distract on a small screen; `grid-cols-1` = long 10-card scroll.

**Sam (accessibility — SR/keyboard/low-vision):** icon-only back Link has no `aria-label`; completed card is a focusable `<Link href="#">` with `preventDefault` (LevelCard:57–61) → tab into a control that does nothing; locked helper text at /30 fails contrast; no `prefers-reduced-motion`.

**Mia (project-specific: pre-reader 2nd-grader):** relies on emoji/icon/progress bar (good non-text cues), but locked "Complete previous level first" is text-only at unreadable contrast; "X / Y words" numeric is meaningless to a non-reader; star-0 bug gives no reward feedback she could feel.

## Minor Observations

- Star badge uses `border-b-2` (not the 6px chip depth) and raw `lime-400` while speak mode uses token `quest` — asymmetric even within one element.
- PLAY label `text-slate-950` off the `#0c0c1f` token spec for near-black labels.
- `LEVEL_EMOJIS` array duplicated in both files (LevelsPage:5–9, LevelCard:12–16); LevelsPage passes the `emoji` prop, so LevelCard's copy is dead fallback.
- Subtitle "Select a level to play" (LevelsPage:38) is `font-bold`, not `font-black uppercase` — softens the mandated HUD voice.

## Questions to Consider

1. If a 2nd-grader can't read "Complete previous level first," should locked cards speak through icon + audio rather than low-contrast text — retiring the contrast problem entirely?
2. Ten levels in one grid: is this a *level-select* or a *progress trophy case*? Would a single prominent "NEXT LEVEL" card with the rest dimmed beat a 10-up grid for a 7-year-old?
3. The star badge lies (shows 0) — but why a global star count on level-select if each card shows its own progress? Is it measuring the wrong thing (session vs lifetime stars)?
4. Every motion cue is hover-first in a tablet-first product — are we designing the arcade for a mouse K-5 rarely holds? Should "press" semantics be the default?
