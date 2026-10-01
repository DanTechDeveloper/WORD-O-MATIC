<?php

namespace Tests\Unit;

use App\Services\ReportService;
use PHPUnit\Framework\TestCase;

class NormalizeWordTest extends TestCase
{
    public function test_folds_case_and_punctuation_like_the_asr_matcher(): void
    {
        // Twin of speechUtils.js normalizeText(). It has to agree with
        // isWordMatch because that is what decided a word was missed at all.
        $this->assertSame('big', ReportService::normalizeWord('BIG'));
        $this->assertSame('big', ReportService::normalizeWord('big.'));
        $this->assertSame('big', ReportService::normalizeWord('  Big!  '));
        $this->assertSame('dont', ReportService::normalizeWord("don't"));
        $this->assertSame('a', ReportService::normalizeWord('A'));
        $this->assertSame('', ReportService::normalizeWord('...'));
        $this->assertSame('', ReportService::normalizeWord(null));
    }

    public function test_merges_duplicate_texts_and_sums_the_attempts(): void
    {
        // Story Quest content is free prose, so the same word legitimately
        // appears at several positions in one module. Keying by raw text is
        // PHP's last-write-wins, which UNDERCOUNTS the most common words in
        // the curriculum — "a" would report 2 instead of 5.
        $merged = ReportService::mergeSentenceWords([
            ['word' => 'a', 'mastery' => 'training', 'failed_attempts' => 2],
            ['word' => 'A', 'mastery' => 'training', 'failed_attempts' => 3],
            ['word' => 'big', 'mastery' => 'training', 'failed_attempts' => 1],
        ]);

        $this->assertCount(2, $merged);
        $this->assertSame(['a', 'big'], array_column($merged, 'word'));
        $this->assertSame(5, $merged[0]['failed_attempts']);
        $this->assertSame(1, $merged[1]['failed_attempts']);
    }

    public function test_merged_word_keeps_the_worst_mastery(): void
    {
        // A word is only recovered when EVERY occurrence was conquered — the
        // same all-or-nothing rule buildLevels applies at sentence level.
        $merged = ReportService::mergeSentenceWords([
            ['word' => 'big', 'mastery' => 'mastered', 'failed_attempts' => 4],
            ['word' => 'Big', 'mastery' => 'training', 'failed_attempts' => 1],
        ]);

        $this->assertCount(1, $merged);
        $this->assertSame('training', $merged[0]['mastery']);
        $this->assertSame(5, $merged[0]['failed_attempts']);
    }

    public function test_merged_word_carries_its_own_verdict(): void
    {
        $merged = ReportService::mergeSentenceWords([
            ['word' => 'a', 'mastery' => 'training', 'failed_attempts' => 2],
            ['word' => 'A', 'mastery' => 'training', 'failed_attempts' => 1],
            ['word' => 'big', 'mastery' => 'mastered', 'failed_attempts' => 6],
            ['word' => 'cat', 'mastery' => 'unseen', 'failed_attempts' => 0],
        ]);

        $byWord = array_column($merged, 'verdict', 'word');

        $this->assertSame(ReportService::VERDICT_NEEDS_ATTENTION, $byWord['a'], '2+1 summed to 3, which IS the threshold');
        $this->assertSame(ReportService::VERDICT_RECOVERED, $byWord['big']);
        $this->assertSame(ReportService::VERDICT_NOT_ATTEMPTED, $byWord['cat']);
    }

    public function test_a_recovered_word_reports_the_peak_it_reached_while_failing(): void
    {
        // The freeze is what makes history possible. StudentController only
        // increments failed_attempts while status != 'mastered' and then
        // early-returns, so the stored value IS the high-water mark — the "last
        // attempt count before it became Recovered". It can never be a
        // post-mastery artefact, and it can never decrease.
        $merged = ReportService::mergeSentenceWords([
            ['word' => 'big', 'mastery' => 'mastered', 'failed_attempts' => 4],
        ]);

        $this->assertSame(4, $merged[0]['failed_attempts']);
        $this->assertSame(ReportService::VERDICT_RECOVERED, $merged[0]['verdict']);
        // The displayed number is the merged raw count, in every surface. Nothing
        // adds a "winning try": the 5s-silence watchdog puts non-tries in this
        // counter, and the parent email prints it raw. See
        // VerdictTest::test_neither_language_adds_arithmetic_to_the_displayed_attempt_number().
    }

    public function test_excel_merges_duplicates_across_sentences_within_a_level(): void
    {
        // Level 5 verbatim: "A tiger crosses the river. A robot holds a lemon."
        // "A" appears in BOTH sentences (and twice in the second). The Excel has
        // no Sentence column, so a row's identity is (level, word) — merging per
        // SENTENCE emitted two rows that looked identical on the sheet. The
        // email and the teacher page keep the per-sentence unit on purpose,
        // because both print the sentence directly above the words.
        $curriculum = [[
            'level' => 'Level 5: Chapter 5',
            'sentence_stats' => [
                ['sentence' => 'A tiger crosses the river.', 'mastery' => 'training', 'words' => [
                    ['word' => 'A', 'mastery' => 'training', 'failed_attempts' => 2],
                    ['word' => 'tiger', 'mastery' => 'mastered', 'failed_attempts' => 0],
                    ['word' => 'river', 'mastery' => 'mastered', 'failed_attempts' => 0],
                ]],
                ['sentence' => 'A robot holds a lemon.', 'mastery' => 'training', 'words' => [
                    ['word' => 'A', 'mastery' => 'training', 'failed_attempts' => 3],
                    ['word' => 'a', 'mastery' => 'training', 'failed_attempts' => 1],
                    ['word' => 'lemon', 'mastery' => 'mastered', 'failed_attempts' => 0],
                ]],
            ],
        ]];

        $rows = (new ReportService)->sentenceWordStruggleRowsFrom($curriculum);

        $this->assertCount(1, $rows, 'one row per (level, word) — never two identical-looking rows');
        $this->assertSame('Level 5: Chapter 5', $rows[0]['level']);
        $this->assertSame('A', $rows[0]['word']);
        $this->assertSame(6, $rows[0]['attempts'], '2 + 3 + 1 across both sentences');
        $this->assertSame(ReportService::VERDICT_NEEDS_ATTENTION, $rows[0]['verdict']);
        $this->assertArrayNotHasKey('sentence', $rows[0], 'a single sentence cannot describe a word that spans two');
    }
}
