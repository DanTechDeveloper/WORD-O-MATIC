<?php

namespace Tests\Feature;

use App\Models\ParagraphModule;
use App\Models\Setting;
use App\Models\StudentWordMastery;
use App\Models\User;
use App\Models\WordModule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModuleCrudTest extends TestCase
{
    use RefreshDatabase;

    private $teacher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->teacher = User::factory()->create(['role' => 'teacher']);
    }

    private function tenUniqueWords(): array
    {
        return [
            ['word' => 'alpha'], ['word' => 'bravo'], ['word' => 'charlie'],
            ['word' => 'delta'], ['word' => 'echo'], ['word' => 'foxtrot'],
            ['word' => 'golf'], ['word' => 'hotel'], ['word' => 'india'],
            ['word' => 'juliet'],
        ];
    }

    private function seedWordModule(int $level, string $title, array $words): void
    {
        WordModule::saveWithWords([
            'level' => $level,
            'title' => $title,
            'words' => $words,
        ]);
    }

    public function test_save_word_module_creates_module_and_words(): void
    {
        WordModule::saveWithWords([
            'level' => 1,
            'title' => 'Module Alpha',
            'words' => [
                ['word' => 'apple'],
                ['word' => 'banana'],
            ],
        ]);

        $module = WordModule::where('level', 1)->first();
        $this->assertNotNull($module);
        $this->assertEquals('Module Alpha', $module->title);
        $this->assertCount(2, $module->words);
        $this->assertEquals('APPLE', $module->words[0]->word);
        $this->assertEquals('BANANA', $module->words[1]->word);
    }

    public function test_save_word_module_overwrites_existing_module(): void
    {
        WordModule::saveWithWords([
            'level' => 1,
            'title' => 'Original',
            'words' => [['word' => 'old']],
        ]);

        WordModule::saveWithWords([
            'level' => 1,
            'title' => 'Updated',
            'words' => [['word' => 'new']],
        ]);

        $module = WordModule::where('level', 1)->first();
        $this->assertEquals('Updated', $module->title);
        $this->assertCount(1, $module->words);
        $this->assertEquals('NEW', $module->words[0]->word);
    }

    public function test_save_paragraph_module_creates_module_and_words(): void
    {
        ParagraphModule::saveWithContent([
            'level' => 1,
            'title' => 'Story 1',
            'content' => 'The quick brown fox',
        ]);

        $module = ParagraphModule::where('level', 1)->first();
        $this->assertNotNull($module);
        $this->assertEquals('Story 1', $module->title);
        $this->assertEquals('The quick brown fox', $module->content);
        $this->assertCount(4, $module->words);
        $this->assertEquals('The', $module->words[0]->word);
    }

    public function test_save_paragraph_module_handles_empty_content(): void
    {
        ParagraphModule::saveWithContent([
            'level' => 2,
            'title' => 'Empty',
            'content' => '',
        ]);

        $module = ParagraphModule::where('level', 2)->first();
        $this->assertNotNull($module);
        $this->assertCount(0, $module->words);
    }

    public function test_teacher_can_view_word_modules_page(): void
    {
        WordModule::saveWithWords([
            'level' => 1,
            'title' => 'Test Module',
            'words' => [['word' => 'test']],
        ]);

        $response = $this->actingAs($this->teacher)->get('/teacher/wordModules');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Teacher/Word')
            ->has('modules')
        );
    }

    public function test_teacher_can_update_word_module_via_http(): void
    {
        WordModule::saveWithWords([
            'level' => 1,
            'title' => 'Old Title',
            'words' => [['word' => 'old']],
        ]);

        $response = $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'title' => 'New Title',
            'words' => $this->tenUniqueWords(),
        ]);

        $response->assertRedirect();
        $module = WordModule::where('level', 1)->first();
        $this->assertEquals('New Title', $module->title);
        $this->assertCount(10, $module->words);
        $this->assertEquals('ALPHA', $module->words[0]->word);
    }

    public function test_update_word_module_rejects_blank_slots(): void
    {
        $words = $this->tenUniqueWords();
        $words[3] = ['word' => '   '];

        $response = $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'title' => 'Blanks',
            'words' => $words,
        ]);

        $response->assertSessionHasErrors('words.3.word');
        $this->assertEquals(0, WordModule::count());
    }

    public function test_update_word_module_rejects_within_module_duplicate(): void
    {
        $words = $this->tenUniqueWords();
        $words[0] = ['word' => 'apple'];
        $words[1] = ['word' => 'apple'];

        $response = $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'title' => 'Dup',
            'words' => $words,
        ]);

        $response->assertSessionHasErrors(['words.0.word' => '"APPLE" is duplicated in this module.']);
        $this->assertEquals(0, WordModule::count());
    }

    public function test_update_word_module_rejects_cross_module_duplicate_case_insensitive(): void
    {
        WordModule::saveWithWords([
            'level' => 1,
            'title' => 'Animals',
            'words' => [
                ['word' => 'cat'], ['word' => 'dog'], ['word' => 'bird'],
                ['word' => 'fish'], ['word' => 'tree'], ['word' => 'sun'],
                ['word' => 'moon'], ['word' => 'star'], ['word' => 'lake'],
                ['word' => 'hill'],
            ],
        ]);

        $words = $this->tenUniqueWords();
        $words[0] = ['word' => 'cat'];

        $response = $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 2,
            'title' => 'Colors',
            'words' => $words,
        ]);

        $response->assertSessionHasErrors(['words.0.word' => '"CAT" is already used in Level 1.']);
        $this->assertFalse(WordModule::where('level', 2)->exists());
    }

    public function test_update_word_module_rejects_word_used_in_tutorial(): void
    {
        $tutorial = WordModule::create(['level' => 0, 'title' => 'Tutorial', 'is_tutorial' => true]);
        $tutorial->words()->create(['word' => 'the', 'position' => 1]);

        $words = $this->tenUniqueWords();
        $words[0] = ['word' => 'THE'];

        $response = $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'title' => 'Attempt',
            'words' => $words,
        ]);

        $response->assertSessionHasErrors(['words.0.word' => '"THE" is already used in Level 0.']);
        $this->assertFalse(WordModule::where('level', 1)->exists());
    }

    public function test_word_modules_payload_exposes_has_progress(): void
    {
        $module = WordModule::create(['level' => 1, 'title' => 'Prog']);
        $word = $module->words()->create(['word' => 'apple', 'position' => 1]);

        $this->actingAs($this->teacher)->get('/teacher/wordModules')
            ->assertInertia(fn ($page) => $page
                ->component('Teacher/Word')
                ->has('modules')
                ->where('modules.0.has_progress', false)
            );

        $student = User::factory()->create(['role' => 'student']);
        StudentWordMastery::create([
            'user_id' => $student->id,
            'word_id' => $word->id,
            'status' => 'training',
        ]);

        $this->actingAs($this->teacher)->get('/teacher/wordModules')
            ->assertInertia(fn ($page) => $page
                ->component('Teacher/Word')
                ->where('modules.0.has_progress', true)
            );
    }

    public function test_student_cannot_access_word_modules_page(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        $response = $this->actingAs($student)->get('/teacher/wordModules');

        $response->assertForbidden();
    }

    public function test_update_word_module_allowed_before_deadline(): void
    {
        Setting::setValue('report_deadline', now()->addDay()->format('Y-m-d H:i:s'));

        $response = $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'title' => 'On Time',
            'words' => $this->tenUniqueWords(),
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertEquals(1, WordModule::count());
        $this->assertCount(10, WordModule::where('level', 1)->first()->words);
    }

    public function test_update_word_module_rejected_after_deadline_even_with_valid_words(): void
    {
        Setting::setValue('report_deadline', now()->subMinute()->format('Y-m-d H:i:s'));

        $response = $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'title' => 'Late',
            'words' => $this->tenUniqueWords(),
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertEquals(0, WordModule::count());
    }

    public function test_update_word_module_requires_level_title_and_words(): void
    {
        $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'title' => 'No Level',
            'words' => $this->tenUniqueWords(),
        ])->assertSessionHasErrors('level');

        $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'words' => $this->tenUniqueWords(),
        ])->assertSessionHasErrors('title');

        $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'title' => 'No Words',
        ])->assertSessionHasErrors('words');

        $words = $this->tenUniqueWords();
        $words[0] = ['other' => 'x'];
        $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'title' => 'Missing Key',
            'words' => $words,
        ])->assertSessionHasErrors('words.0.word');

        $this->assertEquals(0, WordModule::count());
    }

    public function test_update_word_module_rejects_wrong_word_count(): void
    {
        $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'title' => 'Nine',
            'words' => array_slice($this->tenUniqueWords(), 0, 9),
        ])->assertSessionHasErrors('words');
        $this->assertEquals(0, WordModule::count());

        $eleven = array_merge($this->tenUniqueWords(), [['word' => 'kilo']]);
        $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'title' => 'Eleven',
            'words' => $eleven,
        ])->assertSessionHasErrors('words');
        $this->assertEquals(0, WordModule::count());
    }

    public function test_update_word_module_enforces_word_length_limit(): void
    {
        $words = $this->tenUniqueWords();
        $words[0] = ['word' => str_repeat('a', 21)];
        $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'title' => 'Too Long',
            'words' => $words,
        ])->assertSessionHasErrors('words.0.word');
        $this->assertEquals(0, WordModule::count());

        $words = $this->tenUniqueWords();
        $words[0] = ['word' => str_repeat('a', 20)];
        $response = $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'title' => 'Boundary',
            'words' => $words,
        ]);
        $response->assertRedirect();
        $this->assertEquals(str_repeat('A', 20), WordModule::where('level', 1)->first()->words[0]->word);
    }

    public function test_update_word_module_duplicate_detection_is_normalized(): void
    {
        $words = $this->tenUniqueWords();
        $words[0] = ['word' => 'Cat'];
        $words[1] = ['word' => 'CAT'];
        $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'title' => 'Mixed Case',
            'words' => $words,
        ])->assertSessionHasErrors(['words.0.word' => '"CAT" is duplicated in this module.']);
        $this->assertEquals(0, WordModule::count());

        $words = $this->tenUniqueWords();
        $words[0] = ['word' => ' cat '];
        $words[1] = ['word' => ' CAT '];
        $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'title' => 'Padded',
            'words' => $words,
        ])->assertSessionHasErrors(['words.0.word' => '"CAT" is duplicated in this module.']);
        $this->assertEquals(0, WordModule::count());
    }

    public function test_update_word_module_duplicate_error_points_to_first_slot(): void
    {
        $words = $this->tenUniqueWords();
        $words[2] = ['word' => 'apple'];
        $words[5] = ['word' => 'apple'];

        $response = $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'title' => 'Late Dup',
            'words' => $words,
        ]);

        $response->assertSessionHasErrors(['words.2.word' => '"APPLE" is duplicated in this module.']);
        $this->assertEquals(0, WordModule::count());
    }

    public function test_update_word_module_allows_resaving_existing_words(): void
    {
        $this->seedWordModule(1, 'Existing', $this->tenUniqueWords());

        $response = $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'title' => 'Re-saved',
            'words' => $this->tenUniqueWords(),
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertCount(10, WordModule::where('level', 1)->first()->words);
    }

    public function test_update_word_module_preserves_other_modules_words(): void
    {
        $this->seedWordModule(1, 'L1', $this->tenUniqueWords());
        $this->seedWordModule(2, 'L2', [
            ['word' => 'red'], ['word' => 'blue'], ['word' => 'green'],
            ['word' => 'yellow'], ['word' => 'orange'], ['word' => 'purple'],
            ['word' => 'pink'], ['word' => 'brown'], ['word' => 'black'],
            ['word' => 'white'],
        ]);

        $response = $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 2,
            'title' => 'L2 Updated',
            'words' => $this->tenUniqueWords(),
        ]);

        $response->assertRedirect();
        $l1 = WordModule::where('level', 1)->first();
        $this->assertCount(10, $l1->words);
        $this->assertSame(
            ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT', 'GOLF', 'HOTEL', 'INDIA', 'JULIET'],
            $l1->words->pluck('word')->all(),
        );
    }

    public function test_update_word_module_stores_positions_in_order(): void
    {
        $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'title' => 'Ordered',
            'words' => $this->tenUniqueWords(),
        ])->assertRedirect();

        $module = WordModule::where('level', 1)->first();
        $this->assertSame(
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            $module->words->pluck('position')->sort()->values()->all(),
        );
        $this->assertSame(
            ['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA', 'ECHO', 'FOXTROT', 'GOLF', 'HOTEL', 'INDIA', 'JULIET'],
            $module->words->sortBy('position')->pluck('word')->all(),
        );
    }

    public function test_word_modules_has_progress_false_without_words(): void
    {
        WordModule::create(['level' => 1, 'title' => 'Empty']);

        $this->actingAs($this->teacher)->get('/teacher/wordModules')
            ->assertInertia(fn ($page) => $page
                ->component('Teacher/Word')
                ->where('modules.0.has_progress', false)
            );
    }

    public function test_word_modules_has_progress_ignores_mastery_on_other_module(): void
    {
        $l1 = WordModule::create(['level' => 1, 'title' => 'L1']);
        $l2 = WordModule::create(['level' => 2, 'title' => 'L2']);
        $wordL2 = $l2->words()->create(['word' => 'zebra', 'position' => 1]);
        $student = User::factory()->create(['role' => 'student']);
        StudentWordMastery::create([
            'user_id' => $student->id,
            'word_id' => $wordL2->id,
            'status' => 'training',
        ]);

        $this->actingAs($this->teacher)->get('/teacher/wordModules')
            ->assertInertia(fn ($page) => $page
                ->component('Teacher/Word')
                ->where('modules.0.has_progress', false)
                ->where('modules.1.has_progress', true)
            );
    }

    public function test_teacher_can_update_paragraph_module_via_http(): void
    {
        ParagraphModule::create(['level' => 1, 'title' => 'Old', 'content' => 'old content']);

        $response = $this->actingAs($this->teacher)->put('/teacher/paragraphModules', [
            'level' => 1,
            'title' => 'New Para',
            'content' => 'brand new story',
        ]);

        $response->assertRedirect();
        $module = ParagraphModule::where('level', 1)->first();
        $this->assertEquals('New Para', $module->title);
        $this->assertEquals('brand new story', $module->content);
    }

    public function test_guest_cannot_access_word_modules(): void
    {
        $response = $this->get('/teacher/wordModules');
        $response->assertRedirect('/');
    }

    public function test_teacher_cannot_update_word_module_after_deadline(): void
    {
        Setting::setValue('report_deadline', now()->subMinute()->format('Y-m-d H:i:s'));

        $response = $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'title' => 'Locked',
            'words' => array_fill(0, 10, ['word' => '']),
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertEquals(0, WordModule::count());
    }

    public function test_teacher_cannot_update_paragraph_module_after_deadline(): void
    {
        Setting::setValue('report_deadline', now()->subMinute()->format('Y-m-d H:i:s'));

        $response = $this->actingAs($this->teacher)->put('/teacher/paragraphModules', [
            'level' => 1,
            'title' => 'Locked',
            'content' => 'changed',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertEquals(0, ParagraphModule::count());
    }
}
