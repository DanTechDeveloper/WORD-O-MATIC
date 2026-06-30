# Gameplay

> Version 1.0

## Word Blast (Read Mode)

| Property | Value |
|---|---|
| Type | Reading with speech recognition |
| Timer | 60 seconds per session |
| Presentation | Sequential words |
| Scoring | Levenshtein distance on speech |
| Accuracy | `words_smashed / total_words * 100` |
| Update rule | Only on new best score |
| Routes | `/student/gameplayReadMode/{id}`, `/student/readModeLevels` |

## Story Quest (Speak Mode)

| Property | Value |
|---|---|
| Type | Speaking with paragraph content |
| Timer | 60 seconds per session |
| Scoring | AI evaluates speech accuracy |
| Routes | `/student/gameplaySpeakMode/{id}`, `/student/speakModeLevels` |

## Rules

- No speed mechanics.
- Modules sequential (level N must complete to unlock N+1).
- Game sessions logged to `game_sessions` (append-only).
- Progress overwritten on new best score.
- Mastery toggles for individual words.

## Practice Mode

Route: `/student/practice/{read|speak}`. Separate from module progression.

## Results

Route: `/student/results/{id}`. Shows score, accuracy, streak, badges.
