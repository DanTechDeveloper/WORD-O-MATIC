# Database

> Version 1.0

All migrations in `database/migrations/`. No raw SQL.

## Tables

### Users & Auth

| Table | Key Fields | Notes |
|---|---|---|
| `users` | `id, name, username, password, pin, pin_plain, role, email` | role = teacher/student, PIN: bcrypt + plain |
| `sessions` | Laravel session storage | |

### Student Data

| Table | Key Fields | Notes |
|---|---|---|
| `students` | `user_id, points, avatar, status, wordBlastAcc, storyQuestAcc, read_level, speak_level, section, gender, tutorial_completed_at, parent_email` | Denormalized stats, recalculated on best score |
| `student_word_progress` | `user_id, word_module_id, status, words_smashed, accuracy` | Overwritten |
| `student_paragraph_progress` | `user_id, paragraph_module_id, status, words_smashed, accuracy` | Overwritten |
| `student_word_mastery` | `user_id, word_id, status` | Per-word mastery toggle |
| `student_paragraph_mastery` | `user_id, paragraph_word_id, status` | Per-word mastery toggle |
| `student_badges` | `user_id, badge_id, earned_at, progress, status, unlocked_session_id` | Pivot with progress |

### Modules

| Table | Key Fields | Notes |
|---|---|---|
| `word_modules` | `id, level, title` | 10 modules, sequential |
| `words` | `id, word_module_id, word, position, points` | 10 words per module |
| `paragraph_modules` | `id, level, title, content` | 10 modules, sequential |
| `paragraph_words` | `id, paragraph_module_id, word, position` | Words extracted from paragraphs |

### Game Sessions (Append-Only)

| Table | Key Fields | Notes |
|---|---|---|
| `game_sessions` | `id, user_id, module_id, module_type, score, accuracy, streak, created_at` | Polymorphic, append-only |

### Badges & Practice

| Table | Key Fields | Notes |
|---|---|---|
| `badges` | `id, name, slug, description, icon, requirement, metric, operator, threshold_score` | Pre-seeded |
| `practice_sets` | `id, name, slug, type, content, total_items` | Custom practice |
| `practice_items` | `id, practice_set_id, content, position` | Individual items |

### Settings

| Table | Key Fields | Notes |
|---|---|---|
| `settings` | `id, key, value` | Key-value (e.g., deadlines) |

## Morph Map

In `AppServiceProvider::boot()`:
- `'word' → WordModule`
- `'paragraph' → ParagraphModule`
