# Gamification

> Version 1.1

## XP & Points

- Points per module: word smashes in Read and Speak modes.
- Accumulated on `StudentProfile.points`.
- Updated only on new best score (not overwritten by retries).

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

Available at `/student/leaderboards` and `/teacher/leaderboards`. **Best-score based** — retries don't overwrite higher existing scores.

## Status Categories

| Status | Meaning |
|---|---|
| Not Started | No activity |
| In Progress | Working through modules |
| At Risk | Behind expected pace |
| Needs Support | Low accuracy |
| On Track | Meeting expectations |

Computed by `ProgressService::recalculateStatus()` based on `wordBlastAcc` and `storyQuestAcc` averages.

## Student Deletion

Deleting a student (Teacher → Students → Delete) cascade-removes all related records: progress, mastery, game sessions, badges, and profile. Irreversible.
