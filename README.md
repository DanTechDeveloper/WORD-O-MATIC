<div align="center">

# Word-O-Matic

### A gamified literacy platform that boosts students' **reading** and **speaking** skills through interactive mini-games.

<br>

<img src="https://img.shields.io/badge/PHP-8.3-777BB4?style=for-the-badge&logo=php&logoColor=white" alt="PHP" />
<img src="https://img.shields.io/badge/Laravel-13-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel" />
<img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
<img src="https://img.shields.io/badge/Inertia.js-2-9553E9?style=for-the-badge&logo=inertia&logoColor=white" alt="Inertia" />
<img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />

<br><br>

<table>
<tr>
<td align="center" width="50%">
<h3>Word Blast</h3>
Reading-focused word recognition game<br>
<span style="display:inline-block;width:10px;height:10px;border-radius:9999px;background:#a3e635;"></span> <b>Arcade Lime</b> mode (read)
</td>
<td align="center" width="50%">
<h3>Story Quest</h3>
Speaking-focused storytelling activity<br>
<span style="display:inline-block;width:10px;height:10px;border-radius:9999px;background:#38bdf8;"></span> <b>Electric Blue</b> mode (speak)
</td>
</tr>
</table>

<sub>Built on the <b>Tactile Arcade</b> design system — a deep indigo-black Material 3 stage with hard, offset shadows and arcade-neon pop colors that make every card and button feel like a physical game piece. While students play, teachers get tools to monitor progress, assign modules, and analyze performance.</sub>

</div>

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology |
|:------|:-----------|
| **Backend** | PHP 8.3, Laravel 13 (session-based auth via `UserController`) |
| **Frontend** | React 18, Inertia.js v2, Tailwind CSS v3 |
| **Speech Recognition** | Deepgram streaming ASR (nova-3) via `useDeepgramRecognition.js` |
| **Database** | MySQL (Production), SQLite `:memory:` (Testing) |
| **Charts** | Recharts (BarChart on Web) · Native Excel Charts (Pie Chart & Bar Chart on Excel export) |
| **HTTP** | Inertia router/useForm for pages · axios for JSON mastery endpoints |
| **Icons** | Material Symbols Outlined (filled `1` when active) |

</div>

---

## 🎨 Design System — "The Tactile Arcade"

The UI follows a single source of truth: [`DESIGN.md`](./my-app/DESIGN.md). Core principles:

- **Material 3 dark stage** — deep indigo-black canvas (`#0c0c1f`) with layered surfaces; everything sits on the void.
- **One Pop Color per mode** — **Word Blast (read) = Arcade Lime** `#a3e635`, **Story Quest (speak) = Electric Blue** `#38bdf8`. Violet, magenta, and peach are chrome, never calls to action; rose is reserved for "wrong" feedback only.
- **Token-Only** — every surface is built from named tokens (`background`, `surface-*`, `primary-*`, `secondary-container`, `on-surface*`, `outline`, `accent`, `quest`). No raw `zinc-*` / `slate-*` / `purple-*` defaults.
- **Hard, offset, zero-blur shadows** — one tactile shadow color per raised surface (the "physical game piece" feel); no soft blurred shadows or glassmorphism.
- **Black-Uppercase voice** — small UI text is Lexend 900, uppercase, tracked (the game HUD voice).
- **Material Symbols** — vector iconography you can color, fill, and scale (no emoji in the UI).

---

## ⚙️ Setup

Install all dependencies and prepare the application:

```bash
composer run setup
```

<details>
<summary><b>What this command does</b></summary>

<br>

1. Installs Composer dependencies
2. Creates the `.env` file
3. Generates the application key
4. Runs database migrations
5. Installs NPM packages
6. Builds frontend assets

</details>

---

## 💻 Development

Run the complete local development environment:

```bash
composer run dev
```

<details>
<summary><b>Services started (all run concurrently)</b></summary>

<br>

- Laravel development server
- Queue worker
- Log watcher
- Vite development server

</details>

---

## 🧪 Testing

Run the automated test suite:

```bash
composer run test   # or: php artisan test
```

> Tests use an in-memory SQLite database — no external database configuration required.

---

## 🌱 Seed Database

Populate the application with demo data:

```bash
php artisan migrate:fresh --seed
```

<div align="center">

| Account | Details |
|:--------|:--------|
| 👩‍🏫 **1 Teacher** | Username `admin` · Password `password` |
| 🎓 **100 Students** | 3 sectors · randomized progress · varied statuses · sample gameplay history |

</div>

---

## 🏗️ Architecture

### Models

The application contains **14 Eloquent models**, including:

`User` · `StudentProfile` · `WordModule` · `ParagraphModule` · `Word` · `ParagraphWord` · Progress models · Mastery models · `Badges` · `GameSession` · `Setting`

### Core Services

<table>
<tr>
<td width="25%" valign="top">

**🎯 ProgressService**

- Saving gameplay results
- Recording the **highest score** only
- Updating progress
- Denormalized statistics
- Accuracy & level computation

</td>
<td width="25%" valign="top">

**🏅 BadgeService**

- Badge eligibility
- Badge assignment
- Achievement progression
- Module completion tracking (paragraph & word)

</td>
<td width="25%" valign="top">

**📈 LevelService**

- Student progression
- Module unlocking
- Level gating

</td>
<td width="25%" valign="top">

**📊 ReportService**

- Deadline/cutoff resolution (`deadline()`, `cutoff()`)
- `trainingWordsFor()` / `curriculumPercent()` / `latestBadge()`
- Pure projections of `curriculumForUser()`: `trainingGroupsFrom()`, `trainingAttemptsFrom()`
- `NEEDS_ATTENTION_ATTEMPTS = 3` — single-source threshold shared to the teacher UI and used to group parent-email Training Zones (Still Practicing / Needs More Practice)
- Navigated alongside **`ProgressService::finalAverage()`** / the `StudentProfile::finalAverage` accessor — the derived **Final Average** (`round((wb+sq)/2,2)`, null until both skills started) surfaced across the teacher dashboard, students list, Reports.jsx, StudentDetails, parent email, and Excel export.
- Powers `ReportController` (reports, send-emails, deadline, export)

</td>
</tr>
</table>

---

## 🗺️ Routing

<div align="center">

| Role | Prefix | Includes |
|:-----|:-------|:---------|
| **Guest** | `/`, `/teacher/login` | Landing, login |
| **Teacher** | `/teacher/*` | Dashboard · Student Management · Leaderboards · Badges · Reports · Module Management |
| **Student** | `/student/*` | Onboarding · Dashboard · Gameplay · Leaderboards · Badges · Progress Tracking |

</div>

---

## 🔒 Key Behaviors

<details>
<summary><b>Safety invariants (test-locked)</b></summary>

<br>

Two correctness guarantees are enforced as committed PHPUnit tests (`php artisan test`):

- **Status stickiness** — a `completed` module can never be downgraded to `in_progress` by a worse replay (`ProgressService`). Locked by `ProgressServiceTest::test_status_does_not_regress_to_in_progress_on_worse_replay`.
- **Tutorial isolation** — tutorial (`is_tutorial=true`) rounds are excluded from the averaged `wordBlastAcc`/`storyQuestAcc` and never affect points/levels/badges — even a post-onboarding tutorial replay (where `finishRound()` drops the tutorial flag once `tutorial_completed_at` is set): progress records, points don't. Locked by `ProgressServiceTest::test_tutorial_progress_does_not_pollute_accuracy`, `test_unflagged_tutorial_replay_records_progress_without_awarding_points`, `test_points_recompute_excludes_tutorial_rows`, and `GameplayTest::test_tutorial_replay_after_onboarding_does_not_award_points`.
  - **Status classification SOT** — the notStarted / in_progress / onTrack / support / atRisk thresholds live exactly once in `ProgressService::classify(float $wordBlastAcc, float $storyQuestAcc, bool $wordStarted, bool $storyStarted)`; `recalculateStatus()`, `TeacherController::dashboardStats()` (per-student loop + sectionPerformance), and `StudentSeeder` all call it, and the dashboard payload uses the DB's vocabulary (`support`, no separate `needsSupport` key). `started` = `accuracy > 0` OR a progress row on a real (non-empty) module exists — this resolves the both-zero collision where a student who played and scored 0% was mislabeled `notStarted` while their Training Zone still rendered (CAVEATS.md BF26). Locked by `DashboardTest` + `ReportStatusConsistencyTest`. Read paths (dashboard, student detail, **email, Excel export, Reports.jsx**) all trust the denormalized `students.status` column (written only by `ProgressService::recalculateStatus()`); classifications are recomputed on progress writes, never re-derived at read time, so no consumer can drift.
- **Final Average = derived, null until both skills started** — the numeric `(wb + sq) / 2` is computed by `ProgressService::finalAverage()` (logical SOT) and the `StudentProfile::finalAverage` accessor; it returns `null` while either skill is unstarted (`(80+0)/2=40` never misleads). Surfaced consistently across the teacher dashboard (`students[].finalAverage`, `avgFinalAccuracy`, `sectionPerformance[].final_average`), Students list, leaderboards, Reports.jsx, StudentDetails, the parent email, and both Excel sheets, with `?sort=finalAverage` on the students list. Locked by `ProgressServiceTest::test_final_average_*`, `DashboardTest::test_dashboard_avg_final_accuracy_excludes_unstarted_students` + accessor guard, `TeacherStudentsListTest::test_students_list_exposes_final_average_and_sorts_by_it_desc`, and `ReportTest` (reports page + email payload + Excel headings/values).
- **Tutorial write-guards** — teacher module editors validate `level >= 1`: level 0 *is* the tutorial row, and saves upsert by level, so a crafted `level=0` request would silently delete-and-replace every onboarding word. Locked by `TutorialSaveGuardScenarioTest`.
- **Mastery immutability on replay** — replaying a completed module (Again button in `GameResults.jsx`, Play Again on `LevelsPage.jsx`) cannot demote an already-`mastered` word: `StudentController::updateWordMastery` / `updateParagraphMastery` reject `mastered → training` writes; `training → mastered` promotion still applies. `StudentDetails.jsx` mastery bars are a read-only view of `curriculumForUser`, so they reflect true best mastery and can't be corrupted by practice rounds. Locked by `CurriculumIsolationTest::test_existing_mastered_word_is_not_downgraded_on_mispronounce`.
- **Attempt freeze at mastery** — per-word `failed_attempts` counts every unsuccessful attempt (wrong transcript or ASR timeout) while a word is still `training`, then freezes forever on first mastery — replays can never move the counter. Locked by `MasteryAttemptTest`.
- **Streak integrity** — streak-based badges source `GameSession::max('streak')`, which never includes tutorial plays (tutorial rounds skip `GameSession::logSession` entirely), so tutorial-contaminated streaks are structurally impossible.
- **Module access gating** — direct URL access to a locked module (`/student/gameplayReadMode/{level}`, `/student/gameplaySpeakMode/{level}`) is blocked by a `LevelService::isModuleAccessible()` check in `StudentController`; a locked module redirects back to the level-select page with a flash error banner. Locked by `StudentController::gameplayReadMode`, `StudentController::gameplaySpeakMode`, `LevelService::isModuleAccessible`.
- **Atomic bulk roster creation** — a bulk student paste is created only if every row validates (same normalization rules as single-add; case/whitespace-insensitive intra-batch duplicate IDs rejected) and one bad row rejects the whole batch — no partial rosters. Locked by `AddStudentBulkTest` (22 cases: exact-50 boundary, dup handling, invalid gender/email, non-array input safety).
- **Deadline data freeze** — once the report deadline passes, gameplay is blocked server-side: `finishRound()` logs the `GameSession` but skips all `ProgressService` updates, so teacher reports cannot drift after the deadline — post-deadline plays write zero progress/mastery rows, so `LevelService` level status can never advance after the deadline. PLAY AGAIN is disabled and completed level cards are non-clickable, with an amber banner on `LevelsPage.jsx`. Post-deadline sessions are permanently flagged `is_deadline_hit=true` — excluded from streak/accuracy badge metrics and shown with the non-scoring "TIME'S UP!" results view ("You played", no badges) even if the teacher later clears the deadline. The teacher-facing deadline banner is a single source of truth in `DashboardLayout.jsx` (page-aware message: deadline-specific copy on Reports, gameplay-locked copy elsewhere). No deadline set → gameplay fully open. Locked by `GameplayTest::test_round_logs_session_but_skips_progress_when_deadline_passed`, `GameplayTest::test_round_saves_progress_when_no_deadline_is_set`, `GameplayTest::test_deadline_hit_session_stays_excluded_after_deadline_cleared`.

See `my-app/docs/CAVEATS.md` for the full tradeoff ledger (Bug fixes BF1–BF28).

</details>

<details>
<summary><b>Student Onboarding</b>

<br>

A guided, gated 3-step flow enforced by the `CheckStudentOnboarding` middleware. Incomplete students are redirected to the correct step.

1. **Splash → Avatar Selection** — students pick a custom avatar (default avatars are rejected).
2. **Dashboard → Guided Tutorial** — the avatar speech bubble guides students from the dashboard into a two-mode tutorial introducing **Word Blast** (read) and **Story Quest** (speak), each with a dedicated practice module (`is_tutorial=true`, level 0: 5 practice words / one short paragraph). A step-by-step guide overlay appears on first gameplay of each mode, and a cheer-only coach bubble encourages the student on each mispronunciation. The guide's **TAP TO CONTINUE** must be completed before the play action unlocks.
3. **Tutorial Complete → Unlocked Dashboard** — finishing both practices sets `tutorial_completed_at`, flashes the "Tutorial Complete" badge, and (after dismissing it) shows a congratulations bubble. Normal progression unlocks. Tutorial plays do not affect points, leaderboards, mastery, or gameplay badges.

</details>

<details>
<summary><b>Global Data Sharing</b></summary>

<br>

`HandleInertiaRequests::share()` exposes global frontend data: authenticated user, flash messages, and teacher context.

</details>

<details>
<summary><b>Database Design</b></summary>

<br>

Foreign keys use **cascading deletes**. Deleting a user automatically removes student profiles, game sessions, progress, mastery, and badges.

</details>

<details>
<summary><b>Excel Report Structure</b></summary>

<br>

Three-tab Excel export available after deadline:

- **Class Summary** (tab `Class Summary`): Per-student roster with Word Blast %, Story Quest %, **Final Average %**, and each student's own status category (column E), plus a Class Health Summary block (status + count) below the roster that feeds the pie; accuracy bar chart compares per-student Word Blast / Story Quest. Both charts are embedded on this tab in columns N–V (scroll past column M).
- **Student Progress Summary**: One row per student — identity + final status + combined Word Blast / Story Quest accuracy-and-level labels (e.g. `78% (Level 3 - Phonics Fundamentals)`) + **Final Average** (e.g. `87.5%`)
- **Mastered & Training Words**: One row per student — mastered + training words per mode, grouped per level (e.g. `Level 1 - cat, dog`)

</details>

---

## 📁 Project Structure

```text
app/
├── Http/
│   ├── Controllers/
│   │   ├── TeacherController.php
│   │   ├── StudentController.php
│   │   ├── UserController.php
│   │   └── ReportController.php
│   └── Middleware/
│       ├── HandleInertiaRequests.php
│       ├── EnsureUserRole.php
│       └── CheckStudentOnboarding.php
│
├── Services/
│   ├── ProgressService.php
│   ├── BadgeService.php
│   ├── LevelService.php
│   └── ReportService.php
│
└── Models/            # 14 Eloquent models

database/
├── migrations/
└── seeders/
    └── DatabaseSeeder.php

resources/
└── js/
    ├── Pages/         # Teacher/ · Student/
    ├── Layouts/
    ├── Components/
    └── hooks/
```

---

## ✨ Key Features

<table>
<tr>
<td width="50%" valign="top">

### 👩‍🏫 Teacher

- Student management — single add with live validation, or **bulk paste** (`Name, ID, Section` per line → auto PINs → per-row gender/email → atomic, dup-guarded batch create, max 50)
- Module assignment & editing (word / paragraph modules) — **locked after the report deadline** (Manage + Add Module disabled, backend-guarded)
  - Word modules: **paste up to 10 words** at once; all 10 slots required, words are uppercased and capped at 20 chars, no intra-module duplicates, no reuse of a word already used in another level (incl. tutorial), and a progress-reset confirmation when the module has student progress
- Progress monitoring
- Performance reports
- Parent report emails (Gmail SMTP + deadline gating)
- Dashboard analytics
  - Class Health Distribution bar chart with category legends → drill-down student table (section-filtered)
  - Top Performing Students chart (switchable: Points / Word Blast / Story Quest)
  - Leaderboards (Points / Word Blast / Story Quest tabs)
  - Badge analytics (catalog, top earners)
  - **Final Average** metric — derived `(Word Blast + Story Quest) / 2` per student, section and class average (`avgFinalAccuracy`); each accuracy column (incl. Final Average) is risk-color dotted (`computeRisk` 60/80, mirroring `ProgressService::classify`)
   - Student detail pages — **Overall Status panel**: colored status badge, per-status recommendation, Performance Summary (accuracy) + Curriculum Progress (completion %)
   - Word Attempt Analytics — per-word `failed_attempts` ("unsuccessful attempts needed to master", frozen at first mastery) with **Needs Attention** (still training, ≥3 fails) and **Recovered** (mastered after a rough start) flags

</td>
<td width="50%" valign="top">

### 🎓 Student

- Guided 3-step onboarding (Splash → Avatar → Tutorial)
- Word Blast gameplay
- Story Quest gameplay
- Progress tracking
- Leaderboards
- Achievement badges
- Word Blast / Story Quest session persistence
- Background music + action-aware tap sounds (soft blip vs. loud commit SFX, mic-safe during gameplay)
- Replayable completed levels (practice with best-score safety; disabled after report deadline)
- Adaptive results screen with score-band headline and deadline/max-level/normal button rows; confetti on ≥80% accuracy

</td>
</tr>
</table>

---

<div align="center">

### 🌟 Highlights

Laravel 13 + React 18 + Inertia.js &nbsp;•&nbsp; Best-score-only tracking &nbsp;•&nbsp; Gamified literacy &nbsp;•&nbsp; Audio feedback (BGM + two-tier tap sounds) &nbsp;•&nbsp; Teacher analytics &nbsp;•&nbsp; Badge & level system &nbsp;•&nbsp; Parent report emails &nbsp;•&nbsp; Responsive Tailwind UI &nbsp;•&nbsp; In-memory SQLite testing &nbsp;•&nbsp; Seeded demo environment

<br>

<sub>Built with ❤️ as a capstone project</sub>

</div>
