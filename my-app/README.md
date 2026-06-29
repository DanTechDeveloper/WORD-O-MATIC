# Word-O-Matic

A gamified literacy platform for students. Word Blast (reading) and Story Quest (speaking) with a sci-fi theme — teachers monitor progress, assign modules, and track performance.

## Stack

| Layer | Tech |
|---|---|
| Backend | PHP 8.3, Laravel 13, Sanctum |
| Frontend | React 18, Inertia.js v2, Tailwind CSS v3 |
| Database | MySQL (prod), SQLite `:memory:` (tests) |
| Charts | recharts (PieChart, BarChart) |
| Icons | Material Symbols |

## Setup

```bash
composer run setup
```

Runs: `composer install` → `.env` → key generate → migrate → `npm install && npm build`.

## Development

```bash
composer run dev
```

Starts artisan serve, queue worker, log watcher, and Vite dev server via concurrently.

## Testing

```bash
composer run test
# or
php artisan test
```

Uses SQLite `:memory:` — no external DB needed.

## Seed Database

```bash
php artisan migrate:fresh --seed
```

Creates 1 teacher (`admin`/`password`) and 100 students across 3 sectors with varied progress/status.

## Architecture

- **15 models** — `User`, `StudentProfile`, `WordModule`, `ParagraphModule`, progress/mastery tables, badges
- **Key services** — `ProgressService` (writes progress + denormalized fields), `GameSessionService`, `BadgeService`, `LevelService`, `DashboardService`
- **Routes** — Guest (`/`, `/teacher/login`), Teacher (`/teacher/*`), Student (`/student/*`)
- **Student onboarding** — Avatar selection enforced by `CheckStudentOnboarding` middleware

## Project Structure

```
app/
  Http/Controllers/
    TeacherController.php    — Teacher CRUD, reports, modules
    StudentController.php    — Gameplay, onboarding, leaderboards
  Services/
    ProgressService.php      — Updates progress & denormalized accuracy/levels
    DashboardService.php     — Teacher dashboard stats & chart data
    GameSessionService.php   — Wraps ProgressService, logs sessions
    BadgeService.php         — Badge assignment logic
    LevelService.php         — Progression gating
  Models/                    — 15 Eloquent models
database/
  migrations/                — Schema + seed data
  seeders/
    DatabaseSeeder.php       — 100 students with varied data
resources/js/
  Pages/Teacher/             — Dashboard, Students, StudentDetails, Reports, etc.
  Pages/Student/             — Splash, avatar, dashboard, gameplay, leaderboards
  Layouts/                   — Teacher (sidebar) and Student (minimal) layouts
  Components/                — Shared UI and Teacher-specific components
  hooks/Student/             — useGameplayEngine, useSpeechRecognition, etc.
```
