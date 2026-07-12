---
target: resources/js/Pages/Auth/TeacherLogin.jsx
total_score: 34
p0_count: 0
p1_count: 2
timestamp: 2026-07-12T22-06-05Z
slug: resources-js-pages-auth-teacherlogin-jsx
---
# Critique: Auth/TeacherLogin.jsx (re-run, post-fix) — On-System Staff Portal

## Design Health Score

Method: dual-agent (A: ses_0a7a4d77dffeAFvqxHJ71yiifi · B: ses_0a7a4cdf9ffesFWZ1RC5sfP6mA)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | "Logging in…" + disabled; errors aria-live. |
| 2 | Match System / Real World | 4 | Username/Password + Staff portal + admin help. |
| 3 | User Control and Freedom | 3 | Show/hide + Back-to-home; no cancel of submit. |
| 4 | Consistency and Standards | 4 | Fully tokenized; One Pop Color honored. |
| 5 | Error Prevention | 3 | Show/hide + autocomplete; no pre-submit validation. |
| 6 | Recognition Rather Than Recall | 4 | Persistent labels; no recall burden. |
| 7 | Flexibility and Efficiency | 2 | Autofocus ✓; no remember-me for daily user. |
| 8 | Aesthetic and Minimalist Design | 4 | Clean, on-brand, no clutter. |
| 9 | Error Recovery | 3 | Red uppercase errors; messages likely generic. |
| 10 | Help and Documentation | 3 | Admin help + home link; no self-serve reset. |
| **Total** | | **34/40** | **Good (near-shipping)** |

## Anti-Patterns Verdict

**LLM assessment:** No longer reads as generic AI. Coherently "Tactile Arcade": hard `#4c1d95` card shadow, lime-only CTA, chunky `border-4` outlines, Lexend-black uppercase HUD voice, Material Symbols `login` icon (no 🚀). The prior off-system tells are gone. One tension: `font-black uppercase tracking-widest` is on *every* small element — but the brand's Black-Uppercase Rule mandates it, so it's voice, not slop.

**Deterministic scan:** exit code 0 — CLEAN. All previously-flagged off-system issues confirmed removed. One residual raw hex the detector missed: `text-[#0c0c1f]` on the button label (line 127) — a Token-Only leak.

**Visual overlays:** Not available — no browser-automation tool exposed; fallback = CLI + manual grep.

## Overall Impression

From 19/40 (Poor) to 34/40 (Good) in one rebuild — the staff portal now matches the fixed Homepage. Residuals are a11y/contrast + two token-discipline leaks, not brand drift.

## What's Working

1. **Fully tokenized + One Pop Color honored** — lime is the sole CTA; magenta confined to focus rings/state.
2. **Real a11y scaffolding** — autofocus, aria-invalid/describedby, aria-live errors, focus-visible magenta rings, show/hide toggle, Material Symbol.
3. **On-system elevation** — card `8px 8px 0 0 #4c1d95` (single tactile shadow); button `border-b-[6px]` compressing to `[2px]` on press, exactly per DESIGN.md.

## Priority Issues

- **[P1] Placeholder contrast fails 4.5:1.** `placeholder:text-on-surface-variant/40` is too dim. **Fix:** `/70` or a dedicated muted token. **Command:** `audit` / `harden`.
- **[P1] Token-Only leak.** `text-[#0c0c1f]` (L127) raw hex bypasses the token. **Fix:** `text-surface-container-lowest`. **Command:** `harden`.
- **[P2] Show/hide not exposed to AT.** Missing `aria-pressed`/`aria-label`. **Fix:** add them. **Command:** `harden`.
- **[P2] Mobile tap target.** `Show`/`Hide` is `text-xs`, sub-44px. **Fix:** add `px-2 py-1`/min size. **Command:** `adapt`.
- **[P3] Elevation consistency.** Inputs use neither `tactile-input` inset. **Fix:** add it. **Command:** `polish`.
- **[P3] Focus ring on lime button.** Magenta ring over lime fill — verify visibility. **Command:** `audit`.

## Persona Red Flags

- **Sam (a11y):** dim placeholder (P1); show/hide missing aria-pressed (P2); magenta-on-lime ring visibility unverified.
- **Casey (mobile):** Show/Hide target too small (P2); otherwise solid.
- **Alex (daily user):** no remember-me/session — re-types every visit.
- **Jordan:** clear labels + help; fine, but admin-only recovery has no self-serve path.

## Minor Observations

- Card `p-8 md:p-10` exceeds token `card-padding` (24px) but reads intentional.
- `← Back to home` literal glyph — consider a Material Symbol for icon consistency.
- No `prefers-reduced-motion` needed (no infinite animation).

## Questions to Consider

1. Is stamping every label black-uppercase-tracked serving the daily-returning adult, or just the brand — at the cost of a calmer, faster login?
2. Why is recovery a generic "contact your administrator" instead of a real reset path for a tool staff use daily?
3. The button label is still a raw `#0c0c1f` hex — is the system quietly bypassing its own Token-Only Rule where it's hardest to notice?
