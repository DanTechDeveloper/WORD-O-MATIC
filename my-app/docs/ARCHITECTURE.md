# Architecture

> Version 1.3

## Backend

| Layer | Role |
|---|---|
| Controllers | `UserController`, `StudentController`, `TeacherController` — thin, delegate to services |
| Services | `ProgressService`, `BadgeService`, `LevelService` |
| Middleware | `HandleInertiaRequests` (global data), `EnsureUserRole` (role gate), `CheckStudentOnboarding` (avatar) |
| Models | 14 Eloquent models |
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
| HTTP | Inertia `router`/`useForm` for pages; axios for the 2 JSON mastery endpoints (`response()->noContent()`) |
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
Axios JSON endpoints (mastery toggles) bypass Inertia and return `noContent()`.

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
| Mastery = explicit per-word toggle | Auto-mastery removed; `updateWordMastery`/`updateParagraphMastery` via axios |
| PIN with plain+hash | Hash for auth, plain for teacher display (thesis-acceptable) |

## Auth Flow

> The `CheckStudentOnboarding` middleware gates **only** the avatar step (rejects `/images/boy.svg` and `/images/girl.svg`). Tutorial gating is not enforced by middleware.

```
Guest → Login → Student: 3-step onboarding (Splash → Avatar Selection → Tutorial) → Dashboard
                → Teacher: Dashboard (no onboarding)
```
