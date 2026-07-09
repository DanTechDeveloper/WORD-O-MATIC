<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WordModule;
use App\Models\Word;
use App\Models\StudentProfile;
use App\Models\StudentWordProgress;
use App\Services\ProgressService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GameplayTest extends TestCase
{
    use RefreshDatabase;

    private User $student;
    private WordModule $module;
    private ProgressService $progressService;

    // ─── SETUP ──────────────────────────────────────────────────────

    protected function setUp(): void
    {
        parent::setUp();

        // Gumawa ng isang module na may 10 words
        $this->module = WordModule::create([
            'level' => 1,
            'title' => 'Test Module',
        ]);

        foreach (['cat', 'dog', 'sun', 'hat', 'run', 'big', 'red', 'cup', 'box', 'pen'] as $i => $word) {
            Word::create([
                'word_module_id' => $this->module->id,
                'word' => $word,
                'position' => $i + 1,
            ]);
        }

        // Student na hindi pa naglalaro
        $this->student = User::factory()->create(['role' => 'student']);
        StudentProfile::factory()->for($this->student)->create([
            'wordBlastAcc' => 0,
            'storyQuestAcc' => 0,
            'status' => 'notStarted',
        ]);

        $this->progressService = app(ProgressService::class);
    }

    // ─── STATUS RECALCULATION ───────────────────────────────────────

    public function test_playing_status_when_only_word_blast_has_progress(): void
    {
        // I-save ang progress sa Word Blast lang (5 out of 10 words)
        $this->progressService->updateWordProgress(
            $this->student->student,
            $this->module,
            wordsSmashed: 5,
            wordsProcessed: 5,
            accuracy: 70
        );

        // I-refresh para makuha updated values
        $this->student->refresh();

        // Word Blast may progress, Story Quest wala → dapat 'playing'
        $this->assertEquals('in_progress', $this->student->student->status);
        $this->assertEquals(70, $this->student->student->wordBlastAcc);
        $this->assertEquals(0, $this->student->student->storyQuestAcc);
    }

    public function test_status_upgrades_to_onTrack_when_both_games_are_high(): void
    {
        // Maglaro sa Word Blast
        $this->progressService->updateWordProgress(
            $this->student->student,
            $this->module,
            wordsSmashed: 10,
            wordsProcessed: 10,
            accuracy: 90
        );

        // Maglaro sa Story Quest (gumawa muna ng ParagraphModule)
        $paraModule = \App\Models\ParagraphModule::create([
            'level' => 1,
            'title' => 'Test Paragraph',
            'content' => 'The cat is big and fat.',
        ]);
        $words = ['The', 'cat', 'is', 'big', 'and', 'fat'];
        foreach ($words as $pos => $w) {
            \App\Models\ParagraphWord::create([
                'paragraph_module_id' => $paraModule->id,
                'word' => $w,
                'position' => $pos + 1,
            ]);
        }

        $this->progressService->updateParagraphProgress(
            $this->student->student,
            $paraModule,
            wordsSmashed: 6,
            wordsProcessed: 6,
            accuracy: 88
        );

        $this->student->refresh();

        // Both > 0 at average >= 80 → onTrack
        $this->assertEquals('onTrack', $this->student->student->status);
    }

    public function test_status_stays_notStarted_when_no_progress(): void
    {
        $this->student->refresh();

        $this->assertEquals('notStarted', $this->student->student->status);
    }
}
