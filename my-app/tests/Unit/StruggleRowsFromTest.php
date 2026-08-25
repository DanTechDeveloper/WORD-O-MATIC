<?php

namespace Tests\Unit;

use App\Services\ReportService;
use PHPUnit\Framework\TestCase;

class StruggleRowsFromTest extends TestCase
{
    public function test_merges_duplicate_texts_within_level_and_keeps_first_seen_casing(): void
    {
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
            [['level' => 'Level 1: Animals', 'word' => 'CAT', 'attempts' => 3]],
            (new ReportService)->struggleRowsFrom($curriculum)
        );
    }

    public function test_skips_non_training_words_and_empty_levels(): void
    {
        $curriculum = [
            ['level' => 'Level 1: Empty', 'word_stats' => []],
            [
                'level' => 'Level 2: Actions',
                'word_stats' => [
                    ['word' => 'jump', 'mastery' => 'unseen', 'failed_attempts' => 0],
                    ['word' => 'run', 'mastery' => 'mastered', 'failed_attempts' => 2],
                ],
            ],
        ];

        $this->assertSame([], (new ReportService)->struggleRowsFrom($curriculum));
    }

    public function test_same_word_training_in_two_levels_yields_one_row_per_level(): void
    {
        // Per-level merge mirrors the parent email's trainingGroupsFrom(): the
        // same text stays under each level it is training in, attempts summed
        // within the level only.
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

        // Display casing is GLOBAL (first seen anywhere wins), matching the
        // email's trainingGroupsFrom — Level 2 renders 'the', not its own 'The'.
        $this->assertSame([
            ['level' => 'Level 1: A', 'word' => 'the', 'attempts' => 2],
            ['level' => 'Level 2: B', 'word' => 'the', 'attempts' => 4],
        ], (new ReportService)->struggleRowsFrom($curriculum));
    }
}
