---
name: Word-O-Matic
description: A gamified vocabulary-learning platform for students and teachers — tactile arcade energy on a Material 3 dark base.
colors:
  background: "#111125"
  surface: "#1e1e32"
  surface-high: "#28283d"
  primary: "#d1bcff"
  primary-container: "#7000ff"
  secondary-container: "#ff3bc0"
  tertiary: "#ffb77f"
  on-surface: "#e2e0fc"
  on-surface-variant: "#ccc3da"
  outline: "#958da3"
  accent: "#a3e635"
typography:
  display:
    fontFamily: "Lexend Variable, Lexend, sans-serif"
    fontSize: "clamp(2rem, 6vw, 5rem)"
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Lexend Variable, Lexend, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2.25rem)"
    fontWeight: 900
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Plus Jakarta Sans Variable, Plus Jakarta Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.6
  label:
    fontFamily: "Lexend Variable, Lexend, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 900
    letterSpacing: "0.1em"
    textTransform: "uppercase"
rounded:
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  pill: "9999px"
spacing:
  unit: "8px"
  card-padding: "24px"
  gutter: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#0c0c1f"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "16px 40px"
  button-primary-hover:
    backgroundColor: "#bef264"
  button-primary-active:
    backgroundColor: "{colors.accent}"
---

# Design System: Word-O-Matic

## 1. Overview

**Creative North Star: "The Tactile Arcade"**

Word-O-Matic is a vocabulary playground disguised as a game console. The
base is a deep indigo-black "stage" (`#111125`) lifted straight from a
Material 3 dark theme, but the personality comes from **hard, offset,
no-blur shadows** — the "tactile" language in `app.css` — that make every
card and button feel like a physical game piece you can press. Bright
**arcade lime** (`#a3e635`) is the single player-highlight color: it marks
every CTA, progress bar, and active state. Lavender, electric violet, and
hot magenta are the system chrome — present, but never competing with the
lime for attention.

This system explicitly rejects soft, flat SaaS minimalism, gradient-text
decorative effects, glassmorphism, and the muted-cream "AI default"
palette. It also rejects the **ad-hoc neobrutalist drift** currently found
on the public landing page (raw `zinc-*` / `purple-500` / `green-800`
utilities, inconsistent radii, and a "Terminal" label that the visuals
don't honor). The app and the marketing surface must speak the same
language.

**Key Characteristics:**
- Deep indigo-black canvas (`#111125`) with layered surfaces for depth.
- One hard offset shadow per raised surface — never soft blur, never a
  different shadow color per component.
- A single action/highlight accent: arcade lime.
- Lexend (geometric, heavy) for display + UI; Plus Jakarta Sans for body.
- Material Symbols Outlined for iconography (filled `1` when active).

## 2. Colors

A Material 3 dark role system, deepened and sharpened for a game feel.
Lime is the de-facto action color but is **not yet a named token** — it is
used as Tailwind's default `lime-400` throughout the app and must be
promoted to a first-class token (captured here as `accent`).

### Primary
- **Lavender Mist** (`#d1bcff`): primary text-on-accent and icon tints
  (badge icons, earned markers). Used as `primary` token.
- **Electric Violet** (`#7000ff`): `primary-container`, the structural
  "tactile" shadow color in `app.css` (`#4c1d95` is its darkened cousin).
  Used for deep panel shadows and violet glows.

### Secondary / Tertiary
- **Hot Magenta** (`#ff3bc0`): `secondary-container`. Marks the *current*
  level, focus rings, and active nav accents. The "you are here" color.
- **Peach Glow** (`#ffb77f`): `tertiary`. Used sparingly for warm
  highlights and tertiary fixed tints.

### Neutral
- **Indigo Void** (`#111125`): `background` and `surface-dim`. The page
  canvas. The single most important color; everything sits on it.
- **Elevated Indigo** (`#28283d`): `surface-container-highest`. Raised
  cards, panels, modals.
- **Lavender White** (`#e2e0fc`): `on-surface` / `on-background`. Primary
  text color. High contrast on the void.
- **Muted Lavender** (`#ccc3da`): `on-surface-variant`. Secondary text,
  metadata, de-emphasized labels.
- **Slate Outline** (`#958da3`): `outline`. Borders, dividers, disabled
  states.

### The de-facto accent (promote to token)
- **Arcade Lime** (`#a3e635`, Tailwind `lime-400`): the action/highlight
  color. CTAs, progress fills, PLAY buttons, active states, badges'
  "EARNED" sheen. Currently untokenized — every usage reaches for the
  Tailwind default. Codify it as `accent` so it cannot drift.

### Named Rules
**The One Pop Color Rule.** Arcade lime is the *only* action/highlight
color on any screen. Violet, magenta, and peach are chrome, not calls to
action. If two elements are both lime and both shout "click me," one of
them is wrong.

**The Token-Only Rule.** Build every surface with the named Material 3
tokens (`background`, `surface-*`, `primary-*`, `secondary-container`,
`on-surface*`, `outline`, `accent`). Never reach for raw Tailwind
`zinc-*` / `slate-*` / `purple-*` defaults. The public landing page
currently violates this and must be brought on-system.

## 3. Typography

**Display Font:** Lexend Variable (with Lexend fallback)
**Body Font:** Plus Jakarta Sans Variable (with Plus Jakarta Sans fallback)
**Label/Icon Font:** Lexend Variable; Material Symbols Outlined for icons

**Character:** A geometric, near-black display face (Lexend at weight 900)
set against a humanist, friendly body face (Plus Jakarta Sans). The
contrast axis is *geometric display + humanist body* — a deliberate,
on-brief pairing, not two similar sans competing. Display type is almost
always **uppercase, italic, and tightly tracked** (`-0.04em`) for a
sports/arcade signage feel.

### Hierarchy
- **Display** (900, clamp(2rem,6vw,5rem), line-height 0.9, -0.04em):
  Hero headlines, section titles. Often italic + uppercase.
- **Headline** (900, clamp(1.5rem,3vw,2.25rem), -0.02em): card titles,
  modal headers, in-card headings.
- **Title** (900, ~1.125rem): list-item and badge headings, button labels.
- **Body** (700, 1rem, line-height 1.6): paragraphs, descriptions,
  metadata. Cap measure at ~70ch.
- **Label** (900, 0.75rem, 0.1em, uppercase): eyebrows, nav items, form
  labels, button text. The workhorse of the UI voice — almost everything
  small is a black uppercase label.

### Named Rules
**The Black-Uppercase Rule.** Small UI text is Lexend 900, uppercase, and
tracked. This is the brand's "game HUD" voice — nav, buttons, labels,
section kickers. Do not soften it to sentence-case body text in those
roles.

## 4. Elevation

Depth is conveyed by **hard, offset, zero-blur box-shadows** — the
"tactile" language. There are no soft drop shadows at rest; the system is
flat until a surface is *raised*, and when raised it gets a single crisp
offset shadow, never a blur. Currently the shadow color drifts
(`#4c1d95`, `#1a1a2e`, `#1e1b4b`, `#020617`) depending on the file. This
must collapse to **one** tactile shadow color.

### Shadow Vocabulary
- **Tactile Card** (`box-shadow: 8px 8px 0 0 <tactile-shadow>`): raised
  panels, badges, login card. Currently split between `#4c1d95` (app.css)
  and `#1a1a2e` / `#1e1b4b` / `#020617` (components).
- **Tactile Button** (`box-shadow: 0 6px 0 0 <tactile-shadow>` → active
  `0 2px 0 0` + `translateY(4px)`): pressable buttons. The offset
  *shrinks* on press to sell the physical click.
- **Tactile Input** (`box-shadow: inset 0 2px 4px rgba(0,0,0,0.3)`):
  inset recess for form fields.

### Named Rules
**The One Tactile Shadow Rule.** Every raised surface uses the *same*
hard offset shadow color (recommended: a darkened violet `#1a1a2e` or the
existing `#4c1d95`). Never mix `#4c1d95` / `#1a1a2e` / `#1e1b4b` /
`#020617` across files. The shadow color is a token, not a per-component
guess.

## 5. Components

### Buttons
- **Shape:** large radius (`rounded-lg`, 1rem) or fully pill.
- **Primary:** arcade-lime fill (`accent`), near-black label
  (`#0c0c1f`), black-uppercase label, often with a bottom "depth" border
  (`border-b-[6px]` darkened lime) that compresses on press.
- **Hover / Focus:** brighten to `#bef264`; lift via `hover:-translate-y-1`
  or border compression. Focus ring uses `secondary-container` (magenta).
- **Secondary / Ghost:** outline or surface-tinted, lime/magenta text on
  press.

### Cards / Containers
- **Corner Style:** `rounded-2xl` (1rem) in the app; the landing page
  uses oversized `rounded-[28px]`–`[40px]` (inconsistent — standardize).
- **Background:** `surface-container-highest` (`#28283d`) or
  `surface-container-low` for locked/empty states.
- **Shadow Strategy:** one hard tactile shadow (see Elevation).
- **Border:** `border-2` / `border-4` in `outline` or a state color
  (lime when complete, magenta when current).
- **Internal Padding:** `card-padding` (24px).

### Inputs / Fields
- **Style:** dark fill (`surface-container-lowest` / `bg-zinc-950` — the
  latter is off-system), `border-2`/`border-4` outline, large radius.
- **Focus:** border shifts to `accent` (lime) or `secondary` (magenta)
  ring; never a soft glow alone.
- **Error / Disabled:** red-`500` message in black-uppercase; disabled
  fields use `outline` at low opacity.

### Navigation
- **Bottom nav (student):** fixed, `bg-slate-950/95` + blur, magenta is
  *not* used here — active item is lime (`text-lime-400`), icons filled
  (`FILL 1`). Inconsistent base color (`slate-950` vs token `background`).
- **Sidebar (teacher):** `bg-slate-950` + `border-b-4` header with one
  tactile shadow. Search field uses `surface-container-lowest` + focus
  ring in `secondary`.

### Signature Component
- **Level Card:** the flagship pattern. A gradient cover (one of six
  preset violet/lime/amber/cyan/rose/violet blends), a state pill
  (LOCKED / LEVEL N / COMPLETE), an emoji, a lime PLAY chip, and a
  progress bar. State drives border + cover opacity: locked = dashed +
  desaturated, current = magenta ring + shimmer, complete = lime border +
  check. This is the strongest, most on-brand component — use it as the
  reference for all other cards.

## 6. Do's and Don'ts

### Do:
- **Do** build every surface from the named Material 3 tokens
  (`background`, `surface-*`, `primary-*`, `secondary-container`,
  `on-surface*`, `outline`).
- **Do** use arcade lime as the single action/highlight color; reserve
  violet/magenta/peach for chrome and state.
- **Do** give every raised surface one hard, zero-blur offset shadow in
  the single tactile-shadow color.
- **Do** write small UI text as Lexend 900 uppercase, tracked — the game
  HUD voice.
- **Do** drive card/chip appearance from explicit state (locked / current
  / complete), as the Level Card does.

### Don't:
- **Don't** build the landing page (or any surface) with raw `zinc-*` /
  `slate-*` / `purple-*` / `green-*` Tailwind defaults. The current
  `Auth/Homepage.jsx` does this and is off-system — bring it onto the
  token palette.
- **Don't** drift the tactile shadow color across `#4c1d95` / `#1a1a2e` /
  `#1e1b4b` / `#020617`. Pick one and tokenize it.
- **Don't** mix radii arbitrarily — the app uses `rounded-2xl` while the
  landing uses `rounded-[28px]`–`[40px]`. Standardize on the token scale.
- **Don't** use soft blurred shadows, gradient text, side-stripe border
  accents, or glassmorphism as defaults.
- **Don't** label a surface "Terminal" (as the footer currently does)
  without a terminal visual language to back it up.
- **Don't** let lime stay untokenized — promote `lime-400` to the
  `accent` token so it cannot drift.
