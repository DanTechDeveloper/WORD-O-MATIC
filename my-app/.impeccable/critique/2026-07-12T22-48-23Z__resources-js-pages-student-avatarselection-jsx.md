---
target: /opt/lampp/htdocs/WordOMatic/my-app/resources/js/Pages/Student/AvatarSelection.jsx
total_score: 19
p0_count: 2
p1_count: 2
timestamp: 2026-07-12T22-48-23Z
slug: resources-js-pages-student-avatarselection-jsx
---
# Critique — Student/AvatarSelection.jsx

## Method
Dual-agent: A: ses_0a77e2500ffej0SmM2J6ui0Uaw · B: ses_0a77e1b6dffeiDEhq5e0a7CpdS. Browser visualization unavailable (no browser automation in env); B ran the CLI detector only.

## Design Health Score — 19/40 (Poor)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Spinner exists; no per-card "selected" confirmation before full-screen overlay |
| 2 | Match System / Real World | 3 | "SELECT YOUR HERO" is kid-friendly but unreadable to a non-reader K-5 child |
| 3 | User Control and Freedom | 1 | `hasSubmitted` locks the whole screen on first tap — no undo, no re-pick, no back |
| 4 | Consistency and Standards | 0 | Zero design-system tokens or tactile primitives; total drift from rebuilt siblings |
| 5 | Error Prevention | 1 | No preview/confirm; a mis-tap commits the avatar permanently |
| 6 | Recognition Rather Than Recall | 3 | All 6 options visible, but no visible labels/names under heads |
| 7 | Flexibility and Efficiency | 2 | No keyboard focus styling or default focus ring |
| 8 | Aesthetic and Minimalist | 2 | Clean layout but off-brand neutrals look unfinished |
| 9 | Help Recognize/Diagnose Errors | 2 | Error toast exists but generic copy, off-token red, tiny dismiss |
| 10 | Help and Documentation | 2 | Only a pulsing hint; no contextual help |
| **Total** | | **19/40** | **Poor** |

## Anti-Patterns Verdict
**LLM:** Reads as pre-design-system AI boilerplate. Every raised surface uses generic Tailwind neutrals and generic effects — the exact drift DESIGN.md §2/§6 and PRODUCT.md Anti-references ban. Tells: raw `zinc-950/900/800/500` (banned), untokenized `lime-400` (should be `accent`), raw `red-600` (should be `error`), `backdrop-blur-sm` glass overlay (banned), zero tactile shadows (the system's defining primitive is absent), off-scale radii (`3xl`/`2xl`), ad-hoc `z-[90]/z-[100]/z-[110]`, and `hover:scale-110 active:scale-95` bouncy transforms instead of tactile press. No emoji (compliant). Sibling onboarding files (SplashScreen, Tutorial, PracticePage, BadgeUnlockModal, TapToStartOverlay) were already rebuilt on-system; **this file is the one that was missed**, so it's the only onboarding step that looks and behaves off-system.

**Deterministic scan:** 0 findings — but this is a **false negative**. `detect.mjs` matches only raw hex/inline tokens, not Tailwind utility classes, so `bg-zinc-950`, `text-lime-400`, `bg-red-600`, `text-zinc-500`, `text-4xl md:text-6xl` all pass unscanned. The detector gives no coverage here; the human review is the only signal. (Note for future: token-class drift on .jsx is invisible to the bundled detector.)

## Overall Impression
This is a child's first act of self-expression in the product — the highest-stakes "who am I" moment in onboarding — and it undersells it. A genuinely inviting 6-head grid is sabotaged by (1) committing on a single irreversible tap and (2) a gray blur spinner where the celebration should be. Visually it's the one unfinished tile in an otherwise rebuilt mosaic.

## What's Working
- Descriptive alt text on every avatar ("Comet Cadet Sam robot avatar") — real a11y effort, not filenames.
- Submit guard against double-fire (`if (isUpdating || hasSubmitted) return;`) prevents duplicate POSTs.
- No emoji, all 6 options visible at once, responsive `grid-cols-2 md:grid-cols-3`.

## Priority Issues

**[P0] Full off-system palette — zero tokens, zero tactile shadow.**
- Why: Violates the Token-Only and One Tactile Shadow rules; the screen is visibly unfinished beside its rebuilt siblings.
- Fix: `bg-zinc-950→bg-background`; card `bg-zinc-900→bg-surface-container-high` + `tactile-card`; `border-zinc-800→border-outline`; `hover:border-lime-400→hover:border-accent`; `hover:bg-zinc-800→hover:bg-surface-bright`; `text-lime-400→text-accent`; `bg-red-600→bg-error` + `text-on-error`; `text-zinc-500→text-on-surface-variant`.
- Command: `/impeccable polish`

**[P0] First tap is irreversible with no confirm (control/freedom + error prevention).**
- Why: `handleAvatarClick` immediately POSTs and sets `hasSubmitted`; a mis-tap permanently sets a child's identity with no undo. Worst case for a distracted or non-reading child.
- Fix: Add a `selected` state → `border-accent` + compressed `tactile-card`; show the pick full-size with its name; require a separate lime `tactile-button` "THIS ONE!" confirm CTA before POST. Let the child re-highlight freely until confirm.
- Command: `/impeccable onboard`

**[P1] Glassmorphism loading overlay (banned primitive).**
- Why: `backdrop-blur-sm` is explicitly banned; the gray blur steals the child's choice instead of celebrating it.
- Fix: Remove `backdrop-blur-sm`; `bg-black/50→bg-background/90` (solid, no blur). Replace the silent spinner with a calm "Nice pick, <name>!" confirmation to fix the peak-end valley.
- Command: `/impeccable polish`

**[P1] Motion ignores prefers-reduced-motion (WCAG / PRODUCT.md a11y).**
- Why: `animate-spin`, `animate-pulse`, `hover:scale-110 active:scale-95` all ignore `prefers-reduced-motion`; the scale bounce also isn't the system's tactile press.
- Fix: Add `motion-reduce:animate-none`; swap the scale transform for tactile shadow compression (active-state `tactile-button`) per §4/§5.
- Command: `/impeccable animate`

**[P2] Ad-hoc z-index + off-scale radii.**
- Why: `z-[90]/z-[100]/z-[110]` are magic numbers; `rounded-3xl`/`2xl` sit off the token scale (§6 "don't mix radii").
- Fix: Replace with a semantic z scale (base `z-40` / overlay `z-50` / toast `z-[60]`); `rounded-3xl/2xl→rounded-xl` (0.75rem), toast `rounded-lg`.
- Command: `/impeccable layout`

## Persona Red Flags
- **Jordan (first-timer):** Taps a head just to look → screen instantly freezes (`hasSubmitted`) and blurs out. Jordan never meant to commit. Failing: L22–26 immediate POST, L75 no selected preview, L54 blur overlay.
- **Casey (distracted mobile):** Thumb grazes a head while scrolling → committed. `gap-4` on a 2-col mobile grid puts targets close; `hover:scale-110` gives no pre-commit touch feedback. Failing: L70 tight mobile gap + L22 no confirm = accidental permanent pick.
- **Riley (early/non-reader K-5, project):** Can't read "SELECT YOUR HERO" or "Tap to choose your avatar"; no visible names/audio under heads (alt text invisible to sighted non-readers); doesn't know a tap is permanent. Failing: L67/L85 text-only instructions, L6–11 names only in alt.
- **Ms. Delgado (teacher supervising, project):** A child mis-taps; she looks for "change avatar" and finds the screen locked with a generic "Something went wrong" if it failed — no reset without leaving the flow. Failing: L23 permanent lock, L33 non-actionable error, L63 tiny `&times;`.

## Minor Observations
- Error copy `'Something went wrong'` (L33) is off-voice; system wants black/uppercase HUD labels.
- Dismiss is a raw `&times;` glyph (L63) — should be Material Symbol `close` with a real hit target.
- Error toast `text-white` on `red-600` (L61) → on-system `text-on-error` on `bg-error`.
- Spinner `text-6xl` Material Symbol `sync` is fine but pair with a reassurance line, not silence.
- `max-w-2xl` wrapper then `max-w-lg` grid (L66, L70) — redundant double constraint.
- No visible focus ring on avatar buttons (L72–76); system focus color is `secondary-container`.

## Questions to Consider
- This is a child's first identity choice — why does it commit on one tap with no preview, no name echo, and no undo, when "pick → confirm" costs one state variable?
- Every sibling onboarding screen was rebuilt on the Tactile Arcade and this one wasn't. Is the risk purely visual drift, or does the missing confirm step make this the only onboarding step a child can't recover from?
- The peak-end reward ("START ADVENTURE!") lives in `BadgeUnlockModal`. What does this screen actually give the child for choosing, other than a gray blur and a spinner?
