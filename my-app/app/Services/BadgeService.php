<?php

namespace App\Services;

use App\Models\Badges;
use App\Models\GameSession;
use App\Models\ParagraphModule;
use App\Models\StudentParagraphProgress;
use App\Models\StudentWordProgress;
use App\Models\User;
use App\Models\WordModule;

class BadgeService
{
    // Best streak/accuracy counts only non-deadline-hit sessions, so a post-deadline
    // round can't inflate badge progress — even if the deadline is later cleared
    // (doc: CAVEATS BF7/BF10). The flag is baked in at log time, so this is sticky.
    private function bestSessionMetric(User $user, string $column): int
    {
        return (int) GameSession::where('user_id', $user->id)
            ->where('is_deadline_hit', false)
            ->max($column) ?? 0;
    }
    public function awardOnboardingBadge(User $user, string $slug): ?array
    {
        $badge = Badges::where('slug', $slug)->first();

        if (! $badge) {
            return null;
        }

        $changes = $user->badges()->syncWithoutDetaching([
            $badge->id => ['earned_at' => now(), 'status' => 'earned'],
        ]);

        if (empty($changes['attached'])) {
            return null;
        }

        return [
            'name' => $badge->name,
            'description' => $badge->description,
            'slug' => $badge->slug,
            'icon' => $badge->icon,
        ];
    }

    public function checkAllEligibleBadges(User $user): array
    {
        $student = $user->student;

        if (! $student) {
            return [];
        }

        $awarded = [];
        $earnedBadgeIds = $user->badges()->pluck('badges.id')->toArray();

        $actionBadges = [
            'profile-pioneer' => $student->avatar && ! in_array($student->avatar, ['/images/boy.svg', '/images/girl.svg']),
            'tutorial-complete' => ! is_null($student->tutorial_completed_at),
        ];

        foreach ($actionBadges as $slug => $satisfied) {
            if (! $satisfied) {
                continue;
            }

            $badge = Badges::where('slug', $slug)->whereNotIn('id', $earnedBadgeIds)->first();

            if (! $badge) {
                continue;
            }

            $user->badges()->syncWithoutDetaching([
                $badge->id => ['earned_at' => now(), 'status' => 'earned'],
            ]);

            $awarded[] = [
                'name' => $badge->name,
                'description' => $badge->description,
                'slug' => $badge->slug,
                'icon' => $badge->icon,
            ];
        }

        $earnedBadgeIds = $user->badges()->pluck('badges.id')->toArray();

        $badgesToCheck = Badges::whereNotIn('id', $earnedBadgeIds)
            ->whereIn('metric', ['total_points', 'streak', 'accuracy', 'paragraph_completion', 'word_completion'])
            ->get()
            ->groupBy('metric');

        foreach ($badgesToCheck as $metric => $group) {
            $currentValue = match ($metric) {
                'total_points' => $student->points,
                'streak' => $this->bestSessionMetric($user, 'streak'),
                'accuracy' => max((float) $student->wordBlastAcc, (float) $student->storyQuestAcc),
                'paragraph_completion' => $this->calculateModuleCompletion($user, 'paragraph'),
                'word_completion' => $this->calculateModuleCompletion($user, 'word'),
                default => 0,
            };

            // ponytail: tier only for streak/accuracy — prevents 10/10 6-badge burst, points/completion award all
            if (in_array($metric, ['streak', 'accuracy'])) {
                $winner = $group->filter(fn ($b) => $this->meetsThreshold($currentValue, $b->threshold_score))
                    ->sortByDesc('threshold_score')
                    ->first();
                if (! $winner) {
                    continue;
                }
                $user->badges()->attach($winner->id, [
                    'earned_at' => now(),
                    'progress' => $currentValue,
                    'status' => 'earned',
                    'unlocked_session_id' => null,
                ]);
                $awarded[] = [
                    'name' => $winner->name,
                    'description' => $winner->description,
                    'slug' => $winner->slug,
                    'icon' => $winner->icon,
                ];
            } else {
                foreach ($group as $badge) {
                    if (! $this->meetsThreshold($currentValue, $badge->threshold_score)) {
                        continue;
                    }
                    $user->badges()->attach($badge->id, [
                        'earned_at' => now(),
                        'progress' => $currentValue,
                        'status' => 'earned',
                        'unlocked_session_id' => null,
                    ]);
                    $awarded[] = [
                        'name' => $badge->name,
                        'description' => $badge->description,
                        'slug' => $badge->slug,
                        'icon' => $badge->icon,
                    ];
                }
            }
        }

        return $awarded;
    }

    public function checkGameplayBadges(User $user, int $sessionId, float $accuracy): array
    {
        $student = $user->student;

        if (! $student) {
            return [];
        }

        $earnedBadgeIds = $user->badges()->pluck('badges.id')->toArray();

        $badgesToCheck = Badges::whereNotIn('id', $earnedBadgeIds)
            ->whereIn('metric', ['total_points', 'streak', 'accuracy', 'paragraph_completion', 'word_completion'])
            ->get();

        if ($badgesToCheck->isEmpty()) {
            return [];
        }

        $awarded = [];
        $grouped = $badgesToCheck->groupBy('metric');

        foreach ($grouped as $metric => $group) {
            $currentValue = match ($metric) {
                'total_points' => $student->points,
                'streak' => $this->bestSessionMetric($user, 'streak'),
                'accuracy' => $accuracy,
                'paragraph_completion' => $this->calculateModuleCompletion($user, 'paragraph'),
                'word_completion' => $this->calculateModuleCompletion($user, 'word'),
                default => 0,
            };

            if (in_array($metric, ['streak', 'accuracy'])) {
                // ponytail: tier — only highest per metric per round
                $winner = $group->filter(fn ($b) => $this->meetsThreshold($currentValue, $b->threshold_score))
                    ->sortByDesc('threshold_score')
                    ->first();
                if (! $winner) {
                    continue;
                }
                $user->badges()->attach($winner->id, [
                    'earned_at' => now(),
                    'progress' => $currentValue,
                    'status' => 'earned',
                    'unlocked_session_id' => $sessionId,
                ]);
                $awarded[] = $winner;
            } else {
                foreach ($group as $badge) {
                    if (! $this->meetsThreshold($currentValue, $badge->threshold_score)) {
                        continue;
                    }
                    $user->badges()->attach($badge->id, [
                        'earned_at' => now(),
                        'progress' => $currentValue,
                        'status' => 'earned',
                        'unlocked_session_id' => $sessionId,
                    ]);
                    $awarded[] = $badge;
                }
            }
        }

        return $awarded;
    }

    public function getBadgeProgress(User $user, GameSession $session): array
    {
        $student = $user->student;
        $earnedBadgeIds = $user->badges()->pluck('badges.id')->toArray();

        $badges = Badges::whereIn('metric', ['total_points', 'streak', 'accuracy', 'paragraph_completion', 'word_completion'])->get();

        $progress = [];

        foreach ($badges as $badge) {
            $currentValue = match ($badge->metric) {
                'total_points' => $student ? $student->points : 0,
                'streak' => $this->bestSessionMetric($user, 'streak'),
                'accuracy' => (int) round((float) $session->accuracy),
                'paragraph_completion' => $this->calculateModuleCompletion($user, 'paragraph'),
                'word_completion' => $this->calculateModuleCompletion($user, 'word'),
                default => 0,
            };

            $progress[] = [
                'name' => $badge->name,
                'description' => $badge->description,
                'slug' => $badge->slug,
                'icon' => $badge->icon,
                'metric' => $badge->metric,
                'threshold' => $badge->threshold_score,
                'current_value' => $currentValue,
                'is_earned' => in_array($badge->id, $earnedBadgeIds),
            ];
        }

        return $progress;
    }

    public function calculateModuleCompletion(User $user, string $type): float
    {
        if ($type === 'paragraph') {
            // Sentence-based for Story Quest — aligns badge `story-finisher` with teacher
            // reporting `sentenceCurriculumPercent` (20 sents, 2/level uniform). Word Blast stays word-based.
            $curriculum = ParagraphModule::curriculumForUser($user->id);
            $mastered = 0;
            $total = 0;
            foreach ($curriculum as $level) {
                $mastered += $level['mastered_sentences'] ?? collect($level['sentence_stats'] ?? [])->where('mastery', 'mastered')->count();
                $total += $level['total_sentences'] ?? count($level['sentence_stats'] ?? []);
            }
            if ($total === 0) return 0;
            // ponytail: whole number per DepEd — same rule as accuracies
            return (int) round(min(100, ($mastered / $total) * 100));
        }

        $tutorialModule = WordModule::where('is_tutorial', true)->first();
        $total = WordModule::where('is_tutorial', false)->withCount('words')->get()->sum('words_count');
        if ($total === 0) return 0;
        $earned = StudentWordProgress::where('user_id', $user->id)
            ->when($tutorialModule, fn ($q) => $q->where('word_module_id', '!=', $tutorialModule->id))
            ->sum('words_smashed');
        return (int) round(min(100, ($earned / $total) * 100));
    }

    private function meetsThreshold($value, $threshold): bool
    {
        return $value >= $threshold;
    }
}
