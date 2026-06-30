# Word-O-Matic

> Version 1.1 — Developer Guide

Run commands from `my-app/`.

## Stack

Laravel 13 + React 18 + Inertia v2 + Tailwind v3 + MySQL (SQLite in-memory for tests).

## Commands

| Action | Command |
|---|---|
| Dev server (4 processes) | `composer run dev` |
| All tests | `php artisan test` |
| Single test | `php artisan test --filter=TestName` |
| Migrate | `php artisan migrate` |
| Build frontend | `npm run build` |
| Frontend dev | `npm run dev` |

No lint, typecheck, or CI.

## Auth

| Role | Prefix | Middleware | Login |
|---|---|---|---|
| Teacher | `/teacher` | `EnsureUserRole` | email + username + password |
| Student | `/student` | `EnsureUserRole` + `CheckStudentOnboarding` | name + 4-digit PIN |

PIN stored as bcrypt + plain text (`pin_plain`).

## Onboarding

```
splashScreen → avatarSelection → greetings → tutorial → completeTutorial → dashboard
```

Enforced by `CheckStudentOnboarding`.

## Services

| Service | Responsibility |
|---|---|
| `ProgressService` | Update word/paragraph progress, recalculate status |
| `GameSessionService` | Log game session, delegate to ProgressService |
| `BadgeService` | Award badges, check thresholds |
| `LevelService` | Module lock/current/completed status per student |
| `DashboardService` | Teacher dashboard stats |

## Conventions

- No comments unless explaining _why_.
- Extend before creating new.
- After each task: list changed files + what changed + intentionally untouched + follow-up.
- Frontend pages: `resources/js/Pages/{Student,Teacher}/`. Hooks: `hooks/`. Components: `Components/`.
- Inertia forms: `router.post` / `router.put`.
- New DB field: migration → `$fillable` → controller response array.

## Test Quirks

- `RefreshDatabase` — all tests in transactions.
- SQLite in-memory — no MySQL features.
- Mail driver: `array`.
- `DashboardServiceTest` has 2 pre-existing failures (unrelated).
