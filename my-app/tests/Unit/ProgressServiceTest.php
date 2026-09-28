<?php

namespace Tests\Unit;

use App\Services\ProgressService;
use PHPUnit\Framework\TestCase;

class ProgressServiceTest extends TestCase
{
    public function test_never_played_is_not_started(): void
    {
        $this->assertSame('notStarted', ProgressService::classify(0, 0, false, false));
    }

    public function test_word_blast_only_with_zero_accuracy_is_in_progress(): void
    {
        // Both accuracies 0, but Word Blast has progress rows (the bug case).
        $this->assertSame('in_progress', ProgressService::classify(0, 0, true, false));
    }

    public function test_played_both_with_zero_accuracy_is_in_progress(): void
    {
        // Exact reported scenario: Training Zone exists but accuracy is 0/0.
        $this->assertSame('in_progress', ProgressService::classify(0, 0, true, true));
    }

    public function test_one_skill_zero_accuracy_stays_in_progress(): void
    {
        $this->assertSame('in_progress', ProgressService::classify(0, 75, true, true));
    }

    public function test_at_risk_average(): void
    {
        $this->assertSame('atRisk', ProgressService::classify(80, 20, true, true));
    }

    public function test_support_average(): void
    {
        $this->assertSame('support', ProgressService::classify(70, 65, true, true));
    }

    public function test_on_track_average(): void
    {
        $this->assertSame('onTrack', ProgressService::classify(85, 90, true, true));
    }

    public function test_final_average_is_null_until_both_skills_started(): void
    {
        $this->assertNull(ProgressService::finalAverage(0, 0, false, false));
        $this->assertNull(ProgressService::finalAverage(80, 0, true, false));
        $this->assertNull(ProgressService::finalAverage(0, 90, false, true));
        $this->assertNull(ProgressService::finalAverage(80, 0, true, true));
        $this->assertNull(ProgressService::finalAverage(0, 90, true, true));
    }

    public function test_final_average_averages_and_rounds_both_accuracies(): void
    {
        $this->assertSame(50, ProgressService::finalAverage(80, 20, true, true));
        $this->assertSame(88, ProgressService::finalAverage(85, 90, true, true));
        // Odd sum yields whole number per DepEd (0.5 rounds up).
        $this->assertSame(67, ProgressService::finalAverage(66, 67, true, true));
    }

    public function test_classify_threshold_boundaries(): void
    {
        $this->assertSame('support', ProgressService::classify(80, 79, true, true));
        $this->assertSame('onTrack', ProgressService::classify(80, 80, true, true));
        $this->assertSame('atRisk', ProgressService::classify(60, 59, true, true));
        $this->assertSame('support', ProgressService::classify(60, 60, true, true));
    }

    public function test_final_average_rounds_half_up(): void
    {
        $this->assertSame(80, ProgressService::finalAverage(79, 80, true, true));
        $this->assertSame(60, ProgressService::finalAverage(60, 60, true, true));
    }

    // ── hardestFrom(): the SSOT behind BOTH hardest-module surfaces ──
    // The per-student array adapter (ReportService) and the class-wide SQL
    // adapter (StudentWordMastery) both feed this, so these cases pin the
    // decisions neither adapter is allowed to make for itself.

    public function test_hardest_picks_the_highest_summed_attempts(): void
    {
        $this->assertSame(
            ['level' => 'Level 3: Phonics', 'level_num' => 3],
            ProgressService::hardestFrom([
                1 => ['title' => 'Numbers', 'attempts' => 4],
                3 => ['title' => 'Phonics', 'attempts' => 12],
                2 => ['title' => 'Colors', 'attempts' => 7],
            ]),
        );
    }

    public function test_hardest_is_null_when_every_level_summed_zero(): void
    {
        // The guard that stops "hardest module: 0 failures" from ever rendering.
        $this->assertNull(ProgressService::hardestFrom([
            1 => ['title' => 'Numbers', 'attempts' => 0],
            2 => ['title' => 'Colors', 'attempts' => 0],
        ]));
    }

    public function test_hardest_is_null_for_empty_input(): void
    {
        $this->assertNull(ProgressService::hardestFrom([]));
    }

    public function test_hardest_skips_zero_levels_but_still_answers(): void
    {
        // A class where one level is spot-on and another is brutal.
        $this->assertSame(
            ['level' => 'Level 5: Blends', 'level_num' => 5],
            ProgressService::hardestFrom([
                1 => ['title' => 'Numbers', 'attempts' => 0],
                5 => ['title' => 'Blends', 'attempts' => 9],
            ]),
        );
    }

    public function test_hardest_tie_breaks_to_the_first_level(): void
    {
        // Deterministic: the same input must always give the same answer, or the
        // Dashboard card and the Excel column could disagree run to run.
        $this->assertSame(
            ['level' => 'Level 1: Numbers', 'level_num' => 1],
            ProgressService::hardestFrom([
                1 => ['title' => 'Numbers', 'attempts' => 6],
                2 => ['title' => 'Colors', 'attempts' => 6],
            ]),
        );
    }

    public function test_hardest_label_is_built_here_not_by_the_caller(): void
    {
        // Both adapters pass the title PARTS; the format lives in one place, so
        // the SQL adapter can never CONCAT its own and disagree.
        $this->assertSame(
            'Level 7: Diphthongs',
            ProgressService::hardestFrom([
                7 => ['title' => 'Diphthongs', 'attempts' => 3],
            ])['level'],
        );
    }

    public function test_hardest_casts_string_sums_from_the_database(): void
    {
        // MySQL SUM() on an unsigned int can come back as a string; the Excel
        // card would then print "12" and compare "9" > "12" lexically.
        $this->assertSame(
            ['level' => 'Level 2: Colors', 'level_num' => 2],
            ProgressService::hardestFrom([
                1 => ['title' => 'Numbers', 'attempts' => '9'],
                2 => ['title' => 'Colors', 'attempts' => '12'],
            ]),
        );
    }
}
