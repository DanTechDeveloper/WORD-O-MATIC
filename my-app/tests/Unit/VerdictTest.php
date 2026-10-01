<?php

namespace Tests\Unit;

use App\Services\ReportService;
use PHPUnit\Framework\Attributes\DataProvider;
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

        // NOTE, third and final revision of this tombstone:
        //
        //   v1 (wrong)  "there is deliberately no tries helper; every surface
        //                says N recorded failures" — while attemptsShown() sat
        //                15 lines above, tested, rendering a +1 on the page.
        //   v2 (also wrong, mine) "the note is wrong, the helper DOES exist" —
        //                true that day, but it re-taught the +1 as current.
        //   v3 (now)    the helper is GONE from both languages. One convention:
        //                raw failed_attempts, labelled "recorded".
        //
        // The lesson is the reason this file keeps tripping over it: a comment
        // asserting a rule gets stale silently, and here it outlived two
        // deletions of the very thing it described. The rule now lives in a
        // test that fails if the arithmetic returns —
        // test_neither_language_adds_arithmetic_to_the_displayed_attempt_number().
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

    // ── the whole rule, every branch ──
    //
    // The JS twin runs the IDENTICAL table in
    // tests/Unit/masteryLabels.test.js::sentenceVerdict, transcribed from
    // ParagraphModule::buildLevels(). Running the same rows through both
    // implementations is what makes "change one, change the other" a fact rather
    // than a habit — the two suites fail together or pass together.
    //
    // Each row's third element is the SERVER's own sentence mastery, i.e. what
    // `mastered_sentences` counts. A row where the verdict is MASTERED but the
    // server says mastered too is a sentence the header calls "Mastered" AND the
    // panel puts in the Mastered group. A row where they disagree is the D-B
    // divergence: two different meanings of "Mastered" on one page.
    public static function sentenceVerdictMatrix(): array
    {
        $m = fn (string $word, string $mastery, $failed) => ['word' => $word, 'mastery' => $mastery, 'failed_attempts' => $failed];

        return [
            'clean mastered' => [[$m('Crows', 'mastered', 0), $m('caw.', 'mastered', 0)], ReportService::VERDICT_MASTERED, 'mastered'],
            'mastered, 1 recorded failure' => [[$m('Crows', 'mastered', 0), $m('caw.', 'mastered', 1)], ReportService::VERDICT_MASTERED, 'mastered'],
            'mastered, 2 recorded failures' => [[$m('Crows', 'mastered', 0), $m('caw.', 'mastered', 2)], ReportService::VERDICT_MASTERED, 'mastered'],
            'mastered, 3 recorded failures (boundary)' => [[$m('Crows', 'mastered', 0), $m('caw.', 'mastered', 3)], ReportService::VERDICT_RECOVERED, 'mastered'],
            'mastered, 7 recorded failures' => [[$m('Crows', 'mastered', 0), $m('caw.', 'mastered', 7)], ReportService::VERDICT_RECOVERED, 'mastered'],
            'training, 0' => [[$m('Goats', 'training', 0)], ReportService::VERDICT_PRACTICING, 'training'],
            'training, 2' => [[$m('Goats', 'training', 2)], ReportService::VERDICT_PRACTICING, 'training'],
            'training, 3 (boundary)' => [[$m('Goats', 'training', 3)], ReportService::VERDICT_NEEDS_ATTENTION, 'training'],
            'every word unseen' => [[$m('Crab', 'unseen', 0), $m('paws.', 'unseen', 0)], ReportService::VERDICT_NOT_ATTEMPTED, 'training'],
            'mastered + unseen' => [[$m('Milo', 'mastered', 0), $m('frog.', 'unseen', 0)], ReportService::VERDICT_NOT_ATTEMPTED, 'training'],
            'recovered word + hard word' => [[$m('mail', 'mastered', 4), $m('goes.', 'training', 9)], ReportService::VERDICT_NEEDS_ATTENTION, 'training'],
            'dup word, 2+2 (merge crosses, sentence does not)' => [[$m('A', 'mastered', 2), $m('cat', 'mastered', 0), $m('a', 'mastered', 2)], ReportService::VERDICT_MASTERED, 'mastered'],
            'dup word, 3+0 (merge crosses threshold)' => [[$m('A', 'mastered', 3), $m('cat', 'mastered', 0)], ReportService::VERDICT_RECOVERED, 'mastered'],
            'null failed_attempts' => [[$m('A', 'mastered', null)], ReportService::VERDICT_MASTERED, 'mastered'],
            // No `undefined` in PHP — the real shape of "never set" is a MISSING
            // key, which is what (int) ($w['failed_attempts'] ?? 0) defends.
            'missing failed_attempts key' => [[['word' => 'A', 'mastery' => 'mastered']], ReportService::VERDICT_MASTERED, 'mastered'],
        ];
    }

    #[DataProvider('sentenceVerdictMatrix')]
    public function test_sentence_verdict_matrix(array $words, string $expected, string $_serverMastery): void
    {
        $this->assertSame($expected, ReportService::sentenceVerdictFrom($words));
    }

    // The sentence verdict reads the RAW per-occurrence words, while
    // mergeSentenceWords() folds duplicates into one row and sums their
    // counters. "A" at 2 failures in position 1 and "a" at 2 in position 5 is
    // therefore a MASTERED sentence (no single occurrence hit 3) carrying a
    // RECOVERED drill row (the merged word reached 4). Same word, two
    // questions, and the panel answers both.
    #[DataProvider('sentenceVerdictMatrix')]
    public function test_duplicate_occurrences_are_judged_per_occurrence_at_sentence_level(
        array $words,
        string $verdict,
        string $_serverMastery,
    ): void {
        $duplicate = array_filter($words, fn ($w) => strtolower($w['word']) === 'a');

        if (count($duplicate) < 2) {
            $this->assertTrue(true);

            return;
        }

        $eachBelow = array_reduce(
            $duplicate,
            fn (bool $carry, $w) => $carry && (int) $w['failed_attempts'] < ReportService::NEEDS_ATTENTION_ATTEMPTS,
            true,
        );

        $this->assertSame(
            ReportService::VERDICT_MASTERED,
            $verdict,
            'no occurrence of the repeated word reached the threshold, so the sentence must not be Recovered on the merge alone',
        );
        $this->assertTrue($eachBelow);
    }

    /**
     * The D-B divergence, stated as a test so it cannot be rediscovered by hand.
     *
     * `mastered_sentences` (the SERVER rule: every word mastered) drives the
     * StudentDetails header "N of M Sentences Conquered" and the Story Quest
     * progress %. The JS rule (RECOVERED once any word hit the threshold) drives
     * the panel's "N mastered" count. The header therefore reads higher than the
     * panel's Mastered group by exactly the number of recovered sentences — two
     * correct answers to two different questions, which is why the header is
     * labelled "Conquered" and not "Mastered". Do not "fix" the gap by making
     * the header track the panel: that hides recovered history from the %.
     *
     * The Excel/email path shares the server rule via
     * sentenceCurriculumPercent(), so the two rules are intentionally different
     * and both must survive a change.
     */
    #[DataProvider('sentenceVerdictMatrix')]
    public function test_the_server_and_the_verdict_disagree_only_on_recovered_history(
        array $words,
        string $verdict,
        string $serverMastery,
    ): void {
        $countsInHeader = $serverMastery === 'mastered';
        $countsInPanel = $verdict === ReportService::VERDICT_MASTERED;

        if ($countsInHeader === $countsInPanel) {
            $this->assertTrue(true);

            return;
        }

        // A deliberate divergence is only defensible if the sentence carries
        // history — otherwise the page is flatly contradicting itself.
        $carriesHistory = false;
        foreach ($words as $w) {
            if (($w['mastery'] ?? '') === 'mastered'
                && (int) ($w['failed_attempts'] ?? 0) >= ReportService::NEEDS_ATTENTION_ATTEMPTS) {
                $carriesHistory = true;
                break;
            }
        }

        $this->assertTrue(
            $carriesHistory,
            'the header counts this sentence as Mastered and the panel does not, but it carries no history to justify the split',
        );
    }

    // THE BUG, PHP half. `in_array(NOT_ATTEMPTED, $verdicts, true)` is the guard
    // that stops a never-attempted sentence falling through to MASTERED, but it
    // needs at least one word to find. Zero words misses every branch and
    // returns MASTERED — the exact "conquered on the first try" reading the
    // guard exists to prevent. The JS half is the same hole and is red in
    // tests/Unit/masteryLabels.test.js.
    //
    // Not reachable from production data today: sentencesFromContent() filters
    // empty splits and the legacy branch in ParagraphModule::buildLevels()
    // requires words->count() > 0.
    public function test_a_sentence_with_no_words_is_not_attempted_never_mastered(): void
    {
        $this->assertSame(
            ReportService::VERDICT_NOT_ATTEMPTED,
            ReportService::sentenceVerdictFrom([]),
            'An empty sentence has no evidence of a conquest.',
        );
    }

    /**
     * THE CROSS-SURFACE LOCK. One number, one convention, no arithmetic — in
     * either language.
     *
     * A word's displayed number is `failed_attempts`, raw. It is not a count of
     * the child's tries: the 5s-silence watchdog increments failed_attempts on
     * pure silence, so a word the child stalled on and never attempted carries a
     * "failure" that was never a pronunciation attempt. Both languages
     * therefore must NOT add to it.
     *
     * They used to disagree, and the two conventions were:
     *   - the email + Excel: raw (the blade never called the helper at all)
     *   - the teacher page:   failed_attempts + 1 for every MASTERED word
     * so a recovered word read "4 recorded attempts to conquer" in the parent
     * email and "Attempts: 5" on the page. The page's +1 was added to fix an
     * earlier Word-Blast-vs-Story-Quest mismatch and broke the email in the
     * process; ReportService::attemptsShown() has been dead code ever since,
     * called by tests only.
     *
     * This is a SOURCE lock on purpose. A rendering test would have to mount the
     * Inertia page inside a PHP process, which the two gates do not share. Two
     * greps cost nothing and fail forever if either side does arithmetic again.
     */
    public function test_neither_language_adds_arithmetic_to_the_displayed_attempt_number(): void
    {
        $js = file_get_contents(dirname(__DIR__, 2).'/resources/js/utils/masteryLabels.js');
        $this->assertIsString($js, 'masteryLabels.js must be readable');

        $this->assertSame(
            0,
            preg_match('/failed_attempts\s*\|\|\s*0\s*\)\s*\+\s*1/', $js),
            'masteryLabels.js does arithmetic on failed_attempts for display — the email prints it raw and the two will disagree again',
        );

        // The helper is the arithmetic. It must not exist on the PHP side, which
        // is what the email renders from.
        $this->assertFalse(
            method_exists(ReportService::class, 'attemptsShown'),
            'ReportService::attemptsShown() is the +1. No blade calls it, so it is dead code that only re-teaches the wrong convention to the tests.',
        );
    }

    // The JS twin is the thing this whole file claims to police, and nothing
    // compared the two. `NEEDS_ATTENTION_ATTEMPTS` is shipped to the frontend as
    // the shared `teacher.attention_threshold` prop, so a drift between the two
    // literals would silently give the page a different floor than the server
    // uses — a teacher could never reproduce a verdict by hand. Read the JS file
    // rather than duplicating the number: that is the whole point.
    public function test_the_attention_threshold_matches_the_js_twin(): void
    {
        // dirname, not base_path(): this class extends PHPUnit\Framework\TestCase
        // (no app container), so the Laravel helper is undefined here.
        $js = file_get_contents(dirname(__DIR__, 2).'/resources/js/utils/masteryLabels.js');
        $this->assertIsString($js, 'masteryLabels.js is the verdict twin; it must be readable');

        $this->assertSame(
            1,
            preg_match('/NEEDS_ATTENTION_ATTEMPTS\s*=\s*(\d+)/', $js, $m),
            'masteryLabels.js no longer declares a literal NEEDS_ATTENTION_ATTEMPTS — update this test',
        );

        $this->assertSame(
            ReportService::NEEDS_ATTENTION_ATTEMPTS,
            (int) $m[1],
            'ReportService::NEEDS_ATTENTION_ATTEMPTS and masteryLabels.js disagree — the page would judge a different floor than the server',
        );
    }
}
