# Word-O-Matic

> Version 1.7 — Developer Guide

## Design Context

Word-O-Matic has a committed design system. Read these before any UI work so
surfaces stay on-system:

- `PRODUCT.md` — register (product), platform (web), primary users (K-5
  students; teachers secondary), positioning, brand personality (Playful,
  electric, bold), anti-references, and strategic design principles.
- `DESIGN.md` — the "Tactile Arcade" Material 3 dark visual system: indigo-
  black canvas (`#0c0c1f`), arcade-lime as the single action color, violet /
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
Both login routes are rate-limited: student `throttle:30,1`, teacher `throttle:5,1`.
Student PIN is stored bcrypt-only (`pin`) and is **reset-only** — never readable back;
teachers set a new PIN via `EditStudentModal` (blank = keep current), and
`TeacherController::pinIsTaken()` rejects any PIN already in use by another student
**with the same name** on `store()` / `updateStudent()` (the bcrypt scan is scoped to
same-name rows because login resolves by name + PIN).
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
Guided by AvatarSpeechBubble on Dashboard + guide overlay on first gameplay. Enforced by `CheckStudentOnboarding` middleware,
which also bounces avatar-complete students away from `splashScreen`/`avatarSelection` (no re-entry).

## Services

| Service | Responsibility |
|---|---|
| `ProgressService` | Update word/paragraph progress (best score only), recalculate status. Status thresholds live in the static `classify()` (single source of truth — also called by `TeacherController::dashboardStats` and `StudentSeeder`). Tutorial plays — including post-onboarding replays, where `finishRound()` drops the isTutorial flag — never move `students.points` (recompute sums exclude tutorial rows; the delta path is gated on `! $module->is_tutorial`). Clamps client-reported inputs at the service boundary — `words_processed ≥ 0`, `words_smashed ≤ words_processed`, `accuracy ∈ [0,100]` — and never completes a module with 0 words (`$totalWords > 0` guard). |
| `BadgeService` | Award badges, check thresholds. `calculateModuleCompletion()` computes paragraph/word completion % from `words_smashed`. `checkAllEligibleBadges()` also runs at student login (avatar set). |
| `LevelService` | Module lock/current/completed status per student |
| `ReportService` | Deadline/cutoff resolution (`deadline()`, `cutoff()`), `trainingWordsFor()`, pure projections of `curriculumForUser()` (`trainingGroupsFrom()`, `trainingAttemptsFrom()`), `curriculumPercent()`, `latestBadge()`, and the `NEEDS_ATTENTION_ATTEMPTS` threshold const shared to the teacher UI — powers `ReportController` (routes `reports`, `reports.sendEmails`, `reports.deadline`, `reports.export`). |
| `TeacherController::dashboardStats()` | Teacher dashboard stats (private method, no service class). Returns `topStudents`, `chartCounts`, `sectionPerformance`, and a per-student `students` list (id, name, section, wordBlastAcc, storyQuestAcc, status) powering the class-health drill-down table. |

Session logging done via `GameSession::logSession()` static method on the model (no service class).

## Student Management (Teacher)

Two creation paths, both routed through the same rules and the shared private
`TeacherController::persistStudent()` (writes the `users` row + `students`
row: role `student`, bcrypt-only PIN, default avatar by gender, zeros):

- **Single add** — `POST /teacher/addStudent` → `store()`. `store()` and
  `Students()` share `existingStudentIds` (pluck of `student_id`) so the modal
  does live client-side checks ("This ID is already registered."). Inertia
  validation errors still backstop the server. PINs are bcrypt-only and unique per
  name: `pinIsTaken()` (a `Hash::check` scan over same-name student rows) rejects a
  PIN already in use by another student with the same name.
- **Edit** — `PUT /teacher/students/{student}` → `updateStudent()`. The PIN is
  **reset-only**: `EditStudentModal` shows a blank field ("leave blank to keep
  current", refresh to auto-generate) — it is never pre-filled and cannot be
  read back. A new PIN is also checked against `pinIsTaken()` (skipping the
  student being edited). Changing gender re-syncs the gender-default avatar only
  while the current avatar is still a placeholder (`/images/boy.svg` /
  `/images/girl.svg`); custom avatars are kept.
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

- Level is validated `required|integer|min:1` — level 0 IS the tutorial row,
  and `saveWithWords` upserts by level, so a `level=0` request would delete and
  replace every onboarding word (locked by `TutorialSaveGuardScenarioTest`).

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

## Paragraph Module Editing (Teacher)

`PUT /teacher/paragraphModules` → `updateParagraphModule()`. Content is trimmed
then required (`required|string`) — empty or whitespace-only content is rejected,
so a zero-word paragraph module can never be created (a zero-word module would
strand students: `ProgressService` refuses to complete a module with 0 words —
`$totalWords > 0` guard, see CAVEATS.md BF13). Words are split on whitespace and
stored case-as-entered via `ParagraphModule::saveWithContent` (deletes +
recreates the module's words each save). `level` is likewise validated
`min:1` for the same reason as word modules (`saveWithContent` upserts by
level; 0 is the tutorial row). `ParagraphInputModal.jsx` disables Save
while content or title is empty and renders server validation errors in-modal
(modals never close themselves on a failed save).

## Audio & SFX (student)

- All audio lives in `resources/js/utils/sounds.js`; `initStudentAudio()` is
  called once in `app.jsx`. Route all SFX through `playAudio`/`playClickSound`/
  `playSoftBlip` — never `new Audio()` inline.
- BGM starts on the first `/student` click (autoplay policy), loops at 0.5,
  ducks to 0.12 for 500ms on SFX, pauses on gameplay `ACTIVE` (mic live), and
  resumes on any tap. Position persists to `sessionStorage.wordomaticBgm`.
- `micLive` blocks all SFX/BGM-resume while the mic is open; `bgmSilenced`
  blocks them while the badge modal is up. Both are module flags in sounds.js.
- Click SFX is two-tier: tag real commit actions (`data-sfx="major"`) for the
  loud + duck sound; everything else gets the soft blip automatically. The
  default is soft, so a new button that forgets the tag just sounds soft (safe).
- `playClickSound`/`playSoftBlip` share a 200ms debounce (double-click = one sound).

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
- Don't name a destructured option after a module function — `playAudio(path, { duck })` shadowed the `duck()` helper and crashed every SFX call (`duck is not a function`, which also froze the 5s/3s word advance). Rename the option (`duck: shouldDuck`).

## Test Quirks

- `RefreshDatabase` — all tests in transactions.
- SQLite in-memory — no MySQL features.
- Mail driver: `array`.
- DashboardServiceTest deleted — logic inlined into TeacherController.
- `assertSessionHasNoErrors()` takes NO key argument (asserts zero errors
  session-wide). For per-key absence use
  `assertArrayNotHasKey($key, session('errors')->getBag('default')->messages())`.
- Student/word-module validation hardening lives in `AddStudentBulkTest.php`
  (22 cases), `ModuleCrudTest.php` (dup/blank/length/deadline/has_progress),
  and `TutorialSaveGuardScenarioTest.php` (level ≥ 1 tutorial-wipe guard).

## Data Flow

```
Controller → Service → Model → DB
                         ↓
HandleInertiaRequests::share() ← session flash + auth
                         ↓
              Inertia Response → React $page.props
```

Global data shared via `HandleInertiaRequests`: `auth.user`, `flash` (success, error, new_badges, sent, failed, reported_at), `teacher` flags (incl. `attention_threshold` = `ReportService::NEEDS_ATTENTION_ATTEMPTS`).

## Gameplay Resume (client-side) — See `docs/resume-and-timer.md`
- Do not re-add a private timer to `GameplayHeader`; use the `timeLeft` prop from `useGameplayEngine`.
- Do not render `TapToStartOverlay` when `isResume` is true (already gated by `gameState === "IDLE"`).
- Persist/resume is tab-only (`sessionStorage`, key `wordomaticResume:<moduleId>`). Do not escalate to cross-run persistence without a TTL + server check.
- To force-reset an in-progress round, clear `sessionStorage["wordomaticResume:<moduleId>"]` (or use `clearResumeSession`).

## Commands
- `php artisan test` only runs PHP — JS/vitest/pint are not wired into it.
