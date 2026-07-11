<?php

namespace App\Services;

use App\Models\Badges;
use App\Models\GameSession;
use App\Models\User;

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

        $uniqueModules = GameSession::where('user_id', $user->id)
            ->whereNotNull('module_id')
            ->selectRaw('COUNT(DISTINCT CONCAT(module_id, "-", module_type)) as cnt')
            ->value('cnt');

        if ($uniqueModules < 2) {
            return [];
        }

        $earnedBadgeIds = $user->badges()->pluck('badges.id')->toArray();

        $badgesToCheck = Badges::whereNotIn('id', $earnedBadgeIds)
            ->whereIn('metric', ['total_points', 'streak', 'accuracy'])
            ->get();

        if ($badgesToCheck->isEmpty()) {
            return [];
        }

        $awarded = [];

        foreach ($badgesToCheck as $badge) {
            $currentValue = match ($badge->metric) {
                'total_points' => $student->points,
                'streak' => (int) GameSession::where('id', $sessionId)->value('streak') ?? 0,
                'accuracy' => $accuracy,
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

        $badges = Badges::whereIn('metric', ['total_points', 'streak', 'accuracy'])->get();

        $progress = [];

        foreach ($badges as $badge) {
            $currentValue = match ($badge->metric) {
                'total_points' => $student ? $student->points : 0,
                'streak' => (int) $session->streak,
                'accuracy' => round((float) $session->accuracy, 2),
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
