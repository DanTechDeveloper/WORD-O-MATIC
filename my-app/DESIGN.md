---
name: Word-O-Matic
description: One arcade, two players — a big, bold K-5 student game and a calm, dense teacher workbench, both sharing one dark cabinet.
colors:
  canvas: "#0c0c1f"
  surface: "#1e1e32"
  surface-high: "#28283d"
  ink: "#e2e0fc"
  ink-muted: "#ccc3da"
  action: "#a3e635"
  action-hover: "#bef264"
  action-deep: "#3f6212"
  quest: "#38bdf8"
  quest-deep: "#0284c7"
  chrome: "#d1bcff"
  chrome-deep: "#7000ff"
  magenta: "#ff3bc0"
  peach: "#ffb77f"
  outline: "#958da3"
  error: "#ffb4ab"
typography:
  display:
    fontFamily: "Lexend Variable, Lexend, sans-serif"
    fontSize: "clamp(2.5rem, 8vw, 6rem)"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Lexend Variable, Lexend, sans-serif"
    fontSize: "clamp(1.5rem, 4vw, 3rem)"
    fontWeight: 900
    lineHeight: 1.0
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Lexend Variable, Lexend, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "0.01em"
  body:
    fontFamily: "Plus Jakarta Sans Variable, Plus Jakarta Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Lexend Variable, Lexend, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "0.12em"
rounded:
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  unit: "8px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.canvas}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "16px 40px"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
    textColor: "{colors.canvas}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "16px 40px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "16px 40px"
  card:
    backgroundColor: "{colors.surface-high}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
---

# Design System: Word-O-Matic

## 1. Overview

**Creative North Star: "One Arcade, Two Players"**

Word-O-Matic is a glowing arcade cabinet in a dark room. The indigo-void canvas is the cabinet's shell; students press glowing panels that respond with hard, physical shadows and electric color; teachers open a quiet workbench under the same glow, where the cabinet's rules are still in force but the volume is all the way down.

This is not two products with two visual languages. It is one language with two dialects:

- **The K-5 Arcade (student experience):** huge type, physical buttons, single unmistakable action, and celebrations that land like winning a prize.
- **The Workbench (teacher experience):** the same cabinet, small and quiet — dense data, calm surfaces, one primary action, professional.

Depth is earned, not implied. Controls are buttons you could press with a thumb; every win is a moment of light; every teacher screen is a place you read the truth fast.

This system explicitly rejects all 30 AI slop patterns listed in §6. It also forbids raw default palette leaks — `slate-*`, `zinc-*`, `purple-*`, `lime-400`, `rose-500` — that some components have drifted into; always use the named tokens. See §6 Banned table and §11 Launch split for Student vs Teacher enforcement.

**Key Characteristics**
- Indigo-void canvas; depth from hard offset shadows, not soft blur.
- One action color (Arcade Lime) carries intent; everything else is chrome.
- Lexend for headings and labels; Plus Jakarta Sans for body reading.
- Two type volumes: huge on the student side, compact on the teacher side.
- Motion is physical for the student; still for the teacher.

---

## 2. The Shared Core (both experiences)

### Colors: The Arcade Palette

A dark, saturated, single-action palette. The canvas is near-black indigo; one lime action color does the work; violet, magenta, and peach are chrome, not competing accents.

**Primary**
- **Arcade Lime** (#a3e635): the single action color. Primary buttons, CTAs, active progress fills, the "play" moment. Used sparingly so its rarity reads as "go". Hover/bright `#bef264`; deep pair `#3f6212`.
- **Quest Cyan** (#38bdf8): read-mode / secondary-action color. Used where a clearly different secondary action exists (STORY QUEST, reading drills). Deep pair `#0284c7`.

**Secondary (chrome)**
- **Electric Violet** (#d1bcff): primary chrome — icon tints, badge titles, progress text. Low chroma, supports without shouting.
- **Magenta** (#ff3bc0) and **Peach** (#ffb77f): tertiary chrome for badges, avatars, celebrations. Decorative, never functional.

**Neutral**
- **Indigo Void** (#0c0c1f): canvas — page background, input wells.
- **Surface** (#1e1e32) / **Surface High** (#28283d): raised panels, cards.
- **Ink** (#e2e0fc) primary text; **Ink Muted** (#ccc3da) secondary text. Both clear WCAG AA on canvas.
- **Outline** (#958da3): borders/dividers at rest. **Error** (#ffb4ab): destructive / wrong-answer states.

**Shared Named Rules**
- **The One Action Color Rule.** Arcade Lime is the only "do this" color on a given screen, ≤ 10–15% of surface. Quest Cyan may mark a second, explicitly different action; never a third.
- **The Violet Shadow Rule.** Hard offset shadows use `#7000ff` (Violet Deep) or the surface's own dark tone — never a soft gray blur.

### Typography (faces)

- **Display:** Lexend (Variable fallback), 900.
- **Body:** Plus Jakarta Sans (Variable fallback), 500.
- **Label/Mono:** Lexend, 900, uppercase tracked.

The character: Lexend's geometric confidence gives headings arcade punch; Plus Jakarta Sans keeps instructions calm and legible. Students get the loud scale; teachers get the same faces at data density.

### Icons

Material Symbols Outlined everywhere. Students use filled (`FILL 1`) variants for action and celebration states; teachers keep outlined symbols. Never Lucide, never sparkle decorative icons, never random emojis as primary — purposeful emoji only as secondary for K-5 decode with alt text.

### Motion (baseline)

- Honors `prefers-reduced-motion` on every animation.
- Student motion is physical and alive (press, shake, surge).
- Workbench motion is nearly absent: only hover/focus `transition` and a single page-fade. No bounce, no pulse, no shine on teacher. `glow-pulse` in `tailwind.config.js` is gated to `[data-celebrate]` only, never on teacher chrome — see §10.

---

## 3. Student Experience — "K-5 Arcade, Play First"

### North Star for this track

The arcade cabinet turned up to classroom volume: every screen lit like a playable panel, one electric action color, giant text a five-year-old can read from across the room, and hard physical shadows that read as something you can actually press.

### Type Scale (student)

| Token    | Value (recommended)  | Notes                              |
| -------- | -------------------- | ---------------------------------- |
| Display  | clamp(3rem, 14vw, 9rem) | hero titles, big win numbers, splash. Almost always uppercase + italic. |
| Headline | clamp(2rem, 7vw, 5rem)  | section titles, card headers.     |
| Title    | 1.5–1.75rem            | sub-headers, level titles.        |
| Body     | ≥ 1.25rem (18px+)     | lesson copy, instructions. Line cap 65–75ch. |
| Label    | 0.875–1rem            | buttons, chips, stat captions. |

### The Split-Case Rule (student)

The old rule "every heading and button is uppercase" is **retired on the student side**, because early readers decode by word shape and ALL-CAPS destroys word shape.

- **ALL CAPS:** single-word or short (≤ 2–3 word) CTAs, labels, button text, chips, stat captions. e.g. `PLAY`, `LEVEL 1`, `SCORE`.
- **Sentence case:** all body copy, instructions, descriptions, subtitles, lesson text, badge descriptions. e.g. "Tap the word that matches the rest".

### Student Components (tuned)

- **Buttons:** chunky corners (rounded-xl=0.75rem), 2–4px border in canvas or Violet Deep. Primary = Lime fill + dark label + Tactile Button shadow; hover brightens; active drops 4px. Minimum touch target 48px in both dimensions. `Homepage.jsx:202` `w-full py-5 border-b-[8px] border-accent-deep` is canonical.
- **Cards:** Surface High, rounded-xl, Tactile Card offset shadow. Generous 24px pad; hover lifts -translate-y-1 once max; reduced motion keeps the lift.
- **Navigation:** fixed bottom bar, big w/h icons + word labels, active state shapes an unmistakable Lime block (never color-only). Students should only ever see ≤ 2 taps ahead. A primary action button is always visible in reach of the thumb. `Homepage.jsx:35` `min-h-screen flex items-center justify-center` — login is the CTA, no marketing hero above it `// ponytail: hero deferred until public signup exists`.
- **Progress Surge:** thick bar, Ink Muted track, Arcade Lime or Electric Violet fill, inset shadow + animated fill; the single most repeated "reward" moment.
- **Feedback:** win states always stack color + a full-word check + icon (so color-blind students are never asked to decode by color alone). Wrong states return instantly with a calm nudge, never a punishing animation streak.
- **Celebration (bounded):** confetti, shake, glow are reserved for rare, timed wins — a single celebration ≤ 3s with `prefers-reduced-motion` static fallback. Never more than ~2 celebratory screens in a 5-minute session.
- **Empty / onboarding states:** the game's own energy carries a first-run student — they never stall. Empty states still offer one obvious "go" button.

### Student Navigation Rules

- One primary path per screen; secondary paths are ghost icons in the corner.
- Bottom bar items in icon+word; active item is a filled Lime block with a hard offset.
- Deadlines/banners never block the action for locked pads: they inform only.
- During the onboarding tutorial, the nav remains visible (full opacity) but is temporarily `pointer-events-none` so the student stays on the guided path. (See `DashboardLayout` `disableNav`.)

---

## 4. Teacher Experience — "The Workbench"

### North Star for its track

The same arcade turned down into a quiet, dense, professional workbench: calm surfaces, small and legible data, one obvious primary action per screen, no confetti. It must let a teacher glance, judge, and act without spectacle.

### Type Scale (teacher)

| Token | Value (document) | Notes |
|---|---|---|
| Headline | 1.5rem                  | section titles (not black-uppercase) |
| Title    | 1.125rem                | sub-headers, card titles |
| Body     | 0.875–1rem, 1.5 line-height | table body, descriptions (≥ 14px) |
| Data/Numbers | 0.875–1rem `tabular-nums` | score, accuracy, columns |
| Label    | 0.75–0.875rem, 0.08–0.12em tracking | column headers, stat captions |

Titles are title-case, not ALL-CAPS. The black-uppercase rule does not apply — teacher headings are readable at a glance without shouting.

### Components (teacher)

- **Buttons:** standard utility size (32–44px target). Primary = Lime fill with ink label and muted `#3f6212` offset shadow; ghosts are flat on Surface; danger is quiet red. No playful active-bounce; focus-visible gets a clear ring. `Pages/Teacher/Students.jsx:142` `Add Student` is canonical.
- **Cards/panels:** Surface / Surface High, rounded-lg, thin outline border, soft offset shadow enforced as a *hint*, never the 8/8 violet slab. hover = row highlight, not jump.
- **Tables (the workhorse):** dense rows (40px min), clear column headers, `outline-variant` row separators, hover highlights a row, sticky header on scroll. Row actions are quiet icon buttons revealed on hover; the one primary action per row is an Icon with spoken label for accessibility. `Pages/Teacher/Students.jsx:353` desktop `hidden lg:table` vs mobile `block lg:hidden` `Students.jsx:224` is canonical.
- **Status chips:** pair color + word + icon — `ACHIEVED` (Lime), `IN PROGRESS` (Quest), `NOT STARTED` (outline), `ERROR` (error). Never a single color standing alone. No `slate-*`/`zinc-*`. `Pages/Teacher/Students.jsx:120` `riskStyles` + `Dashboard.jsx:137`.
- **Forms/inputs:** Input wells from the shared spec; inline validation with a clearly-visible error border AND a text message.
- **Empty / error:** calm and aspirational — a helpful illustration is fine, but keeps the teacher's next step obvious (with an action to hand).

### Motion (teacher)

- Only page-fade on load, hover states, focus rings. No glow, no shake, no confetti, no sound. `glow-pulse` never on teacher — see §10.

### Workbench Rules

1. **The primary-action floor:** each teacher screen has exactly one primary button, Lime, tactile.
2. **The glance:** leaderboard/class tables must be readable in a single scan — color positions the eye, never alone.
3. **The safety-net rule** — every anomaly (stuck student, missing module, approaching deadline) surfaces as a chip + word, not as decoration.
4. **No glass, no desktop bling** — the workbench stays opaque and honest.

---

## 5. Shared Components

Both sides use the same palette, the same tokens, same Material icons, but each side has its own shaping tables (student big/physical, teacher compact/quiet).

| Component | Student | Teacher |
|---|---|---|
| Primary button  | tactile (6px offset), Lime, 48px+ | Lime, muted offset, quiet, 40px |
| Ghost/secondary | flat slim, bordered | flat, outline border |
| Card           | Tactile Card 8/8 shadow, hover lift | subtle hint, row hover |
| Input          | large (well, `tactile-input`) | compact (well, standard) |
| Chip / badge   | big, filled, uppercase label | status chip (color+word+icon) |
| Navigation     | fixed bottom bar (big icons) | fixed left sidebar / drawer |
| Progress bar   | surge bar (Ink track → Lime surge) | thin bar or percent |
| Table          | avoided outside leaderboard | core of the workbench |
| Empty state    | fun & aspirational | calm & actionable |
| Error          | red flash + gentle retry, never punishing | alert inline, blocking only for critical |

---

## 6. Do's and Don'ts — 30 AI slop bans with instead

### Both experiences — Color and texture bans

| # | Ban | Instead |
|---|---|---|
| 1 | Harsh gradients | Solid fill plus hard offset `6px 6px 0 0 #7000ff` Violet Deep — never gradient mesh |
| 22 | Radial orbs | None. At most one capped `rgba(112,0,255,0.08)` at `Homepage.jsx` hero, static for `prefers-reduced-motion` |
| 23 | Dotgrids | None. Remove `home-grid-bg` dots or keep `opacity 0.04` max static |
| 8 | Liquid glass (blur, backdrop, gradient clip) | Opaque `bg-surface` / `bg-surface-container-high` — explicit reject glassmorphism |
| 4 | Rainbow coloring | One Lime `#a3e635` `≤15%` plus Quest `#38bdf8` only when second distinct action, never third |
| 20 | Purple and black gradient | Solid indigo void `#0c0c1f` canvas only |
| 29 | Neon overload | Lime is single neon, everything else muted `text-ink-muted` `border-outline` |
| 30 | Basic pastel swatches | Arcade saturated only |

### Both — Layout bans

| # | Ban | Instead |
|---|---|---|
| 6 | 3 feature cards in a row | Student: 2 cards `grid-cols-1 md:grid-cols-2` `Student/Dashboard.jsx:158`. Teacher: filter bar `Students.jsx:169` plus table `Students.jsx:353` |
| 13 | Bento grids | Linear stack or single table |
| 14 | Terminal window | None |
| 11 | Colored left stripe status | Dot plus word plus icon `Students.jsx:120` `riskStyles` |
| 17 | 3 pricing tiers | None — classroom license no pricing page `PRODUCT.md` `// ponytail: deferred until public sale` |
| 19 | Soft corner radius `2xl 3xl` | Ceiling `lg 0.5rem xl 0.75rem` `tailwind.config.js:101` |
| 18 | No real product demos | `Components/Student/GameplayDemo.jsx` real demo before any claim |

### Student stricter vs Teacher stricter

| # | Ban | Student vs Teacher |
|---|---|---|
| 28 | Hover bounce / shine | Student: one `hover:-translate-y-1` max `Student/Dashboard.jsx:176`. Teacher: color shift only `transition-colors duration-150` no translate |
| 5 | Soft drop shadow blur `blur-md` | Both hard offset `6px 6px 0 0 #7000ff` |
| 24 | Sparkle icons | Both: use `military_tech` badge not sparkle |
| 25 | Animated arrows | Both static `play_arrow` `Homepage.jsx:208` |
| 7 | Random decorative emojis | Student: purposeful emoji secondary with alt allowed; Teacher: never, Material icon only |
| 2 | Lucide icons | Both Material Symbols Outlined `DESIGN.md:190`, student filled `FILL 1` `Student/Dashboard.jsx:182` |

### Trust and copy bans

| # | Ban | Instead |
|---|---|---|
| 12 | Fake testimonials | None unless verifiable name plus section; prefer demo or table |
| 21 | No skeleton loaders | Calm `animate-pulse bg-surface-container-high` `Components/Shared/Skeleton.jsx` never shimmer glass |
| 26 | No TOS | `GET /terms` `Pages/Legal/Terms.jsx` public |
| 27 | No privacy policy | `GET /privacy` `Pages/Legal/Privacy.jsx` public |
| 16 | Checkmark bullets marketing list | Keep win check with word `ProgressBar` `BadgeCard`; marketing uses numbered steps not `✓` |
| 10 | Inter / Geist / Space Grotesk | Lexend 900 + Plus Jakarta Sans 500 `tailwind.config.js:114` only |
| 9 | Em dashes `—` in body | Period or colon for early readers `PRODUCT.md` Split Case — linter only |
| 15 | It is not x it is y headline | Direct: `Pick Your Game` `Student/Dashboard.jsx:122` |

### Both experiences — Keep

- **Do** use Arcade Lime as the only "action" color; let rarity signal intent.
- **Do** use named tokens (`bg-action`, `text-ink`, `border-chrome-deep`) — no raw `slate-*`/`zinc-*`/`purple-*`/`lime-400`/`rose-500` leaks.
- **Do** keep body text wherever possible; Ink / Ink Muted floor is WCAG AA.
- **Do** honor `prefers-reduced-motion` — keep state changes, drop the translate/decoration.
- **Do** keep tap targets ≥ 48px on student and ≥ 32px teacher.
- **Don't** use glassmorphism AI-slop (blur, backdrop, gradient clip).
- **Don't** build generic corporate edtech (blue/white, stock, flat).
- **Don't** infantize (baby-cartoon, low contrast).
- **Don't** add a third action color; lime + cyan is the ceiling.

### Student (K-5 Arcade) only

- **Do** use huge display type and sentence-case body for reading (*see the split-case rule*).
- **Do** deliver one unmistakable action; every lesson is two taps from play.
- **Do** celebrate rarely and boundedly (≤ 3s) with reduced-motion fallback.
- **Don't** ALL-CAPS long instructions or lesson body.
- **Don't** gate onboarding behind a timer/streak.
- **Don't** use color-only feedback.

### Teacher (Workbench) only

- **Do** keep type compact and `tabular-nums` in data; title-case headers.
- **Do** keep tables dense with clear hover + one primary action per screen.
- **Do** keep all motion surgical; keyboard and visible focus everywhere.
- **Don't** bring confetti/glow/shake to the workbench.
- **Don't** make teacher screens the game's emissions; the workbench stays accountable.

---

## 7. The Signature Moment

**The Progress Surge** (student) — a thick bar that fills in Arcade Lime / Electric Violet over an Ink Muted track, animating home on a win, always with the physical/ tactile gesture language. It is the single most repeated "reward" in the game loop. On the teacher side the same data point is a thin, status-colored bar in a table — information, not ceremony.

---

## 8. Student vs Teacher, side by side

| | Student | Teacher |
|---|---|---|
| Verb | Play | Manage |
| Type | Huge (Display clamp 3–9rem) | Compact/legible (Headline 1.1-1.5rem) |
| Case | Mixed: labels caps, sentences sentence | Sentence/title case |
| Motion | Alive (press, bounce, shine) | Still (fade, hover) |
| Navigation | Bottom bar, ≤ 2 taps to play | Sidebar + table scan |
| Density | Low, one message fits | High, many rows fit |
| Celebration | Bounded moments of light | Never celebratory |

---

## 9. Deprecated / Removed From v1

- The blanket "every heading and button is uppercase" rule (superseded by Split-Case).
- The blanket assumption that teacher pages need the same arcade volume as student screens — teacher shadows are minimized now.
- The practice of applying student density (huge type, chunky buttons, giant taps) to the teachers.

## 10. Token gaps vs the codebase (next updates)

While this document is the vision, `tailwind.config.js` still carries the older scale. The working tokens should move to the student values above. The work items worth doing, when editing tokens next:

- `glow-pulse` and `shimmer` in `tailwind.config.js:25-45` are gated to `[data-celebrate]` only — never on teacher chrome. Teacher uses no glow `// ponytail: glow gated to celebration, add broader use only if kid testing shows need`.
- Add student-typed sizes: `text-display`, bump body floors.
- Keep the existing color tokens (they already match the spec exactly).
- Nothing else changes.

(This section is a roadmap, not license to convert — students begin with a phase-based transition so both experiences stay coherent.)

## 11. Launch essentials — 19 split Student vs Teacher

`Keep` ships now, `Deferred // ponytail` adds when condition met. Inputs locked: 1 wala muna address placeholder, 2 none on student zero tracking COPPA, 3 thank you yes redirect, 4 OG from existing arcade screenshot.

| # | Essential | Student | Teacher | Owner file | Accept check |
|---|---|---|---|---|---|
| 1 | Custom 404 page | Keep — kid 404 big 404 sentence one Lime GO HOME | Keep — pro 404 dense title case Go to dashboard | `resources/views/errors/404.blade.php` via `auth.role` | `/nope` shows correct branch |
| 2 | CTA above the fold | Deferred — login IS CTA `Homepage.jsx:202` `// ponytail: no marketing hero until public signup` | Keep — one primary per screen `Students.jsx:142` Add Student | `Pages/Auth/Homepage.jsx:34` + `Pages/Teacher/Students.jsx:132` | PLAY at 375px no scroll |
| 3 | Meta title per page | Keep per page `Head title` `Student/Dashboard.jsx:121` | Keep per page `Teacher/Dashboard.jsx:154` | `resources/js/Pages/*` + `app.blade.php:7` | view source title |
| 4 | Meta description per page | Keep one line | Keep one line | `app.blade.php:7` + per page Head | view source desc |
| 5 | Open Graph image | Deferred — teacher OG covers crawler | Keep — existing arcade screenshot `public/og-image.png` 1200x630 | `public/og-image.png` + `app.blade.php:7` | og:image present |
| 6 | Favicon set | Keep `favicon.ico` + `apple-touch-icon.png` minimal | Keep plus `site.webmanifest` | `public/favicon.ico` etc | `/favicon.ico` serves |
| 7 | robots.txt | Deferred — teacher file covers | Keep allow `/` `/teacher/login` `/privacy` `/terms` disallow `/student` `/teacher/*` | `public/robots.txt` | `curl` has `Sitemap:` |
| 8 | sitemap.xml | Deferred student gated `role:student` never indexed | Keep 4 public URLs only | `public/sitemap.xml` + `routes/web.php` `GET /sitemap.xml` | valid xml |
| 9 | Alt text on every image | Keep avatars badges `Dashboard.jsx:134` | Keep avatars charts `Students.jsx:246` | `Components/Student/*` `Components/Teacher/*` | Wave audit pass |
| 10 | Mobile breakpoints | Keep `sm 640 md 768` `Student/Dashboard.jsx:158` | Keep `block lg:hidden` table `hidden lg:block` `Dashboard.jsx:290` | `DESIGN.md` + Tailwind | 375px no overflow |
| 11 | Sticky mobile CTA | Deferred `// ponytail` PLAY full width in reach, sticky covers game | Keep header `fixed top-0` `DashboardLayout.jsx:86` no extra bar | `Layouts/Teacher/DashboardLayout.jsx:86` | header sticky on scroll |
| 12 | Loading states | Keep calm `animate-pulse` no shimmer | Keep table skeleton rows | `Components/Shared/Skeleton.jsx` | skeleton on nav |
| 13 | Form error states | Keep gentle `Homepage.jsx:168` `aria-invalid` | Keep inline `AddStudentModal` `EditStudentModal` | `Components/Teacher/*` | word plus border |
| 14 | Thank-you page | Deferred kid reward is `BadgeUnlockFlow` not page | Keep yes `oo` after `POST /teacher/reports/send-emails` | `Pages/Teacher/Thanks.jsx` + `ReportController` | `/teacher/reports/thank-you` shows counts |
| 15 | Privacy policy page | Deferred teacher legal covers | Keep `GET /privacy` | `Pages/Legal/Privacy.jsx` | `/privacy` public |
| 16 | Terms page | Deferred same | Keep `GET /terms` | `Pages/Legal/Terms.jsx` | `/terms` public |
| 17 | Cookie banner | Deferred none on student `// ponytail: session only` | Deferred `// ponytail: add only if analytics enabled` since none | `Components/Shared/CookieBanner.jsx` env gated | no banner until analytics |
| 18 | Analytics installed | Deferred none on student COPPA `// ponytail` | Deferred env gated default off | `app.blade.php` conditional when `VITE_ANALYTICS_ID` | no script until env |
| 19 | Real contact address | Deferred `wala muna // ponytail: replace when school address provided` placeholder `Address to come` | Deferred same placeholder | `Components/Shared/Footer.jsx` + `Layouts` | footer shows placeholder |

