<?php

namespace Tests\Feature;

use App\Models\ParagraphModule;
use App\Models\ParagraphWord;
use App\Models\StudentParagraphProgress;
use App\Models\StudentProfile;
use App\Models\StudentWordProgress;
use App\Models\User;
use App\Models\Word;
use App\Models\WordModule;
use App\Services\ProgressService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProgressServiceTest extends TestCase
{
    use RefreshDatabase;

    private ProgressService $progressService;

    private User $student;

    private WordModule $wordModule;

    private ParagraphModule $paraModule;

    protected function setUp(): void
    {
        parent::setUp();

        $this->progressService = app(ProgressService::class);

        $this->student = User::factory()->create(['role' => 'student']);
        StudentProfile::factory()->for($this->student)->create();

        $this->wordModule = WordModule::create(['level' => 1, 'title' => 'Test Word Module']);
        foreach (['cat', 'dog', 'sun', 'hat', 'run'] as $i => $word) {
            Word::create(['word_module_id' => $this->wordModule->id, 'word' => $word, 'position' => $i + 1]);
        }

        $this->paraModule = ParagraphModule::create(['level' => 1, 'title' => 'Test Para Module', 'content' => 'The cat is big.']);
        foreach (['The', 'cat', 'is', 'big'] as $i => $w) {
            ParagraphWord::create(['paragraph_module_id' => $this->paraModule->id, 'word' => $w, 'position' => $i + 1]);
        }
    }

    public function test_tutorial_completion_bumps_level_from_zero(): void
    {
        // Mirror a freshly created student (persistStudent now seeds level 0).
        $this->student->student->update(['read_level' => 0, 'speak_level' => 0]);

        $tutWord = WordModule::create(['level' => 0, 'title' => 'Tut Word', 'is_tutorial' => true]);
        Word::create(['word_module_id' => $tutWord->id, 'word' => 'a', 'position' => 1]);

        $tutPara = ParagraphModule::create([
            'level' => 0, 'title' => 'Tut Para', 'content' => 'I see a cat.', 'is_tutorial' => true,
        ]);
        foreach (['I', 'see', 'a', 'cat'] as $i => $w) {
            ParagraphWord::create(['paragraph_module_id' => $tutPara->id, 'word' => $w, 'position' => $i + 1]);
        }

        $this->progressService->updateWordProgress(
            $this->student->student, $tutWord,
            wordsSmashed: 1, wordsProcessed: 1, accuracy: 100, isTutorial: true
        );
        $this->progressService->updateParagraphProgress(
            $this->student->student, $tutPara,
            wordsSmashed: 4, wordsProcessed: 4, accuracy: 100, isTutorial: true
        );

        $this->student->student->refresh();
        $this->assertEquals(1, $this->student->student->read_level);
        $this->assertEquals(1, $this->student->student->speak_level);
        // Tutorial plays must not inflate accuracy or points (BF24).
        $this->assertEquals(0.0, $this->student->student->wordBlastAcc);
        $this->assertEquals(0, $this->student->student->points);

        // A post-onboarding tutorial replay must not re-bump the level.
        $this->progressService->updateWordProgress(
            $this->student->student, $tutWord,
            wordsSmashed: 1, wordsProcessed: 1, accuracy: 100, isTutorial: true
        );
        $this->student->student->refresh();
        $this->assertEquals(1, $this->student->student->read_level);
    }

    public function test_level_up_on_completion(): void
    {
        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 5, wordsProcessed: 5, accuracy: 90
        );

        $this->student->refresh();
        $this->assertEquals(2, $this->student->student->read_level);
    }

    public function test_points_updated_on_new_best(): void
    {
        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 3, wordsProcessed: 3, accuracy: 70
        );

        $this->student->refresh();
        $this->assertEquals(3, $this->student->student->points);
    }

    public function test_points_increment_on_improvement(): void
    {
        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 3, wordsProcessed: 3, accuracy: 70
        );

        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 5, wordsProcessed: 5, accuracy: 90
        );

        $this->student->refresh();
        $this->assertEquals(5, $this->student->student->points);
    }

    public function test_points_not_updated_on_worse_score(): void
    {
        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 5, wordsProcessed: 5, accuracy: 90
        );

        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 2, wordsProcessed: 2, accuracy: 50
        );

        $this->student->refresh();
        $this->assertEquals(5, $this->student->student->points);
    }

    public function test_accuracy_averaged_across_modules(): void
    {
        $module2 = WordModule::create(['level' => 2, 'title' => 'Module 2']);
        Word::create(['word_module_id' => $module2->id, 'word' => 'new', 'position' => 1]);

        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 5, wordsProcessed: 5, accuracy: 80
        );

        $this->progressService->updateWordProgress(
            $this->student->student, $module2,
            wordsSmashed: 1, wordsProcessed: 1, accuracy: 60
        );

        $this->student->refresh();
        $this->assertEquals(70, $this->student->student->wordBlastAcc);
    }

    public function test_read_progress_counts_completed_modules(): void
    {
        $module2 = WordModule::create(['level' => 2, 'title' => 'Module 2']);
        Word::create(['word_module_id' => $module2->id, 'word' => 'new', 'position' => 1]);

        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 5, wordsProcessed: 5, accuracy: 90
        );

        $this->progressService->updateWordProgress(
            $this->student->student, $module2,
            wordsSmashed: 1, wordsProcessed: 1, accuracy: 60
        );

        $this->student->refresh();
        $this->assertEquals(2, $this->student->student->read_progress);
    }

    public function test_read_progress_counts_single_completed_module(): void
    {
        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 5, wordsProcessed: 5, accuracy: 90
        );

        $this->student->refresh();
        $this->assertEquals(1, $this->student->student->read_progress);
    }

    public function test_null_student_does_nothing(): void
    {
        $this->progressService->updateWordProgress(null, $this->wordModule, 5, 5, 90);

        $this->assertEquals(0, StudentWordProgress::count());
    }

    public function test_paragraph_progress_level_up(): void
    {
        $this->progressService->updateParagraphProgress(
            $this->student->student, $this->paraModule,
            wordsSmashed: 4, wordsProcessed: 4, accuracy: 85
        );

        $this->student->refresh();
        $this->assertEquals(2, $this->student->student->speak_level);
    }

    public function test_tutorial_progress_does_not_pollute_accuracy(): void
    {
        $tutorial = WordModule::create(['level' => 0, 'title' => 'Tutorial', 'is_tutorial' => true]);
        foreach (['a', 'I', 'see', 'my', 'the'] as $i => $word) {
            Word::create(['word_module_id' => $tutorial->id, 'word' => $word, 'position' => $i + 1]);
        }

        $this->progressService->updateWordProgress($this->student->student, $tutorial, 0, 5, 0, isTutorial: true);

        $this->progressService->updateWordProgress($this->student->student, $this->wordModule, 5, 5, 100);

        $this->student->refresh();
        $this->assertEquals(100, $this->student->student->wordBlastAcc);
    }

    public function test_tutorial_paragraph_progress_does_not_pollute_accuracy(): void
    {
        $tutorial = ParagraphModule::create(['level' => 0, 'title' => 'Tutorial Para', 'is_tutorial' => true]);
        foreach (['I', 'see', 'a', 'cat'] as $i => $w) {
            ParagraphWord::create(['paragraph_module_id' => $tutorial->id, 'word' => $w, 'position' => $i + 1]);
        }

        $this->progressService->updateParagraphProgress($this->student->student, $tutorial, 0, 4, 0, isTutorial: true);

        $this->progressService->updateParagraphProgress($this->student->student, $this->paraModule, 4, 4, 100);

        $this->student->refresh();
        $this->assertEquals(100, $this->student->student->storyQuestAcc);
    }

    public function test_status_recalculated_on_new_best(): void
    {
        $module2 = WordModule::create(['level' => 2, 'title' => 'Module 2']);
        Word::create(['word_module_id' => $module2->id, 'word' => 'new', 'position' => 1]);

        $this->progressService->updateWordProgress(
            $this->student->student, $module2,
            wordsSmashed: 1, wordsProcessed: 1, accuracy: 85
        );

        $this->student->refresh();
        $this->assertEquals('in_progress', $this->student->student->status);
    }

    public function test_status_in_progress_when_only_word_progress_and_story_zero(): void
    {
        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 5, wordsProcessed: 5, accuracy: 87.5
        );

        $this->student->refresh();
        $this->assertSame(88.0, (float) $this->student->student->wordBlastAcc);
        $this->assertSame(0.0, (float) $this->student->student->storyQuestAcc);
        $this->assertSame('in_progress', $this->student->student->status);
        $this->assertNotEquals('atRisk', $this->student->student->status);
    }

    public function test_accuracy_zero_is_cast_to_float_and_treated_as_no_skill(): void
    {
        $this->student->student->update(['wordBlastAcc' => 87.5, 'storyQuestAcc' => 0]);

        $fresh = $this->student->student->fresh();
        $this->assertSame(0.0, $fresh->storyQuestAcc);
        $this->assertFalse((bool) $fresh->storyQuestAcc);

        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 5, wordsProcessed: 5, accuracy: 90
        );

        $this->student->refresh();
        $this->assertSame('in_progress', $this->student->student->status);
    }

    public function test_status_does_not_regress_to_in_progress_on_worse_replay(): void
    {
        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 5, wordsProcessed: 5, accuracy: 100
        );

        // replay that is worse (fewer words processed) must not downgrade status
        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 3, wordsProcessed: 3, accuracy: 60
        );

        $record = StudentWordProgress::where('user_id', $this->student->id)
            ->where('word_module_id', $this->wordModule->id)
            ->first();

        $this->assertSame('completed', $record->status);
    }

    public function test_better_replay_cannot_downgrade_accuracy(): void
    {
        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 5, wordsProcessed: 5, accuracy: 100
        );

        // worse accuracy on replay must not replace the stored best accuracy
        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 3, wordsProcessed: 5, accuracy: 60
        );

        $record = StudentWordProgress::where('user_id', $this->student->id)
            ->where('word_module_id', $this->wordModule->id)
            ->first();

        $this->assertSame(100.0, (float) $record->accuracy);
        $this->student->refresh();
        $this->assertEquals(100, $this->student->student->wordBlastAcc);
    }

    public function test_empty_module_stays_in_progress_without_leveling_up(): void
    {
        $empty = WordModule::create(['level' => 2, 'title' => 'Empty Module']);

        $this->progressService->updateWordProgress(
            $this->student->student, $empty,
            wordsSmashed: 0, wordsProcessed: 0, accuracy: 0
        );

        $record = StudentWordProgress::where('user_id', $this->student->id)
            ->where('word_module_id', $empty->id)
            ->first();

        $this->assertSame('in_progress', $record->status);

        $this->student->refresh();
        $this->assertEquals(1, $this->student->student->read_level);
        $this->assertEquals(0, $this->student->student->read_progress);
        $this->assertEquals(0, $this->student->student->points);
        $this->assertSame(0.0, (float) $this->student->student->wordBlastAcc);
        $this->assertSame('notStarted', $this->student->student->status);
    }

    public function test_all_words_mispronounced_still_marks_completed(): void
    {
        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 0, wordsProcessed: 5, accuracy: 0
        );

        $record = StudentWordProgress::where('user_id', $this->student->id)
            ->where('word_module_id', $this->wordModule->id)
            ->first();

        $this->assertSame('completed', $record->status);

        $this->student->refresh();
        $this->assertEquals(2, $this->student->student->read_level);
        $this->assertEquals(0, $this->student->student->points);
    }

    public function test_processed_exceeding_total_words_marks_completed(): void
    {
        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 3, wordsProcessed: 999, accuracy: 60
        );

        $record = StudentWordProgress::where('user_id', $this->student->id)
            ->where('word_module_id', $this->wordModule->id)
            ->first();

        $this->assertSame('completed', $record->status);

        $this->student->refresh();
        $this->assertEquals(2, $this->student->student->read_level);
        $this->assertEquals(3, $this->student->student->points);
    }

    public function test_smashed_greater_than_processed_is_clamped_to_processed(): void
    {
        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 5, wordsProcessed: 3, accuracy: 100
        );

        $record = StudentWordProgress::where('user_id', $this->student->id)
            ->where('word_module_id', $this->wordModule->id)
            ->first();

        $this->assertSame('in_progress', $record->status);
        $this->assertEquals(3, $record->words_smashed);

        $this->student->refresh();
        $this->assertEquals(3, $this->student->student->points);
        $this->assertEquals(1, $this->student->student->read_level);
    }

    public function test_zero_processed_marks_in_progress_without_points(): void
    {
        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 0, wordsProcessed: 0, accuracy: 0
        );

        $record = StudentWordProgress::where('user_id', $this->student->id)
            ->where('word_module_id', $this->wordModule->id)
            ->first();

        $this->assertSame('in_progress', $record->status);

        $this->student->refresh();
        $this->assertEquals(1, $this->student->student->read_level);
        $this->assertEquals(0, $this->student->student->points);
    }

    public function test_accuracy_above_100_is_clamped_to_100(): void
    {
        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 5, wordsProcessed: 5, accuracy: 150
        );

        $this->student->refresh();
        $this->assertSame(100.0, (float) $this->student->student->wordBlastAcc);
    }

    public function test_negative_accuracy_is_clamped_to_zero(): void
    {
        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 5, wordsProcessed: 5, accuracy: -10
        );

        $this->student->refresh();
        $this->assertSame(0.0, (float) $this->student->student->wordBlastAcc);
    }

    public function test_negative_smashed_is_clamped_to_zero(): void
    {
        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: -1, wordsProcessed: 5, accuracy: 50
        );

        $record = StudentWordProgress::where('user_id', $this->student->id)
            ->where('word_module_id', $this->wordModule->id)
            ->first();

        $this->assertSame('completed', $record->status);
        $this->assertSame(0, $record->words_smashed);

        $this->student->refresh();
        $this->assertEquals(2, $this->student->student->read_level);
        $this->assertSame(0, $this->student->student->points);
    }

    public function test_new_best_overwrites_accuracy_even_when_worse(): void
    {
        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 3, wordsProcessed: 3, accuracy: 90
        );

        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 5, wordsProcessed: 5, accuracy: 30
        );

        $this->student->refresh();
        $this->assertSame(30.0, (float) $this->student->student->wordBlastAcc);
    }

    public function test_completion_at_lower_level_does_not_regress_or_relevel(): void
    {
        $this->student->student->update(['read_level' => 3]);

        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 5, wordsProcessed: 5, accuracy: 90
        );

        $this->student->refresh();
        $this->assertEquals(3, $this->student->student->read_level);
    }

    public function test_level_up_only_to_next_level(): void
    {
        $module2 = WordModule::create(['level' => 2, 'title' => 'Module 2']);
        foreach (['one', 'two', 'three'] as $i => $word) {
            Word::create(['word_module_id' => $module2->id, 'word' => $word, 'position' => $i + 1]);
        }

        $this->student->student->update(['read_level' => 2]);

        $this->progressService->updateWordProgress(
            $this->student->student, $module2,
            wordsSmashed: 3, wordsProcessed: 3, accuracy: 80
        );

        $this->student->refresh();
        $this->assertEquals(3, $this->student->student->read_level);
    }

    public function test_points_equal_sum_of_words_smashed_after_completion(): void
    {
        $module2 = WordModule::create(['level' => 2, 'title' => 'Module 2']);
        foreach (['one', 'two', 'three'] as $i => $word) {
            Word::create(['word_module_id' => $module2->id, 'word' => $word, 'position' => $i + 1]);
        }

        $this->progressService->updateWordProgress(
            $this->student->student, $module2,
            wordsSmashed: 1, wordsProcessed: 1, accuracy: 60
        );

        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 5, wordsProcessed: 5, accuracy: 90
        );

        $this->student->refresh();
        $sum = StudentWordProgress::where('user_id', $this->student->id)->sum('words_smashed');
        $this->assertEquals($sum, $this->student->student->points);
        $this->assertEquals(6, $this->student->student->points);
    }

    public function test_tutorial_replay_does_not_change_level_or_points(): void
    {
        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 0, wordsProcessed: 5, accuracy: 0, isTutorial: true
        );

        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 0, wordsProcessed: 5, accuracy: 0, isTutorial: true
        );

        $this->student->refresh();
        $this->assertEquals(1, $this->student->student->read_level);
        $this->assertEquals(0, $this->student->student->points);
        $this->assertSame(0.0, (float) $this->student->student->wordBlastAcc);
    }

    // Post-onboarding tutorial replay: finishRound drops the isTutorial flag,
    // so the service sees a normal play on the tutorial module. Progress rows
    // may record it, but students.points must never move.
    public function test_unflagged_tutorial_replay_records_progress_without_awarding_points(): void
    {
        $tutorial = WordModule::create(['level' => 0, 'title' => 'Tutorial', 'is_tutorial' => true]);
        foreach (['a', 'i', 'see', 'my', 'the'] as $i => $word) {
            Word::create(['word_module_id' => $tutorial->id, 'word' => strtoupper($word), 'position' => $i + 1]);
        }

        $this->progressService->updateWordProgress(
            $this->student->student, $tutorial,
            wordsSmashed: 5, wordsProcessed: 5, accuracy: 100
        );

        $record = StudentWordProgress::where('user_id', $this->student->id)
            ->where('word_module_id', $tutorial->id)
            ->first();

        $this->assertSame(5, $record->words_smashed);

        $this->student->refresh();
        $this->assertEquals(0, $this->student->student->points);
        // No non-tutorial row exists to average — stored accuracy stays put.
        $this->assertSame(0.0, (float) $this->student->student->wordBlastAcc);
    }

    public function test_points_recompute_excludes_tutorial_rows(): void
    {
        $tutorial = WordModule::create(['level' => 0, 'title' => 'Tutorial', 'is_tutorial' => true]);
        foreach (['a', 'i', 'see'] as $i => $word) {
            Word::create(['word_module_id' => $tutorial->id, 'word' => strtoupper($word), 'position' => $i + 1]);
        }

        // Legacy/replay row on the tutorial carrying a real smash count.
        StudentWordProgress::create([
            'user_id' => $this->student->id,
            'word_module_id' => $tutorial->id,
            'status' => 'completed',
            'words_smashed' => 7,
            'accuracy' => 70,
        ]);

        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 4, wordsProcessed: 4, accuracy: 80
        );

        $this->student->refresh();
        // Completion recompute must match the dashboard formula: 4, not 11.
        $this->assertEquals(4, $this->student->student->points);
    }

    public function test_accuracy_rounded_to_two_decimals(): void
    {
        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 5, wordsProcessed: 5, accuracy: 100 / 3
        );

        $this->student->refresh();
        $this->assertSame(33.0, (float) $this->student->student->wordBlastAcc);
    }

    public function test_status_on_track_when_both_skills_high(): void
    {
        $this->student->student->update(['storyQuestAcc' => 90]);

        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 5, wordsProcessed: 5, accuracy: 85
        );

        $this->student->refresh();
        $this->assertSame('onTrack', $this->student->student->status);
    }

    public function test_status_support_when_both_skills_mid(): void
    {
        $this->student->student->update(['storyQuestAcc' => 70]);

        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 5, wordsProcessed: 5, accuracy: 70
        );

        $this->student->refresh();
        $this->assertSame('support', $this->student->student->status);
    }

    public function test_status_at_risk_when_both_skills_low(): void
    {
        $this->student->student->update(['storyQuestAcc' => 50]);

        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 5, wordsProcessed: 5, accuracy: 50
        );

        $this->student->refresh();
        $this->assertSame('atRisk', $this->student->student->status);
    }

    public function test_paragraph_empty_module_stays_in_progress_without_leveling_up(): void
    {
        $empty = ParagraphModule::create(['level' => 2, 'title' => 'Empty Para']);

        $this->progressService->updateParagraphProgress(
            $this->student->student, $empty,
            wordsSmashed: 0, wordsProcessed: 0, accuracy: 0
        );

        $record = StudentParagraphProgress::where('user_id', $this->student->id)
            ->where('paragraph_module_id', $empty->id)
            ->first();

        $this->assertSame('in_progress', $record->status);

        $this->student->refresh();
        $this->assertEquals(1, $this->student->student->speak_level);
        $this->assertEquals(0, $this->student->student->speak_progress);
    }

    public function test_paragraph_all_words_mispronounced_still_marks_completed(): void
    {
        $this->progressService->updateParagraphProgress(
            $this->student->student, $this->paraModule,
            wordsSmashed: 0, wordsProcessed: 4, accuracy: 0
        );

        $record = StudentParagraphProgress::where('user_id', $this->student->id)
            ->where('paragraph_module_id', $this->paraModule->id)
            ->first();

        $this->assertSame('completed', $record->status);

        $this->student->refresh();
        $this->assertEquals(2, $this->student->student->speak_level);
        $this->assertEquals(0, $this->student->student->points);
    }

    public function test_paragraph_zero_processed_marks_in_progress_without_points(): void
    {
        $this->progressService->updateParagraphProgress(
            $this->student->student, $this->paraModule,
            wordsSmashed: 0, wordsProcessed: 0, accuracy: 0
        );

        $record = StudentParagraphProgress::where('user_id', $this->student->id)
            ->where('paragraph_module_id', $this->paraModule->id)
            ->first();

        $this->assertSame('in_progress', $record->status);

        $this->student->refresh();
        $this->assertEquals(1, $this->student->student->speak_level);
        $this->assertEquals(0, $this->student->student->points);
    }

    public function test_paragraph_worse_replay_does_not_regress_level(): void
    {
        $this->progressService->updateParagraphProgress(
            $this->student->student, $this->paraModule,
            wordsSmashed: 4, wordsProcessed: 4, accuracy: 90
        );

        $this->progressService->updateParagraphProgress(
            $this->student->student, $this->paraModule,
            wordsSmashed: 1, wordsProcessed: 1, accuracy: 50
        );

        $this->student->refresh();
        $this->assertEquals(2, $this->student->student->speak_level);
        $this->assertSame(90.0, (float) $this->student->student->storyQuestAcc);
    }

    public function test_word_and_paragraph_points_share_one_pot(): void
    {
        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 5, wordsProcessed: 5, accuracy: 90
        );

        $this->progressService->updateParagraphProgress(
            $this->student->student, $this->paraModule,
            wordsSmashed: 2, wordsProcessed: 4, accuracy: 70
        );

        $this->student->refresh();
        $this->assertEquals(7, $this->student->student->points);
    }
}
