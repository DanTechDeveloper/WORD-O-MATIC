# Modules

> Version 1.1

## Structure

| Type | Count | Content |
|---|---|---|
| Word modules | 11 (10 real + 1 tutorial) | 10 words each (5 for tutorial), progressive difficulty, randomized per gameplay |
| Paragraph modules | 11 (10 real + 1 tutorial) | Paragraph-based, progressive difficulty, fixed order |

Tutorial modules (`is_tutorial=true`, `level=0`) seeded via `CurriculumSeeder`. Filtered out by `LevelService` (`->where('is_tutorial', false)`) after student completes tutorial.

## Teacher

| Action | Route |
|---|---|
| View word modules | `GET /teacher/wordModules` |
| View paragraph modules | `GET /teacher/paragraphModules` |
| Update word modules | `PUT /teacher/wordModules` |
| Update paragraph modules | `PUT /teacher/paragraphModules` |
| Delete student | `DELETE /teacher/students/{id}` |

## Student

| View | Route |
|---|---|
| Read levels | `/student/readModeLevels` |
| Speak levels | `/student/speakModeLevels` |

Status mapped by `LevelService`: `locked`, `current`, `in_progress`, `completed`.

## Rules

- Sequential — no skipping.
- Deadlines set by teacher in Reports.
- Completed modules remain replayable ("PLAY AGAIN" on level cards) — best-score-only keeps replays point-safe.

## Completion Badges

Two finisher badges track curriculum-wide completion:

| Badge | Slug | Metric | Requirement |
|---|---|---|---|
| Story Quest Finisher | `story-finisher` | `paragraph_completion` | Complete 100% of paragraph module words |
| Word Blast Finisher | `word-blast-finisher` | `word_completion` | Complete 100% of word module words |

Progress shown as a percentage on the Student badges page and Game Results screen.
Calculated dynamically from `words_smashed` sums — no fixed thresholds.
