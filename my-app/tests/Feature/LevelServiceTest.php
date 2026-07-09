<?php

namespace Tests\Feature;

use App\Models\ParagraphModule;
use App\Models\ParagraphWord;
use App\Models\StudentParagraphProgress;
use App\Models\StudentWordProgress;
use App\Models\User;
use App\Models\Word;
use App\Models\WordModule;
use App\Services\LevelService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LevelServiceTest extends TestCase
{
    use RefreshDatabase;

    private LevelService $levelService;
    private User $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->levelService = app(LevelService::class);
        $this->student = User::factory()->create(['role' => 'student']);
    }

    private function createWordModules(int $count): void
    {
        foreach (range(1, $count) as $level) {
            $module = WordModule::create(['level' => $level, 'title' => "Module $level"]);
            foreach (range(1, 5) as $i) {
                Word::create(['word_module_id' => $module->id, 'word' => "word{$level}_{$i}", 'position' => $i]);
            }
        }
    }

    private function createParagraphModules(int $count): void
    {
        foreach (range(1, $count) as $level) {
            $module = ParagraphModule::create(['level' => $level, 'title' => "Module $level", 'content' => 'test content']);
            foreach (range(1, 5) as $i) {
                ParagraphWord::create(['paragraph_module_id' => $module->id, 'word' => "word{$level}_{$i}", 'position' => $i]);
            }
        }
    }

    public function test_first_module_is_current_when_no_progress(): void
    {
        $this->createWordModules(3);
        $statuses = $this->levelService->getWordModuleStatuses($this->student->id);

        $this->assertEquals('current', $statuses[0]['status']);
        $this->assertEquals('locked', $statuses[1]['status']);
        $this->assertEquals('locked', $statuses[2]['status']);
    }

    public function test_partial_progress_shows_in_progress_and_locks_next(): void
    {
        $this->createWordModules(3);
        $module1 = WordModule::where('level', 1)->first();

        StudentWordProgress::create([
            'user_id' => $this->student->id,
            'word_module_id' => $module1->id,
            'words_smashed' => 3,
            'status' => 'in_progress',
        ]);

        $statuses = $this->levelService->getWordModuleStatuses($this->student->id);

        $this->assertEquals('in_progress', $statuses[0]['status']);
        $this->assertEquals('locked', $statuses[1]['status']);
        $this->assertEquals('locked', $statuses[2]['status']);
    }

    public function test_completed_module_unlocks_next(): void
    {
        $this->createWordModules(3);
        $module1 = WordModule::where('level', 1)->first();

        StudentWordProgress::create([
            'user_id' => $this->student->id,
            'word_module_id' => $module1->id,
            'words_smashed' => 5,
            'status' => 'completed',
        ]);

        $statuses = $this->levelService->getWordModuleStatuses($this->student->id);

        $this->assertEquals('completed', $statuses[0]['status']);
        $this->assertEquals('current', $statuses[1]['status']);
        $this->assertEquals('locked', $statuses[2]['status']);
    }

    public function test_multiple_completed_modules_advance_properly(): void
    {
        $this->createWordModules(3);

        foreach ([1, 2] as $level) {
            $module = WordModule::where('level', $level)->first();
            StudentWordProgress::create([
                'user_id' => $this->student->id,
                'word_module_id' => $module->id,
                'words_smashed' => 5,
                'status' => 'completed',
            ]);
        }

        $statuses = $this->levelService->getWordModuleStatuses($this->student->id);

        $this->assertEquals('completed', $statuses[0]['status']);
        $this->assertEquals('completed', $statuses[1]['status']);
        $this->assertEquals('current', $statuses[2]['status']);
    }

    public function test_speak_module_in_progress_locks_next(): void
    {
        $this->createParagraphModules(3);

        $module1 = ParagraphModule::where('level', 1)->first();
        StudentParagraphProgress::create([
            'user_id' => $this->student->id,
            'paragraph_module_id' => $module1->id,
            'words_smashed' => 3,
            'status' => 'in_progress',
        ]);

        $statuses = $this->levelService->getSpeakModuleStatuses($this->student->id);

        $this->assertEquals('in_progress', $statuses[0]['status']);
        $this->assertEquals('locked', $statuses[1]['status']);
        $this->assertEquals('locked', $statuses[2]['status']);
    }

    public function test_returns_words_smashed_and_total_points(): void
    {
        $this->createWordModules(1);
        $module1 = WordModule::where('level', 1)->first();

        StudentWordProgress::create([
            'user_id' => $this->student->id,
            'word_module_id' => $module1->id,
            'words_smashed' => 4,
            'status' => 'in_progress',
        ]);

        $statuses = $this->levelService->getWordModuleStatuses($this->student->id);

        $this->assertEquals(4, $statuses[0]['words_smashed']);
        $this->assertEquals(5, $statuses[0]['total_points']);
    }
}
