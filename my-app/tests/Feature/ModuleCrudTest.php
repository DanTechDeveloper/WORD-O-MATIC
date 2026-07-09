<?php

namespace Tests\Feature;

use App\Models\ParagraphModule;
use App\Models\Word;
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

        $this->teacher = \App\Models\User::factory()->create(['role' => 'teacher']);
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

        $words = array_merge(
            [['word' => 'updated']],
            array_fill(0, 9, ['word' => ''])
        );

        $response = $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'title' => 'New Title',
            'words' => $words,
        ]);

        $response->assertRedirect();
        $module = WordModule::where('level', 1)->first();
        $this->assertEquals('New Title', $module->title);
        $this->assertEquals('UPDATED', $module->words[0]->word);
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
}
