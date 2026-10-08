<?php

namespace Tests\Unit;

use App\Services\ReportService;
use PHPUnit\Framework\TestCase;

class ReportServiceHelpersTest extends TestCase
{
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
