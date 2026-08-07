# Gameplay

> Version 1.4

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
- **`sentenceTimeoutRef` (5000ms)**: Stores target word at setup; only fires if current `targetWord` matches
- **`mispronounceTimeoutRef` (200ms in word mode word-final)**: Validates target word before `onMispronounced` call
- **`mispronounceTimeoutRef` (300ms in sentence mode)**: Validates target word identity before calling `onMispronounced`
- **`mispronounceTimeoutRef` (1200ms in word mode result loop)**: Validates target word before calling `onMispronounced`
- **`wordTimeoutRef` (5000ms in useGameplayEngine)**: Delegates to speech hook which validates target word

This prevents race conditions where:
1. User speaks but doesn't complete word within 5s
2. 5s word timeout fires → `handleMispronounce()` → `moveToNextWord()`
3. Target word changes, but pending speech recognition timer would have fired with stale transcript

## Results

Route: `/student/results/{id}`. Shows a scorecard, headline, call-to-action row, and badges.

**Scorecard** — two tiles: Score ("Score" label, or **"You played"** when the round was deadline-hit) and Words (item count). On a deadline-hit round a "Points not counted — deadline passed" note and an amber DeadlineBanner are shown; NextBadge is hidden.

**Headline** (h1) — fixed `TIME'S UP!` when the round was played after the deadline; `PERFECT!` at 100% accuracy; otherwise a motivational, deterministic pick from four accuracy bands. Low / zero scores never scold (e.g. "YOU GOT THIS!"). Selection is stable per session keyed on `session.id % pool.length` (no math in render, no useMemo).

**Celebration** — confetti overlay fires only when `accuracy >= 80%`.

**Call-to-action row** depends on state:

| State | Buttons |
|---|---|
| Game closed (`isDeadlineClosed`) | Home |
| Max level reached | Again · Home |
| Normal | Again · Next Level · Home |
