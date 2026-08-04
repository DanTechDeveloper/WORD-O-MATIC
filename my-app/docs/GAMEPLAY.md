# Gameplay

> Version 1.3

## Word Blast (Read Mode)

| Property | Value |
|---|---|
| Type | Reading with speech recognition |
| Timer | 60 seconds per session |
| Presentation | Words randomized per session (`inRandomOrder()`) |
| Scoring | Tolerance-bucketed Levenshtein fuzzy match (`speechUtils.js` `isFuzzyMatch`, wraps `standardLevenshtein`) |
| Accuracy | `words_smashed / total_words * 100` |
| Update rule | Only on new best score (retries don't lower existing score) |
| Mastery | Per-word: `mastered` or `training`, stored in `student_word_mastery` |
| Routes | `/student/gameplayReadMode/{id}`, `/student/readModeLevels` |

## Story Quest (Speak Mode)

| Property | Value |
|---|---|
| Type | Speaking with paragraph content |
| Timer | 60 seconds per session |
| Presentation | Sentence-based, fixed word order |
| Scoring | Speech recognition accuracy per word |
| Update rule | Only on new best score |
| Mastery | Per-word: `mastered` or `training`, stored in `student_paragraph_mastery` |
| Routes | `/student/gameplaySpeakMode/{id}`, `/student/speakModeLevels` |

## Rules

- No speed mechanics.
- Modules sequential (level N must complete to unlock N+1).
- Game sessions logged to `game_sessions` (append-only).
- Progress overwritten on new best score only.
- Mastery toggles per word — mastered words can still appear in retries (spaced repetition).
- Completed modules are replayable for practice (results "Again" + level card "PLAY AGAIN"); retries never lower best scores or award extra points.
- Direct URL access to a locked module (`gameplayReadMode/{id}`, `gameplaySpeakMode/{id}`) is blocked: `LevelService::isModuleAccessible()` redirects to the level-select page with a flash error.

## Tutorial

Dedicated tutorial modules (`is_tutorial=true`, `level=0`) seeded in `CurriculumSeeder`:
- **Word Blast tutorial**: 5 words (a, I, see, my, the) — no timer
- **Story Quest tutorial**: "I see a cat." — no timer

Tutorial plays bypass GameSession, mastery, points, leaderboard, and gameplay badge tracking.
Progress is saved but does not affect accuracy/status calculations on `students` table.
Tutorial Complete badge flashes on Dashboard when both modes finished.

## Results

Route: `/student/results/{id}`. Shows score, accuracy, streak, badges earned.
