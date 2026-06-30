# Modules

> Version 1.0

## Structure

| Type | Count | Content |
|---|---|---|
| Word modules | 10 | 10 words each, progressive difficulty |
| Paragraph modules | 10 | Paragraph-based, progressive difficulty |

Seeded via `DatabaseSeeder`.

## Teacher

| Action | Route |
|---|---|
| View word modules | `GET /teacher/wordModules` |
| View paragraph modules | `GET /teacher/paragraphModules` |
| Update word modules | `PUT /teacher/wordModules` |
| Update paragraph modules | `PUT /teacher/paragraphModules` |

## Student

| View | Route |
|---|---|
| Read levels | `/student/readModeLevels` |
| Speak levels | `/student/speakModeLevels` |

Status mapped by `LevelService`: `locked`, `current`, `in_progress`, `completed`.

## Rules

- Sequential — no skipping.
- Deadlines set by teacher in Reports.
- Completed modules not replayable unless conditions met.
