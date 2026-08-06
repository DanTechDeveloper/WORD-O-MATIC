# CAVEATS

> Version 1.0 — ledger of known tradeoffs, risks, and intentional shortcuts.

This file exists so no caveat gets lost. Every row below is a known behavior
that may surprise, a risk that is accepted for MVP, or a tradeoff with an
explicit trigger to fix. If something in here starts hurting, the "Trigger to
fix" column names the event that should prompt the fix — not before (YAGNI).

## How to use

- **High** — will bite in production or real classroom use. Fix before it
  happens if the trigger is near, otherwise track it.
- **Medium** — bites under specific conditions (a particular flow, a scale
  milestone, a new feature).
- **Low** — accepted; tracked for awareness only.
- **Explicitly accepted for MVP** — intentional design decisions with known
  downsides; do not "fix" without revisiting the decision first.

## High

| # | Area | Caveat | Consequence | Trigger to fix |
|---|---|---|---|---|
| H1 | Emails | `StudentReportMail` is sent via `Mail::to()->queue()` (StudentReportMail.php:33) — a queue worker must run in prod (DEPLOYMENT.md:34). Kung walang worker, ang emails ay tumutumpok sa `jobs` table pero ang UI ay nagsasabing "sent" at `report_sent_at` ay nase-set (TeacherController.php:480). No failure detection. | Parents never receive reports while teacher believes they were sent | First production email run |
| H2 | Gameplay trust | `saveWordProgress` / `saveParagraphProgress` validate `words_processed` with only `min:0` (StudentController.php:186), so a student can POST `words_processed: 999` → `ProgressService` sets `status='completed'` (ProgressService.php:74). `words_smashed` is clamped but completion status is not. | Progress/levels/leaderboard can be gamed without playing | If cheating becomes a real concern |
| H3 | Authz | `results($id)` uses `GameSession::findOrFail($id)` with no `user_id` check — any authenticated student can view another student's session by guessing ids. | Cross-student data exposure | Pre-launch security pass |
| H4 | Reports (product) | Retries erase the struggle signal: 25 retries → perfect → `onTrack` → no warning email. `game_sessions` holds every attempt but reports only use best scores. | Warning-only reports miss the students who needed the most attempts | Prof feedback says parents need attempt counts |
| H6 | Security | Student PINs stored plaintext in `pin_plain` (intentional — teacher PIN management reads them back). Data-at-rest tradeoff. | Compromised DB exposes student PINs | Security review / auth change |

## Medium

| # | Area | Caveat |
|---|---|---|
| M1 | Data | Mass-assignment silently drops fields — a new column needs migration → `$fillable` → controller response array (the `report_sent_at` bug pattern). |
| M2 | Data | Denormalized stats on `students` (`points`, accuracies, `status`, levels) are updated only via `ProgressService`; teacher edits/seeders bypass it. `status` is sticky (a `completed` module cannot regress on replay) and otherwise recalculates only on a new best; `points`/levels/locks still move only on a new best. Per-word mastery rows (`student_word_mastery` / `student_paragraph_mastery`) are updated via the controllers and are now sticky-by-design (BF4) — practice replays cannot regress earned mastery. |
| M3 | Gameplay | `finishRound` has no locking — two parallel POSTs (double-tap via `saveWordProgress` / `saveParagraphProgress`) can create duplicate `GameSession` rows and double points delta. |
| M4 | Reports | `Setting('report_deadline')` is a single global deadline — one deadline for all sections/classes. After the deadline passes, student gameplay is blocked server-side (see BF7): progress POSTs log the session but skip all stat updates. |
| M5 | Teacher | Teacher Badges page (`badges()`) runs `checkAllEligibleBadges` for ALL students on every GET — writes during a read path, O(students × badges) per page view. |
| M6 | Data | `GameSession` rows grow unbounded — the replay feature multiplies attempts; no pruning/archival. |
| M7 | Gameplay | Resume is client-only (`sessionStorage`, see resume-and-timer.md) — switching devices/browser loses mid-round progress; server only knows completed saves. |
| M8 | Onboarding | `updateAvatar` validates `avatar_url` as free-form string (`StudentController.php:74`, only `required|string`) — arbitrary value stored in `avatar` and rendered as `<img src>` in `StudentDetails`. |
| M9 | Onboarding | `CheckStudentOnboarding` gates the avatar step only — direct URL to any gameplay module bypasses tutorial ordering; tutorial branches assume `->first()` tutorial module. |
| M10 | CI | vitest/Pint/typecheck are not wired into CI (PHP tests only) — JS regressions ship invisibly. |

## Low (accepted)

| # | Area | Caveat |
|---|---|---|
| L1 | Stats | `wordBlastAcc` = average across modules — early modules drag the average down; risk sort uses COALESCE avg. |
| L2 | Results | `results()` crashes on null module if the session's module was deleted (`$module->words_count`). |
| L3 | Performance | `TeacherController::dashboardStats()` re-queries aggregates per request, no caching — fine at MVP scale. |
| L4 | Deploy | Queue env divergence: local `.env` uses `sync`, prod expects `database` — async ordering and failure visibility differ. |

## Explicitly accepted for MVP

## Bug fixes (verified by tests)

| # | Area | Was | Now | Locked by |
|---|---|---|---|---|
| BF1 | Accuracy | Tutorial module accuracy was included in the averaged `wordBlastAcc`/`storyQuestAcc` (ProgressService lines 84-87, `avg('accuracy')` with no tutorial filter). | Tutorial (`is_tutorial=true`) rows excluded via `when($tutorialModule, ...)`. | `ProgressServiceTest::test_tutorial_progress_does_not_pollute_accuracy`, `test_tutorial_paragraph_progress_does_not_pollute_accuracy`. |
| BF2 | Status regression | A worse replay could downgrade a `completed` module back to `in_progress` (ProgressService line 74: `status = wordsProcessed >= totalWords ? completed : in_progress`). | Status is sticky: `completed` stays `completed` on replay (`progress->status === 'completed' || wordsProcessed >= totalWords`). Replay triggers (Again in `GameResults.jsx`, Play Again on `LevelsPage.jsx`) mount a fresh `useGameplayEngine` round — they never reset the module's persisted status. See also BF4 (per-word mastery). | `ProgressServiceTest::test_status_does_not_regress_to_in_progress_on_worse_replay`, `test_better_replay_cannot_downgrade_accuracy`. |
| BF3 | Curriculum contamination | `WordModule::curriculumForUser` / `ParagraphModule::curriculumForUser` (and the `trainingWordsForUser` / `trainingWordsForUsers` getters) selected `is_tutorial=true` modules, inflating the teacher `StudentDetails` mastery bars by tutorial words (root cause of the ~105% overage). | Tutorial modules excluded from all curriculum/training queries via `->where('is_tutorial', false)`. Streak integrity was already structural (tutorial plays skip `GameSession::logSession`); `StudentDetails.jsx` is now a pure report-view of this data — see "Replay vs. mastery" under Explicitly accepted for MVP. | `CurriculumIsolationTest::test_word_curriculum_excludes_tutorial_module`, `test_paragraph_curriculum_excludes_tutorial_module`. |
| BF4 | Mastery regression | Replaying a completed module could demote an already-`mastered` word/paragraph-word back to `training` (`StudentController::updateWordMastery` / `updateParagraphMastery` used `updateOrCreate`, overwriting to whatever status the client sent). This flipped `mastered → training` on any mispronounce in a replay, regressing the `StudentDetails` mastery bar on a completed level. | Mastery is now sticky at the controller boundary: a `training` POST on an existing `mastered` row is a no-op; `training → mastered` promotion still allowed. Aligns per-word mastery with the best-score-only invariant (BF2). | `CurriculumIsolationTest::test_existing_mastered_word_is_not_downgraded_on_mispronounce`, `test_training_word_can_still_be_promoted_to_mastered`. |
| BF5 | Module access | `gameplayReadMode/{id}` / `gameplaySpeakMode/{id}` accepted any module ID with no per-student gating — a student could jump to a locked module by editing the URL. | Both endpoints now call `LevelService::isModuleAccessible($userId, $id, $type)`; a `locked` status redirects back to the level-select page with a flash error. `LevelsPage.jsx` renders the `flash.error` banner so the student sees why they were bounced. | `StudentController::gameplayReadMode`, `StudentController::gameplaySpeakMode`, `LevelService::isModuleAccessible`, `resources/js/Pages/Student/LevelsPage.jsx`. |
| BF6 | Deadline Cutoff & Excel Charts | ISO date string comparison issue. Excel export had charts & namespace typos. Training words were in a single combined sheet. | Cutoff timestamp parsed & formatted as `Y-m-d H:i:s`. Validation updated to `after_or_equal:today`. Excel export implements `WithCharts` with native Pie Chart and Bar Chart, and now provides 3 distinct sheets: Class Report, Word Blast Progress, and Story Quest Progress (separated for clearer teacher analysis with explicit Status and Accuracy columns). | `WordModule::trainingWordsForUsers`, `ParagraphModule::trainingWordsForUsers`, `TeacherController::saveDeadline`, `ClassReportSheet`, `ReportTest`. |
| BF7 | Post-deadline drift (Option A) | After the deadline, students could keep replaying; the emailed accuracy (`wordBlastAcc`/`storyQuestAcc`) is the live denormalized value, so late retries shifted it past the as-of-deadline training-word cutoff (old H5). | Gameplay is blocked once the deadline passes: `finishRound()` checks `Setting('report_deadline')` and skips all `ProgressService` updates — the `GameSession` is still logged for analytics, but points/accuracies/status/mastery are frozen. Frontend mirrors this: PLAY AGAIN is disabled and completed level cards are non-clickable (`LevelCard.jsx`), with an amber banner on `LevelsPage.jsx`. No deadline set → gameplay fully open (both server and UI). | `GameplayTest::test_round_logs_session_but_skips_progress_when_deadline_passed`, `test_round_saves_progress_when_no_deadline_is_set`. |
| BF8 | Timeout race conditions in speech recognition | All speech recognition timeouts (`sentenceTimeoutRef` 5s, `mispronounceTimeoutRef` 200ms/300ms/1200ms) could fire after the target word changed, incorrectly marking mispronunciations on the wrong word. | All timeouts now verify target word identity before calling `onMispronounced`. `sentenceTimeoutTargetRef` stores the target at timeout setup; callbacks check if it still matches current `targetWord`. | `useSpeechRecognition.js:114-120` (5000ms sentence timeout), `153-163` (300ms sentence mode), `204-231` (200ms word mode), `244-258` (1200ms word mode) - all validate target word; reset on `targetWord` change (line 331). |

## Explicitly accepted for MVP

- **Best-score-only retry** — worse plays never overwrite; replay is practice with zero point farming. Intentional, see ProgressService.
- **Replay vs. mastery** — Replaying a completed module (Again button in `GameResults.jsx`, Play Again on `LevelsPage.jsx`) is a *fresh practice round* with its own `useGameplayEngine` state; it does **not** reset or resume mastery rows. Mastery writes are gated server-side to be add-only (`mastered` stays `mastered`; `training → mastered` allowed), so practice feedback still fires without demoting earned mastery. `StudentDetails.jsx` and `LevelsPage.jsx` are read-only views of `curriculumForUser` + denorm columns and cannot corrupt mastery client-side.
- **Replayable completed levels** — LevelCard allows "PLAY AGAIN" on completed modules; H4 is the known tradeoff of this decision.
- **Single global report deadline** — per-class deadlines deferred (M4).
- **Teacher-visible PINs** — `pin_plain` readback for teacher convenience; security tradeoff accepted (H6).
- **No Form Request classes / no Policies** — inline validation + middleware only; fine while controllers stay small.
