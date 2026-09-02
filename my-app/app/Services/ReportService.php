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

    // ponytail: Word Blast dedup removed — WordModule has 10 unique words/level
    // and cross-level reuse blocked by TeacherController::updateWordModule,
    // so duplicate merge is YAGNI. Story Quest is sentence-based (no word dedup).

    // ── Story Quest sentence helpers (approach B: derived, no DB change) ──
    // Split mirrors ParagraphModule::sentencesFromContent so service stays pure.
    public static function sentencesFromContent(?string $content): array
    {
        $content = trim((string) $content);
        if ($content === '') return [];
        $parts = preg_split('/(?<=[.!?])\s+/u', $content, -1, PREG_SPLIT_NO_EMPTY);
        if (! $parts || count($parts) === 0) return [$content];
        return array_values(array_filter(array_map('trim', $parts), fn ($s) => $s !== ''));
    }

    // ["Level X: Title" => [sentences]] for Story Quest — no word dedup.
    public function trainingSentenceGroupsFrom(array $curriculum): array
    {
        return collect($curriculum)
            ->mapWithKeys(function ($level) {
                $sentences = [];
                foreach ($level['sentence_stats'] ?? [] as $stat) {
                    if (($stat['mastery'] ?? 'unseen') === 'training') {
                        $sentences[] = $stat['sentence'];
                    }
                }
                return [$level['level'] => $sentences];
            })
            ->filter(fn ($s) => $s !== [])
            ->all();
    }

    // [sentence => summed attempts] — sum of constituent word failed_attempts.
    public function trainingSentenceAttemptsFrom(array $curriculum): array
    {
        $attempts = [];
        foreach ($curriculum as $level) {
            foreach ($level['sentence_stats'] ?? [] as $stat) {
                if (($stat['mastery'] ?? 'unseen') === 'training') {
                    $attempts[$stat['sentence']] = (int) ($stat['failed_attempts'] ?? 0);
                }
            }
        }
        return $attempts;
    }

    // Flat rows for Excel: one row per training sentence.
    public function sentenceStruggleRowsFrom(array $curriculum): array
    {
        $rows = [];
        foreach ($curriculum as $level) {
            foreach ($level['sentence_stats'] ?? [] as $stat) {
                if (($stat['mastery'] ?? 'unseen') !== 'training') continue;
                $rows[] = [
                    'level' => $level['level'],
                    'word' => $stat['sentence'],
                    'sentence' => $stat['sentence'],
                    'attempts' => (int) ($stat['failed_attempts'] ?? 0),
                ];
            }
        }
        return $rows;
    }

    public function sentenceCurriculumPercent(array $curriculum): int
    {
        $mastered = 0;
        $total = 0;
        foreach ($curriculum as $level) {
            $mastered += $level['mastered_sentences'] ?? collect($level['sentence_stats'] ?? [])->where('mastery', 'mastered')->count();
            $total += $level['total_sentences'] ?? count($level['sentences'] ?? []) ?: count($level['sentence_stats'] ?? []);
        }
        return $total ? (int) round(($mastered / $total) * 100) : 0;
    }

    // Pure projections of curriculumForUser() output — no queries.
    // Word Blast is 10 unique words/level (no dedup needed).
    public function trainingGroupsFrom(array $curriculum): array
    {
        return collect($curriculum)
            ->mapWithKeys(function ($level) {
                $words = collect($level['word_stats'] ?? [])
                    ->filter(fn ($s) => ($s['mastery'] ?? '') === 'training')
                    ->pluck('word')
                    ->all();
                return [$level['level'] => $words];
            })
            ->filter(fn ($words) => $words !== [])
            ->all();
    }

    // Every still-training word with its recorded try count → [word => tries].
    public function trainingAttemptsFrom(array $curriculum): array
    {
        $attempts = [];
        foreach ($curriculum as $level) {
            foreach ($level['word_stats'] ?? [] as $stat) {
                if (($stat['mastery'] ?? '') === 'training') {
                    $attempts[$stat['word']] = (int) ($stat['failed_attempts'] ?? 0);
                }
            }
        }
        return $attempts;
    }

    // Flat drill-down rows for the Excel export: one entry per still-training word.
    public function struggleRowsFrom(array $curriculum): array
    {
        $rows = [];
        foreach ($curriculum as $level) {
            foreach ($level['word_stats'] ?? [] as $stat) {
                if (($stat['mastery'] ?? '') !== 'training') continue;
                $rows[] = [
                    'level' => $level['level'],
                    'word' => $stat['word'],
                    'attempts' => (int) ($stat['failed_attempts'] ?? 0),
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
