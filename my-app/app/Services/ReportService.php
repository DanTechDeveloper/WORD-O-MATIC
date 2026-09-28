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

    // ── The verdict SOT ──
    //
    // ONE rule, shared by the parent email, the Excel export and the teacher
    // page, so the three surfaces cannot answer "is this word a problem?"
    // differently. The JS twin is resources/js/utils/masteryLabels.js::verdict().
    //
    // `unseen` is the default because a module word with no mastery row has no
    // history at all — never a fake 0, same guard as hardestFrom().

    public const VERDICT_NOT_ATTEMPTED = 'notAttempted';
    public const VERDICT_NEEDS_ATTENTION = 'needsAttention';
    public const VERDICT_PRACTICING = 'practicing';
    public const VERDICT_RECOVERED = 'recovered';
    public const VERDICT_MASTERED = 'mastered';

    public static function verdict(string $mastery, int $failed, int $threshold = self::NEEDS_ATTENTION_ATTEMPTS): string
    {
        if ($mastery === 'unseen') {
            return self::VERDICT_NOT_ATTEMPTED;
        }
        if ($mastery === 'mastered') {
            // The floor is the SAME as needsAttention, not 1. A word cannot
            // recover from something that never hurt it: at floor 1 a word
            // that slipped once and was then read correctly was celebrated as
            // "Recovered" even though it was never a problem. Keeping the two
            // floors equal also means a word flagged needsAttention at exactly
            // the threshold still earns an acknowledgment when conquered.
            return $failed >= $threshold ? self::VERDICT_RECOVERED : self::VERDICT_MASTERED;
        }

        return $failed >= $threshold ? self::VERDICT_NEEDS_ATTENTION : self::VERDICT_PRACTICING;
    }

    // Display string per verdict. The threshold verbs are the parent's
    // "Still Practicing" / "Needs More Practice" pair, the teacher's
    // "Practicing" / "Needs Attention" pair — same threshold, two audiences.
    public static function verdictLabel(string $verdict, bool $forParent = false): string
    {
        return match ($verdict) {
            self::VERDICT_NEEDS_ATTENTION => $forParent ? 'Needs More Practice' : 'Needs Attention',
            self::VERDICT_PRACTICING => $forParent ? 'Still Practicing' : 'Practicing',
            self::VERDICT_RECOVERED => 'Recovered',
            self::VERDICT_MASTERED => 'Mastered',
            default => 'Not Attempted',
        };
    }

    // The +1 that is a MASTERED word's own winning try. Never a sentence: a
    // sentence has no single winning try, and failed_attempts counts failure
    // events (wrong reads AND 5s-silence watchdog timeouts), so it is not a
    // count of the child's attempts. WordChip shows this; the drill list shows
    // failed_attempts directly because that is what it is counting.
    public static function attemptsShown(string $mastery, int $failed): int
    {
        return $mastery === 'mastered' ? $failed + 1 : $failed;
    }

    // The sentence verdict, derived from its WORDS — never from the summed
    // failed_attempts. A 5-word sentence at one miss each sums to 5 and would
    // clear the threshold while every single word is fine; that false positive
    // is exactly what the word-level view exists to remove.
    public static function sentenceVerdictFrom(array $words, int $threshold = self::NEEDS_ATTENTION_ATTEMPTS): string
    {
        $verdicts = array_map(
            fn ($w) => self::verdict($w['mastery'] ?? 'unseen', (int) ($w['failed_attempts'] ?? 0), $threshold),
            $words,
        );

        if (in_array(self::VERDICT_NEEDS_ATTENTION, $verdicts, true)) {
            return self::VERDICT_NEEDS_ATTENTION;
        }
        if (in_array(self::VERDICT_RECOVERED, $verdicts, true)) {
            return self::VERDICT_RECOVERED;
        }
        if (in_array(self::VERDICT_PRACTICING, $verdicts, true)) {
            return self::VERDICT_PRACTICING;
        }
        // A word never attempted keeps its sentence from being mastered. Without
        // this branch the verdict falls straight through to MASTERED and a
        // brand-new student renders every untouched sentence as "conquered on
        // the first try".
        if (in_array(self::VERDICT_NOT_ATTEMPTED, $verdicts, true)) {
            return self::VERDICT_NOT_ATTEMPTED;
        }

        return self::VERDICT_MASTERED;
    }

    // Case + punctuation folding, the PHP twin of speechUtils.js normalizeText().
    // Story Quest content is free prose, so the same word legitimately appears
    // at several positions in one module ("A crab can swim." / "A fox naps.").
    // Without this, keying by raw text is PHP's last-write-wins and the report
    // UNDERCOUNTS the most common words in the curriculum. It also has to match
    // isWordMatch, because that is what decided a word was missed at all.
    public static function normalizeWord(?string $word): string
    {
        $clean = preg_replace('/[^\p{L}\p{N}\s]/u', '', trim((string) $word));

        return mb_strtolower((string) $clean);
    }

    // Merge duplicate texts inside one sentence: sum the attempts, and keep the
    // WORST mastery. 'training' beats 'mastered' because the sentence is only
    // recovered when every occurrence of the word was conquered
    // (ParagraphModule::buildLevels applies the same rule at sentence level).
    public static function mergeSentenceWords(array $words, int $threshold = self::NEEDS_ATTENTION_ATTEMPTS): array
    {
        $merged = [];

        foreach ($words as $w) {
            $key = self::normalizeWord($w['word'] ?? '');
            if ($key === '') {
                continue;
            }

            $mastery = $w['mastery'] ?? 'unseen';
            $failed = (int) ($w['failed_attempts'] ?? 0);

            if (! isset($merged[$key])) {
                $merged[$key] = ['word' => $w['word'], 'mastery' => $mastery, 'failed_attempts' => $failed];

                continue;
            }

            $merged[$key]['failed_attempts'] += $failed;
            if ($mastery !== 'mastered') {
                $merged[$key]['mastery'] = $mastery;
            }
        }

        return array_values(array_map(
            fn ($w) => [...$w, 'verdict' => self::verdict($w['mastery'], $w['failed_attempts'], $threshold)],
            $merged,
        ));
    }

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

    // [sentence => [[word, mastery, failed_attempts, verdict], ...]] — the
    // training sentences with their per-word verdicts. Shapes identically to
    // trainingSentenceAttemptsFrom() so it drops into the same blade loop, but
    // the words are no longer discarded into a single sum.
    public function trainingSentenceWordAttemptsFrom(array $curriculum): array
    {
        $rows = [];

        foreach ($curriculum as $level) {
            foreach ($level['sentence_stats'] ?? [] as $stat) {
                if (($stat['mastery'] ?? 'unseen') !== 'training') {
                    continue;
                }
                $rows[$stat['sentence']] = self::mergeSentenceWords($stat['words'] ?? []);
            }
        }

        return $rows;
    }

    // Mastered sentences that still carry history. The email's Training Zone is
    // filtered to `mastery === 'training'`, so a sentence flips to mastered the
    // moment its last hard word is conquered and the child's hard-won attempts
    // vanish from the parent report — this is the gate that keeps them.
    // Gated at the shared threshold so a single flub is not a "conquest".
    public function recoveredSentenceWordsFrom(array $curriculum, int $threshold = self::NEEDS_ATTENTION_ATTEMPTS): array
    {
        $rows = [];

        foreach ($curriculum as $level) {
            foreach ($level['sentence_stats'] ?? [] as $stat) {
                if (($stat['mastery'] ?? 'unseen') !== 'mastered') {
                    continue;
                }

                $recovered = array_values(array_filter(
                    self::mergeSentenceWords($stat['words'] ?? [], $threshold),
                    fn ($w) => $w['verdict'] === self::VERDICT_RECOVERED,
                ));

                if ($recovered !== []) {
                    $rows[$stat['sentence']] = $recovered;
                }
            }
        }

        return $rows;
    }

    // Flat drill-down for the Excel: one row per word that carries history,
    // each with its own verdict. Replaces the sentence-level rows on the export
    // path — a teacher reteaching a word needs the word.
    //
    // Walks EVERY sentence, not just training ones, because a word conquered
    // inside a now-mastered sentence is exactly the history worth seeing: its
    // counter froze at the peak it reached while still failing
    // (StudentController only increments while status != 'mastered').
    //
    // MERGE UNIT IS THE LEVEL, not the sentence — and that is forced by the
    // sheet, not chosen. The sheet has no Sentence column, so a row's identity
    // is (level, word): merging per sentence emitted "A" twice for Level 5
    // ("A tiger crosses the river. A robot holds a lemon." — one A in each
    // sentence) as two rows that looked identical because nothing on the sheet
    // could tell them apart. Per-LEVEL merging is right here; the email and the
    // teacher page deliberately keep the per-sentence unit, because both print
    // the sentence immediately above the words.
    public function sentenceWordStruggleRowsFrom(array $curriculum, int $threshold = self::NEEDS_ATTENTION_ATTEMPTS): array
    {
        $rows = [];

        foreach ($curriculum as $level) {
            $byWord = [];

            foreach ($level['sentence_stats'] ?? [] as $stat) {
                foreach (self::mergeSentenceWords($stat['words'] ?? [], $threshold) as $word) {
                    $key = self::normalizeWord($word['word']);
                    if ($key === '') {
                        continue;
                    }

                    if (! isset($byWord[$key])) {
                        $byWord[$key] = $word;

                        continue;
                    }

                    $byWord[$key]['failed_attempts'] += $word['failed_attempts'];
                    // Worst mastery wins, same as within one sentence.
                    if ($word['mastery'] !== 'mastered') {
                        $byWord[$key]['mastery'] = $word['mastery'];
                    }
                }
            }

            foreach ($byWord as $word) {
                // Untouched and clean-mastered words say nothing. Everything
                // else keeps its peak count: still failing (needsAttention /
                // practicing) or conquered after struggling (recovered).
                $verdict = self::verdict($word['mastery'], $word['failed_attempts'], $threshold);
                if ($verdict === self::VERDICT_NOT_ATTEMPTED || $verdict === self::VERDICT_MASTERED) {
                    continue;
                }

                $rows[] = [
                    'level' => $level['level'],
                    'word' => $word['word'],
                    'attempts' => (int) $word['failed_attempts'],
                    'verdict' => $verdict,
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

    // Flat drill-down rows for the Excel export: one entry per word carrying
    // history — still training, OR conquered after struggling. A recovered word
    // is mastered, but its counter froze at the peak it reached while failing,
    // and that peak is the history a reteach is planned from. Each row carries
    // its own verdict so the sheet's Verdict column needs no re-derivation.
    public function struggleRowsFrom(array $curriculum, int $threshold = self::NEEDS_ATTENTION_ATTEMPTS): array
    {
        $rows = [];
        foreach ($curriculum as $level) {
            foreach ($level['word_stats'] ?? [] as $stat) {
                $mastery = $stat['mastery'] ?? 'unseen';
                if ($mastery === 'unseen') {
                    continue;
                }

                $attempts = (int) ($stat['failed_attempts'] ?? 0);
                $verdict = self::verdict($mastery, $attempts, $threshold);

                // Untouched and clean-mastered words say nothing.
                if ($verdict === self::VERDICT_NOT_ATTEMPTED || $verdict === self::VERDICT_MASTERED) {
                    continue;
                }

                $rows[] = [
                    'level' => $level['level'],
                    'word' => $stat['word'],
                    'attempts' => $attempts,
                    'verdict' => $verdict,
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
