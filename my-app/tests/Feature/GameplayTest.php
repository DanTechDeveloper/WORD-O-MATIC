<?php

namespace Tests\Feature;

use App\Models\ParagraphModule;
use App\Models\ParagraphWord;
use App\Models\Setting;
use App\Models\StudentProfile;
use App\Models\User;
use App\Models\Word;
use App\Models\WordModule;
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

    public function test_status_upgrades_to_on_track_when_both_games_are_high(): void
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
        $paraModule = ParagraphModule::create([
            'level' => 1,
            'title' => 'Test Paragraph',
            'content' => 'The cat is big and fat.',
        ]);
        $words = ['The', 'cat', 'is', 'big', 'and', 'fat'];
        foreach ($words as $pos => $w) {
            ParagraphWord::create([
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

    public function test_status_stays_not_started_when_no_progress(): void
    {
        $this->student->refresh();

        $this->assertEquals('notStarted', $this->student->student->status);
    }

    // ─── DEADLINE GATE ─────────────────────────────────────────────

    public function test_round_saves_progress_when_no_deadline_is_set(): void
    {
        Setting::where('key', 'report_deadline')->delete();

        $this->actingAs($this->student)
            ->post(route('student.saveWordProgress'), [
                'module_id' => $this->module->id,
                'words_smashed' => 10,
                'words_processed' => 10,
            ])
            ->assertRedirect()
            ->assertSessionMissing('info');

        $this->student->refresh();
        $this->assertEquals(10, $this->student->student->points);
        $this->assertDatabaseHas('student_word_progress', [
            'user_id' => $this->student->id,
            'word_module_id' => $this->module->id,
            'words_smashed' => 10,
        ]);
        $this->assertDatabaseHas('game_sessions', ['user_id' => $this->student->id]);
    }

    public function test_round_logs_session_but_skips_progress_when_deadline_passed(): void
    {
        Setting::setValue('report_deadline', now()->subMinute()->format('Y-m-d H:i:s'));

        $this->actingAs($this->student)
            ->post(route('student.saveWordProgress'), [
                'module_id' => $this->module->id,
                'words_smashed' => 10,
                'words_processed' => 10,
            ])
            ->assertRedirect()
            ->assertSessionHas('info');

        $this->student->refresh();
        $this->assertEquals(0, $this->student->student->points);
        $this->assertDatabaseMissing('student_word_progress', [
            'user_id' => $this->student->id,
        ]);
        $this->assertDatabaseHas('game_sessions', ['user_id' => $this->student->id]);
    }
}
