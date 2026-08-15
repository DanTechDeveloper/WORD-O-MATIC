# Reports

> Version 1.6

## Dashboard

Route: `GET /teacher/reports` → `ReportController@reports`. Charts classify students:

| Category | Meaning |
|---|---|
| Not Started | No game sessions (accuracy null/0) |
| At Risk | Average accuracy < 60% |
| Needs Support | Average accuracy 60-80% |
| On Track | Average accuracy ≥ 80% |

Classification formula: `wordBlastAcc` and `storyQuestAcc` averaged.

## Deadline

| State | Behavior |
|---|---|
| Before deadline | Checkboxes disabled, Send locked, deadline save locked; student gameplay fully open |
| After deadline | All teacher actions enabled. **Student gameplay blocked** (Option A, see CAVEATS.md BF7): `saveWordProgress` / `saveParagraphProgress` log the session but skip all progress updates (`StudentController::finishRound`); PLAY AGAIN disabled and completed level cards non-clickable (`LevelCard.jsx`), amber banner on `LevelsPage.jsx`. No deadline set → gameplay open. |

Post-deadline sessions are logged with `is_deadline_hit=true` (baked in at `finishRound`, sticky — see DATABASE.md). The results page renders the non-scoring "TIME'S UP!" view (`GameResults.jsx`: deadline banner, "You played" score card, NextBadge hidden), and `BadgeUnlockModal` auto-suppresses via `auth.deadline`. Streak/accuracy badge metrics (`BadgeService::bestSessionMetric`, `StudentController::badges()`) exclude flagged sessions permanently — even if the teacher clears the deadline afterward.

The `created_at <= deadline` filter (normalized via `Carbon::parse($cutoff)->format('Y-m-d H:i:s')` to avoid ISO string comparison issues) applies to training words, mastered words, **and** the curriculum rows shown on `StudentDetails`. The cutoff is centralized in `ReportService::cutoff()` (returns the deadline value only once it has passed, else `null`) and threaded through `ReportController::reports`, `sendReportEmails`, and `exportReports`. No cutoff passed → all rows returned.

The teacher deadline banner is a single source of truth in `DashboardLayout.jsx` (reads global `auth.deadline`), shown across the main content whenever a deadline is set. Its message is page-aware: the Reports page (`/teacher/reports`) gets deadline-specific copy ("…All report actions are now available. Deadline was set to …" past / "Reporting deadline not yet reached…" future), every other teacher page gets the gameplay-locked copy — which also states that **module editing (Word Blast and Story Quest) is locked**. After the deadline, `Word.jsx` / `Paragraph.jsx` disable the Manage buttons and the Add Module card (frontend), and `TeacherController::updateWordModule` / `updateParagraphModule` reject writes (backend). Reports no longer renders its own inline banner.

## Email

- Sent via `Mail::to()->queue()` (queued, not synchronous).
- Teacher clicks Send button → response returns immediately, mail processed by queue worker.
- `reported_at` = deadline timestamp (not current time).
- Flash data (`sent`, `failed`, `reported_at`) exposed to frontend via `HandleInertiaRequests`.

**Email content** (`student-report.blade.php`) mirrors the teacher `StudentDetails` readout:

- **6-tile grid** (3 rows): `Word Blast` / `Story Quest` accuracy, `Word Blast Level` / `Story Quest Level` (relabeled from Read/Speak Level), and `Word Blast Progress` / `Story Quest Progress` (curriculum completion %, `wordBlastProg` / `storyQuestProg`).
- `wordBlastProg` / `storyQuestProg` are computed via `ReportService::curriculumPercent()` — `round(Σmastered / Σwords_count × 100)` per skill, the same percentage the frontend computes from `curriculumForUser`. Kept as two implementations by decision (see CAVEATS).
- The per-status recommendation block (`onTrack` / `needsSupport` / `support` / `atRisk`) uses the exact copy from the `StudentDetails.jsx` `recommendations` map — that JSX map is the single source of that wording. `notStarted` / `in_progress` have no banner block (same as before).

## Sent Tracking

- `students.report_sent_at` timestamp set after each successful email queue (inside `ReportController::sendReportEmails()`).
- Students with a non-null `report_sent_at` are hidden from the selection list and moved to a collapsible "Already Sent" section above the student list.
- Field must be added to `$fillable` in `StudentProfile` model (silent drop otherwise).

## Exports

Excel (`.xlsx`) export via `ReportsExport` is available after deadline passes.
- **Class Summary Sheet**: Contains student details, status breakdown summary, and two embedded native Excel charts:
  - **Class Health Distribution** (Pie Chart): Visualizes student status distribution (On Track, Needs Support, At Risk, In Progress, Not Started).
  - **Student Accuracy Comparison** (Bar/Column Chart): Compares Word Blast and Story Quest accuracies per student.
- **Student Progress Summary Sheet**: One row per student with identity + status + per-mode progress:
  - Student Name, Student ID, Section, Final Status, Word Blast (accuracy + level combined, e.g. `78% (Level 3 - Phonics Fundamentals)`), Story Quest (accuracy + level combined, e.g. `90% (Level 2 - Farm Animals)`)
- **Mastered & Training Words Sheet**: One row per student with the actual mastered/training words per mode:
  - Student Name, Word Blast Mastered, Word Blast Training, Story Quest Mastered, Story Quest Training
  - Each cell lists words grouped per level, e.g. `Level 1 - cat, dog` (one group per line)

## Student Details

Route: `GET /teacher/studentDetails/{id}`. Shows completed modules, accuracy trends, badge history. A top **Overall Status panel** summarizes the student at a glance: colored status badge, the per-status recommendation line, a Performance Summary (Word Blast / Story Quest accuracy), and Curriculum Progress (completion % per mode, computed from `curriculumForUser`).
