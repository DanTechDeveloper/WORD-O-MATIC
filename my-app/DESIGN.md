---
name: Word-O-Matic
description: Tactile Arcade — a playful, electric, bold literacy game for K-5 students.
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

**Creative North Star: "The Arcade Cabinet"**

Word-O-Matic is a glowing arcade cabinet in a dark room. The indigo-void canvas
is the cabinet's shell; every screen is a playable panel lit by one electric
action color and framed in hard, physical shadows that read as real depth. Depth
is earned, not implied — controls are buttons you could press with a thumb, and
every win is a moment of light. The personality is playful, electric, and bold:
confident arcade energy without losing clarity, a little mischievous, never
childish and never corporate.

This system explicitly rejects **glassmorphism AI-slop** (blurred glass cards,
gradient-clipped text, generic AI sheen), **generic corporate edtech SaaS**
(blue/white admin dashboards, stock illustrations, flat minimalism), and
**infantilized "baby" styling** (overly cartoonish, low-contrast,
undifferentiated). It also forbids raw default palette leaks — `slate-*`,
`zinc-*`, `purple-*`, `lime-400`, `rose-500` and friends — that some components
have drifted into; always use the named tokens.

**Key Characteristics:**
- Indigo-void canvas; depth comes from hard offset shadows, not soft blur.
- One action color (Arcade Lime) carries intent; everything else is chrome.
- Lexend black-uppercase for headings; Plus Jakarta Sans for reading.
- Chunky 2–4px borders and large, forgiving tap targets for small hands.
- Motion is physical: buttons press down, streaks shake, progress surges.

## 2. Colors: The Arcade Palette

A dark, saturated, single-action palette. The canvas is near-black indigo; one
lime action color does all the work; violet, magenta, and peach are chrome, not
competing accents.

### Primary
- **Arcade Lime** (#a3e635): the single action color. Primary buttons, CTAs,
  active progress fills, the "play" moment. Used sparingly so its rarity reads
  as "go". Hover/bright is `#bef264`; deep shadow pair is `#3f6212`.
- **Quest Cyan** (#38bdf8): the read-mode / secondary-action color. Used where a
  second distinct action exists (STORY QUEST, reading drills) so it never
  competes with lime for "primary". Deep pair `#0284c7`.

### Secondary
- **Electric Violet** (#d1bcff): primary chrome — icon tints, badge titles,
  progress text, accent fills. Lower chroma than the action so it supports
  without shouting.
- **Magenta** (#ff3bc0) and **Peach** (#ffb77f): tertiary chrome for variety in
  badges, avatars, and celebratory moments. Decorative, never functional.

### Neutral
- **Indigo Void** (#0c0c1f): the canvas — page background and input wells.
- **Surface** (#1e1e32) / **Surface High** (#28283d): raised panels, cards,
  chips. Stepped so nesting reads.
- **Ink** (#e2e0fc): primary text on the void. **Ink Muted** (#ccc3da):
  secondary text, captions, labels. Both clear WCAG AA on the canvas.
- **Outline** (#958da3): borders and dividers at rest. **Error** (#ffb4ab):
  destructive / wrong-answer states.

### Named Rules
**The One Action Color Rule.** Arcade Lime is the only "do this" color on any
given screen; it appears on ≤10–15% of the surface. Its rarity is the point.
Quest Cyan may mark a second, explicitly different action; never a third.

**The Violet-Deep Shadow Rule.** Hard offset shadows use `#7000ff` (Violet
Deep) or the surface's own dark tone — never a soft gray blur. The shadow color
is part of the brand, not a default.

## 3. Typography

**Display Font:** Lexend (with `Lexend Variable` fallback)
**Body Font:** Plus Jakarta Sans (with `Plus Jakarta Sans Variable` fallback)
**Label/Mono Font:** Lexend (uppercase, tracked) for labels and buttons

**Character:** Lexend's geometric confidence gives headings an arcade-sign
punch; Plus Jakarta Sans keeps long instructions calm and legible. The contrast
is the system: shout with Lexend, read with Jakarta.

### Hierarchy
- **Display** (900, clamp(2.5rem, 8vw, 6rem), line-height 0.95, -0.04em): hero
  titles, splash screens, big win numbers. Almost always uppercase + italic.
- **Headline** (900, clamp(1.5rem, 4vw, 3rem), -0.02em): section titles,
  card headers, leaderboard names.
- **Title** (900, 1.25rem): sub-headers, badge names, modal titles.
- **Body** (500, 1rem, line-height 1.6): instructions, descriptions,
  paragraphs. Cap line length at 65–75ch.
- **Label** (900, 0.75rem, letter-spacing 0.12em, uppercase): buttons, nav
  items, chips, stat captions. The workhorse of the arcade voice.

### Named Rules
**The Black-Uppercase Rule.** Every heading and button is `font-black`,
`uppercase`, and tracked. Lowercase or light weights read as "app", not
"arcade" — prohibited outside body copy.

## 4. Elevation

This system uses **hard offset shadows**, not soft ambient blur. Depth is
physical: a button floats above the void on a solid violet slab; pressed, it
drops. Tonal layering (the surface steps) handles nesting; the hard shadow
handles interaction. Glassmorphism (backdrop-blur, translucent glass) is
explicitly forbidden.

### Shadow Vocabulary
- **Tactile Card** (`box-shadow: 8px 8px 0 0 #4c1d95`): the signature panel
  lift. Panels, cards, avatar tiles at rest and on hover.
- **Tactile Button** (`box-shadow: 0 6px 0 0 #4c1d95`): resting lift on primary
  buttons. On `:active` it collapses to `0 2px 0 0 #4c1d95` and the button
  translates down 4px — a real press.
- **Surface Offset** (`8px 8px 0 0 #1a1a2e`): a softer, same-hue variant used
  inside nested surfaces so depth stays readable without violet everywhere.

### Named Rules
**The Physical Press Rule.** Shadows appear as a response to state (rest,
hover, active), never as decoration. A control at rest has its full offset; on
press it shrinks and drops. Reduced-motion users get the state change without
the translate.

## 5. Components

### Buttons
- **Shape:** rounded-xl (rounded-md token, 0.75rem); chunky 2–4px border in the
  canvas or Violet Deep.
- **Primary:** Arcade Lime fill, Indigo-Void label, uppercase Lexend black,
  Tactile Button shadow. Hover brightens to `#bef264`; active drops 4px.
- **Hover / Focus:** brightness shift + the press translate; focus-visible gets
  a 4px ring in Magenta/Violet (`ring-secondary-container`).
- **Ghost / Secondary:** transparent fill, Ink label, bordered; used for
  back/cancel. Quest Cyan variant marks the read-mode action.

### Cards / Containers
- **Corner Style:** rounded-xl (0.75rem).
- **Background:** Surface High (#28283d) for raised panels, Surface (#1e1e32)
  for nested.
- **Shadow Strategy:** Tactile Card offset; border 2–4px in Violet Deep or
  Outline.
- **Internal Padding:** 24px (spacing-lg) on desktop, scaling down on mobile.
- **State:** hover lifts -translate-y-1; reduced-motion disables the lift.

### Inputs / Fields
- **Style:** Indigo-Void well, 2px border in Outline or Violet Deep, rounded-lg.
- **Focus:** 2px ring in Magenta (`focus:ring-secondary`) + border shift to
  Violet Deep. Never a soft glow.
- **Error / Disabled:** Error (#ffb4ab) border + label; disabled drops opacity.

### Navigation
- **Student:** fixed bottom bar, Indigo-Void, 2–4px top border in Outline.
  Active item brightens to Ink; icons are Material Symbols Outlined.
- **Teacher:** fixed left sidebar (desktop) / drawer, Indigo-Void with a 4px
  Violet-Deep right border and a hard `#1e1b4b` edge shadow. Active item is a
  solid Arcade Lime block with a hard `#3f6212` offset — a lit-up cabinet
  button.

### Chips / Badges
- **Style:** pill (rounded-full), Surface fill, Ink label, uppercase Lexend.
- **State:** selected = Arcade Lime fill; progress chips show a hard-inset fill
  bar. The "EARNED" stamp is a rotated Lime block with a hard black border —
  the cabinet's prize ticket.

### Signature Component
- **The Progress Surge.** A thick bar (Ink Muted track) that fills in Arcade
  Lime or Electric Violet with an inset hard shadow, animating to 100% on win.
  It is the single most repeated "reward" moment in the game loop and should
  always carry the Tactile/Physical-Press language.

## 6. Do's and Don'ts

### Do:
- **Do** use Arcade Lime as the only "action" color on a screen; let its rarity
  signal intent.
- **Do** use hard offset Violet-Deep shadows (`8px 8px 0 0 #4c1d95`) for depth —
  never soft blur.
- **Do** set every heading and button in Lexend `font-black uppercase` with
  tracking.
- **Do** keep tap targets large (≥44px) and borders chunky (2–4px) for small
  hands.
- **Do** honor `prefers-reduced-motion`: keep state changes, drop the translate.
- **Do** use the named tokens (`bg-action`, `text-ink`, `border-chrome-deep`);
  pull new values from `tailwind.config.js`.

### Don't:
- **Don't** use glassmorphism AI-slop: blurred glass cards, backdrop-filter
  sheen, gradient-clipped text.
- **Don't** build a generic corporate edtech SaaS look — blue/white dashboards,
  stock illustrations, flat minimalism.
- **Don't** infantilize: no baby-cartoon styling, no low-contrast
  undifferentiated shapes.
- **Don't** use raw default palette leaks (`slate-*`, `zinc-*`, `purple-*`,
  `lime-400`, `rose-500`) — they break the cabinet. Use the named tokens.
- **Don't** add a third action color; lime + cyan is the ceiling.
- **Don't** use side-stripe borders (>1px colored left/right border) as accents
  — use full borders or background tints.
- **Don't** let body text fall below WCAG AA; keep Ink / Ink Muted as defined.
