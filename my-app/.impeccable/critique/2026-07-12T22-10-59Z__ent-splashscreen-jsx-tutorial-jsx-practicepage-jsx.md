---
target: resources/js/Pages/Student/SplashScreen.jsx,Tutorial.jsx,PracticePage.jsx
total_score: 20
p0_count: 3
p1_count: 3
timestamp: 2026-07-12T22-10-59Z
slug: ent-splashscreen-jsx-tutorial-jsx-practicepage-jsx
---
# Critique: Student Flow — SplashScreen · Tutorial · PracticePage

## Design Health Score (flow-level)

Method: dual-agent (A: ses_0a79fcc6affeUBdstU7SZhmucP · B: ses_0a79fc1b9ffeqcKWRGyloYWg53)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of Status | 3 | Progress dots + "Complete" overlays; splash has none. |
| 2 | Match System / Real World | 2 | Friendly "Word Buddy" good; emoji/sky/monospace mismatch the system. |
| 3 | User Control & Freedom | 2 | `guideLocked` "Wait for the guide" overlay can trap a child. |
| 4 | Consistency & Standards | 1 | Pervasive zinc/sky/monospace/glass/external-texture drift. |
| 5 | Error Prevention | 2 | Whole-screen-clickable splash invites accidental skip. |
| 6 | Recognition > Recall | 3 | Avatar guide + clear mode labels reduce memory load. |
| 7 | Flexibility & Efficiency | 1 | No skip for students who don't need the step-by-step. |
| 8 | Aesthetic & Minimalist | 2 | Emoji, neon glows, gradients, glass — not minimalist. |
| 9 | Help & Documentation | 2 | Contextual avatar help strong; thin error-help copy. |
| 10 | Error Recovery | 3 | DeniedModal + "NO PRESSURE" reassurance is genuinely good. |
| **Total** | | **~20/40** | **Acceptable (Poor edge)** |

## Anti-Patterns Verdict

**LLM assessment:** Reads as generic AI/template output on entry. Concrete tells: rainbow neon glow hero with 5 hues none in the palette (SplashScreen L5/L51); monospace `Courier New` title (L50) vs the Lexend brand; emoji-spam (🤖⚡🔒📖🎭🚀🏠) instead of Material Symbols; glassmorphism `backdrop-blur-*` overlays (Tutorial L147/180/190/251/260/268); an external `transparenttextures.com` texture URL (Tutorial L144/214); a third accent `sky-400` when the system's second color is magenta `secondary-container`; and **zero tactile hard shadows** — the "Tactile Arcade" signature is entirely absent from all three.

**Deterministic scan:** exit code 2, 6 findings — `bounce-easing` (Splash L117), `gray-on-color` (L117, Tutorial L319), `side-tab` border-r-4 (Tutorial L137), `design-system-color` advisories (Splash L107, sky-400). Manual grep confirmed the detector's blind spots: glassmorphism (7 hits), emoji overload (24+ glyphs), `bg-zinc-950` flood (10+ lines), `sky-400` third color, arbitrary z-index (`z-[100]`/`z-[60]`), repeated uppercase tracked eyebrows, and the external URL hotlink. PracticePage is detector-clean but still carries `sky-400` + emoji + `z-[60]`.

**Visual overlays:** Not available — no browser-automation tool exposed; fallback = CLI + manual grep.

## Overall Impression

`PracticePage` is the only file near the 32–34/40 bar set by the Auth pages. The entry (Splash + Tutorial) drags the flow down: sensory-overload neon, a foreign cyan, monospace, glass, and a fragile external texture. The peak-end (badge unlock) is good; the entry is the weak link.

## What's Working

1. **Progress dots** — clear position-in-flow, animated, token-colored.
2. **Avatar speech-bubble guide** — personified, contextual, reduces first-run anxiety.
3. **Tactile mic + DeniedModal + 3-2-1 countdown** — practice activation is well-considered and reassuring.

## Priority Issues

- **[P0] `sky-400` third color** (Tutorial + PracticePage). System's second color is `secondary-container` magenta. **Fix:** swap sky → `secondary-container` for Story Quest/speak "current" role. **Command:** `colorize`.
- **[P0] Off-system canvas `bg-zinc-950`** (Splash + Tutorial). **Fix:** `bg-background` (#111125) everywhere; gradients terminate in `background`/`surface-*`. **Command:** `colorize`.
- **[P0] Missing tactile language** — no hard offset shadows anywhere. **Fix:** apply `tactile-card`/`tactile-button` (single `#4c1d95` shadow) to mode cards, buttons, modals. **Command:** `polish`.
- **[P1] Glassmorphism overlays** (`backdrop-blur-*`). **Fix:** solid `surface-container-high` panels + tactile border. **Command:** `quieter`.
- **[P1] External texture URL** (Tutorial L144/214). **Fix:** remove; at 3% opacity it's negligible; inline SVG/noise data-URI if needed. **Command:** `distill`.
- **[P1] Monospace font** (Splash L50). **Fix:** `font-headline-xl` (Lexend). **Command:** `typeset`.
- **[P2] Emoji spam → Material Symbols** (`smart_toy`, `bolt`, `lock`, `menu_book`, `theater_comedy`, `rocket`, `home`, `mic`, `schedule`, `auto_awesome`). **Command:** `distill`.
- **[P2] Reduced-motion hazards** — infinite `animate-bounce`/`animate-pulse` with no `prefers-reduced-motion` guard. **Fix:** gate loops; crossfade/instant under reduced-motion. **Command:** `harden`.
- **[P2] Inline SVG play triangles** (Tutorial L155/227) → Material Symbols `play_arrow`. **Command:** `distill`.
- **[P3] Splash affordance conflict** — full-screen `onClick` + Play button + "tap anywhere". **Fix:** single CTA. **Command:** `clarify`.
- **[P3] Soft shadow + raw slate on Continue** (Tutorial L319) → `tactile-button` + token label. **Command:** `polish`.

## Persona Red Flags

- **Jordan (young first-timer):** Splash full-screen click + neon overload with no button hierarchy; Tutorial `guideLocked` "Wait for the guide 👀" *locks* interaction; lime-vs-sky mode confusion ("which game am I in?").
- **Sam (a11y):** infinite `animate-bounce`/`animate-pulse` with no reduced-motion guard; emoji not `aria-hidden`; `backdrop-blur` overlays cut contrast; avatar bubble (`onClick` div) not keyboard-focusable.
- **Riley (stress):** mic-denied path is good (DeniedModal + "NO PRESSURE"); verify modal offers explicit re-request CTA.
- **Casey (mobile):** external carbon-fibre URL wastes bandwidth/fails offline; heavy infinite animations drain battery; otherwise layout is reasonable.

## Minor Observations

- Arbitrary z-index soup (`z-[100]`/`z-[60]`/`z-[5]`/`z-[30]`/`z-[40]`/`z-[50]`) — adopt a semantic scale.
- `text-slate-950` on lime buttons should be token `#0c0c1f`.
- `tracking-[0.3em]` (Splash L123) exceeds the 0.1em label token.
- Gradients `from-lime-400/20 to-zinc-950` — prefer flat token surfaces + tactile shadow.

## Questions to Consider

1. Why does Story Quest get a foreign cyan when `secondary-container` magenta is already the system's "you-are-here" chrome — was the second color ever decided?
2. The entire Tactile Arcade signature is absent from these three screens — is the design system only enforced on Auth/landing?
3. A first-run child meets a full-screen-clickable neon splash then "Wait for the guide 👀" lockdown — is onboarding reducing or adding anxiety?
4. The carbon-fibre texture is fetched from a third-party URL every load — acceptable in a kids' classroom app behind school firewalls?
