# Reports

> Version 1.3

## Dashboard

Route: `GET /teacher/reports`. Charts classify students:

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

Training words filtered by `created_at <= deadline` (deadline is normalized via `Carbon::parse($cutoff)->format('Y-m-d H:i:s')` to avoid SQL string comparison issues with ISO dates).

## Email

- Sent via `Mail::to()->queue()` (queued, not synchronous).
- Teacher clicks Send — response returns immediately, mail processed by queue worker.
- `reported_at` = deadline timestamp (not current time).
- Flash data (`sent`, `failed`, `reported_at`) exposed to frontend via `HandleInertiaRequests`.

## Sent Tracking

- `students.report_sent_at` timestamp set after each successful email queue (`TeacherController.php:475`, inside `sendReportEmails()`; the method itself starts at line 424).
- Students with a non-null `report_sent_at` are hidden from the selection list and moved to a collapsible "Already Sent" section above the student list.
- Field must be added to `$fillable` in `StudentProfile` model (silent drop otherwise).

## Exports

Excel (`.xlsx`) export via `ReportsExport` is available after deadline passes.
- **Class Report Sheet**: Contains student details, status breakdown summary, and two embedded native Excel charts:
  - **Class Health Distribution** (Pie Chart): Visualizes student status distribution (On Track, Needs Support, At Risk, In Progress, Not Started).
  - **Student Accuracy Comparison** (Bar/Column Chart): Compares Word Blast and Story Quest accuracies per student.
- **Word Blast Progress Sheet**: Detailed list of words currently in training per student, including:
  - Student Name, Section, Status, Accuracy (%), Module, Training Words, Word Count
- **Story Quest Progress Sheet**: Detailed list of paragraphs currently in training per student, including:
  - Student Name, Section, Status, Accuracy (%), Module, Training Words, Word Count

## Student Details

Route: `GET /teacher/studentDetails/{id}`. Shows completed modules, accuracy trends, badge history.
