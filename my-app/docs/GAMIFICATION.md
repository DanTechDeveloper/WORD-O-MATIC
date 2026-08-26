# Gamification

> Version 1.1

## XP & Points

- Points per module: word smashes in Read and Speak modes.
- Accumulated on `StudentProfile.points`.
- Updated only on new best score (not overwritten by retries).

## Levels

| Field | Track |
|---|---|
| `read_level` | Word module progression |
| `speak_level` | Paragraph module progression |

Sequential — must complete level N for N+1. 10 levels each.

## Tutorial Isolation

Tutorial play (`is_tutorial=true` modules) is isolated from real game tracking:
- No points awarded — excluded from `StudentProfile.points` sum
- No accuracy/status recalculation on `students` table
- No `GameSession` logged
- No leaderboard impact
- Only "Tutorial Complete" badge can be earned (not gameplay badges)
- On completion the badge flashes via `BadgeUnlockFlow`; dismissing it shows a congratulations `AvatarSpeechBubble` on the Dashboard (gated by the `tutorial-complete` flash badge)

## Badges

| Type | Trigger | Service |
|---|---|---|
| Onboarding | Complete tutorial / set avatar | `awardOnboardingBadge()` |
| Gameplay | Points / streak / accuracy thresholds | `checkGameplayBadges()` |

Badges defined in `badges` table (`operator`, `threshold_score`). Unlock once per student via `student_badges` pivot.

### Teacher Badges Page

The `/teacher/badges` page provides class-wide badge analytics. It first runs
`BadgeService::checkAllEligibleBadges()` for every student (idempotent catch-up), so
badges earned while a student was logged out still count. Props passed from `TeacherController::badges()`: `badges` (catalog with `earned_count`), `topEarners` (students with `badge_count` + `last_earned_at`), `totalStudents`, `totalBadges`, `totalEarned`, `mostEarnedBadge`, `sections`.

`mostEarnedBadge` only returns a badge if `earned_count >= 2`. If no badge reaches the 2-student threshold, it is `null` and the summary card displays `"N/A"`.

- **Summary cards**: total badges defined, total earned, most earned badge, students with zero badges (computed client-side from `topEarners`, not a separate controller query)
- **Badge catalog**: grid of all 11 badges with earn counts and percentage rates
- **Top earners table**: students ranked by badge count, with section filter and name search

### Full Badge Catalog

| Badge | Slug | Category | Metric | Threshold | Requirement |
|---|---|---|---|---|---|
| First Steps | `first-steps` | Points | `total_points` | 5 | Reach 5 accumulated player points |
| Word Master | `word-master` | Points | `total_points` | 30 | Reach 30 accumulated player points |
| Story Quest Finisher | `story-finisher` | Completion | `paragraph_completion` | 100 (%) | Complete 100% of paragraph module words |
| Word Blast Finisher | `word-blast-finisher` | Completion | `word_completion` | 100 (%) | Complete 100% of word module words |
| On Fire | `on-fire` | Streak | `streak` | 3 | Get 3 correct in a row |
| Blazing Streak | `blazing-streak` | Streak | `streak` | 5 | Get 5 correct in a row |
| Unstoppable | `unstoppable` | Streak | `streak` | 10 | Get 10 correct in a row |
| Clear Speaker | `clear-speaker` | Accuracy | `accuracy` | 80 | Get 80% accuracy in a single game |
| Perfect Round | `perfect-round` | Accuracy | `accuracy` | 100 | Get 100% accuracy in a single game |
| Tutorial Complete | `tutorial-complete` | Onboarding | `action` | — | Finish both tutorial modes |
| Profile Pioneer | `profile-pioneer` | Onboarding | `action` | — | Set your profile avatar |

### Module Completion Metrics

Two metrics replace the old single `total_points` approach for finisher badges. Rather than
checking a fixed point threshold against accumulated player points (which vary by module word count
and mix read + speak modes), these compute **what percentage of the curriculum the student has
mastered**, dynamically:

| Metric | Numerator (earned) | Denominator (total) | Method |
|---|---|---|---|
| `paragraph_completion` | `student_paragraph_progress.words_smashed` (all records) | Sum of `words_count` across all non-tutorial `paragraph_modules` (`withCount('words')`) | `BadgeService::calculateModuleCompletion($user, 'paragraph')` |
| `word_completion` | `student_word_progress.words_smashed` (all records) | Sum of `words_count` across all non-tutorial `word_modules` (`withCount('words')`) | `BadgeService::calculateModuleCompletion($user, 'word')` |

- Returns a **percentage** (0–100.00), rounded to 2 decimal places.
- Badge awards when value `>= 100` (student has smashed all available words).
- Tutorial modules (`is_tutorial=true`, `level=0`) are **excluded** from both numerator and denominator.
- No fixed threshold number — adapts automatically when modules are added/removed/reshuffled.

## Leaderboards

Available at `/student/leaderboards` and `/teacher/leaderboards`. **Best-score based** — retries don't overwrite higher existing scores.

### Teacher Leaderboards

The `/teacher/leaderboards` page shows class-wide rankings with three switchable metric tabs:

- **Points** — total accumulated student points (`students.points`)
- **Word Blast** — average word recognition accuracy (`students.wordBlastAcc`)
- **Story Quest** — average speaking/story accuracy (`students.storyQuestAcc`)

Each tab displays a full ranked list (all students) with section filter dropdown and name search. Top 3 ranked students receive medal indicators (gold/silver/bronze). Data fetched from `students` table joined with `users`, sorted by the selected metric. Props passed from `TeacherController::leaderboards()`: `leaderboard` (3 sorted arrays keyed by metric), `sections`.

## Status Categories

| Status | Meaning |
|---|---|
| Not Started | No activity |
| In Progress | Working through modules |
| At Risk | Behind expected pace |
| Needs Support | Low accuracy |
| On Track | Meeting expectations |

Computed by `ProgressService::recalculateStatus()`, which delegates to the shared static classifier `ProgressService::classify(float $wordBlastAcc, float $storyQuestAcc)` — the single source of truth for these thresholds. The teacher dashboard (`TeacherController::dashboardStats`) and `StudentSeeder` call the same method, and the dashboard payload uses the DB vocabulary (`support`, not a separate `needsSupport` key).

## Word Attempt Analytics

Per-word attempt tracking lives on `student_word_mastery` / `student_paragraph_mastery`
(`failed_attempts`, default 0). Deliberately kept distinct from module/student Status —
three concepts, never collapsed:

| Concept | Answers | Where |
|---|---|---|
| Status | How is the student performing overall? | `students.status` (accuracy-based) |
| Mastery | Has the student recognized this word at least once? | `student_*_mastery.status` (sticky) |
| Attempts | Which words required repeated attempts? | `student_*_mastery.failed_attempts` |

Semantics:

- Every unsuccessful attempt (wrong transcript **or** ASR timeout) increments
  `failed_attempts` while the word is still `training` (`StudentController::updateMastery`).
- First mastery **freezes** the counter forever — it reads as "unsuccessful attempts
  needed to master"; replays can never move it (same sticky guard).
- The threshold lives server-side as `ReportService::NEEDS_ATTENTION_ATTEMPTS = 3`
  (single source of truth, no DB storage); the teacher UI receives it via the
  `teacher.attention_threshold` shared prop (`HandleInertiaRequests`, JSX falls
  back to 3):
  - `training` + ≥3 → **Needs Attention** (unresolved struggle — act)
  - `mastered` + ≥3 → **Recovered** (was difficult, overcome — history only)
  - else → no flag rendered (Normal is the absence of a flag, not a label)
- Surfaced in the Word Analysis tables on `Teacher/StudentDetails.jsx` via the
  additive `word_stats` key of `curriculumForUser()`; unseen words appear at 0.
- Duplicate texts within a level (natural in sentences — "I see a cat. The cat
  is big") render as ONE chip: `failed_attempts` summed across occurrences and
  the worst mastery shown (`training` beats `unseen` beats `mastered`) so a
  Needs Attention flag survives merging. Grouping normalizes casing and
  trailing punctuation (`Cat.` ≡ `cat` ≡ `THE`). The rule is mirrored
  identically page-side (`aggregateZoneRows` in StudentDetails.jsx) and
  email-side (`ReportService::aggregateWordStats`) — locked by the parity test.
- Also surfaced in parent emails: the Training Zones group training words into
  **Still Practicing** (< threshold) and **Needs More Practice** (≥ threshold,
  amber, "Not yet mastered") with `N recorded attempt(s)` metas — counts framed
  as recorded history, not recommended repetitions. Recovered stays teacher-only;
  email ↔ StudentDetails parity locked by
  `ReportTest::test_email_payload_matches_student_details_view_data`.

## Student Deletion

Deleting a student (Teacher → Students → Delete) cascade-removes all related records: progress, mastery, game sessions, badges, and profile. Irreversible.
