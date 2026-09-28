<?php

namespace Tests\Unit;

use App\Services\ReportService;
use PHPUnit\Framework\TestCase;

class VerdictTest extends TestCase
{
    // The five states every report surface renders. masteryLabels.js::verdict()
    // is the JS twin of verdict() — a change in one is a change in both.
    public function test_verdict_table(): void
    {
        $this->assertSame(
            ReportService::VERDICT_NOT_ATTEMPTED,
            ReportService::verdict('unseen', 0),
            'A module word with no mastery row has no history, never a fake 0.',
        );

        // Boundary at the threshold: 2 is practicing, 3 is the boundary that fires.
        $this->assertSame(ReportService::VERDICT_PRACTICING, ReportService::verdict('training', 2));
        $this->assertSame(ReportService::VERDICT_NEEDS_ATTENTION, ReportService::verdict('training', 3));
        $this->assertSame(ReportService::VERDICT_NEEDS_ATTENTION, ReportService::verdict('training', 9));

        // The mastered branch is threshold-gated, NOT `> 0`. A word that slipped
        // once and was then read correctly was never a problem, so calling it
        // "Recovered" credited a recovery that did not happen. The floor has to
        // EQUAL the attention floor: at floor 4 a word flagged needsAttention at
        // exactly 3 would conquer and then render as plain mastered.
        $this->assertSame(ReportService::VERDICT_MASTERED, ReportService::verdict('mastered', 0));
        $this->assertSame(ReportService::VERDICT_MASTERED, ReportService::verdict('mastered', 1));
        $this->assertSame(ReportService::VERDICT_MASTERED, ReportService::verdict('mastered', 2));
        $this->assertSame(ReportService::VERDICT_RECOVERED, ReportService::verdict('mastered', 3));
        $this->assertSame(ReportService::VERDICT_RECOVERED, ReportService::verdict('mastered', 4));
    }

    public function test_the_recovered_floor_always_equals_the_attention_floor(): void
    {
        // The invariant that keeps the five states coherent, checked at several
        // thresholds: whatever counts as a problem must also be recoverable, so
        // a word can never be flagged and then conquered with no acknowledgment.
        foreach ([1, 2, 3, 4, 5] as $threshold) {
            foreach (range(0, 8) as $failed) {
                $wasFlagged = ReportService::verdict('training', $failed, $threshold)
                    === ReportService::VERDICT_NEEDS_ATTENTION;
                $isRecovered = ReportService::verdict('mastered', $failed, $threshold)
                    === ReportService::VERDICT_RECOVERED;

                $this->assertSame(
                    $wasFlagged,
                    $isRecovered,
                    "threshold {$threshold}, failed {$failed}: a flagged word must earn recovery when conquered",
                );
            }
        }
    }

    public function test_verdict_honours_an_explicit_threshold(): void
    {
        $this->assertSame(ReportService::VERDICT_PRACTICING, ReportService::verdict('training', 3, 5));
        $this->assertSame(ReportService::VERDICT_NEEDS_ATTENTION, ReportService::verdict('training', 5, 5));
    }

    public function test_verdict_labels_split_by_audience_but_never_by_rule(): void
    {
        // Same state, different audience: the parent reads "Still Practicing"
        // where the teacher reads "Practicing". The STATE is one value.
        $this->assertSame('Still Practicing', ReportService::verdictLabel(ReportService::VERDICT_PRACTICING, true));
        $this->assertSame('Practicing', ReportService::verdictLabel(ReportService::VERDICT_PRACTICING));
        $this->assertSame('Needs More Practice', ReportService::verdictLabel(ReportService::VERDICT_NEEDS_ATTENTION, true));
        $this->assertSame('Needs Attention', ReportService::verdictLabel(ReportService::VERDICT_NEEDS_ATTENTION));
        $this->assertSame('Recovered', ReportService::verdictLabel(ReportService::VERDICT_RECOVERED, true));
        $this->assertSame('Not Attempted', ReportService::verdictLabel(ReportService::VERDICT_NOT_ATTEMPTED, true));
    }

    public function test_attempts_shown_adds_the_winning_try_only_for_mastered(): void
    {
        $this->assertSame(3, ReportService::attemptsShown('training', 3));
        $this->assertSame(5, ReportService::attemptsShown('mastered', 4));
        $this->assertSame(1, ReportService::attemptsShown('mastered', 0));
    }

    public function test_a_recovered_word_carries_history_where_a_first_try_one_does_not(): void
    {
        // failed_attempts is 0 only when the word was NEVER recorded as failing
        // — i.e. a first-try correct read. That is a clean Mastered. Any value
        // above zero means the word was recorded failing at least once before
        // it was conquered, which is exactly what Recovered reports.
        $this->assertSame(ReportService::VERDICT_MASTERED, ReportService::verdict('mastered', 0));
        $this->assertSame(ReportService::VERDICT_MASTERED, ReportService::verdict('mastered', 1), 'one slip is not a recovery');
        $this->assertSame(ReportService::VERDICT_RECOVERED, ReportService::verdict('mastered', 3));
        $this->assertSame(ReportService::VERDICT_RECOVERED, ReportService::verdict('mastered', 4));

        // NOTE: there is deliberately no "tries" helper left. failed_attempts
        // counts recorded failure events — wrong reads AND 5s-silence watchdog
        // timeouts — so `failed + 1` would claim attempts that never happened.
        // Every surface says "N recorded failures". See REPORTS.md.
    }

    public function test_sentence_verdict_comes_from_its_words_not_the_sum(): void
    {
        // THE false positive this whole feature exists to remove: five words at
        // one miss each sum to 5, which clears the threshold, while not one word
        // is actually a problem. The sentence must NOT be flagged.
        $words = [
            ['mastery' => 'mastered', 'failed_attempts' => 0],
            ['mastery' => 'mastered', 'failed_attempts' => 0],
            ['mastery' => 'mastered', 'failed_attempts' => 0],
            ['mastery' => 'training', 'failed_attempts' => 1],
            ['mastery' => 'training', 'failed_attempts' => 2],
        ];

        $this->assertSame(3, array_sum(array_column($words, 'failed_attempts')));
        $this->assertSame(
            ReportService::VERDICT_PRACTICING,
            ReportService::sentenceVerdictFrom($words),
            'A 3-attempt sum whose worst word took 2 is still only practicing.',
        );

        // Same shape with a recovered word: still not flagged. The old rule
        // (sum >= threshold) would have called this "Needs Attention".
        $withHistory = [
            ['mastery' => 'mastered', 'failed_attempts' => 1],
            ['mastery' => 'training', 'failed_attempts' => 1],
            ['mastery' => 'training', 'failed_attempts' => 2],
        ];
        $this->assertSame(4, array_sum(array_column($withHistory, 'failed_attempts')));
        $this->assertNotSame(
            ReportService::VERDICT_NEEDS_ATTENTION,
            ReportService::sentenceVerdictFrom($withHistory),
            'A 4-attempt sum must not flag a sentence whose worst word took 2.',
        );
    }

    public function test_one_hard_word_makes_the_whole_sentence_need_attention(): void
    {
        $words = [
            ['mastery' => 'mastered', 'failed_attempts' => 0],
            ['mastery' => 'training', 'failed_attempts' => 5],
            ['mastery' => 'training', 'failed_attempts' => 1],
        ];

        $this->assertSame(
            ReportService::VERDICT_NEEDS_ATTENTION,
            ReportService::sentenceVerdictFrom($words),
        );
    }

    public function test_untouched_sentence_is_not_attempted_not_mastered(): void
    {
        // A brand-new student has rows with no mastery at all. Falling through
        // to MASTERED made the teacher page claim every untouched sentence was
        // "conquered on the first try" — the sentence must be Not Attempted.
        $untouched = [
            ['mastery' => 'unseen', 'failed_attempts' => 0],
            ['mastery' => 'unseen', 'failed_attempts' => 0],
            ['mastery' => 'unseen', 'failed_attempts' => 0],
        ];

        $this->assertSame(
            ReportService::VERDICT_NOT_ATTEMPTED,
            ReportService::sentenceVerdictFrom($untouched),
        );

        // One played word is enough to move it out of Not Attempted — it is being
        // worked on, so Still Practicing is the honest read.
        $this->assertSame(
            ReportService::VERDICT_PRACTICING,
            ReportService::sentenceVerdictFrom([
                ['mastery' => 'training', 'failed_attempts' => 1],
                ['mastery' => 'unseen', 'failed_attempts' => 0],
            ]),
        );

        // And a genuinely clean sentence is still Mastered.
        $this->assertSame(
            ReportService::VERDICT_MASTERED,
            ReportService::sentenceVerdictFrom([
                ['mastery' => 'mastered', 'failed_attempts' => 0],
                ['mastery' => 'mastered', 'failed_attempts' => 0],
            ]),
        );
    }

    public function test_sentence_verdict_reports_recovered_history(): void
    {
        $this->assertSame(
            ReportService::VERDICT_RECOVERED,
            ReportService::sentenceVerdictFrom([
                ['mastery' => 'mastered', 'failed_attempts' => 4],
                ['mastery' => 'mastered', 'failed_attempts' => 0],
            ]),
        );
        $this->assertSame(
            ReportService::VERDICT_MASTERED,
            ReportService::sentenceVerdictFrom([
                ['mastery' => 'mastered', 'failed_attempts' => 0],
            ]),
        );
    }
}
