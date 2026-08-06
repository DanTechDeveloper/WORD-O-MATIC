<?php

namespace App\Services;

use App\Models\Badges;
use App\Models\GameSession;
use App\Models\ParagraphModule;
use App\Models\Setting;
use App\Models\StudentParagraphProgress;
use App\Models\StudentWordProgress;
use App\Models\User;
use App\Models\WordModule;

class BadgeService
{
    // Best streak/accuracy counts only pre-deadline sessions, so a post-deadline
    // round can't inflate badge progress display (doc: CAVEATS BF7/BF10).
    private function bestSessionMetric(User $user, string $column): int
    {
        $query = GameSession::where('user_id', $user->id);

        if ($deadline = Setting::getValue('report_deadline')) {
            $query->where('created_at', '<', $deadline);
        }

        return (int) $query->max($column) ?? 0;
    }
    public function awardOnboardingBadge(User $user, string $slug): ?array
    {
        $badge = Badges::where('slug', $slug)->first();

        if (! $badge) {
            return null;
        }

        $changes = $user->badges()->syncWithoutDetaching([
            $badge->id => ['earned_at' => now()],
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
                $badge->id => ['earned_at' => now()],
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
            ->get();

        foreach ($badgesToCheck as $badge) {
            $currentValue = match ($badge->metric) {
                'total_points' => $student->points,
                'streak' => $this->bestSessionMetric($user, 'streak'),
                'accuracy' => max((float) $student->wordBlastAcc, (float) $student->storyQuestAcc),
                'paragraph_completion' => $this->calculateModuleCompletion($user, 'paragraph'),
                'word_completion' => $this->calculateModuleCompletion($user, 'word'),
                default => 0,
            };

            if ($this->meetsThreshold($currentValue, $badge->operator, $badge->threshold_score)) {
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

        foreach ($badgesToCheck as $badge) {
            $currentValue = match ($badge->metric) {
                'total_points' => $student->points,
                'streak' => $this->bestSessionMetric($user, 'streak'),
                'accuracy' => $accuracy,
                'paragraph_completion' => $this->calculateModuleCompletion($user, 'paragraph'),
                'word_completion' => $this->calculateModuleCompletion($user, 'word'),
                default => 0,
            };

            if ($this->meetsThreshold($currentValue, $badge->operator, $badge->threshold_score)) {
                $user->badges()->attach($badge->id, [
                    'earned_at' => now(),
                    'progress' => $currentValue,
                    'status' => 'earned',
                    'unlocked_session_id' => $sessionId,
                ]);
                $awarded[] = $badge;
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
                'accuracy' => round((float) $session->accuracy, 2),
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
        $isParagraph = $type === 'paragraph';
        $moduleClass = $isParagraph ? ParagraphModule::class : WordModule::class;
        $progressClass = $isParagraph ? StudentParagraphProgress::class : StudentWordProgress::class;
        $moduleKey = $isParagraph ? 'paragraph_module_id' : 'word_module_id';

        $tutorialModule = $moduleClass::where('is_tutorial', true)->first();

        $total = $moduleClass::where('is_tutorial', false)
            ->withCount('words')
            ->get()
            ->sum('words_count');

        if ($total === 0) {
            return 100;
        }

        $earned = $progressClass::where('user_id', $user->id)
            ->when($tutorialModule, fn ($q) => $q->where($moduleKey, '!=', $tutorialModule->id))
            ->sum('words_smashed');

        return round(($earned / $total) * 100, 2);
    }

    private function meetsThreshold($value, string $operator, $threshold): bool
    {
        return match ($operator) {
            '>=' => $value >= $threshold,
            '>' => $value > $threshold,
            '=' => $value == $threshold,
            '<=' => $value <= $threshold,
            '<' => $value < $threshold,
            default => false,
        };
    }
}
