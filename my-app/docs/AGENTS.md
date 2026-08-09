# Word-O-Matic

> Version 1.4 — Developer Guide

## Design Context

Word-O-Matic has a committed design system. Read these before any UI work so
surfaces stay on-system:

- `PRODUCT.md` — register (product), platform (web), primary users (K-5
  students; teachers secondary), positioning, brand personality (Playful,
  electric, bold), anti-references, and strategic design principles.
- `DESIGN.md` — the "Tactile Arcade" Material 3 dark visual system: indigo-
  black canvas (`#111125`), arcade-lime as the single action color, violet /
  magenta / peach as chrome, hard offset tactile shadows, Lexend + Plus Jakarta
  Sans, Material Symbols Outlined. Build every surface from the named tokens in
  `tailwind.config.js` — never raw `zinc-*` / `slate-*` / `purple-*` defaults.

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

No lint or typecheck. CI (`.github/workflows/ci.yml`) runs PHP tests only;
JS/vitest/pint are not wired into it.

## Auth

| Role | Prefix | Middleware | Login |
|---|---|---|---|
| Teacher | `/teacher` | `role:teacher` | username + password |
| Student | `/student` | `role:student` + `CheckStudentOnboarding` | name + 4-digit PIN |

Teacher login: `UserController@teacherLoginPost` — validates `username` + `password`, no email.
PIN stored as bcrypt (`pin`) + plain text (`pin_plain`).
Student login runs `BadgeService::checkAllEligibleBadges($user)` (constructor-injected
into `UserController`) when the student has a custom avatar.

## Onboarding

```
splashScreen → avatarSelection → dashboard
```

Tutorial uses dedicated modules (`is_tutorial=true`, `level=0`):
- Word Blast: 5 practice words (a, I, see, my, the)
- Story Quest: "I see a cat." paragraph
Tutorial plays skip GameSession, mastery, points, leaderboard, and gameplay badges.
Tutorial Complete badge awarded when both modes are done via `BadgeService::awardOnboardingBadge('tutorial-complete')`.
Guided by AvatarSpeechBubble on Dashboard + guide overlay on first gameplay. Enforced by `CheckStudentOnboarding` middleware.

## Services

| Service | Responsibility |
|---|---|
| `ProgressService` | Update word/paragraph progress (best score only), recalculate status |
| `BadgeService` | Award badges, check thresholds. `calculateModuleCompletion()` computes paragraph/word completion % from `words_smashed`. `checkAllEligibleBadges()` also runs at student login (avatar set). |
| `LevelService` | Module lock/current/completed status per student |
| `TeacherController::dashboardStats()` | Teacher dashboard stats (private method, no service class). Returns `topStudents`, `chartCounts`, `sectionPerformance`, and a per-student `students` list (id, name, section, wordBlastAcc, storyQuestAcc, status) powering the class-health drill-down table. |

Session logging done via `GameSession::logSession()` static method on the model (no service class).

## Student Management (Teacher)

Two creation paths, both routed through the same rules and the shared private
`TeacherController::persistStudent()` (writes the `users` row + `students`
row: role `student`, bcrypt + plain PIN, default avatar by gender, zeros):

- **Single add** — `POST /teacher/addStudent` → `store()`. `store()` and
  `Students()` share `existingStudentIds` (pluck of `student_id`) so the modal
  does live client-side checks ("This ID is already registered."). Inertia
  validation errors still backstop the server.
- **Bulk paste** — `POST /teacher/addStudents` → `storeBulk()`
  (`addStudents.store`). Payload is `students[]` (max 50): paste grammar
  `Name, ID, Section` per line; the modal fills auto-generated 4-digit PINs
  and optional per-row gender/email in the preview. `storeBulk()` normalizes
  every row → validates with wildcard rules → a manual case/whitespace-
  insensitive intra-batch duplicate pass (only the first collision is reported
  per request) → creates everything in ONE `DB::transaction` (all-or-nothing).
  `Rule::unique('users','student_id')` backstops against existing students.
- Frontend: `BulkAddStudentModal.jsx` is a separate component from
  `AddStudentModal.jsx` — each `useForm` gets its own error keys, so they
  never cross-contaminate.

## Word Module Editing (Teacher)

`PUT /teacher/wordModules` → `updateWordModule()`. Words are normalized in PHP
(lowercase for checks, uppercase for storage via `WordModule::saveWithWords`).
Rules:

- Exactly 10 word slots, all required (`required|string|max:20`); blanks fail
  ("Every word must be filled in.").
- No intra-module duplicates — case-insensitive, error points at the first
  slot (`"X" is duplicated in this module.`).
- No cross-module reuse — a word already used in another level (including the
  tutorial module, level 0) is rejected (`"X" is already used in Level N.`).
  The module being edited is excluded, so resaving its own words is fine.
  Checks run in PHP because MySQL's ci collation differs from SQLite (tests).
- `wordModules()` exposes `has_progress` (any `StudentWordMastery` row on the
  module's words); the modal then asks for a `window.confirm` before saving
  because saving deletes and recreates the module's words.
- `WordInputModal.jsx` supports pasting 10 words (split on spaces/commas) and
  live per-row duplicate detection before submit.

## Conventions

- No comments unless explaining _why_.
- Extend before creating new.
- After each task: list changed files + what changed + intentionally untouched + follow-up.
- Frontend pages: `resources/js/Pages/{Student,Teacher}/`. Hooks: `hooks/`. Components: `Components/`.
- Inertia forms: `router.post` / `router.put`. `useForm.post(url, options)` sends the form's OWN data state — set data via `setData` before `post`; the options object is for callbacks/visibility, never a body (passing a payload as the 2nd arg sends `{}` and silently fails validation).
- JSON endpoints (`/student/updateWordMastery`, `/student/updateParagraphMastery`)
  go through axios and return `response()->noContent()`; page forms/transitions
  stay Inertia `router.*`.
- New DB field: migration → `$fillable` → controller response array. (Fields missing from `$fillable` are silently dropped by mass-assignment, e.g., `report_sent_at` bug.)
- Validation: inline `$request->validate()` in controllers (no Form Request pattern).
- Auth: middleware-based (`EnsureUserRole`), no Policy files.

## Test Quirks

- `RefreshDatabase` — all tests in transactions.
- SQLite in-memory — no MySQL features.
- Mail driver: `array`.
- DashboardServiceTest deleted — logic inlined into TeacherController.
- `assertSessionHasNoErrors()` takes NO key argument (asserts zero errors
  session-wide). For per-key absence use
  `assertArrayNotHasKey($key, session('errors')->getBag('default')->messages())`.
- Student/word-module validation hardening lives in `AddStudentBulkTest.php`
  (22 cases) and `ModuleCrudTest.php` (dup/blank/length/deadline/has_progress).

## Data Flow

```
Controller → Service → Model → DB
                         ↓
HandleInertiaRequests::share() ← session flash + auth
                         ↓
              Inertia Response → React $page.props
```

Global data shared via `HandleInertiaRequests`: `auth.user`, `flash` (success, error, new_badges, sent, failed, reported_at), `teacher` flags.

## Gameplay Resume (client-side) — See `docs/resume-and-timer.md`
- Do not re-add a private timer to `GameplayHeader`; use the `timeLeft` prop from `useGameplayEngine`.
- Do not render `TapToStartOverlay` when `isResume` is true (already gated by `gameState === "IDLE"`).
- Persist/resume is tab-only (`sessionStorage`, key `wordomaticResume:<moduleId>`). Do not escalate to cross-run persistence without a TTL + server check.
- To force-reset an in-progress round, clear `sessionStorage["wordomaticResume:<moduleId>"]` (or use `clearResumeSession`).

## Commands
- `php artisan test` only runs PHP — JS/vitest/pint are not wired into it.
