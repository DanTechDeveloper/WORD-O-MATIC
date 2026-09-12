# Product

## Register

product

## Platform

web

## Users

Two audiences share one product, and each is given its own experience of the same arcade — two different dials on one machine.

### Primary audience: K-5 students

Primary readers, roughly ages 5 to 10, practicing reading and speaking aloud in a gamified environment. Usually on classroom desktops or tablets with teacher supervision. What they need: to pick a game, play it, win a level, earn a badge, see their name move up the board, and above all to do it without help. They are not analysts; they are players. Everything they touch must be huge, obvious, and forgiving, and it must tell them clearly whether they won without a paragraph to find out.

### Secondary audience: teachers

The teacher sets up the class, assigns practice, reviews progress, and decides who needs more support. Their job, start to finish: load the class, assign the right work, glance at what happened, act on it. They do not come to be charmed; they come to know, quickly and trustingly, what happened. What they need from the product is clarity: dense, visual, sortable truth.

## Product Purpose

WordOMatic is a gamified reading and speaking platform for early-grade students. It turns foundational literacy practice (word recognition, reading aloud, speaking) into an arcade-style game with levels, badges, streaks, leaderboards, and avatars — practice that feels like play. Teachers set up classes and assignments and track outcomes. Success means a child who chooses to keep playing, and a teacher who sees real progress at a glance.

## Positioning

For the student: practice that feels like play — the only literacy game where young kids choose to keep going. For the teacher: the same product, flipped — progress you can see in one glance, without wading through a collage of screens.

Classroom license. No public pricing tiers, no bento pricing grid, no checkout funnel. Students are provisioned by teachers with name plus 4 digit PIN. The product is not sold to anonymous visitors on a marketing site.

Proof over promise: every claim has a live demo or a table. `Components/Student/GameplayDemo.jsx` is the real demo, not a mock. No fake testimonials, no stock quotes, no unnamed schools.

## Brand Personality

One personality, two registers:

- **Student: playful, electric, bold.** Arcade energy without losing clarity; confident and a little mischievous. Never childish, never corporate.
- **Teacher: disciplined, sharp, calm.** The same arcade turned all the way down — quiet, dense, professional, trustworthy. The glow stays; the confetti does not.

## Anti-references — 30 AI slop bans

Grouped so a reviewer can scan once. Each ban states what to use instead. Applies to both tracks; student vs teacher column notes where the ban is stricter.

### Color and texture

| # | Ban | Instead | Student vs Teacher |
|---|---|---|---|
| 1 | Harsh gradients | Solid fill plus hard offset `6px 6px 0 0 #7000ff` `DESIGN.md` Violet Deep | Both. Teacher keeps hint shadow only `DESIGN.md` Workbench Rules |
| 22 | Radial orbs | None. If glow needed, one capped radial `rgba(112,0,255,0.08)` at `Homepage.jsx` hero only, static fallback for `prefers-reduced-motion` | Student only at hero, never on teacher |
| 23 | Dotgrids | None. Remove `home-grid-bg` dot pattern or keep at `opacity 0.04` max and static. No animated dot field | Both |
| 8 | Liquid glass (blur, backdrop, gradient clip) | Opaque `bg-surface` or `bg-surface-container-high` `DESIGN.md` | Both — explicit reject glassmorphism |
| 4 | Rainbow coloring | One action color Arcade Lime `#a3e635` `DESIGN.md` plus Quest Cyan `#38bdf8` only when a second distinct action exists. Max two | Both |
| 20 | Purple and black gradient | Solid indigo void `#0c0c1f` canvas only, never purple to black gradient mesh | Both |
| 29 | Neon overload | Lime is the single neon, muted elsewhere `text-ink-muted` `border-outline`. No magenta peach at full saturation on functional surfaces | Both |
| 30 | Basic pastel swatches | Arcade saturated palette only: Lime, Quest, Violet, Magenta, Peach as chrome `DESIGN.md` | Both |

### Layout

| # | Ban | Instead | Student vs Teacher |
|---|---|---|---|
| 6 | 3 feature cards in a row | Student: 2 mode cards `grid-cols-1 md:grid-cols-2` `Pages/Student/Dashboard.jsx:158`. Teacher: filter bar plus table `Pages/Teacher/Students.jsx:169` + `223` | Both |
| 13 | Bento grids | Linear stack or single table workhorse `DESIGN.md` Shared Components | Both |
| 14 | Terminal window | None. No code window decoration | Both |
| 11 | Colored left stripe status | Dot plus word plus icon chip `Components/Student` + `Pages/Teacher/Students.jsx:120` `riskStyles`. Never stripe alone | Both — stripe fails color only |
| 17 | 3 pricing tiers | None. Product is classroom license, no public pricing page. If a pricing note is ever needed, plain list not tiers `// ponytail: pricing tiers deferred until public sale exists` | Both |
| 19 | Soft corner radius `2xl 3xl` | `lg 0.5rem xl 0.75rem` ceiling `tailwind.config.js:101` `DESIGN.md` rounded tokens | Both |
| 18 | No real product demos | `Components/Student/GameplayDemo.jsx` is the real demo. Show before claim | Both |

### Typography and copy

| # | Ban | Instead | Note |
|---|---|---|---|
| 10 | Inter, Geist, Space Grotesk | Lexend Variable 900 + Plus Jakarta Sans Variable 500 `tailwind.config.js:114` `DESIGN.md` faces | Enforced by lint on raw font imports |
| 9 | Em dashes `—` in body | Period or colon. Keep reading shape for early decoders `PRODUCT.md` Split Case `DESIGN.md:228` | Linter only |
| 15 | It is not x it is y headline | Direct title: `Pick Your Game` `Pages/Student/Dashboard.jsx:122` not `It is not practice it is play` | Copy guide |
| 16 | Checkmark bullets as marketing checklist | Student: check is win feedback `ProgressBar` `BadgeCard` with word — keep. Marketing: use numbered steps, not `✓` list | Student keeps win check, marketing bans check list |

### Iconography and motion

| # | Ban | Instead | Student vs Teacher |
|---|---|---|---|
| 2 | Lucide icons | Material Symbols Outlined `DESIGN.md:190` filled `FILL 1` on student celebration `Student/Dashboard.jsx:182` outlined on teacher | Both |
| 24 | Sparkle icons | Star or badge icon with purpose `military_tech` `Pages/Student/Dashboard.jsx` not decorative sparkle | Both |
| 7 | Random decorative emojis | Material icon is primary; purposeful emoji only with alt text as secondary for K-5 decode | Student secondary allowed, teacher never |
| 25 | Animated arrows | None. Static `play_arrow` `Homepage.jsx:208` no bounce loop | Both |
| 5 | Soft drop shadow blur | Hard offset `6px 6px 0 0 #7000ff` `DESIGN.md:177` never `blur-md shadow-xl` | Both |
| 28 | Hover bounce or shine | Student: one `hover:-translate-y-1` max plus `transition-colors duration-150` `Student/Dashboard.jsx:176`. Teacher: color shift only, no translate `DESIGN.md:315` | Stricter on teacher |

### Trust

| # | Ban | Instead | Note |
|---|---|---|---|
| 12 | Fake testimonials | No testimonials unless verifiable name plus section. Prefer live demo or table | Both |
| 21 | No skeleton loaders | Calm `animate-pulse bg-surface-container-high` `Components/Shared/Skeleton.jsx` no shimmer glass | Both |
| 26 | No TOS | `GET /terms` `Pages/Legal/Terms.jsx` public, footer link | Teacher track |
| 27 | No privacy policy | `GET /privacy` `Pages/Legal/Privacy.jsx` public, footer link | Teacher track |

## Principles

### Student: Play First

- Big and bold — type read from across the classroom, tap targets sized for small hands, no fiddly controls.
- One action — a single clear do this affordance per screen, so intent is never split between competing buttons. Login is the CTA on `Pages/Auth/Homepage.jsx:202` PLAY — no marketing hero above it `// ponytail: hero deferred until public signup exists`.
- Show, don't tell — teach through play and feedback, not instructions. `GameplayDemo.jsx` before paragraphs.
- Forgiving — wrong tries return instantly, mistakes are never punishing, and try again is always one tap away.
- Celebrate progress — every win (streak, badge, level) earns a moment of light, not just a number. Bounded `<=3s` max 2 per 5 min `DESIGN.md`.

### Teacher — The Workbench

- Legible — small, readable data with clear column headers; no decoration competes with the numbers.
- Glanceable — who has done, who is stuck: readable in a single scan. `Pages/Teacher/Dashboard.jsx:188` health distribution plus `Pages/Teacher/Students.jsx:353` table.
- Calm — flat, quiet surfaces; the tactile shadow belongs to the one primary action only `DESIGN.md:321`.
- Keyboard-first — full keyboard navigation with visible focus every step `tailwind` `focus-visible:ring`.
- Predictable — controls behave like a trustworthy tool, not a game button.

## Launch completeness — 19 essentials split Student vs Teacher

Legend: Keep = ships now. Deferred = `// ponytail` add when condition met.

| # | Essential | Student | Teacher | Owner file | Accept check |
|---|---|---|---|---|---|
| 1 | Custom 404 page | Keep — kid 404 big 404 sentence body one Lime GO HOME | Keep — pro 404 dense title case Go to dashboard | `resources/views/errors/404.blade.php` via `auth.role` branch | 404 at `/nope` shows correct branch |
| 2 | CTA above the fold | Deferred — login IS the CTA `Homepage.jsx:202` `// ponytail: no marketing hero until public signup` | Keep — one primary per screen `Students.jsx:142` Add Student | `Pages/Auth/Homepage.jsx:34` + `Pages/Teacher/Students.jsx:132` | Student PLAY visible at 375px no scroll |
| 3 | Meta title per page | Keep — `Head title="Word-O-Matic - Play"` per student page | Keep — `Head title` per teacher page via `HandleInertiaRequests` | `resources/js/Pages/*` + `app.blade.php:7` | View source shows title |
| 4 | Meta description per page | Keep — one line per page | Keep — one line per teacher page | `app.blade.php:7` + per page `Head` | View source shows desc |
| 5 | Open Graph image | Deferred — teacher OG covers crawler | Keep — existing arcade screenshot reused `og:image` 1200x630 | `public/og-image.png` + `app.blade.php:7` | `og:image` present |
| 6 | Favicon set | Keep — `favicon.ico` + `apple-touch-icon.png` minimal | Keep — plus `site.webmanifest` | `public/favicon.ico` etc | Icon at `/favicon.ico` |
| 7 | robots.txt | Deferred — teacher file covers | Keep — allow `/` `/teacher/login` `/privacy` `/terms` disallow `/student` `/teacher/*` | `public/robots.txt` | `curl /robots.txt` has `Sitemap:` |
| 8 | sitemap.xml | Deferred — student gated `role:student` never indexed | Keep — 4 public URLs only | `public/sitemap.xml` + `routes/web.php` guest `GET /sitemap.xml` | `curl /sitemap.xml` valid |
| 9 | Alt text on every image | Keep — avatars badges speech bubble `Dashboard.jsx:134` | Keep — avatars charts `Students.jsx:246` | `Components/Student/*` `Components/Teacher/*` | Wave alt audit pass |
| 10 | Mobile breakpoints | Keep — `sm 640 md 768 lg 1024` `grid-cols-1 md:grid-cols-2` `Student/Dashboard.jsx:158` | Keep — cards `block lg:hidden` table `hidden lg:block` `Dashboard.jsx:290` | `DESIGN.md` §11 + Tailwind | 375px no overflow |
| 11 | Sticky mobile CTA | Deferred — PLAY already full width in thumb reach, sticky would cover game `// ponytail` | Keep — header `fixed top-0` `DashboardLayout.jsx:86` is sticky, no extra bottom bar | `Layouts/Teacher/DashboardLayout.jsx:86` | Header stays on scroll |
| 12 | Loading states | Keep — calm `animate-pulse` no shimmer | Keep — table skeleton rows | `Components/Shared/Skeleton.jsx` | Skeleton on nav |
| 13 | Form error states | Keep — gentle `Homepage.jsx:168` `border-error aria-invalid` | Keep — inline `border-error text-error` `AddStudentModal` `EditStudentModal` | `Components/Teacher/*` | Error shows word plus border |
| 14 | Thank-you page | Deferred — kid reward is `BadgeUnlockFlow` plus surge not page | Keep — yes `oo` after `POST /teacher/reports/send-emails` | `Pages/Teacher/Thanks.jsx` + `ReportController` redirect | `/teacher/reports/thank-you` shows counts |
| 15 | Privacy policy page | Deferred — teacher legal covers, teacher footer link | Keep — `GET /privacy` | `Pages/Legal/Privacy.jsx` | `/privacy` public |
| 16 | Terms page | Deferred — same | Keep — `GET /terms` | `Pages/Legal/Terms.jsx` | `/terms` public |
| 17 | Cookie banner | Deferred — none on student `// ponytail: session only` | Deferred — session only `// ponytail: add banner only if analytics enabled` since none now | `Components/Shared/CookieBanner.jsx` env gated | No banner until analytics |
| 18 | Analytics installed | Deferred — none on student `// ponytail: zero tracking on student COPPA` | Deferred — env gated default off `VITE_ANALYTICS_ID` | `app.blade.php` conditional | No script until env set |
| 19 | Real contact address | Deferred — teacher footer placeholder `wala muna // ponytail: replace when school address provided` | Deferred — same placeholder | `Components/Shared/Footer.jsx` + `Layouts/Teacher/DashboardLayout.jsx` + `Homepage.jsx:222` | Footer shows `Address to come` |

## Accessibility and Inclusion

- WCAG AA contrast baseline on the dark canvas (both experiences).

**Student — K-5 specific:**
- Tap targets at least 48px.
- Lesson copy at least 18px.
- Body and instructions in sentence case; ALL-CAPS only for short labels and single-word CTAs (early readers decode by word shape).
- Feedback never color-only; pair color with icon or word.
- Every animation has a calm `prefers-reduced-motion` fallback `Homepage.jsx:67` `Student/Dashboard.jsx:176`.
- The onboarding/tutorial is never gated behind a timer or a streak.

**Teacher — specific:**
- Fully keyboard-navigable with visible focus states.
- Status chips pair color with a word or icon so signals survive color-blindness `Pages/Teacher/Students.jsx:120`.

