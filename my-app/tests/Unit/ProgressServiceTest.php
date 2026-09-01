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
}
