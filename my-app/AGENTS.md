# Word-O-Matic — Agent Guide

Run all commands from `my-app/`.

## Stack

- **Backend:** PHP 8.3, Laravel 13 (Breeze scaffold), Sanctum auth
- **Frontend:** React 18 + Inertia.js v2, Tailwind CSS v3 (custom dark theme), Vite 8
- **Database:** MySQL (local), SQLite `:memory:` (tests)
- **Session/Cache/Queue:** all use `database` driver
- **Charts:** recharts (PieChart, BarChart)
- **Icons:** Material Symbols (`material-symbols-outlined`)

## Commands

| Command | What it does |
|---|---|
| `composer run setup` | Full setup: composer install, .env, key gen, migrate, npm install, npm build |
| `composer run dev` | Starts artisan serve + queue:listen + pail logs + Vite dev via concurrently |
| `composer run test` | `config:clear` then `php artisan test` |
| `php artisan test` | PHPUnit with SQLite `:memory:` (see phpunit.xml) |
| `php artisan migrate:fresh --seed` | Reset DB — creates 1 teacher (`admin`/`password`), 24 students across 3 sectors |
| `npm run build` | Vite production build |
| `npm run dev` | Vite dev server only |

CI: `migrate --force` → `npm install && npm run build` → `php artisan test` → `migrate --force` (Railway MySQL).

## Frontend Conventions

- Plain JSX, no TypeScript. Path alias `@/` → `resources/js/` (see `jsconfig.json`).
- 4-space indent, no semicolons aren't enforced but existing code uses them.
- Inertia pages resolve as `./Pages/{name}.jsx` under `resources/js/`.
- Blade: only `resources/views/app.blade.php` (Inertia root).
- **No code comments** unless the original code already has them.
- `react-joyride` is in package.json but no longer imported — Tutorial.jsx uses avatar-guided onboarding instead.

### Student Pages
- Wrapped in `resources/js/Layouts/Student/DashboardLayout.jsx` — no sidebar, minimal layout with `StudentProfile` + `StudentFeatures`.
- Student hooks live in `resources/js/hooks/Student/`: `useGameplayEngine`, `useWordSpeechRecognition`, `useSentenceSpeechRecognition`, `useCountdown`, `useMicrophonePermission`.

### Teacher Pages
- Wrapped in `resources/js/Layouts/Teacher/DashboardLayout.jsx` — includes sidebar (`Components/Teacher/Sidebar.jsx`).

## Backend Architecture

### Models (15 total)

| Table | Model | Key Fields |
|---|---|---|
| `users` | `User` | `role` (teacher/student), `hasOne(StudentProfile)` |
| `students` | `StudentProfile` | Denormalized: `points`, `wordBlastAcc`, `storyQuestAcc`, `status` ENUM, `section`, `read_level`, `speak_level`, `avatar` |
| `game_sessions` | `GameSession` | Polymorphic `morphTo` → `WordModule`/`ParagraphModule`, static `logSession()` |
| `word_modules` | `WordModule` | `hasMany(Word)`, static `trainingWordsForUser()`, `curriculumForUser()` |
| `paragraph_modules` | `ParagraphModule` | `hasMany(ParagraphWord)`, same static helpers |
| `student_word_progress` | `StudentWordProgress` | Per-module word progress |
| `student_paragraph_progress` | `StudentParagraphProgress` | Per-module paragraph progress |
| `student_word_mastery` | `StudentWordMastery` | Per-word training/mastered status |
| `student_paragraph_mastery` | `StudentParagraphMastery` | Per-word paragraph mastery |
| `badges` + `student_badges` | `Badges`, `StudentBadges` | Many-to-many with pivot |

### Key Services (injected into StudentController)
- `ProgressService` — writes to detailed progress tables + denormalized `students` fields
- `GameSessionService` — wraps `ProgressService`, logs sessions
- `BadgeService` — badge earning logic
- `LevelService` — progression gating

### Data-Flow Pattern
- `TeacherController` reads directly from `students` table (denormalized), not progress tables
- Chart classification: `null`/`0` accuracy → `notStarted`; avg `< 60` → `atRisk`; `60-80` → `needsSupport`; `≥ 80` → `onTrack`
- Student `status` ENUM: `atRisk`, `support`, `onTrack`, `notStarted` (defined in migration)

### Routes (`routes/web.php`)
- **Guest:** `GET /` (student login), `GET /teacher/login`
- **Teacher** (`/teacher/*`, middleware `role:teacher`): dashboard, students, modules, reports, leaderboards, assignments, badges
- **Student** (`/student/*`, `role:student` + `CheckStudentOnboarding`): splash → avatar → greetings → dashboard, gameplay (read/speak), leaderboards, badges, results

### Student Onboarding
- `CheckStudentOnboarding` middleware enforces: `students.avatar` must be non-empty.
- Flow: splashScreen → avatarSelection (POST `/avatar`) → greetings → dashboard.
