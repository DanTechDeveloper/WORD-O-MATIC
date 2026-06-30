# Reports

> Version 1.0

## Dashboard

Route: `GET /teacher/reports`. Charts classify students:

| Category | Meaning |
|---|---|
| Not Started | No game sessions |
| At Risk | Significantly behind |
| Needs Support | Low accuracy trend |
| On Track | Meeting expectations |

## Deadline

| State | Behavior |
|---|---|
| Before deadline | Checkboxes disabled, Send locked, deadline save locked |
| After deadline | All enabled |

Training words filtered by `created_at <= deadline`.

## Email

- Sent via `Mail::to()->send()` (synchronous, no queue).
- Teacher clicks Send → immediate.
- `reported_at` = deadline timestamp (not current time).
- Test mail driver: `array`.

## Exports

PDF and Excel from reports page. Available after deadline passes.

## Student Details

Route: `GET /teacher/studentDetails/{id}`. Shows completed modules, accuracy trends, badge history.
