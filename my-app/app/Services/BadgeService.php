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
                'streak' => (int) GameSession::where('user_id', $user->id)->max('streak') ?? 0,
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
                'streak' => (int) GameSession::where('user_id', $user->id)->max('streak') ?? 0,
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
