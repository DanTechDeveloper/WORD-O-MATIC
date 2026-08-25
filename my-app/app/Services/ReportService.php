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

    // Display/report normalization: the same spoken word collapses to one
    // entry regardless of casing or trailing punctuation ("Cat." ≡ "cat" ≡
    // "THE"). Applied only at report boundaries — storage stays untouched.
    public static function normalizeWord(string $word): string
    {
        return mb_strtolower(preg_replace('/[^\p{L}\p{N}]+$/u', '', trim($word)));
    }

    // Merge duplicate word texts into one stat row: summed failed_attempts,
    // worst mastery wins (training > unseen > mastered) so struggle flags
    // survive the merge (BF25).
    public static function aggregateWordStats(array $wordStats): array
    {
        $rank = ['mastered' => 0, 'unseen' => 1, 'training' => 2];
        $merged = [];

        foreach ($wordStats as $stat) {
            $key = self::normalizeWord((string) ($stat['word'] ?? ''));

            if ($key === '') {
                continue;
            }

            if (! isset($merged[$key])) {
                $merged[$key] = [
                    'word' => $stat['word'],
                    'mastery' => $stat['mastery'],
                    'failed_attempts' => (int) ($stat['failed_attempts'] ?? 0),
                ];

                continue;
            }

            $merged[$key]['failed_attempts'] += (int) ($stat['failed_attempts'] ?? 0);

            if (($rank[$stat['mastery']] ?? 0) > ($rank[$merged[$key]['mastery']] ?? 0)) {
                $merged[$key]['mastery'] = $stat['mastery'];
            }
        }

        return array_values($merged);
    }

    // Global pass first so every surface agrees on ONE display casing per
    // normalized word (first occurrence seen wins).
    private function aggregatedWordStats(array $curriculum): array
    {
        return self::aggregateWordStats(
            collect($curriculum)->flatMap(fn ($level) => $level['word_stats'])->all()
        );
    }

    // Pure projections of curriculumForUser() output — no queries.
    // ["Level X: Title" => [words]]; empty levels skipped so payloads keep
    // their legacy shape. Duplicate texts are collapsed to one entry (BF25).
    public function trainingGroupsFrom(array $curriculum): array
    {
        $display = [];

        foreach ($this->aggregatedWordStats($curriculum) as $stat) {
            $display[self::normalizeWord($stat['word'])] = $stat['word'];
        }

        return collect($curriculum)
            ->mapWithKeys(function ($level) use ($display) {
                $words = [];

                foreach (self::aggregateWordStats($level['word_stats'] ?? []) as $stat) {
                    if ($stat['mastery'] === 'training') {
                        $words[] = $display[self::normalizeWord($stat['word'])];
                    }
                }

                return [$level['level'] => $words];
            })
            ->filter(fn ($words) => $words !== [])
            ->all();
    }

    // Every still-training word with its recorded try count → [word => tries].
    // Duplicate texts are summed into one entry instead of overwriting (BF25).
    public function trainingAttemptsFrom(array $curriculum): array
    {
        $attempts = [];

        foreach ($this->aggregatedWordStats($curriculum) as $stat) {
            if ($stat['mastery'] === 'training') {
                $attempts[$stat['word']] = $stat['failed_attempts'];
            }
        }

        return $attempts;
    }

    // Flat drill-down rows for the Excel export: one entry per still-training
    // word. Merge/dedupe is per level with global display casing — the exact
    // semantics of trainingGroupsFrom — plus the attempt count the email shows.
    // Pure projection of curriculumForUser() output — no queries.
    public function struggleRowsFrom(array $curriculum): array
    {
        $display = [];

        foreach ($this->aggregatedWordStats($curriculum) as $stat) {
            $display[self::normalizeWord($stat['word'])] = $stat['word'];
        }

        $rows = [];

        foreach ($curriculum as $level) {
            foreach (self::aggregateWordStats($level['word_stats'] ?? []) as $stat) {
                if ($stat['mastery'] !== 'training') {
                    continue;
                }

                $rows[] = [
                    'level' => $level['level'],
                    'word' => $display[self::normalizeWord($stat['word'])],
                    'attempts' => (int) $stat['failed_attempts'],
                ];
            }
        }

        return $rows;
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
