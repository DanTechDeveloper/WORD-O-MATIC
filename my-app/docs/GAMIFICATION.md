# Gamification

> Version 1.0

## XP & Points

- Points per word module completion (individual word `points` values).
- Accumulated on `StudentProfile.points`.
- Recalculated from `game_sessions` on new best score.

## Levels

| Field | Track |
|---|---|
| `read_level` | Word module progression |
| `speak_level` | Paragraph module progression |

Sequential — must complete level N for N+1. 10 levels each.

## Badges

| Type | Trigger | Service |
|---|---|---|
| Onboarding | Complete tutorial / set avatar | `awardOnboardingBadge()` |
| Gameplay | Points / streak / accuracy thresholds | `checkGameplayBadges()` |

Badges defined in `badges` table (`operator`, `threshold_score`). Unlock once per student via `student_badges` pivot.

## Leaderboards

Available at `/student/leaderboards` and `/teacher/leaderboards`. Read-only.

## Status Categories

| Status | Meaning |
|---|---|
| Not Started | No activity |
| In Progress | Working through modules |
| At Risk | Behind expected pace |
| Needs Support | Low accuracy |
| On Track | Meeting expectations |

Computed by `ProgressService::recalculateStatus()`.
