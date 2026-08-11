<?php

namespace Tests\Feature;

use App\Models\GameSession;
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
        $this->assertDatabaseHas('game_sessions', [
            'user_id' => $this->student->id,
            'is_deadline_hit' => false,
        ]);
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
            ->assertSessionMissing('info');

        $this->student->refresh();
        $this->assertEquals(0, $this->student->student->points);
        $this->assertDatabaseMissing('student_word_progress', [
            'user_id' => $this->student->id,
        ]);
        $this->assertDatabaseHas('game_sessions', [
            'user_id' => $this->student->id,
            'is_deadline_hit' => true,
        ]);
    }

    public function test_post_deadline_mastery_write_is_rejected(): void
    {
        Setting::setValue('report_deadline', now()->subMinute()->format('Y-m-d H:i:s'));

        $word = Word::where('word_module_id', $this->module->id)->first();

        $this->actingAs($this->student)
            ->post(route('student.updateWordMastery'), [
                'word_id' => $word->id,
                'status' => 'mastered',
            ])
            ->assertNoContent();

        $this->assertDatabaseMissing('student_word_mastery', [
            'user_id' => $this->student->id,
            'word_id' => $word->id,
        ]);
    }

    public function test_post_deadline_paragraph_mastery_write_is_rejected(): void
    {
        Setting::setValue('report_deadline', now()->subMinute()->format('Y-m-d H:i:s'));

        $paraModule = ParagraphModule::create([
            'level' => 1,
            'title' => 'Test Paragraph',
            'content' => 'The cat is big and fat.',
        ]);
        $paraWord = ParagraphWord::create([
            'paragraph_module_id' => $paraModule->id,
            'word' => 'cat',
            'position' => 1,
        ]);

        $this->actingAs($this->student)
            ->post(route('student.updateParagraphMastery'), [
                'paragraph_word_id' => $paraWord->id,
                'status' => 'mastered',
            ])
            ->assertNoContent();

        $this->assertDatabaseMissing('student_paragraph_mastery', [
            'user_id' => $this->student->id,
            'paragraph_word_id' => $paraWord->id,
        ]);
    }

    public function test_round_rejects_words_processed_above_module_total(): void
    {
        Setting::where('key', 'report_deadline')->delete();

        $this->actingAs($this->student)
            ->post(route('student.saveWordProgress'), [
                'module_id' => $this->module->id,
                'words_smashed' => 3,
                'words_processed' => 999,
            ])
            ->assertSessionHasErrors('words_processed');

        $this->assertDatabaseMissing('student_word_progress', [
            'user_id' => $this->student->id,
        ]);
        $this->assertDatabaseMissing('game_sessions', [
            'user_id' => $this->student->id,
        ]);
    }

    public function test_paragraph_round_rejects_words_processed_above_module_total(): void
    {
        Setting::where('key', 'report_deadline')->delete();

        $paraModule = ParagraphModule::create([
            'level' => 1,
            'title' => 'Test Paragraph',
            'content' => 'The cat is big and fat.',
        ]);
        foreach (['The', 'cat', 'is', 'big', 'and', 'fat'] as $pos => $w) {
            ParagraphWord::create([
                'paragraph_module_id' => $paraModule->id,
                'word' => $w,
                'position' => $pos + 1,
            ]);
        }

        $this->actingAs($this->student)
            ->post(route('student.saveParagraphProgress'), [
                'module_id' => $paraModule->id,
                'words_smashed' => 3,
                'words_processed' => 999,
            ])
            ->assertSessionHasErrors('words_processed');

        $this->assertDatabaseMissing('student_paragraph_progress', [
            'user_id' => $this->student->id,
        ]);
        $this->assertDatabaseMissing('game_sessions', [
            'user_id' => $this->student->id,
        ]);
    }

    public function test_round_clamps_score_and_streak_in_session(): void
    {
        Setting::where('key', 'report_deadline')->delete();

        $this->actingAs($this->student)
            ->post(route('student.saveWordProgress'), [
                'module_id' => $this->module->id,
                'words_smashed' => 999,
                'words_processed' => 10,
                'streak' => 999,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('game_sessions', [
            'user_id' => $this->student->id,
            'module_id' => $this->module->id,
            'score' => 10,
            'streak' => 11,
            'accuracy' => 100.0,
            'is_deadline_hit' => false,
        ]);
    }

    public function test_tutorial_round_still_records_progress_when_deadline_passed(): void
    {
        Setting::setValue('report_deadline', now()->subMinute()->format('Y-m-d H:i:s'));

        $tutorialModule = WordModule::create([
            'level' => 0,
            'title' => 'Tutorial',
            'is_tutorial' => true,
        ]);
        Word::create([
            'word_module_id' => $tutorialModule->id,
            'word' => 'cat',
            'position' => 1,
        ]);

        $this->actingAs($this->student)
            ->post(route('student.saveWordProgress'), [
                'module_id' => $tutorialModule->id,
                'words_smashed' => 1,
                'words_processed' => 1,
            ])
            ->assertRedirect(route('student.dashboard'));

        $this->assertDatabaseHas('student_word_progress', [
            'user_id' => $this->student->id,
            'word_module_id' => $tutorialModule->id,
            'status' => 'completed',
        ]);
        $this->assertDatabaseMissing('game_sessions', ['user_id' => $this->student->id]);
    }

    public function test_pre_deadline_mastery_write_is_accepted(): void
    {
        $word = Word::where('word_module_id', $this->module->id)->first();

        $this->actingAs($this->student)
            ->post(route('student.updateWordMastery'), [
                'word_id' => $word->id,
                'status' => 'mastered',
            ])
            ->assertNoContent();

        $this->assertDatabaseHas('student_word_mastery', [
            'user_id' => $this->student->id,
            'word_id' => $word->id,
            'status' => 'mastered',
        ]);
    }

    // ─── GET ENDPOINT DEADLINE GATE ───────────────────────────────────

    public function test_gameplay_page_redirects_when_deadline_passed(): void
    {
        Setting::setValue('report_deadline', now()->subMinute()->format('Y-m-d H:i:s'));

        $this->actingAs($this->student)
            ->get(route('student.gameplayReadMode', $this->module->level))
            ->assertRedirect(route('student.readModeLevels'));
    }

    public function test_gameplay_page_loads_when_no_deadline(): void
    {
        Setting::where('key', 'report_deadline')->delete();
        $this->student->student->update(['tutorial_completed_at' => now()]);

        $this->actingAs($this->student)
            ->get(route('student.gameplayReadMode', $this->module->level))
            ->assertSuccessful();
    }

    public function test_real_module_redirects_to_levels_during_onboarding(): void
    {
        $this->actingAs($this->student)
            ->get(route('student.gameplayReadMode', $this->module->level))
            ->assertRedirect(route('student.readModeLevels'))
            ->assertSessionMissing('error');
    }

    public function test_tutorial_module_loads_at_level_zero_during_onboarding(): void
    {
        $tutorialModule = WordModule::create([
            'level' => 0,
            'title' => 'Tutorial',
            'is_tutorial' => true,
        ]);
        Word::create([
            'word_module_id' => $tutorialModule->id,
            'word' => 'cat',
            'position' => 1,
        ]);

        $this->actingAs($this->student)
            ->get(route('student.gameplayReadMode', 0))
            ->assertSuccessful();
    }

    public function test_speak_gameplay_page_redirects_when_deadline_passed(): void
    {
        $paraModule = ParagraphModule::create([
            'level' => 1,
            'title' => 'Test Paragraph',
            'content' => 'The cat is big and fat.',
        ]);
        foreach (['The', 'cat', 'is', 'big', 'and', 'fat'] as $pos => $w) {
            ParagraphWord::create([
                'paragraph_module_id' => $paraModule->id,
                'word' => $w,
                'position' => $pos + 1,
            ]);
        }

        Setting::setValue('report_deadline', now()->subMinute()->format('Y-m-d H:i:s'));

        $this->actingAs($this->student)
            ->get(route('student.gameplaySpeakMode', $paraModule->level))
            ->assertRedirect(route('student.speakModeLevels'));
    }

    public function test_speak_gameplay_page_loads_when_no_deadline(): void
    {
        $paraModule = ParagraphModule::create([
            'level' => 1,
            'title' => 'Test Paragraph',
            'content' => 'The cat is big and fat.',
        ]);

        Setting::where('key', 'report_deadline')->delete();
        $this->student->student->update(['tutorial_completed_at' => now()]);

        $this->actingAs($this->student)
            ->get(route('student.gameplaySpeakMode', $paraModule->level))
            ->assertSuccessful();
    }

    public function test_speak_real_module_redirects_to_levels_during_onboarding(): void
    {
        $paraModule = ParagraphModule::create([
            'level' => 1,
            'title' => 'Test Paragraph',
            'content' => 'The cat is big and fat.',
        ]);

        $this->actingAs($this->student)
            ->get(route('student.gameplaySpeakMode', $paraModule->level))
            ->assertRedirect(route('student.speakModeLevels'))
            ->assertSessionMissing('error');
    }

    public function test_speak_tutorial_module_loads_at_level_zero_during_onboarding(): void
    {
        $tutorialPara = ParagraphModule::create([
            'level' => 0,
            'title' => 'Tutorial',
            'content' => 'I see the cat.',
            'is_tutorial' => true,
        ]);
        foreach (['I', 'see', 'the', 'cat', '.'] as $pos => $w) {
            ParagraphWord::create([
                'paragraph_module_id' => $tutorialPara->id,
                'word' => $w,
                'position' => $pos + 1,
            ]);
        }

        $this->actingAs($this->student)
            ->get(route('student.gameplaySpeakMode', 0))
            ->assertSuccessful();
    }

    public function test_tutorial_module_loads_at_level_zero_after_tutorial_completed(): void
    {
        $this->student->student->update(['tutorial_completed_at' => now()]);

        $tutorialPara = ParagraphModule::create([
            'level' => 0,
            'title' => 'Tutorial',
            'content' => 'I see the cat.',
            'is_tutorial' => true,
        ]);

        $this->actingAs($this->student)
            ->get(route('student.gameplaySpeakMode', 0))
            ->assertSuccessful();
    }

    public function test_read_tutorial_module_still_loads_when_deadline_passed(): void
    {
        Setting::setValue('report_deadline', now()->subMinute()->format('Y-m-d H:i:s'));

        $tutorialModule = WordModule::create([
            'level' => 0,
            'title' => 'Tutorial',
            'is_tutorial' => true,
        ]);
        Word::create([
            'word_module_id' => $tutorialModule->id,
            'word' => 'cat',
            'position' => 1,
        ]);

        $this->actingAs($this->student)
            ->get(route('student.gameplayReadMode', $tutorialModule->level))
            ->assertSuccessful();
    }

    public function test_speak_tutorial_module_still_loads_when_deadline_passed(): void
    {
        Setting::setValue('report_deadline', now()->subMinute()->format('Y-m-d H:i:s'));

        $tutorialPara = ParagraphModule::create([
            'level' => 0,
            'title' => 'Tutorial',
            'content' => 'I see the cat.',
            'is_tutorial' => true,
        ]);
        foreach (['I', 'see', 'the', 'cat', '.'] as $pos => $w) {
            ParagraphWord::create([
                'paragraph_module_id' => $tutorialPara->id,
                'word' => $w,
                'position' => $pos + 1,
            ]);
        }

        $this->actingAs($this->student)
            ->get(route('student.gameplaySpeakMode', $tutorialPara->level))
            ->assertSuccessful();
    }

    // ─── IDOR FIX (H3) ────────────────────────────────────────────────

    public function test_student_can_view_own_session_results(): void
    {
        GameSession::create([
            'user_id' => $this->student->id,
            'module_id' => $this->module->id,
            'module_type' => 'word',
            'score' => 85,
            'accuracy' => 85.0,
            'streak' => 3,
        ]);

        $this->student2 = User::factory()->create(['role' => 'student']);
        StudentProfile::factory()->for($this->student2)->create([
            'wordBlastAcc' => 0,
            'storyQuestAcc' => 0,
            'status' => 'notStarted',
        ]);

        $session = GameSession::where('user_id', $this->student2->id)
            ->where('module_id', $this->module->id)
            ->firstOrCreate([
                'user_id' => $this->student2->id,
                'module_id' => $this->module->id,
                'module_type' => 'word',
            ], [
                'score' => 50,
                'accuracy' => 50.0,
                'streak' => 1,
            ]);

        $this->actingAs($this->student)
            ->get(route('student.results', $session->id))
            ->assertRedirect(route('student.dashboard'))
            ->assertSessionHas('error', 'Access denied.');
    }

    public function test_student_can_access_own_results(): void
    {
        $session = GameSession::create([
            'user_id' => $this->student->id,
            'module_id' => $this->module->id,
            'module_type' => 'word',
            'score' => 85,
            'accuracy' => 85.0,
            'streak' => 3,
        ]);

        $this->actingAs($this->student)
            ->get(route('student.results', $session->id))
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page->has('session')->where('deadlineHit', false));
    }

    public function test_results_flags_deadline_hit_for_flagged_session(): void
    {
        $session = GameSession::create([
            'user_id' => $this->student->id,
            'module_id' => $this->module->id,
            'module_type' => 'word',
            'score' => 85,
            'accuracy' => 85.0,
            'streak' => 3,
            'is_deadline_hit' => true,
        ]);

        $this->actingAs($this->student)
            ->get(route('student.results', $session->id))
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page->where('deadlineHit', true));
    }

    public function test_deadline_hit_session_stays_excluded_after_deadline_cleared(): void
    {
        Setting::setValue('report_deadline', now()->subMinute()->format('Y-m-d H:i:s'));

        $this->actingAs($this->student)
            ->post(route('student.saveWordProgress'), [
                'module_id' => $this->module->id,
                'words_smashed' => 10,
                'words_processed' => 10,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('game_sessions', [
            'user_id' => $this->student->id,
            'is_deadline_hit' => true,
        ]);

        Setting::where('key', 'report_deadline')->delete();

        $streak = GameSession::where('user_id', $this->student->id)
            ->where('is_deadline_hit', false)
            ->max('streak');
        $this->assertNull($streak);
    }
}
