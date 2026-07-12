---
target: resources/js/Pages/Auth/TeacherLogin.jsx
total_score: 19
p0_count: 2
p1_count: 2
timestamp: 2026-07-12T22-00-59Z
slug: resources-js-pages-auth-teacherlogin-jsx
---
# Critique: Auth/TeacherLogin.jsx — Off-System Staff Portal

## Design Health Score

Method: dual-agent (A: ses_0a7a87253ffe6d2yryEmEtIMQi · B: ses_0a7a869b8ffeUEcLqwEz01V7Qg)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Button disables on `processing`; no loading/success microfeedback. |
| 2 | Match System / Real World | 2 | "Terminal v1.0.4" + 🚀 + orbs read as a kids' game, not a staff tool. |
| 3 | User Control and Freedom | 2 | No back-to-home or forgot-password escape. |
| 4 | Consistency and Standards | 1 | Wholesale off-system: zinc/purple/green, not the app's token palette. |
| 5 | Error Prevention | 2 | No show-password, no caps-lock warning. |
| 6 | Recognition Rather Than Recall | 2 | No persistent signifiers; placeholder-only hints. |
| 7 | Flexibility and Efficiency | 1 | No autofocus, no "remember me," nothing for the daily returning teacher. |
| 8 | Aesthetic and Minimalist Design | 1 | Orbs + glow + emoji + tracked eyebrows = decorative noise. |
| 9 | Error Recovery | 2 | Red uppercase errors exist, no next-step guidance. |
| 10 | Help and Documentation | 1 | Zero help link, no forgot-password, no support pointer. |
| **Total** | | **19/40** | **Poor** |

## Anti-Patterns Verdict

**LLM assessment:** Yes — textbook off-system drift, the exact neobrutalist/AI-default pattern DESIGN.md rejects. Soft-blur purple orbs (L19–20), `rounded-[40px]` card (L26), hardcoded `#1e1b4b` shadow bypassing `tactile-card` (L26), "Terminal v1.0.4" footer with no terminal visuals (L88), 🚀 emoji CTA (L82), and raw `zinc-*`/`purple-*` everywhere. Critically, it breaks the **One Pop Color Rule**: the action is purple, not the app-wide lime — so teachers who know the student app will hunt for the wrong color.

**Deterministic scan:** exit code 2, 1 finding — `design-system-font-size` advisory at L87 (`text-[10px]` off-ramp). Manual grep confirmed the detector's blind spots: repeated uppercase tracked eyebrows (L31/38/57/87), decorative `blur-[120px]` glow blobs, heavy off-system zinc/purple/red, `rounded-[40px]` + `#1e1b4b` hex shadow on the same element as `tactile-card`, and the 🚀 emoji. The detector does not read token context, so the off-system palette was invisible to it.

**Visual overlays:** Not available — no browser-automation tool exposed; fallback = CLI + manual grep.

## Overall Impression

This is the Homepage's *pre-fix* state, shipped on the staff portal. The single biggest problem: an auth screen that undermines professional trust (orbs + emoji + "Terminal" label) and uses the wrong action color, breaking affordance transfer from the rest of the app.

## What's Working

1. **`useForm` hygiene** — `processing` disable + `reset("password")` is correct anti-double-submit/security practice.
2. **Large touch targets** — `p-5` inputs, `py-6` button; good for mobile/keyboard.
3. **On-brand display voice** — `font-black italic tracking-tighter` h1; only the purple accent is wrong.

## Priority Issues

- **[P0] Wrong action color + emoji CTA.** `bg-purple-600` + 🚀 (L79–82). Violates One Pop Color Rule; teachers scan for lime. **Fix:** `bg-accent text-[#0c0c1f] border-b-[6px] border-accent-deep hover:bg-accent-hover`, drop emoji for a Material Symbol (`login`/`arrow_forward`). **Command:** `colorize`.

- **[P0] Full token-system rewrite.** Every surface uses raw `zinc-*`/`purple-*`. **Fix:** `bg-background` canvas, `bg-surface-container-high border-4 border-outline` card, `bg-surface-container-lowest border-4 border-outline focus:border-accent` inputs, `text-on-surface-variant` labels. **Command:** `adapt`.

- **[P1] Soft-blur orbs + glow.** `blur-[120px]` orbs (L19–20), `shadow-[0_10px_20px_-10px...]` (L79). DESIGN.md hard-denies soft shadows/glow. **Fix:** delete orbs; one hard tactile shadow only. **Command:** `quieter`.

- **[P1] Radius + shadow drift.** `rounded-[40px]` + `shadow-[20px_20px_0_0_#1e1b4b]` (L26). **Fix:** `rounded-2xl` + the single `tactile-card` class (`8px 8px 0 #4c1d95`). **Command:** `polish`.

- **[P2] "Terminal v1.0.4" footer + tracked eyebrows.** L88; `tracking-[0.2em]/[0.3em]` micro-labels. **Fix:** on-brand wordmark + version in `text-on-surface-variant`; keep one eyebrow max. **Command:** `clarify`.

- **[P3] Missing staff affordances.** No forgot-password, back-to-home, show-password, autofocus. **Fix:** `autoFocus` on username, lime "Forgot ID?" link, ghost "Back" to Homepage. **Command:** `harden` / `onboard`.

## Persona Red Flags

**Alex (power user / returning teacher):** purple non-lime button breaks affordance transfer — loses ~1s daily hunting for the action; no autofocus/remember-me = repeated friction.
**Jordan (first-timer):** "Terminal v1.0.4" + 🚀 confusing; no help/forgot-password = stuck on first failure.
**Sam (accessibility):** `placeholder:text-zinc-800` on `bg-zinc-950` is near-invisible; 🚀 has no `aria-hidden`; focus uses purple glow, not a real `secondary-container` ring; `zinc-500` eyebrow on `zinc-900` fails contrast.
**Riley (stress tester):** full-screen `blur-[120px]` orbs risk repaint jank under load.
**Casey (mobile):** layout responsive and targets large — OK; two 120px blur layers can drop frames on low-end devices.

## Minor Observations

- `transition-all` on inputs is heavy; scope to `transition-colors`.
- `border-4 border-purple-900` (L26) should be `border-outline`.
- No `autoComplete`/`inputMode` hints for faster fill.

## Questions to Consider

1. The student app's signature is the lime CTA — by making the one staff action purple, did we hide the single thing users know to click?
2. Is "Terminal v1.0.4" a real build artifact someone reads, or decorative slop we forgot to delete?
3. Should a *daily* staff portal carry arcade energy at all, or deserve a calmer on-system variant of the tactile language?
4. The Homepage scored 32/40 after being fixed — why is the staff login still shipping the exact drift we just paid to remove?
