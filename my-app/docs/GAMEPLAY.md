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

## Speech Recognition Timeout Rules

Both Word Blast (read mode) and Story Quest (speak mode) have a 5-second timeout for recognizing speech:

| Mode | Timeout Behavior |
|---|---|
| **Word Mode** | If no word match is detected within 5 seconds of word display, the word is marked as mispronounced and advances to the next word. Internal 300ms/1200ms delays also verify target word identity before firing. |
| **Sentence Mode** | Same 5-second timeout with additional synchronization. Timeout callbacks verify the target word hasn't changed before firing. This prevents the next word from being incorrectly marked as mispronounced when the 5s rule advances the game while speech results are still processing. |

### Timer Synchronization

All speech recognition timeouts use target word validation:
- **`sentenceTimeoutRef` (5000ms)**: Stores target word at setup time; only fires if current `targetWord` matches
- **`mispronounceTimeoutRef` (300ms in sentence mode, 1200ms in word mode)**: Validates target word identity before calling `onMispronounced`

This prevents race conditions where:
1. User speaks but doesn't complete word within 5s
2. 5s word timeout fires → `handleMispronounce()` → `moveToNextWord()`
3. Target word changes, but pending speech recognition timer would have fired with stale transcript

## Results

Route: `/student/results/{id}`. Shows score, accuracy, streak, badges earned.
