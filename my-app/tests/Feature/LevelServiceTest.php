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

    public function test_replaying_completed_module_keeps_status_completed(): void
    {
        $this->createWordModules(1);
        $module1 = WordModule::where('level', 1)->first();

        StudentWordProgress::create([
            'user_id' => $this->student->id,
            'word_module_id' => $module1->id,
            'words_smashed' => 5,
            'status' => 'completed',
        ]);

        $statuses = $this->levelService->getWordModuleStatuses($this->student->id);

        $this->assertEquals('completed', $statuses[0]['status']);
    }

    public function test_only_one_current_module_at_a_time(): void
    {
        $this->createWordModules(3);

        // completing level 1 advances the current slot to level 2
        StudentWordProgress::create([
            'user_id' => $this->student->id,
            'word_module_id' => WordModule::where('level', 1)->first()->id,
            'words_smashed' => 5,
            'status' => 'completed',
        ]);

        $statuses = $this->levelService->getWordModuleStatuses($this->student->id);
        $this->assertEquals('completed', $statuses[0]['status']);
        $this->assertEquals('current', $statuses[1]['status']);
        $this->assertEquals('locked', $statuses[2]['status']);
    }

    public function test_multiple_completed_with_one_in_progress(): void
    {
        $this->createWordModules(4);

        StudentWordProgress::create([
            'user_id' => $this->student->id,
            'word_module_id' => WordModule::where('level', 1)->first()->id,
            'words_smashed' => 5, 'status' => 'completed',
        ]);
        StudentWordProgress::create([
            'user_id' => $this->student->id,
            'word_module_id' => WordModule::where('level', 2)->first()->id,
            'words_smashed' => 5, 'status' => 'completed',
        ]);
        StudentWordProgress::create([
            'user_id' => $this->student->id,
            'word_module_id' => WordModule::where('level', 3)->first()->id,
            'words_smashed' => 2, 'status' => 'in_progress',
        ]);

        $statuses = $this->levelService->getWordModuleStatuses($this->student->id);
        $this->assertEquals('completed', $statuses[0]['status']);
        $this->assertEquals('completed', $statuses[1]['status']);
        $this->assertEquals('in_progress', $statuses[2]['status']);
        $this->assertEquals('locked', $statuses[3]['status']);
    }

    public function test_is_module_accessible_word_current_vs_locked(): void
    {
        $this->createWordModules(3);
        $m1 = WordModule::where('level', 1)->first();
        $m2 = WordModule::where('level', 2)->first();

        $this->assertTrue($this->levelService->isModuleAccessible($this->student->id, $m1->id, 'word'));
        $this->assertFalse($this->levelService->isModuleAccessible($this->student->id, $m2->id, 'word'));
    }

    public function test_is_module_accessible_completed_and_in_progress(): void
    {
        $this->createWordModules(3);
        $m1 = WordModule::where('level', 1)->first();
        $m2 = WordModule::where('level', 2)->first();
        $m3 = WordModule::where('level', 3)->first();

        StudentWordProgress::create([
            'user_id' => $this->student->id, 'word_module_id' => $m1->id, 'words_smashed' => 5, 'status' => 'completed',
        ]);
        StudentWordProgress::create([
            'user_id' => $this->student->id, 'word_module_id' => $m2->id, 'words_smashed' => 2, 'status' => 'in_progress',
        ]);

        $this->assertTrue($this->levelService->isModuleAccessible($this->student->id, $m1->id, 'word'));
        $this->assertTrue($this->levelService->isModuleAccessible($this->student->id, $m2->id, 'word'));
        $this->assertFalse($this->levelService->isModuleAccessible($this->student->id, $m3->id, 'word'));
    }

    public function test_is_module_accessible_paragraph_current_vs_locked(): void
    {
        $this->createParagraphModules(3);
        $p1 = ParagraphModule::where('level', 1)->first();
        $p2 = ParagraphModule::where('level', 2)->first();

        $this->assertTrue($this->levelService->isModuleAccessible($this->student->id, $p1->id, 'paragraph'));
        $this->assertFalse($this->levelService->isModuleAccessible($this->student->id, $p2->id, 'paragraph'));
    }

    // ponytail: regression lock for BF16 — tutorial modules are outside the level
    // chain (absent from the status map) but must stay playable during onboarding.
    public function test_is_module_accessible_tutorial_always_true(): void
    {
        $tutorial = WordModule::create(['level' => 0, 'title' => 'Tutorial', 'is_tutorial' => true]);

        $this->assertTrue($this->levelService->isModuleAccessible($this->student->id, $tutorial->id, 'word'));
    }

    // ponytail: regression lock for BF16 — access is deny-by-default: an unknown
    // id (nonexistent, wrong type) must resolve to false, not null !== 'locked'.
    public function test_is_module_accessible_nonexistent_id_returns_false(): void
    {
        $this->assertFalse($this->levelService->isModuleAccessible($this->student->id, 999999, 'word'));
    }

    public function test_statuses_ordered_by_level_not_insertion(): void
    {
        foreach ([3, 1, 2] as $level) {
            $module = WordModule::create(['level' => $level, 'title' => "Module $level"]);
            Word::create(['word_module_id' => $module->id, 'word' => "w{$level}", 'position' => 1]);
        }

        $statuses = $this->levelService->getWordModuleStatuses($this->student->id);

        $this->assertSame([1, 2, 3], collect($statuses)->pluck('level')->all());
    }

    public function test_word_and_paragraph_chains_independent(): void
    {
        $this->createWordModules(2);
        $this->createParagraphModules(2);

        StudentWordProgress::create([
            'user_id' => $this->student->id,
            'word_module_id' => WordModule::where('level', 1)->first()->id,
            'words_smashed' => 5, 'status' => 'completed',
        ]);

        $word = $this->levelService->getWordModuleStatuses($this->student->id);
        $speak = $this->levelService->getSpeakModuleStatuses($this->student->id);

        $this->assertEquals(['completed', 'current'], collect($word)->pluck('status')->all());
        $this->assertEquals(['current', 'locked'], collect($speak)->pluck('status')->all());
    }

    public function test_empty_curriculum_returns_empty_collection(): void
    {
        $this->assertTrue($this->levelService->getWordModuleStatuses($this->student->id)->isEmpty());
        $this->assertTrue($this->levelService->getSpeakModuleStatuses($this->student->id)->isEmpty());
    }

    public function test_out_of_order_progress(): void
    {
        $this->createWordModules(3);
        StudentWordProgress::create([
            'user_id' => $this->student->id,
            'word_module_id' => WordModule::where('level', 3)->first()->id,
            'words_smashed' => 2, 'status' => 'in_progress',
        ]);

        $statuses = $this->levelService->getWordModuleStatuses($this->student->id);

        $this->assertEquals('current', $statuses[0]['status']);
        $this->assertEquals('locked', $statuses[1]['status']);
        $this->assertEquals('in_progress', $statuses[2]['status']);
    }

    public function test_zero_word_module_still_current_and_total_points_zero(): void
    {
        WordModule::create(['level' => 1, 'title' => 'Empty Module']);

        $statuses = $this->levelService->getWordModuleStatuses($this->student->id);

        $this->assertEquals('current', $statuses[0]['status']);
        $this->assertSame(0, $statuses[0]['total_points']);
    }
}
