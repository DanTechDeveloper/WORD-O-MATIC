<?php

namespace Tests\Unit;

use App\Services\ReportService;
use PHPUnit\Framework\TestCase;

class StruggleRowsFromTest extends TestCase
{
    public function test_merges_duplicate_texts_within_level_and_keeps_first_seen_casing(): void
    {
        // Dedup removed — Word Blast now emits per-word rows (no sum, no casing merge).
        // 'DOG' is in the list because it is RECOVERED: mastered, but its counter
        // froze at the peak of 5 it reached while still failing, and that peak is
        // the history a reteach is planned from.
        $curriculum = [
            [
                'level' => 'Level 1: Animals',
                'word_stats' => [
                    ['word' => 'CAT', 'mastery' => 'training', 'failed_attempts' => 2],
                    ['word' => 'cat.', 'mastery' => 'training', 'failed_attempts' => 1],
                    ['word' => 'DOG', 'mastery' => 'mastered', 'failed_attempts' => 5],
                ],
            ],
        ];

        $this->assertSame(
            [
                ['level' => 'Level 1: Animals', 'word' => 'CAT', 'attempts' => 2, 'verdict' => ReportService::VERDICT_PRACTICING],
                ['level' => 'Level 1: Animals', 'word' => 'cat.', 'attempts' => 1, 'verdict' => ReportService::VERDICT_PRACTICING],
                ['level' => 'Level 1: Animals', 'word' => 'DOG', 'attempts' => 5, 'verdict' => ReportService::VERDICT_RECOVERED],
            ],
            (new ReportService)->struggleRowsFrom($curriculum)
        );
    }

    public function test_skips_untouched_and_clean_words_but_keeps_recovered(): void
    {
        $curriculum = [
            ['level' => 'Level 1: Empty', 'word_stats' => []],
            [
                'level' => 'Level 2: Actions',
                'word_stats' => [
                    // Never attempted, mastered on the first try, and mastered
                    // after only 2 failures — none of these three reach the
                    // threshold, so none is a problem and none is a recovery.
                    // The last one is the case the old `> 0` rule got wrong: a
                    // single slip was celebrated as "Recovered".
                    ['word' => 'jump', 'mastery' => 'unseen', 'failed_attempts' => 0],
                    ['word' => 'walk', 'mastery' => 'mastered', 'failed_attempts' => 0],
                    ['word' => 'hop', 'mastery' => 'mastered', 'failed_attempts' => 2],
                    // Conquered, but it took 3 tries — the real thing. The peak
                    // is the whole point.
                    ['word' => 'run', 'mastery' => 'mastered', 'failed_attempts' => 3],
                    // Still failing.
                    ['word' => 'leap', 'mastery' => 'training', 'failed_attempts' => 4],
                ],
            ],
        ];

        $this->assertSame(
            [
                ['level' => 'Level 2: Actions', 'word' => 'run', 'attempts' => 3, 'verdict' => ReportService::VERDICT_RECOVERED],
                ['level' => 'Level 2: Actions', 'word' => 'leap', 'attempts' => 4, 'verdict' => ReportService::VERDICT_NEEDS_ATTENTION],
            ],
            (new ReportService)->struggleRowsFrom($curriculum),
        );
    }

    public function test_same_word_training_in_two_levels_yields_one_row_per_level(): void
    {
        // Dedup removed — per-word rows, no sum, no global casing.
        $curriculum = [
            [
                'level' => 'Level 1: A',
                'word_stats' => [
                    ['word' => 'the', 'mastery' => 'training', 'failed_attempts' => 1],
                    ['word' => 'the', 'mastery' => 'training', 'failed_attempts' => 1],
                ],
            ],
            [
                'level' => 'Level 2: B',
                'word_stats' => [
                    ['word' => 'The', 'mastery' => 'training', 'failed_attempts' => 4],
                ],
            ],
        ];

        $this->assertSame([
            ['level' => 'Level 1: A', 'word' => 'the', 'attempts' => 1, 'verdict' => ReportService::VERDICT_PRACTICING],
            ['level' => 'Level 1: A', 'word' => 'the', 'attempts' => 1, 'verdict' => ReportService::VERDICT_PRACTICING],
            ['level' => 'Level 2: B', 'word' => 'The', 'attempts' => 4, 'verdict' => ReportService::VERDICT_NEEDS_ATTENTION],
        ], (new ReportService)->struggleRowsFrom($curriculum));
    }

    public function test_sentence_struggle_rows_include_only_training(): void
    {
        $curriculum = [[
            'level' => 'Level 1: Stories',
            'sentence_stats' => [
                ['sentence' => 'Dogs run.', 'mastery' => 'training', 'failed_attempts' => 3],
                ['sentence' => 'Cats nap.', 'mastery' => 'mastered', 'failed_attempts' => 5],
                ['sentence' => 'Birds fly.', 'mastery' => 'unseen', 'failed_attempts' => 0],
            ],
        ]];

        $service = new ReportService;

        $this->assertSame(
            [['level' => 'Level 1: Stories', 'word' => 'Dogs run.', 'sentence' => 'Dogs run.', 'attempts' => 3]],
            $service->sentenceStruggleRowsFrom($curriculum),
        );
        $this->assertSame(
            ['Level 1: Stories' => ['Dogs run.']],
            $service->trainingSentenceGroupsFrom($curriculum),
        );
        $this->assertSame(['Dogs run.' => 3], $service->trainingSentenceAttemptsFrom($curriculum));
    }

    public function test_sentence_curriculum_percent_handles_empty_and_counts_mastered(): void
    {
        $service = new ReportService;

        $this->assertSame(0, $service->sentenceCurriculumPercent([]));
        $this->assertSame(0, $service->curriculumPercent([]));

        $this->assertSame(25, $service->sentenceCurriculumPercent([[
            'level' => 'Level 1: Stories',
            'mastered_sentences' => 1,
            'total_sentences' => 4,
            'sentence_stats' => [],
        ]]));
    }

    public function test_sentences_from_content_splitting(): void
    {
        $this->assertSame([], ReportService::sentencesFromContent(null));
        $this->assertSame([], ReportService::sentencesFromContent('   '));
        $this->assertSame(['No punctuation here'], ReportService::sentencesFromContent('No punctuation here'));
        $this->assertSame(['Dogs run.', 'Cats nap!'], ReportService::sentencesFromContent('Dogs run. Cats nap!'));
        $this->assertSame(['Really?', 'Yes.'], ReportService::sentencesFromContent('Really?   Yes.'));
    }
}
