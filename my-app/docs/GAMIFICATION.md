# Gamification

> Version 1.3

## XP & Points

- Points per module: word smashes in Read and Speak modes.
- Accumulated on `StudentProfile.points`.
- Updated only on new best score (not overwritten by retries).

## Levels

| Field | Track |
|---|---|
| `read_level` | Word module progression |
| `speak_level` | Paragraph module progression |

Sequential — must complete level N for N+1. 10 levels each (levels 1–10 are real
content; `level = 0` is the tutorial module). New students are created at
`read_level = 0` / `speak_level = 0` (the tutorial level) via
`TeacherController::persistStudent()`. Completing the tutorial module in a mode
advances that track to `1` through `ProgressService` (the tutorial module is the
only level-0 module, so the bump is `0 + 1 = 1`).

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

Badges defined in `badges` table (`metric`, `threshold_score` — `operator` dropped 2026-09-02, always `>=`). Unlock once per student via `student_badges` pivot. Streak/accuracy are tiered — only the highest threshold per metric is awarded per game (prevents 10/10 6-badge burst; `first-steps` + `word-master` still stack as different thresholds of same metric are progressive).

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
| Word Master | `word-master` | Points | `total_points` | 50 | Reach 50 accumulated player points |
| Story Quest Finisher | `story-finisher` | Completion | `paragraph_completion` | 100 (%) | Complete 100% of paragraph module words |
| Word Blast Finisher | `word-blast-finisher` | Completion | `word_completion` | 100 (%) | Complete 100% of word module words |
| On Fire | `on-fire` | Streak | `streak` | 3 | Get 3 correct in a row |
| Blazing Streak | `blazing-streak` | Streak | `streak` | 5 | Get 5 correct in a row |
| Unstoppable | `unstoppable` | Streak | `streak` | 7 | Get 7 correct in a row |
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

Computed by `ProgressService::recalculateStatus()`, which delegates to the shared static classifier `ProgressService::classify(float $wordBlastAcc, float $storyQuestAcc, bool $wordStarted, bool $storyStarted)` — the single source of truth for these thresholds. The teacher dashboard (`TeacherController::dashboardStats`) and `StudentSeeder` call the same method, and the dashboard payload uses the DB vocabulary (`support`, not a separate `needsSupport` key). The related **Final Average** metric (`round((wb+sq)/2,2)`) shares `classify`'s started guards via `ProgressService::finalAverage()` and the `StudentProfile::finalAverage` accessor — null until both skills started.

## Word Attempt Analytics

Per-word attempt tracking lives on `student_word_mastery` / `student_paragraph_mastery`
(`failed_attempts`, default 0) — storage stays per-word, reporting diverges. Deliberately kept distinct from module/student Status —
three concepts, never collapsed:

| Concept | Answers | Where |
|---|---|---|
| Status | How is the student performing overall? | `students.status` (accuracy-based) |
| Mastery | Has the student recognized this word/sentence at least once? | Word Blast: `student_word_mastery.status` per word (sticky); Story Quest: sentence `mastered` iff every word `mastered` else `training` (`ParagraphModule::buildLevels` derives `sentence_stats`) |
| Attempts | Which words/sentences required repeated attempts? | Word Blast: `student_word_mastery.failed_attempts` per word; Story Quest: `sentence.failed_attempts = sum(word.failed_attempts)` |

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
- Surfaced in the Word Analysis tables on `Teacher/StudentDetails.jsx`: Word Blast via `word_stats` (`aggregateZoneRows` now direct, no dedup — 10 unique words/level, YAGNI), Story Quest via `sentence_stats` (`SentenceChip` per sentence, `failed_attempts=sum(word)`); unseen words appear at 0. Email ↔ StudentDetails parity locked by `ReportTest::test_email_payload_matches_student_details_view_data` (now sentence-aware for Story Quest).
- Story Quest no longer merges duplicate word texts — sentences are unique (`I see a cat.` vs `The cat is big.`); the old per-word dedup (`aggregateWordStats` `normalizeWord` `BF25`) was Word Blast legacy and has been removed (now direct `word_stats` iteration).
- Also surfaced in parent emails: the Training Zones group training words/sentences into
  **Still Practicing** (< threshold) and **Needs More Practice** (≥ threshold,
  amber, "Not yet mastered") with `N recorded attempt(s)` (Story Quest `N=sum(word)` ) metas — counts framed
  as recorded history, not recommended repetitions. Recovered stays teacher-only;
  email ↔ StudentDetails parity locked by
  `ReportTest::test_email_payload_matches_student_details_view_data`.

## Student Deletion

Deleting a student (Teacher → Students → Delete) cascade-removes all related records: progress, mastery, game sessions, badges, and profile. Irreversible.
