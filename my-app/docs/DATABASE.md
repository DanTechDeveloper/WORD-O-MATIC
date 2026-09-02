# Database

> Version 1.7

All migrations in `database/migrations/`. No raw SQL. All foreign keys on `user_id` use `cascadeOnDelete`.

## Tables

### Users & Auth

| Table | Key Fields | Notes |
|---|---|---|
| `users` | `id, student_id, name, email, username, password, pin, role` | role = teacher/student. PIN is bcrypt-only (`pin`, unique per student, `pin_plain` dropped 2026-08-10) and reset-only — never readable back |
| `sessions` | Laravel session storage | |

### Student Data

| Table | Key Fields | Notes |
|---|---|---|
| `students` | `user_id, points, read_progress, avatar, speak_progress, status, wordBlastAcc, storyQuestAcc, read_level, speak_level, section, gender, parent_email, tutorial_completed_at, report_sent_at` | Denormalized stats, best-score-only updates. `status` (values `notStarted`/`in_progress`/`support`/`atRisk`/`onTrack`) is a stored **read-SOT**, written only by `ProgressService::recalculateStatus()` via `classify()` — read paths never re-derive it. `report_sent_at` set when parent report email is queued. Cascade on `user_id`. (`words_smashed` dropped 2026-06-29) |
| `student_word_progress` | `user_id, word_module_id, status, words_smashed, accuracy` | Overwritten on best score. Cascade. |
| `student_paragraph_progress` | `user_id, paragraph_module_id, status, words_smashed, accuracy` | Overwritten on best score. Cascade. |
| `student_word_mastery` | `user_id, word_id, status` | Per-word mastery toggle. Word Blast stays word-based (10 unique words/level, no dedup). Cascade. |
| `student_paragraph_mastery` | `user_id, paragraph_word_id, status` | Per-word storage, sentence-based reporting — `ParagraphModule::buildLevels` derives `sentence_stats{ sentence, mastery=sum(all words mastered ? mastered:training), failed_attempts=sum(word)}` via `sentencesFromContent` (no `paragraph_sentences` table). Cascade. |
| `student_badges` | `user_id, badge_id, earned_at, progress, status, unlocked_session_id` | Pivot with progress. Cascade. |

### Modules

| Table | Key Fields | Notes |
|---|---|---|
| `word_modules` | `id, level, title, is_tutorial` | 11 modules (10 real + 1 tutorial), sequential. (`total_points`/`paragraph_modules.total_score` dropped 2026-06-28) |
| `words` | `id, word_module_id, word, position` | 10 words per module (5 for tutorial). `position` for teacher ordering, gameplay uses `inRandomOrder()`. (`points` dropped 2026-07-09) |
| `paragraph_modules` | `id, level, title, content, is_tutorial` | 11 modules (10 real + 1 tutorial), sequential. `content` is 2 short sentences ×3-5w (73 total words, was paragraph prose) — split by `sentencesFromContent` `(?<=[.!?])\s+`. |
| `paragraph_words` | `id, paragraph_module_id, word, position` | Words extracted via `preg_split \s+` (73 total, short seed). `position` 1..n drives `sentence_stats` slice. |

### Game Sessions (Append-Only)

| Table | Key Fields | Notes |
|---|---|---|
| `game_sessions` | `id, user_id, module_id, module_type, score, accuracy, streak, is_deadline_hit, created_at` | Append-only. `module_id`/`module_type` are plain columns — no Eloquent relation (the morph map / `MorphTo` was removed 2026-08-13). Cascade on `user_id`. `is_deadline_hit` (boolean, default false) is sticky TRUE when the round was played after the report deadline closed — permanently excluded from badge/streak/accuracy metrics even if the deadline is later cleared. |

### Badges & Practice

| Table | Key Fields | Notes |
|---|---|---|
| `badges` | `id, name, slug, description, icon, requirement, metric, operator, threshold_score` | Pre-seeded (11 badges). `metric` ∈ {`total_points`, `paragraph_completion`, `word_completion`, `streak`, `accuracy`, `action`}. `paragraph_completion`/`word_completion` award at `threshold_score=100` = 100% curriculum completion. |

### Settings

| Table | Key Fields | Notes |
|---|---|---|
| `settings` | `id, key, value` | Key-value (e.g., report deadlines) |

## Morph Map

In `AppServiceProvider::boot()`:
- `'word' → WordModule`
- `'paragraph' → ParagraphModule`

## Cascade Delete Chain

```
User deleted → students cascade
             → game_sessions cascade
             → student_word_progress cascade
             → student_paragraph_progress cascade
             → student_word_mastery cascade
             → student_paragraph_mastery cascade
             → student_badges cascade
```

No orphan records. One `$user->delete()` cleans everything.

## Derived metrics (not columns)

`finalAverage` is **not stored** — it is an appended `StudentProfile` accessor
computing `round((wordBlastAcc + storyQuestAcc) / 2, 2)`, returning `null` while
either accuracy is `0` (i.e. the student has not started one skill yet). It
mirrors `ProgressService::finalAverage()` (the logical SOT, `app/Services/ProgressService.php`).
