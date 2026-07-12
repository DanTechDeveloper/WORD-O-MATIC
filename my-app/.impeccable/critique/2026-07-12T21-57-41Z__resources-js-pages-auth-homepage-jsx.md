---
target: resources/js/Pages/Auth/Homepage.jsx
total_score: 32
p0_count: 0
p1_count: 0
timestamp: 2026-07-12T21-57-41Z
slug: resources-js-pages-auth-homepage-jsx
---
# Critique: Auth/Homepage.jsx (re-run, post-fix) — On-System Tactile Arcade

## Design Health Score

Method: dual-agent (A: ses_0a7ae2107ffeOHgbVJfYP239hq · B: ses_0a7ae17b2ffeUwIVd2fEFWwTa4)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | "Logging in…" label + disabled while processing; could add spinner. |
| 2 | Match System / Real World | 4 | "Enter your name & PIN" + teacher hint — audience-perfect. |
| 3 | User Control and Freedom | 3 | Smooth-scroll nav + mobile toggle fine. |
| 4 | Consistency and Standards | 4 | Fully on the Material-3 Tactile Arcade token system. |
| 5 | Error Prevention | 3 | Numeric PIN + autocomplete; still no maxLength/client check. |
| 6 | Recognition Rather Than Recall | 3 | Clear labels + placeholders. |
| 7 | Flexibility and Efficiency | 3 | Autocomplete on name; reasonable. |
| 8 | Aesthetic and Minimalist Design | 4 | Orbs/glows removed; one hard tactile shadow per raised surface. |
| 9 | Help and Documentation | 4 | Contextual teacher hint; errors now aria-live. |
| 10 | Error Recovery | 4 | Errors announced via aria-live; clear copy. |
| **Total** | | **32/40** | **Good (edge of Strong)** |

## Anti-Patterns Verdict

**LLM assessment:** Not generic. The black-uppercase-italic Lexend voice + tactile button physics give real brand personality. The prior off-system tells are gone: no glass, no zinc/purple/green, no oversized radii, no Terminal label. The four soft-blur orbs were removed entirely (the loudest prior tell), feature cards now share the `tactile-card` shadow, the CTA emoji was swapped for a Material Symbol (`rocket_launch`), and the wordmark now uses the Lexend display face.

**Deterministic scan:** exit code 0 — CLEAN. All previously-flagged off-system tokens confirmed removed; only residual is the intentional `text-[#0c0c1f]` on lime (high-contrast label, not decorative).

**Visual overlays:** Not available — no browser-automation tool exposed; fallback = CLI + manual grep.

## Overall Impression

From 16/40 (Poor) to 32/40 (Good) in one rebuild. The page now reads as the same product the student enters. Remaining nit: the login is still the last section (returning students scroll past hero/features/about) — an IA question, not a visual defect.

## What's Working

1. **Token discipline is real** — `background`, `surface-*`, `accent`/`accent-deep`, `on-surface-variant`, `error`, `outline` throughout.
2. **Unified tactile depth** — feature cards, login card, and buttons all share the hard-offset / press-depth language.
3. **Audience-appropriate** — numeric PIN, teacher hint, "Enter your name & PIN" plain copy, aria-live errors.

## Priority Issues

- **[P2] Login buried below marketing.** Returning students scroll past 3 sections to reach `#login`. **Fix:** surface a compact login entry in the hero, or reorder. **Command:** `layout`.
- **[P3] No PIN maxLength / client validation.** Paste of 500 chars accepted. **Fix:** `maxLength`, light client check. **Command:** `harden`.

(All P0/P1 from the prior run resolved.)

## Persona Red Flags

- **Jordan:** "Enter your name & PIN" + teacher hint remove the prior jargon valley. Solid.
- **Riley:** aria-live errors now announced; focus-visible rings added; still no input bounds.
- **Casey:** `inputMode="numeric"` + large tap targets; still must scroll to login.

## Minor Observations

- Footer links / nav now have `focus-visible:ring-secondary-container` rings.
- `accent-hover` (#bef264) tokenized; `hover:bg-lime-300` replaced.
- Two `<h1>`s resolved — only the hero is `<h1>`.

## Questions to Consider

1. Is a full hero→features→about→login funnel right for a page whose main user is a returning child typing a name + PIN?
2. Would a compact login card in the hero (keeping the funnel below) lift conversion without losing the marketing?
