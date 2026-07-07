# Reports

> Version 1.1

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
| Before deadline | Checkboxes disabled, Send locked, deadline save locked |
| After deadline | All enabled |

Training words filtered by `created_at <= deadline`.

## Email

- Sent via `Mail::to()->queue()` (queued, not synchronous).
- Teacher clicks Send — response returns immediately, mail processed by queue worker.
- `reported_at` = deadline timestamp (not current time).
- Flash data (`sent`, `failed`, `reported_at`) exposed to frontend via `HandleInertiaRequests`.

## Exports

PDF and Excel from reports page. Available after deadline passes.

## Student Details

Route: `GET /teacher/studentDetails/{id}`. Shows completed modules, accuracy trends, badge history.
