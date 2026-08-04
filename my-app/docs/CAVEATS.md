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
| H3 | Authz | `results($id)` uses `GameSession::findOrFail($id)` with no `user_id` check — any authenticated student can view another student's session by guessing ids. `gameplayReadMode/{id}` / `gameplaySpeakMode/{id}` accept any module id with no per-student gating. | Cross-student data exposure | Pre-launch security pass |
| H4 | Reports (product) | Retries erase the struggle signal: 25 retries → perfect → `onTrack` → no warning email. `game_sessions` holds every attempt but reports only use best scores. | Warning-only reports miss the students who needed the most attempts | Prof feedback says parents need attempt counts |
| H5 | Reports (data) | Emailed accuracy (`wordBlastAcc`/`storyQuestAcc`) is the current live denormalized value; training words are computed as-of-deadline (TeacherController.php:452). There is no frozen accuracy snapshot — accuracy is stale-at-send-time, so post-deadline retries shift the emailed value vs. the deadline cutoff used for training words. | Emailed report can contradict the as-of-deadline training list | Strict "as of" reporting required |
| H6 | Security | Student PINs stored plaintext in `pin_plain` (intentional — teacher PIN management reads them back). Data-at-rest tradeoff. | Compromised DB exposes student PINs | Security review / auth change |

## Medium

| # | Area | Caveat |
|---|---|---|
| M1 | Data | Mass-assignment silently drops fields — a new column needs migration → `$fillable` → controller response array (the `report_sent_at` bug pattern). |
| M2 | Data | Denormalized stats on `students` (`points`, accuracies, `status`, levels) are updated only via `ProgressService`; teacher edits/seeders bypass it. `status` is sticky (a `completed` module cannot regress on replay) and otherwise recalculates only on a new best; `points`/levels/locks still move only on a new best. Per-word mastery rows (`student_word_mastery` / `student_paragraph_mastery`) are updated via the controllers and are now sticky-by-design (BF4) — practice replays cannot regress earned mastery. |
| M3 | Gameplay | `finishRound` has no locking — two parallel POSTs (double-tap via `saveWordProgress` / `saveParagraphProgress`) can create duplicate `GameSession` rows and double points delta. |
| M4 | Reports | `Setting('report_deadline')` is a single global deadline — one deadline for all sections/classes. |
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
| BF2 | Status regression | A worse replay could downgrade a `completed` module back to `in_progress` (ProgressService line 74: `status = wordsProcessed >= totalWords ? completed : in_progress`). | Status is sticky: `completed` stays `completed` on replay (`progress->status === 'completed' || wordsProcessed >= totalWords`). | `ProgressServiceTest::test_status_does_not_regress_to_in_progress_on_worse_replay`, `test_better_replay_cannot_downgrade_accuracy`. |
| BF3 | Curriculum contamination | `WordModule::curriculumForUser` / `ParagraphModule::curriculumForUser` (and the `trainingWordsForUser` / `trainingWordsForUsers` getters) selected `is_tutorial=true` modules, inflating the teacher `StudentDetails` mastery bars by tutorial words (root cause of the ~105% overage). | Tutorial modules excluded from all curriculum/training queries via `->where('is_tutorial', false)`. Streak integrity was already structural (tutorial plays skip `GameSession::logSession`). | `CurriculumIsolationTest::test_word_curriculum_excludes_tutorial_module`, `test_paragraph_curriculum_excludes_tutorial_module`. |
| BF4 | Mastery regression | Replaying a completed module could demote an already-`mastered` word/paragraph-word back to `training` (`StudentController::updateWordMastery` / `updateParagraphMastery` used `updateOrCreate`, overwriting to whatever status the client sent). This flipped `mastered → training` on any mispronounce in a replay, regressing the `StudentDetails` mastery bar on a completed level. | Mastery is now sticky at the controller boundary: a `training` POST on an existing `mastered` row is a no-op; `training → mastered` promotion still allowed. Aligns per-word mastery with the best-score-only invariant (BF2). | `CurriculumIsolationTest::test_existing_mastered_word_is_not_downgraded_on_mispronounce`, `test_training_word_can_still_be_promoted_to_mastered`. |

## Explicitly accepted for MVP

- **Best-score-only retry** — worse plays never overwrite; replay is practice with zero point farming. Intentional, see ProgressService.
- **Replayable completed levels** — LevelCard allows "PLAY AGAIN" on completed modules; H4 is the known tradeoff of this decision.
- **Single global report deadline** — per-class deadlines deferred (M4).
- **Teacher-visible PINs** — `pin_plain` readback for teacher convenience; security tradeoff accepted (H6).
- **No Form Request classes / no Policies** — inline validation + middleware only; fine while controllers stay small.
