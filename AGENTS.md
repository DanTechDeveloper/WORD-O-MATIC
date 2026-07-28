# Word-O-Matic — Agent Guide

All source code lives under `my-app/`. Set that as working directory before running any command.

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
- **Backend:** PHP 8.3, Laravel 13 (Breeze scaffold), Sanctum auth
- **Frontend:** React 18 + Inertia.js v2, Tailwind CSS v3 (custom dark theme), Vite 8
- **Database:** MySQL (local), SQLite `:memory:` (tests)
- **Session/Cache/Queue:** all use `database` driver
- **Charts:** recharts (PieChart, BarChart)
- **Icons:** Material Symbols (`material-symbols-outlined`)

## Key Commands

Run from `my-app/`:

| Command | What it does |
|---|---|
| `composer run setup` | Full project setup (composer install, .env, key gen, migrate, npm install, npm build) |
| `composer run dev` | Starts all dev servers: artisan serve, queue:listen, pail logs, Vite dev |
| `composer run test` | `config:clear` then `php artisan test` |
| `php artisan test` | PHPUnit (Unit + Feature) with SQLite `:memory:` |
| `php artisan migrate:fresh --seed` | Reset DB with all seeders (24 students + badges) |
| `npm run build` | Vite production build |
| `npm run dev` | Vite dev server only |

CI: `migrate --force` → `npm install && npm run build` → `php artisan test` → `migrate --force` against Railway MySQL production.

Seeder creates: 1 teacher (`admin`/`password`), 24 students with `wordBlastAcc`/`storyQuestAcc`/`status`/`section` across 3 sectors.

## Architecture

### Routes (`routes/web.php`)
- **Guest:** `GET /` (student login), `GET /teacher/login` (teacher login)
- **Teacher** (`/teacher/*`, middleware `role:teacher`): dashboard, students, word/paragraph modules, reports, leaderboards, assignments, badges
- **Student** (`/student/*`, middleware `role:student` + `CheckStudentOnboarding`): onboarding (splash → avatar → greetings), gameplay (read/speak modes), leaderboards, badges, results
- Auth: session-based via `UserController`

### Controllers
- `TeacherController` — dashboard, student listing, module CRUD, reports
- `StudentController` — onboarding, gameplay, progress saving, leaderboards, badges
- `UserController` — login/logout

### Data Flow
- `TeacherController@students()` returns data for `Students.jsx`: reads `user.name`, `user.student_id`, and `student.*` (avatar, section, status, wordBlastAcc, storyQuestAcc) — all denormalized on the `students` table
- `TeacherController@dashboard()` reads directly from `students` table (not progress tables) for consistency
- Chart counts classification: both accuracy `null`/`0` → `notStarted`; avg < 60 → `atRisk`; 60-80 → `needsSupport`; ≥ 80 → `onTrack`
- Student `status` ENUM: `atRisk`, `support`, `onTrack`, `notStarted` (defined in migration)

### Key Models
- `StudentProfile` (table: `students`) — denormalized snapshot: `points`, `wordBlastAcc`, `storyQuestAcc`, `status`, `section`, `read_level`, `speak_level`, `avatar`
- `GameSession` — logs every play (`logSession()` static method, polymorphic to `WordModule`/`ParagraphModule`)
- `StudentWordProgress` / `StudentParagraphProgress` — per-module progress (separate from denormalized accuracy on `students`)

### Student Onboarding
Enforced by `CheckStudentOnboarding` middleware: `avatar` column on `students` must be non-empty. Flow: splashScreen → avatarSelection (POST `/avatar`) → greetings → dashboard.

## Conventions

- PHP: Laravel Pint (PSR-12)
- No TypeScript, plain JSX with `jsconfig.json`
- Spaces, 4-space indent (`.editorconfig`)
- No code comments unless the original code already has them
- Inertia pages resolve as `./Pages/{name}.jsx` under `resources/js/`
- Blade: only `resources/views/app.blade.php` (Inertia root)
- `DashboardLayout` in `resources/js/Layouts/Teacher/` wraps all teacher pages
- Teacher sidebar: `resources/js/Components/Teacher/Sidebar.jsx`
