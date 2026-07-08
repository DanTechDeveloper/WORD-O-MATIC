<?php

namespace Tests\Feature;

use App\Models\ParagraphModule;
use App\Models\ParagraphWord;
use App\Models\StudentParagraphMastery;
use App\Models\StudentParagraphProgress;
use App\Models\StudentProfile;
use App\Models\StudentWordMastery;
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

    public function test_level_up_on_completion(): void
    {
        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 5, wordsCount: 5, accuracy: 90
        );

        $this->student->refresh();
        $this->assertEquals(2, $this->student->student->read_level);
    }

    public function test_points_updated_on_new_best(): void
    {
        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 3, wordsCount: 3, accuracy: 70
        );

        $this->student->refresh();
        $this->assertEquals(3, $this->student->student->points);
    }

    public function test_points_increment_on_improvement(): void
    {
        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 3, wordsCount: 3, accuracy: 70
        );

        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 5, wordsCount: 5, accuracy: 90
        );

        $this->student->refresh();
        $this->assertEquals(5, $this->student->student->points);
    }

    public function test_points_not_updated_on_worse_score(): void
    {
        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 5, wordsCount: 5, accuracy: 90
        );

        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 2, wordsCount: 2, accuracy: 50
        );

        $this->student->refresh();
        $this->assertEquals(5, $this->student->student->points);
    }

    public function test_mastery_auto_updated_to_mastered_on_completion(): void
    {
        $wordId = $this->wordModule->words()->first()->id;
        StudentWordMastery::create([
            'user_id' => $this->student->id,
            'word_id' => $wordId,
            'status' => 'training',
        ]);

        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 5, wordsCount: 5, accuracy: 90
        );

        $this->assertEquals(
            'mastered',
            StudentWordMastery::where('user_id', $this->student->id)->where('word_id', $wordId)->first()->status
        );
    }

    public function test_accuracy_averaged_across_modules(): void
    {
        $module2 = WordModule::create(['level' => 2, 'title' => 'Module 2']);
        Word::create(['word_module_id' => $module2->id, 'word' => 'new', 'position' => 1]);

        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 5, wordsCount: 5, accuracy: 80
        );

        $this->progressService->updateWordProgress(
            $this->student->student, $module2,
            wordsSmashed: 1, wordsCount: 1, accuracy: 60
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
            wordsSmashed: 5, wordsCount: 5, accuracy: 90
        );

        $this->progressService->updateWordProgress(
            $this->student->student, $module2,
            wordsSmashed: 1, wordsCount: 1, accuracy: 60
        );

        $this->student->refresh();
        $this->assertEquals(2, $this->student->student->read_progress);
    }

    public function test_read_progress_counts_single_completed_module(): void
    {
        $this->progressService->updateWordProgress(
            $this->student->student, $this->wordModule,
            wordsSmashed: 5, wordsCount: 5, accuracy: 90
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
            wordsSmashed: 4, wordsCount: 4, accuracy: 85
        );

        $this->student->refresh();
        $this->assertEquals(2, $this->student->student->speak_level);
    }

    public function test_paragraph_mastery_updated_on_completion(): void
    {
        $wordId = $this->paraModule->words()->first()->id;
        StudentParagraphMastery::create([
            'user_id' => $this->student->id,
            'paragraph_word_id' => $wordId,
            'status' => 'training',
        ]);

        $this->progressService->updateParagraphProgress(
            $this->student->student, $this->paraModule,
            wordsSmashed: 4, wordsCount: 4, accuracy: 85
        );

        $this->assertEquals(
            'mastered',
            StudentParagraphMastery::where('user_id', $this->student->id)
                ->where('paragraph_word_id', $wordId)->first()->status
        );
    }

    public function test_status_recalculated_on_new_best(): void
    {
        $module2 = WordModule::create(['level' => 2, 'title' => 'Module 2']);
        Word::create(['word_module_id' => $module2->id, 'word' => 'new', 'position' => 1]);

        $this->progressService->updateWordProgress(
            $this->student->student, $module2,
            wordsSmashed: 1, wordsCount: 1, accuracy: 85
        );

        $this->student->refresh();
        $this->assertEquals('in_progress', $this->student->student->status);
    }
}
