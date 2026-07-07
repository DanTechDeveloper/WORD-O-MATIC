# Gameplay

> Version 1.1

## Word Blast (Read Mode)

| Property | Value |
|---|---|
| Type | Reading with speech recognition |
| Timer | 60 seconds per session |
| Presentation | Words randomized per session (`inRandomOrder()`) |
| Scoring | Levenshtein distance on speech |
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

## Practice Mode

Route: `/student/practice/{read|speak}`. Separate from module progression.

## Results

Route: `/student/results/{id}`. Shows score, accuracy, streak, badges earned.
