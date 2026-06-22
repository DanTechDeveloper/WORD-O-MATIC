# Word-O-Matic — Agent Guide

All source code lives under `my-app/`. Set that as working directory before running any command.

## INSTRUCTIONS AND RULES
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

- **Backend:** PHP 8.3, Laravel 13 (Laravel Breeze scaffold), Sanctum auth
- **Frontend:** React 18 + Inertia.js v2, Tailwind CSS v3 (custom dark theme), Vite 8
- **Database:** MySQL (local), SQLite `:memory:` (tests)
- **Session/Cache/Queue:** all use `database` driver

## Key Commands

Run from `my-app/`:

| Command              | What it does                                                                          |
| -------------------- | ------------------------------------------------------------------------------------- |
| `composer run setup` | Full project setup (composer install, .env, key gen, migrate, npm install, npm build) |
| `composer run dev`   | Starts all dev servers concurrently: artisan serve, queue:listen, pail logs, Vite dev |
| `composer run test`  | Runs `config:clear` then `php artisan test`                                           |
| `php artisan test`   | Runs PHPUnit (Unit + Feature suites) with SQLite `:memory:` (see `phpunit.xml`)       |
| `npm run build`      | Vite production build                                                                 |
| `npm run dev`        | Vite dev server only                                                                  |

CI runs: `migrate --force` → `npm install && npm run build` → `php artisan test` → `migrate --force` against Railway MySQL production.

## Architecture

- **Entrypoints:** `routes/web.php` (all routes), `resources/js/app.jsx` (Inertia React bootstrap)
- **Inertia pages** resolve as `./Pages/{name}.jsx` under `resources/js/`
- **Roles:** `teacher` and `student` enforced by `EnsureUserRole` middleware (`role:teacher`, `role:student`)
- **Student onboarding** flow enforced by `CheckStudentOnboarding` middleware: splashScreen → avatarSelection (POST `/avatar`) → greetings
- **Auth:** session-based login via `UserController`; guest routes for login, auth routes for dashboard
- **Controllers:** `StudentController`, `TeacherController`, `UserController` in `app/Http/Controllers/`
- **Models:** `User` (role, student_id, username, pin), `StudentProfile` (user_id, avatar, etc.), `WordModule`, `Word`, `ParagraphModule`, `GameSession`, progress/badge pivot models
- **Middleware:** `EnsureUserRole` (aborts 403 on mismatch), `CheckStudentOnboarding` (redirects to splash if no avatar), `HandleInertiaRequests`

## Conventions

- PHP styling: Laravel Pint (in `require-dev`)
- Views: Blade layout only (`resources/views/app.blade.php` — root for Inertia)
- No TypeScript — plain JSX with `jsconfig.json`
- Editor: spaces, 4-space indent (`.editorconfig`)
- No code comments unless the original code already has them
