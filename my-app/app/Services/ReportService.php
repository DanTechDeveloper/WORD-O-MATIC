<?php

namespace App\Services;

use App\Models\ParagraphModule;
use App\Models\Setting;
use App\Models\User;
use App\Models\WordModule;
use Carbon\Carbon;

class ReportService
{
    // Single source of truth for the struggle-flag threshold; shared to the
    // teacher UI via HandleInertiaRequests and used to flag parent-email words.
    public const NEEDS_ATTENTION_ATTEMPTS = 3;

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

    // Pure projections of curriculumForUser() output — no queries.
    // ["Level X: Title" => [words]]; empty levels skipped so payloads keep
    // their legacy shape.
    public function trainingGroupsFrom(array $curriculum): array
    {
        return collect($curriculum)
            ->filter(fn ($level) => $level['training'] !== [])
            ->mapWithKeys(fn ($level) => [$level['level'] => $level['training']])
            ->all();
    }

    // Every still-training word with its recorded try count → [word => tries].
    public function trainingAttemptsFrom(array $curriculum): array
    {
        return collect($curriculum)
            ->flatMap(fn ($level) => $level['word_stats'])
            ->filter(fn ($stat) => $stat['mastery'] === 'training')
            ->pluck('failed_attempts', 'word')
            ->all();
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
