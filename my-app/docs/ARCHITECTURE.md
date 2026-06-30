# Architecture

> Version 1.0

## Backend

| Layer | Role |
|---|---|
| Controllers | `UserController`, `StudentController`, `TeacherController` — thin, delegate to services |
| Services | `ProgressService`, `GameSessionService`, `BadgeService`, `LevelService`, `DashboardService` |
| Models | 15 Eloquent models (`User`, `StudentProfile`, `WordModule`, `ParagraphModule`, `GameSession`, `Badge`, ...) |
| Validation | Form Requests |
| Auth | Policies |
| Notifications | Laravel Mail (`Mail::to()->send()`, no queue) |

## Frontend

| Layer | Detail |
|---|---|
| Framework | React 18 + Inertia.js v2 |
| Build | Vite 8 (`@vitejs/plugin-react`, `laravel-vite-plugin`) |
| CSS | Tailwind 3 (`@tailwindcss/forms`) |
| Charts | Recharts 3.8 |
| Pages | `resources/js/Pages/{Auth,Student,Teacher,Testing}/` |
| Components | `resources/js/Components/` |
| Hooks | `resources/js/hooks/` |

## Data Flow

```
Action → Controller → Service → Model → DB → Inertia Response → React Page
```

## Key Decisions

| Decision | Rationale |
|---|---|
| Denormalized stats on `StudentProfile` | Avoid JOIN-heavy aggregations on dashboard |
| Progress overwritten, not versioned | Only `game_sessions` is append-only |
| Morph map for modules | `'word' → WordModule`, `'paragraph' → ParagraphModule` |
| Synchronous email | No queue infrastructure |

## Auth Flow

```
Guest → Login → Student: 5-step onboarding → Dashboard
               → Teacher: Dashboard (no onboarding)
```
