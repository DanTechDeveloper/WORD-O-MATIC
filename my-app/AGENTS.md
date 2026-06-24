# Word-O-Matic — Agent Guide

All source code lives under `my-app/`. Set that as working directory before running any command.
## Stack

- **Backend:** PHP 8.3, Laravel 13 (Breeze scaffold), Sanctum auth
- **Frontend:** React 18 + Inertia.js v2, Tailwind CSS v3 (custom dark theme), Vite 8
- **Database:** MySQL (local), SQLite `:memory:` (tests)
- **Session/Cache/Queue:** all use `database` driver
- **Charts:** recharts (PieChart, BarChart)
- **Icons:** Material Symbols (`material-symbols-outlined`)

## Key Commands

Run from `my-app/`:

| Command                            | What it does                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| `composer run setup`               | Full project setup (composer install, .env, key gen, migrate, npm install, npm build) |
| `composer run dev`                 | Starts all dev servers: artisan serve, queue:listen, pail logs, Vite dev              |
| `composer run test`                | `config:clear` then `php artisan test`                                                |
| `php artisan test`                 | PHPUnit (Unit + Feature) with SQLite `:memory:`                                       |
| `php artisan migrate:fresh --seed` | Reset DB with all seeders (24 students + badges)                                      |
| `npm run build`                    | Vite production build                                                                 |
| `npm run dev`                      | Vite dev server only                                                                  |

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
