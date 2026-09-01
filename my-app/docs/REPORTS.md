# Reports

> Version 1.9

## Dashboard

Route: `GET /teacher/reports` → `ReportController@reports`. Charts classify students:

| Category | Meaning |
|---|---|
| Not Started | No progress rows in either skill (`started` flag false for both) — a 0% best score from a real play is NOT "not started" (CAVEATS BF26) |
| At Risk | Average accuracy < 60% |
| Needs Support | Average accuracy 60-80% |
| On Track | Average accuracy ≥ 80% |

Classification formula: `wordBlastAcc` and `storyQuestAcc` averaged. The displayed status (dashboard, emailed report, Excel export, Reports.jsx) is the single stored `students.status` column written by `ProgressService::recalculateStatus()` — none recompute it, so they cannot diverge (CAVEATS BF26).

The **numeric Final Average** is a separate, derived metric surfaced everywhere the two accuracies appear (teacher Dashboard table, Students, Reports.jsx, StudentDetails, parent email, Excel export): `round((wordBlastAcc + storyQuestAcc) / 2, 2)`, shown as `null`/"N/A" until **both** skills have a real started signal (one-sided `(80+0)/2=40` never renders). SOT is `ProgressService::finalAverage()` / the `StudentProfile::finalAverage` accessor. Teacher's `Dashboard.jsx` colors each accuracy column (incl. Final Average) with a risk dot based on `computeRisk(acc)` (60/80 thresholds mirroring `classify`).

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

**Email content** (`student-report.blade.php`, v1.7 redesign) is a projection of the **same `curriculumForUser()` data** that powers `StudentDetails` — parity locked by `ReportTest::test_email_payload_matches_student_details_view_data`:

- **Header**: student name, sector, status pill (all five statuses render a colored pill).
- **Performance Overview**: Word Blast / Story Quest accuracy tiles + a full-width amber **Final Average** card (null-safe — hidden/absent when unstarted, `$data['finalAverage'] ?? null`).
- **Curriculum Progress**: per-mode completion % (`wordBlastProg` / `storyQuestProg` via `ReportService::curriculumPercent()` — same math as the frontend's `calcOverallProgress`, parity asserted by test) rendered as progress bars + level line.
- **Latest Achievement**: latest badge card (or empty state).
- **Training Zone × 2** (Word Blast / Story Quest): every still-training word grouped by recorded tries against the shared threshold `ReportService::NEEDS_ATTENTION_ATTEMPTS = 3`:
  - **Still Practicing** — training words below the threshold; chips show `N recorded attempt(s)`.
  - **Needs More Practice** — training words at/above it; amber chips with `N recorded attempts · Not yet mastered`.
  - Disclaimer copy states counts are recorded history, not recommended repetitions.
  - Payload: `wordAttempts` / `paragraphWordAttempts` from `ReportService::trainingAttemptsFrom()`. Recovered words (mastered + ≥3) stay teacher-only.
- **Recommendation**: banner for **all five statuses** (including `notStarted` / `in_progress`). Copy is template-local wording — deliberately no longer mirrored from the `StudentDetails.jsx` `recommendations` map.

## Sent Tracking

- `students.report_sent_at` timestamp set after each successful email queue (inside `ReportController::sendReportEmails()`).
- Students with a non-null `report_sent_at` are hidden from the selection list and moved to a collapsible "Already Sent" section above the student list.
- Field must be added to `$fillable` in `StudentProfile` model (silent drop otherwise).

## Exports

Excel (`.xlsx`) export via `ReportsExport` is available after deadline passes.
- **Class Summary Sheet** (tab name `Class Summary`): One row per student with identity + Word Blast % + Story Quest % + **Final Average %** + that student's **own status category** (column E, per BF25). Below the roster is a **Class Health Summary** block (status category + count, 5 rows) that feeds the pie. Two embedded native Excel charts sit on this same tab in columns N–V (scroll past column M):
  - **Class Health Distribution** (Pie Chart, anchored `N2:V16`): Visualizes the Class Health Summary block — student status distribution (On Track, Needs Support, At Risk, In Progress, Not Started) by count.
  - **Student Accuracy Comparison** (Bar/Column Chart, anchored `N18:V35`): Compares each student's Word Blast and Story Quest accuracy (columns A–C).
- **Student Progress Summary Sheet**: One row per student with identity + status + per-mode progress:
  - Student Name, Student ID, Section, Final Status, Word Blast (accuracy + level combined, e.g. `78% (Level 3 - Phonics Fundamentals)`), Story Quest (accuracy + level combined, e.g. `90% (Level 2 - Farm Animals)`), **Final Average** (e.g. `87.5%`), Top Struggle (up to two worst training words by attempts, e.g. `WB: CAT ×4 · SQ: the ×3`; empty when none)
- **Words Needing Practice Sheet**: Flat drill-down, one row per student-word still in training (sorted attempts-desc within each student):
  - Student Name, Student ID, Section, Mode, Level, Word, Attempts
  - Same normalized projection as the parent email (`ReportService::struggleRowsFrom`, per-level merge + global display casing); rows at/over `NEEDS_ATTENTION_ATTEMPTS` are red-filled
  - Export reads per-student `curriculumForUser` — identical data source as the emailed report

## Student Details

Route: `GET /teacher/studentDetails/{id}`. Shows completed modules, accuracy trends, badge history. A top **Overall Status panel** summarizes the student at a glance: colored status badge, the per-status recommendation line, a Performance Summary (Word Blast / Story Quest accuracy), and Curriculum Progress (completion % per mode, computed from `curriculumForUser`).
