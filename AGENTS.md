# Word-O-Matic — Agent Guide

The runnable app lives in `my-app/`. Set your working directory there before
every command (`cd my-app`). The repo root holds only `opencode.json` and docs.
CI, scripts, and the autoload paths all assume `my-app/` is the app root.

For deeper detail (design tokens, data flow, service contracts) see
`my-app/docs/AGENTS.md` and `my-app/docs/CONVENTIONS.md`; for the visual spec
see `my-app/DESIGN.md` and `my-app/PRODUCT.md`.

## RULES
1. Ask, don't assume. If something is unclear, ask before writing a single line. Never make silent assumptions about intent, architecture, or requirements.
2. Simplest solution first. Always implement the simplest thing that could work. Do not add abstractions or flexibility that weren't explicitly requested.
3. Don't touch unrelated code. If a file or function is not directly part of the current task, do not modify it, even if you think it could be improved.
4. Flag uncertainty explicitly. If you are not confident about an approach or technical detail, say so before proceeding. Confidence without certainty causes more damage than admitting a gap.
5.Never open responses with filler phrases like "Great question!", "Of course!", "Certainly!", or similar warmups. Start every response with the actual answer. No preamble, no acknowledgment of the question.
6. Match response length to task complexity. Simple questions get direct, short answers. Complex tasks get full, detailed responses. Never pad responses with restatements of the question or closing sentences that repeat what you just said.
7. Before any significant task, show me 2-3 ways you could approach this work. Wait for me to choose before proceeding.
8. If you are uncertain about any fact, statistic, date, or piece of technical information: say so explicitly before including it. Never fill gaps in your knowledge with plausible-sounding information. When in doubt, say so. Only modify files, functions, and lines of code directly related to the current task. Do not refactor, rename, reorganize, reformat, or "improve" anything I did not explicitly ask you to change. If you notice something worth fixing elsewhere, mention it in a note at the end. Do not touch it. Ever.
9. Before making any change that significantly alters content I've already created (rewriting sections, removing paragraphs, restructuring flow, changing tone): stop. Describe exactly what you're about to change and why. Wait for my confirmation before proceeding.
10. Before deleting any file, overwriting existing code, dropping database records, or removing dependencies: stop. List exactly what will be affected. Ask for explicit confirmation. Only proceed after I say yes in the current message. "You mentioned this earlier" is not confirmation.
11. The following require explicit in-session confirmation, no exceptions: deploying or pushing to any environment, running migrations or schema changes, sending any external API call, executing any command with irreversible side effects. I must say yes in the current message.
12. After any coding task, end with: Files changed (list every file touched) / What was modified (one line per file) / Files intentionally not touched / Follow-up needed.
13. Never send, post, publish, share, or schedule anything on my behalf without my explicit confirmation in the current message. This includes emails, calendar invites, document shares, or any action outside this conversation. I must say yes in the current message.
14. For any task involving architecture decisions, debugging complex issues, or non-trivial features: work through the problem step by step before writing any code. Show your reasoning. Identify where you're uncertain. Then implement. 

## Stack

Laravel 13 (PHP 8.3) + React 18 + Inertia.js v2 + Vite 8 + Tailwind v3.
MySQL locally, SQLite `:memory:` for tests. Auth is **session-based** via
`UserController` (not Sanctum tokens). `role:teacher`/`role:student`
middleware aliases are registered in `bootstrap/app.php`.

## Commands (run from `my-app/`)

| Command | What it does |
|---|---|
| `composer run setup` | composer install → `.env` → key gen → migrate → `npm install` → `npm run build` |
| `composer run dev` | 4 concurrent procs: `php artisan serve`, `queue:listen --tries=1 --timeout=0`, `pail` (logs), `npm run dev` (Vite) |
| `composer run test` | `config:clear` then `php artisan test` (PHPUnit Unit + Feature) |
| `php artisan test --filter=TestName` | Single test class/method |
| `php artisan migrate:fresh --seed` | Reset DB + seed: 1 teacher (`admin`/`password`) + 100 students across 3 sectors (Sector 7-G, Sector Alpha, Sector Bravo) |
| `npm run dev` | Vite only |
| `npm run build` | Vite production build |
| `npx vitest run` | JS unit tests (`tests/Unit/speechUtils.test.js`) — **not** run by CI or `composer run test` |
| `vendor/bin/pint` | PSR-12 format/fix (not wired into a script or CI) |

## What not to assume

- **Tests never touch MySQL.** `phpunit.xml` sets `DB_CONNECTION=sqlite`,
  `DB_DATABASE=:memory:`, `MAIL_MAILER=array`, `QUEUE_CONNECTION=sync`,
  `CACHE_STORE=array`, `SESSION_DRIVER=array`.
- **CI only runs PHP tests.** `.github/workflows/ci.yml` runs from `my-app/`,
  PHP 8.3, SQLite `:memory:`, then `php artisan test`. No JS/vitest, no Pint,
  no typecheck. On pass it runs `php artisan migrate --force` against Railway
  MySQL using GitHub secrets. No `setup` step in CI (deps cached/installed directly).
- **No global lint/typecheck script exists.** `composer.json` has only setup/dev/test.
- **`php artisan migrate` and DB writes require explicit approval** (see
  `opencode.json` permission rules: `php artisan migrate*` and `php artisan db:*`
  are `ask`).

## Auth & middleware

- Teacher login: `GET/POST /teacher/login` → `UserController@teacherLoginPost`
  validates `username` + `password` (no email).
- Student login: `GET /` (root) shows the student login form; login uses
  `name` + 4-digit PIN. PIN is stored as bcrypt (`pin`) **and** plain text
  (`pin_plain`) — both are in `$fillable`; `pin` is in `$hidden`, `pin_plain` is
  not.
- Role guard: `EnsureUserRole` (alias `role`). `CheckStudentOnboarding` gates
  `/student/*` — a student is blocked until they pick a non-default avatar
  (not `/images/boy.svg` or `/images/girl.svg`); the middleware redirects to
  `student.splashScreen`. It does **not** gate the tutorial flow; onboarding
  past the avatar step is unguarded by middleware.
- Teacher routes live under `/teacher/*`; student routes under `/student/*`.
  Teacher pages are wrapped by `resources/js/Layouts/Teacher/DashboardLayout`;
  the sidebar is `Components/Teacher/Sidebar.jsx`.

## Gotchas

- **Mass-assignment silently drops fields.** A new column needs migration →
  `$fillable` on the model → inclusion in the controller's response array.
  Missing any step means the value is never set (the `report_sent_at` bug).
- **No Form Request classes.** Validation is inline `$request->validate()` in
  controllers. No Policies; authorization is middleware only.
- **Denormalized student stats live on the `students` table** (`points`,
  `wordBlastAcc`, `storyQuestAcc`, `status`, `read_level`, `speak_level`).
  `TeacherController::dashboard()` and `students()` read directly from
  `students`, not from the progress/mastery tables.
- **Progress is best-score-only.** `ProgressService` does not overwrite on a
  worse play.
- **Frontend pages resolve as `./Pages/{name}.jsx`** under `resources/js/`.
  `@` alias (`jsconfig.json`) = `resources/js`; `@/` alias (vitest) too.
- **UI must follow design tokens.** `resources/js/**/*.jsx` classes should come
  from `tailwind.config.js` tokens (Tactile Arcade: Arcade Lime `#a3e635` action,
  indigo-void canvas, hard offset shadows). Avoid raw `zinc-*`/`slate-*`/`purple-*`
  defaults — see `DESIGN.md` §6.

## Workflow conventions

- Reusable logic goes in `app/Services/` (`ProgressService`, `BadgeService`,
  `LevelService`); controllers stay thin. `GameSession::logSession()` is a
  static model method, not a service.
- 3-step "task" convention: list changed files + what changed + untouched +
  follow-up. Don't touch unrelated code.
- Comments explain _why_, rarely _what_. 4-space indent (`.editorconfig`),
  `.md` files keep trailing whitespace.

## Test layout

- `tests/Feature/*` – Laravel feature tests, `RefreshDatabase`, DB-less.
- `tests/Unit/*` (PHP) – model/service unit tests.
- `tests/Unit/speechUtils.test.js` + `tests/setup.js` – vitest JS unit tests.
