# Modules

> Version 1.2

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

> **Deadline edit lock** — after the report deadline passes, teacher module editing is disabled: the Manage buttons and Add Module card on `Word.jsx` / `Paragraph.jsx` are grayed out (frontend), and `TeacherController::updateWordModule` / `updateParagraphModule` reject writes with a flash error ("Cannot edit modules after the report deadline."). The deadline banner copy states this too.

### Word module edit rules

`updateWordModule()` enforces (normalized in PHP — MySQL ci collation differs from SQLite):

- Exactly 10 word slots, all required (`required|string|max:20`); a blank slot fails with "Every word must be filled in.".
- No intra-module duplicates (case-insensitive; error points at the first slot): `"X" is duplicated in this module.`
- No cross-module reuse — a word already used in another level (incl. the tutorial module, level 0) fails: `"X" is already used in Level N.` The module being edited is excluded, so resaving its own words is allowed.
- Words are stored uppercased (`WordModule::saveWithWords`).
- `WordInputModal.jsx` offers a "Paste 10 words" bulk fill (split on spaces/commas; extras past the 10th are silently dropped) and live per-row duplicate detection before submit.
- If the module has student progress (`has_progress` from `wordModules()`), saving asks for a `window.confirm` because saving deletes and recreates the module's words.

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
- Direct URL access to a locked module (`/student/gameplayReadMode/{id}`, `/student/gameplaySpeakMode/{id}`) is rejected: `LevelService::isModuleAccessible()` gates both endpoints and redirects to the level-select page with a flash error.

## Completion Badges

Two finisher badges track curriculum-wide completion:

| Badge | Slug | Metric | Requirement |
|---|---|---|---|
| Story Quest Finisher | `story-finisher` | `paragraph_completion` | Complete 100% of paragraph module words |
| Word Blast Finisher | `word-blast-finisher` | `word_completion` | Complete 100% of word module words |

Progress shown as a percentage on the Student badges page and Game Results screen.
Calculated dynamically from `words_smashed` sums — no fixed thresholds.
