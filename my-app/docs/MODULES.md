# Modules

> Version 1.5

## Structure

| Type | Count | Content |
|---|---|---|
| Word modules | 11 (10 real + 1 tutorial) | 10 words each (5 for tutorial), progressive difficulty, randomized per gameplay |
| Paragraph modules | 11 (10 real + 1 tutorial) | 2 short sentences ×3-5w each (61 total words), **no leading determiner**, each echoes its own level's Word Blast words, progressive difficulty, fixed order, split `(?<=[.!?])\s+` → `sentence_stats` |

Tutorial modules (`is_tutorial=true`, `level=0`) seeded via `CurriculumSeeder`. Filtered out by `LevelService` (`->where('is_tutorial', false)`) after student completes tutorial. Seeder lists are SSOT via static providers (`wordsByModule`, `paragraphsByLevel`, `tutorialWords`; `paragraphsByLevel` is keyed 0-10 where **key 0 is the Story Quest tutorial chapter**) — locked by `CurriculumStrictTest` (PHP content gate) + `curriculumVerdict.test.js` (JS processor gate); a failing word names itself and must be replaced in the seeder, never compensated in the matcher.

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

- Level must be ≥ 1 (`min:1`) — level 0 IS the tutorial module row, and
  `saveWithWords` upserts by level, so a `level=0` save would wipe and replace
  every onboarding word while the row stayed flagged `is_tutorial=true`
  (locked by `TutorialSaveGuardScenarioTest`).
- Exactly 10 word slots, all required (`required|string|max:20`); a blank slot fails with "Every word must be filled in.".
- No intra-module duplicates (case-insensitive; error points at the first slot): `"X" is duplicated in this module.`
- No cross-module reuse — a word already used in another level (incl. the tutorial module, level 0) fails: `"X" is already used in Level N.` The module being edited is excluded, so resaving its own words is allowed.
- Words are stored uppercased (`WordModule::saveWithWords`).
- `WordInputModal.jsx` offers a "Paste 10 words" bulk fill (split on spaces/commas; extras past the 10th are silently dropped) and live per-row duplicate detection before submit.
- Saving is **non-destructive**: `WordModule::saveWithWords` reuses the row at
  each `position` and deletes only positions that disappeared, so a word that did
  not change keeps its `id`. `student_word_mastery` cascades off `words.id`, so
  this is what stops an ordinary edit from wiping the class's mastery. It also
  keeps a mid-round student's `updateWordMastery` POST resolving instead of 422ing
  on dead ids. Two words that are *swapped* still renumber both.
- **A module with student data is LOCKED — not editable at all.** The Save
  button is *not rendered* (not disabled) and the inputs are `readOnly`; only
  Cancel remains. Locked means `has_progress` is true, which is
  **mastery OR progress** (see below) — deliberately not mastery alone, because
  mastery is written **per word mid-round** while progress is written **once per
  finished round**, so neither table is a superset of the other. A round where
  the recognizer matched nothing leaves a progress row and zero mastery rows; a
  half-read round the student abandoned leaves mastery rows and no progress row.
- The lock is **permanent**. It is not lifted by clearing the report deadline.
  There is **no UI unlock** by design — "reset and unlock" would delete the
  students' records to fix a teacher's typo, which is not a fair trade.
- `updateWordModule` / `updateParagraphModule` **enforce** the same rule
  server-side, so a raw `PUT` or a stale page is refused with a flash `error`.
  `force=1` on the request is the **only** escape and is intentionally not
  exposed by any UI. An unchanged re-save does not need it. A **title-only** edit
  does count as changed, because the save rewrites the word rows regardless.

### The seeded-database state

`migrate:fresh --seed` runs `CurriculumSeeder` + `StudentSeeder`, and the seeded
demo students have real progress and mastery rows — so on a seeded database:

| Levels | Editor |
|---|---|
| 1-8 | **Locked** (students have "played" them) |
| 9-10 | **Editable** |

`StudentSeeder` caps the 100-student roster at 8 levels (`$completedLevels`) and
the 3 "perfect" students at 8 too (`$perfectThrough`, deliberately **not** 10) —
otherwise every module would lock and the editor would have nothing to demo.
**Do not raise either cap without re-checking the editor lock.** For a fully
clean, fully editable curriculum, run `migrate:fresh` **without** `--seed` —
production never seeds (`composer run setup` is `migrate --force` only).

`CurriculumSeeder` writes Levels 1-10 through the same
`WordModule::saveWithWords` / `ParagraphModule::saveWithContent` the teacher UI
uses, so a re-seed is idempotent **and** non-destructive (word ids stay stable,
mastery survives). The tutorial rows are the deliberate exception: they are
gated on `wasRecentlyCreated` and are **not** routed through those helpers,
because they do not carry `is_tutorial` (column default `false`) and would
create a non-tutorial Level 0 that `WordModule::tutorial()` cannot find.

### Paragraph module edit rules

`updateParagraphModule()` enforces:

- Level must be ≥ 1 (`min:1`) — same reason as word modules:
  `saveWithContent` upserts by level, and level 0 is the tutorial row.
- Content is trimmed then required (`required|string`) — empty or whitespace-only
  content is rejected with a validation error. A zero-word paragraph module is
  invalid: `ProgressService` never completes a module with 0 words (`$totalWords >
  0` guard), so one would strand students at its level instead of completing
  (see CAVEATS.md BF13).
- Words are split on whitespace and stored case-as-entered via
  `ParagraphModule::saveWithContent` — note this differs from Word Blast, which
  uppercases. The split is **non-destructive by position** like Word Blast, so
  ids survive a light edit, and positions are never renumbered (that is what
  keeps `buildLevels()`'s `$wordStats[$w->position - 1]` slice aligned with
  `sentencesFromContent()`). **There is no word-dedup here** — a paragraph
  legitimately repeats words, and `ReportService` says so explicitly.
- `ParagraphInputModal.jsx` disables Save while content or title is empty, has
  its own `saving` flag (it has no `useForm`, so a double-click would otherwise
  fire two PUTs), and renders server validation errors in-modal (it never closes
  itself on a failed save).- Same hard lock as Word Blast: `has_progress` (mastery **or** progress) hides
  the Save button entirely and makes the inputs `readOnly`. Story Quest needs it
  **more**: its word rows are derived from free text, so an edit also moves
  `totalPossible` and orphans every `paragraph_word_id` a live round still
  holds. Whitespace-only reformatting derives the same rows, so the server does
  not treat it as a change.

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
- Direct URL access to a locked module (`/student/gameplayReadMode/{level}`, `/student/gameplaySpeakMode/{level}`) is rejected: `LevelService::isModuleAccessible()` gates both endpoints and redirects to the level-select page with a flash error.

## Completion Badges

Two finisher badges track curriculum-wide completion:

| Badge | Slug | Metric | Requirement |
|---|---|---|---|
| Story Quest Finisher | `story-finisher` | `paragraph_completion` | Complete 100% of paragraph module words |
| Word Blast Finisher | `word-blast-finisher` | `word_completion` | Complete 100% of word module words |

Progress shown as a percentage on the Student badges page and Game Results screen.
Calculated dynamically from `words_smashed` sums — no fixed thresholds.
