<?php

namespace App\Services;

use App\Models\ParagraphModule;
use App\Models\Setting;
use App\Models\User;
use App\Models\WordModule;
use Carbon\Carbon;

class ReportService
{
    // Past-only by design: this feeds curriculum cutoffs, so a deadline that is
    // still in the future must behave like none at all.
    public function cutoff(): ?string
    {
        $deadline = Setting::getValue('report_deadline');

        return $deadline && Carbon::parse($deadline)->isPast() ? $deadline : null;
    }

    public function deadline(): ?Carbon
    {
        $deadline = Setting::getValue('report_deadline');

        return $deadline ? Carbon::parse($deadline, config('app.timezone')) : null;
    }

    public function trainingWordsFor(array $studentIds): array
    {
        $cutoff = $this->cutoff();

        return [
            WordModule::trainingWordsForUsers($studentIds, $cutoff),
            ParagraphModule::trainingWordsForUsers($studentIds, $cutoff),
        ];
    }

    public function curriculumPercent(array $curriculum): int
    {
        $mastered = 0;
        $total = 0;

        foreach ($curriculum as $level) {
            $mastered += count($level['mastered'] ?? []);
            $total += $level['words_count'] ?? 0;
        }

        return $total ? (int) round(($mastered / $total) * 100) : 0;
    }

    public function latestBadge(?int $userId): ?array
    {
        if (! $userId) {
            return null;
        }

        $badge = User::find($userId)?->badges()
            ->wherePivotNotNull('earned_at')
            ->select('badges.id', 'badges.name', 'badges.slug', 'badges.icon', 'student_badges.earned_at')
            ->orderByPivot('earned_at', 'desc')
            ->first();

        if (! $badge) {
            return null;
        }

        return [
            'name' => $badge->name,
            'slug' => $badge->slug,
            'icon' => $badge->icon,
            'earned_at' => $badge->pivot->earned_at,
        ];
    }
}
