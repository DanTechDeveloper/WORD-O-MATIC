# Architecture

> Version 1.1

## Backend

| Layer | Role |
|---|---|
| Controllers | `UserController`, `StudentController`, `TeacherController` — thin, delegate to services |
| Services | `ProgressService`, `BadgeService`, `LevelService` |
| Middleware | `HandleInertiaRequests` (global data), `EnsureUserRole` (role gate), `CheckStudentOnboarding` (avatar) |
| Models | 16 Eloquent models |
| Validation | Inline `$request->validate()` in controllers |
| Auth | Middleware-based (`role:teacher` / `role:student`), no Policy files |
| Notifications | Laravel Mail queued (`Mail::to()->queue()`) |

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
Action → Controller → Service → Model → DB
                         ↓
HandleInertiaRequests::share() ← session flash + auth
                         ↓
              Inertia Response → React $page.props
```

Global props: `auth.user`, `flash.*`, `teacher` flags. Lazy-loaded closures, no extra queries unless accessed.

## Key Decisions

| Decision | Rationale |
|---|---|
| Denormalized stats on `StudentProfile` | Avoid JOIN-heavy aggregations on dashboard |
| Best-score-only progress | Retries don't overwrite higher existing scores |
| Progress overwritten, not versioned | Only `game_sessions` is append-only |
| Morph map for modules | `'word' → WordModule`, `'paragraph' → ParagraphModule` |
| Queued email | Don't block response waiting for mail |
| Cascade deletes | All child tables cascade on `user_id` — delete user = clean slate |
| Random word order | `inRandomOrder()` per session in Read mode, prevents memorization |
| PIN with plain+hash | Hash for auth, plain for teacher display (thesis-acceptable) |

## Auth Flow

```
Guest → Login → Student: 5-step onboarding → Dashboard
               → Teacher: Dashboard (no onboarding)
```
