<?php

namespace Tests\Feature;

use App\Models\ParagraphModule;
use App\Models\Setting;
use App\Models\StudentParagraphMastery;
use App\Models\StudentParagraphProgress;
use App\Models\StudentWordMastery;
use App\Models\StudentWordProgress;
use App\Models\User;
use App\Models\WordModule;
use Database\Seeders\CurriculumSeeder;
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

    public function test_paragraph_modules_payload_exposes_has_progress(): void
    {
        $module = ParagraphModule::create(['level' => 1, 'title' => 'Story', 'content' => 'the cat sat']);
        $word = $module->words()->create(['word' => 'the', 'position' => 1]);

        $this->actingAs($this->teacher)->get('/teacher/paragraphModules')
            ->assertInertia(fn ($page) => $page
                ->component('Teacher/Paragraph')
                ->where('modules.0.has_progress', false)
            );

        $student = User::factory()->create(['role' => 'student']);
        StudentParagraphMastery::create([
            'user_id' => $student->id,
            'paragraph_word_id' => $word->id,
            'status' => 'training',
        ]);

        $this->actingAs($this->teacher)->get('/teacher/paragraphModules')
            ->assertInertia(fn ($page) => $page
                ->component('Teacher/Paragraph')
                ->where('modules.0.has_progress', true)
            );
    }

    // Mirrors the Word Blast case: mastery on ANOTHER module must not flag this
    // one, or every card on the page warns.
    public function test_paragraph_modules_has_progress_ignores_mastery_on_other_module(): void
    {
        $l1 = ParagraphModule::create(['level' => 1, 'title' => 'L1', 'content' => 'one two']);
        $l2 = ParagraphModule::create(['level' => 2, 'title' => 'L2', 'content' => 'three four']);
        $wordL2 = $l2->words()->create(['word' => 'three', 'position' => 1]);
        $student = User::factory()->create(['role' => 'student']);
        StudentParagraphMastery::create([
            'user_id' => $student->id,
            'paragraph_word_id' => $wordL2->id,
            'status' => 'training',
        ]);

        $this->actingAs($this->teacher)->get('/teacher/paragraphModules')
            ->assertInertia(fn ($page) => $page
                ->component('Teacher/Paragraph')
                ->where('modules.0.has_progress', false)
                ->where('modules.1.has_progress', true)
            );
    }

    public function test_paragraph_modules_has_progress_false_without_words(): void
    {
        ParagraphModule::create(['level' => 1, 'title' => 'Empty', 'content' => '']);

        $this->actingAs($this->teacher)->get('/teacher/paragraphModules')
            ->assertInertia(fn ($page) => $page
                ->component('Teacher/Paragraph')
                ->where('modules.0.has_progress', false)
            );
    }

    public function test_paragraph_modules_payload_preserves_teacher_page_fields(): void
    {
        ParagraphModule::saveWithContent([
            'level' => 1,
            'title' => 'Story',
            'content' => 'the cat sat down',
        ]);

        $this->actingAs($this->teacher)->get('/teacher/paragraphModules')
            ->assertInertia(fn ($page) => $page
                ->component('Teacher/Paragraph')
                ->where('modules.0.title', 'Story')
                ->where('modules.0.content', 'the cat sat down')
                ->where('modules.0.total_score', 4)
            );
    }

    // ── the rewrite gate ─────────────────────────────────────────────────────
    // Locking the SERVER side of "a module with student data is not editable".
    // The modals hide their Save button outright, so these lock the rule that a
    // raw PUT or a stale page cannot slip past it. `force` is the deliberate
    // escape hatch that no UI exposes.

    private function seedWordModuleWithMastery(int $level, array $words): array
    {
        WordModule::saveWithWords(['level' => $level, 'title' => 'L'.$level, 'words' => $words]);
        $module = WordModule::where('level', $level)->firstOrFail();
        $student = User::factory()->create(['role' => 'student']);
        $word = $module->words()->first();
        StudentWordMastery::create([
            'user_id' => $student->id,
            'word_id' => $word->id,
            'status' => 'training',
        ]);

        return ['module' => $module, 'student' => $student, 'word_id' => $word->id];
    }

    public function test_update_word_module_refuses_rewrite_with_progress_without_force(): void
    {
        $seeded = $this->seedWordModuleWithMastery(1, $this->tenUniqueWords());
        $module = $seeded['module'];
        $originalWordIds = $module->words()->pluck('id')->all();

        $replacement = $this->tenUniqueWords();
        $replacement[0] = ['word' => 'zulu'];

        $response = $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'title' => 'L1',
            'words' => $replacement,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
        // Nothing touched: same words, same ids, mastery intact.
        $this->assertSame($originalWordIds, $module->fresh()->words()->pluck('id')->all());
        $this->assertDatabaseHas('student_word_mastery', ['word_id' => $seeded['word_id']]);
    }

    public function test_update_word_module_allows_rewrite_with_progress_when_forced(): void
    {
        $module = $this->seedWordModuleWithMastery(1, $this->tenUniqueWords())['module'];

        $replacement = $this->tenUniqueWords();
        $replacement[0] = ['word' => 'zulu'];

        $response = $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'title' => 'L1',
            'words' => $replacement,
            'force' => true,
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertEquals('ZULU', $module->fresh()->words()->orderBy('position')->first()->word);
    }

    // The escape hatch must not become "you can never fix a typo".
    public function test_update_word_module_allows_unchanged_resave_without_force(): void
    {
        $seeded = $this->seedWordModuleWithMastery(1, $this->tenUniqueWords());

        $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'title' => 'L1',
            'words' => $this->tenUniqueWords(),
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('student_word_mastery', ['word_id' => $seeded['word_id']]);
        $this->assertCount(10, $seeded['module']->fresh()->words);
    }

    public function test_update_word_module_allows_rewrite_without_progress(): void
    {
        WordModule::saveWithWords(['level' => 1, 'title' => 'L1', 'words' => $this->tenUniqueWords()]);

        $replacement = $this->tenUniqueWords();
        $replacement[0] = ['word' => 'zulu'];

        $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'title' => 'L1',
            'words' => $replacement,
        ])->assertSessionHasNoErrors();

        $this->assertEquals('ZULU', WordModule::where('level', 1)->first()->words()->first()->word);
    }

    private function seedParagraphModuleWithMastery(int $level, string $content): array
    {
        ParagraphModule::saveWithContent(['level' => $level, 'title' => 'P'.$level, 'content' => $content]);
        $module = ParagraphModule::where('level', $level)->firstOrFail();
        $student = User::factory()->create(['role' => 'student']);
        $word = $module->words()->first();
        StudentParagraphMastery::create([
            'user_id' => $student->id,
            'paragraph_word_id' => $word->id,
            'status' => 'training',
        ]);

        return ['module' => $module, 'student' => $student, 'word_id' => $word->id];
    }

    public function test_update_paragraph_module_refuses_rewrite_with_progress_without_force(): void
    {
        $seeded = $this->seedParagraphModuleWithMastery(1, 'the cat sat down');

        $response = $this->actingAs($this->teacher)->put('/teacher/paragraphModules', [
            'level' => 1,
            'title' => 'P1',
            'content' => 'a dog ran fast',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertEquals('the cat sat down', $seeded['module']->fresh()->content);
        $this->assertDatabaseHas('student_paragraph_mastery', ['paragraph_word_id' => $seeded['word_id']]);
    }

    public function test_update_paragraph_module_allows_rewrite_with_progress_when_forced(): void
    {
        $module = $this->seedParagraphModuleWithMastery(1, 'the cat sat down')['module'];

        $this->actingAs($this->teacher)->put('/teacher/paragraphModules', [
            'level' => 1,
            'title' => 'P1',
            'content' => 'a dog ran fast',
            'force' => true,
        ])->assertSessionHasNoErrors();

        $this->assertEquals('a dog ran fast', $module->fresh()->content);
    }

    public function test_update_paragraph_module_allows_unchanged_resave_without_force(): void
    {
        $seeded = $this->seedParagraphModuleWithMastery(1, 'the cat sat down');

        $this->actingAs($this->teacher)->put('/teacher/paragraphModules', [
            'level' => 1,
            'title' => 'P1',
            'content' => 'the cat sat down',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('student_paragraph_mastery', ['paragraph_word_id' => $seeded['word_id']]);
        $this->assertEquals('the cat sat down', $seeded['module']->fresh()->content);
    }

    // Whitespace-only reformatting derives the SAME word rows, so the server
    // does not treat it as a rewrite and does not demand the escape flag.
    public function test_update_paragraph_module_treats_whitespace_reformat_as_unchanged(): void
    {
        $seeded = $this->seedParagraphModuleWithMastery(1, 'the cat sat down');

        $this->actingAs($this->teacher)->put('/teacher/paragraphModules', [
            'level' => 1,
            'title' => 'P1',
            'content' => "the   cat\tsat\ndown",
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('student_paragraph_mastery', ['paragraph_word_id' => $seeded['word_id']]);
        $this->assertCount(4, $seeded['module']->fresh()->words);
    }

    // The point of the position-reuse: a one-word fix must not renumber the
    // other nine, or every mid-round student's mastery POST 422s.
    public function test_update_word_module_keeps_ids_of_unchanged_positions(): void
    {
        WordModule::saveWithWords(['level' => 1, 'title' => 'L1', 'words' => $this->tenUniqueWords()]);
        $before = WordModule::where('level', 1)->first()->words()->orderBy('position')->pluck('id', 'position')->all();

        $replacement = $this->tenUniqueWords();
        $replacement[2] = ['word' => 'zulu'];
        $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'title' => 'L1',
            'words' => $replacement,
        ])->assertSessionHasNoErrors();

        $after = WordModule::where('level', 1)->first()->words()->orderBy('position')->get();
        $this->assertCount(10, $after);
        foreach ($after as $word) {
            $pos = $word->position;
            $this->assertSame($before[$pos], $word->id, "position {$pos} changed id");
        }
        $this->assertEquals('ZULU', $after->firstWhere('position', 3)->word);
    }

    public function test_update_paragraph_module_keeps_ids_of_unchanged_prefix(): void
    {
        ParagraphModule::saveWithContent(['level' => 1, 'title' => 'P1', 'content' => 'one two three four']);
        $before = ParagraphModule::where('level', 1)->first()->words()->orderBy('position')->pluck('id', 'position')->all();

        $this->actingAs($this->teacher)->put('/teacher/paragraphModules', [
            'level' => 1,
            'title' => 'P1',
            'content' => 'one two three five',
        ])->assertSessionHasNoErrors();

        $after = ParagraphModule::where('level', 1)->first()->words()->orderBy('position')->get();
        $this->assertCount(4, $after);
        foreach ($after as $word) {
            $pos = $word->position;
            $this->assertSame($before[$pos], $word->id, "position {$pos} changed id");
        }
        $this->assertEquals('five', $after->firstWhere('position', 4)->word);
    }

    // Shrinking must remove the surplus rows, not orphan them. This is ALSO the
    // one case the rewrite gate cannot make safe: the deleted rows cascade the
    // mastery away, and StudentController then throws on
    // `words_processed > $totalPossible` for any round still in flight. Pinned
    // here so the hazard stays visible until it is fixed.
    public function test_update_paragraph_module_deletes_surplus_words_when_shortened(): void
    {
        ParagraphModule::saveWithContent(['level' => 1, 'title' => 'P1', 'content' => 'one two three four five']);
        $module = ParagraphModule::where('level', 1)->firstOrFail();
        $student = User::factory()->create(['role' => 'student']);
        $surplusWord = $module->words()->where('position', 5)->firstOrFail();
        StudentParagraphMastery::create([
            'user_id' => $student->id,
            'paragraph_word_id' => $surplusWord->id,
            'status' => 'training',
        ]);

        $this->actingAs($this->teacher)->put('/teacher/paragraphModules', [
            'level' => 1,
            'title' => 'P1',
            'content' => 'one two',
            'force' => true,
        ])->assertSessionHasNoErrors();

        $this->assertCount(2, $module->fresh()->words);
        // Cascade confirmed: the mastery row on a deleted word is GONE.
        $this->assertDatabaseMissing('student_paragraph_mastery', [
            'paragraph_word_id' => $surplusWord->id,
        ]);
    }

    // The gate is the only thing standing between an accidental shrink and that
    // cascade — assert it actually refuses, so the guard cannot silently regress.
    public function test_update_paragraph_module_shrink_is_refused_without_force(): void
    {
        ParagraphModule::saveWithContent(['level' => 1, 'title' => 'P1', 'content' => 'one two three four five']);
        $module = ParagraphModule::where('level', 1)->firstOrFail();
        $student = User::factory()->create(['role' => 'student']);
        StudentParagraphMastery::create([
            'user_id' => $student->id,
            'paragraph_word_id' => $module->words()->where('position', 5)->firstOrFail()->id,
            'status' => 'training',
        ]);

        $this->actingAs($this->teacher)->put('/teacher/paragraphModules', [
            'level' => 1,
            'title' => 'P1',
            'content' => 'one two',
        ])->assertSessionHas('error');

        $this->assertCount(5, $module->fresh()->words);
        $this->assertEquals('one two three four five', $module->fresh()->content);
    }

    // sentence_stats slices $wordStats[$w->position - 1] against
    // sentencesFromContent(); renumbering would silently misreport mastery.
    public function test_paragraph_curriculum_sentence_alignment_holds_after_edit(): void
    {
        ParagraphModule::saveWithContent([
            'level' => 1,
            'title' => 'P1',
            'content' => 'The cat sat. The dog ran fast.',
        ]);
        $student = User::factory()->create(['role' => 'student']);
        $module = ParagraphModule::where('level', 1)->firstOrFail();
        // Master every word of the FIRST sentence only.
        $module->words()->where('position', '<=', 3)->each(function ($word) use ($student) {
            StudentParagraphMastery::create([
                'user_id' => $student->id,
                'paragraph_word_id' => $word->id,
                'status' => 'mastered',
            ]);
        });

        // force is REQUIRED here: mastery exists on words 1-3 and the content
        // changed, so the rewrite gate refuses without an acknowledgment. The
        // gate blocks on flash 'error', not validation errors, so
        // assertSessionHasNoErrors alone would not catch it.
        $this->actingAs($this->teacher)->put('/teacher/paragraphModules', [
            'level' => 1,
            'title' => 'P1',
            'content' => 'The cat sat. The dog ran fast!',
            'force' => true,
        ])->assertSessionHasNoErrors();

        $curriculum = ParagraphModule::curriculumForUser($student->id);
        $sentences = $curriculum[0]['sentences'];
        $this->assertSame(['The cat sat.', 'The dog ran fast!'], $sentences);
        // Sentence 1 fully mastered; sentence 2 untouched.
        $this->assertEquals('mastered', $curriculum[0]['sentence_stats'][0]['mastery']);
        $this->assertEquals('training', $curriculum[0]['sentence_stats'][1]['mastery']);
        $this->assertSame([1, 2, 3], $curriculum[0]['sentence_stats'][0]['word_ids']);
    }

    // ── the lock key: mastery OR progress ────────────────────────────────────
    // The two tables are written at different times — mastery per word
    // mid-round, progress once per finished round — so neither is a superset of
    // the other and a lock keyed on one alone would miss real data.

    public function test_word_modules_locked_by_progress_row_with_no_mastery(): void
    {
        $module = WordModule::create(['level' => 1, 'title' => 'L1']);
        $module->words()->create(['word' => 'apple', 'position' => 1]);
        $student = User::factory()->create(['role' => 'student']);
        // A round where the recognizer matched nothing: progress row, no mastery.
        StudentWordProgress::create([
            'user_id' => $student->id,
            'word_module_id' => $module->id,
            'status' => 'in_progress',
            'words_smashed' => 0,
            'accuracy' => 0,
        ]);

        $this->assertFalse(StudentWordMastery::where('user_id', $student->id)->exists());

        $this->actingAs($this->teacher)->get('/teacher/wordModules')
            ->assertInertia(fn ($page) => $page
                ->component('Teacher/Word')
                ->where('modules.0.has_progress', true)
            );
    }

    public function test_paragraph_modules_locked_by_progress_row_with_no_mastery(): void
    {
        $module = ParagraphModule::create(['level' => 1, 'title' => 'P1', 'content' => 'the cat sat']);
        $module->words()->create(['word' => 'the', 'position' => 1]);
        $student = User::factory()->create(['role' => 'student']);
        StudentParagraphProgress::create([
            'user_id' => $student->id,
            'paragraph_module_id' => $module->id,
            'status' => 'in_progress',
            'words_smashed' => 0,
            'accuracy' => 0,
        ]);

        $this->actingAs($this->teacher)->get('/teacher/paragraphModules')
            ->assertInertia(fn ($page) => $page
                ->component('Teacher/Paragraph')
                ->where('modules.0.has_progress', true)
            );
    }

    public function test_word_modules_not_locked_when_no_progress_and_no_mastery(): void
    {
        $module = WordModule::create(['level' => 1, 'title' => 'L1']);
        $module->words()->create(['word' => 'apple', 'position' => 1]);

        $this->actingAs($this->teacher)->get('/teacher/wordModules')
            ->assertInertia(fn ($page) => $page
                ->component('Teacher/Word')
                ->where('modules.0.has_progress', false)
            );
    }

    // One student's progress on Level 2 must not lock Level 1, or every card on
    // the page would be locked as soon as anyone played anything.
    public function test_word_modules_lock_is_per_module(): void
    {
        $l1 = WordModule::create(['level' => 1, 'title' => 'L1']);
        $l1->words()->create(['word' => 'apple', 'position' => 1]);
        $l2 = WordModule::create(['level' => 2, 'title' => 'L2']);
        $l2->words()->create(['word' => 'zebra', 'position' => 1]);
        $student = User::factory()->create(['role' => 'student']);
        StudentWordProgress::create([
            'user_id' => $student->id,
            'word_module_id' => $l2->id,
            'status' => 'completed',
            'words_smashed' => 10,
            'accuracy' => 100,
        ]);

        $this->actingAs($this->teacher)->get('/teacher/wordModules')
            ->assertInertia(fn ($page) => $page
                ->component('Teacher/Word')
                ->where('modules.0.has_progress', false)
                ->where('modules.1.has_progress', true)
            );
    }

    // ── CurriculumSeeder must not be the app's last destructive writer ───────
    // It used to do words()->delete() then create(), so `db:seed --class=
    // CurriculumSeeder` on a database with students silently cascaded away the
    // whole class's mastery. Runs on SQLite (no raw SQL in the seeder), unlike
    // StudentSeeder, so this is the automated proof for that fix.

    public function test_reseeding_curriculum_keeps_word_ids_and_mastery(): void
    {
        $this->seed(CurriculumSeeder::class);

        $before = WordModule::where('level', 1)->firstOrFail()->words()
            ->orderBy('position')->pluck('id', 'position')->all();
        $student = User::factory()->create(['role' => 'student']);
        $masteredWordId = $before[1];
        StudentWordMastery::create([
            'user_id' => $student->id,
            'word_id' => $masteredWordId,
            'status' => 'mastered',
        ]);

        // Re-seed WITHOUT fresh — the exact command that used to wipe the class.
        $this->seed(CurriculumSeeder::class);

        $after = WordModule::where('level', 1)->firstOrFail()->words()
            ->orderBy('position')->pluck('id', 'position')->all();
        $this->assertSame($before, $after, 're-seed renumbered word ids');
        $this->assertDatabaseHas('student_word_mastery', [
            'user_id' => $student->id,
            'word_id' => $masteredWordId,
            'status' => 'mastered',
        ]);
    }

    public function test_reseeding_curriculum_keeps_paragraph_word_ids_and_mastery(): void
    {
        $this->seed(CurriculumSeeder::class);

        $module = ParagraphModule::where('level', 1)->firstOrFail();
        $before = $module->words()->orderBy('position')->pluck('id')->all();
        $student = User::factory()->create(['role' => 'student']);
        StudentParagraphMastery::create([
            'user_id' => $student->id,
            'paragraph_word_id' => $before[0],
            'status' => 'training',
        ]);

        $this->seed(CurriculumSeeder::class);

        $after = ParagraphModule::where('level', 1)->firstOrFail()->words()
            ->orderBy('position')->pluck('id')->all();
        $this->assertSame($before, $after, 're-seed renumbered paragraph word ids');
        $this->assertDatabaseHas('student_paragraph_mastery', [
            'user_id' => $student->id,
            'paragraph_word_id' => $before[0],
        ]);
    }

    // The seeder must still produce a complete, well-formed curriculum — the
    // non-destructive write must not skip or reorder anything.
    public function test_curriculum_seeder_produces_full_curriculum_and_stays_idempotent(): void
    {
        $this->seed(CurriculumSeeder::class);

        $this->assertSame(11, WordModule::count(), '10 levels + tutorial');
        $this->assertSame(11, ParagraphModule::count(), '10 levels + tutorial');
        $this->assertCount(10, WordModule::where('level', 4)->firstOrFail()->words);
        $this->assertTrue((bool) WordModule::where('level', 0)->firstOrFail()->is_tutorial);
        $this->assertCount(5, WordModule::where('level', 0)->firstOrFail()->words);

        $firstIds = WordModule::all()->flatMap(fn ($m) => $m->words->pluck('id'))->sort()->values()->all();
        $this->seed(CurriculumSeeder::class);
        $secondIds = WordModule::all()->flatMap(fn ($m) => $m->words->pluck('id'))->sort()->values()->all();

        $this->assertSame(11, WordModule::count(), 're-seed duplicated modules');
        $this->assertSame($firstIds, $secondIds, 're-seed duplicated or renumbered words');
    }

    public function test_student_cannot_access_word_modules_page(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        $response = $this->actingAs($student)->get('/teacher/wordModules');

        $response->assertRedirect(route('student.dashboard'));
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

    public function test_teacher_cannot_save_paragraph_module_with_empty_content(): void
    {
        $response = $this->actingAs($this->teacher)->put('/teacher/paragraphModules', [
            'level' => 1,
            'title' => 'Empty Para',
            'content' => '',
        ]);

        $response->assertSessionHasErrors('content');
        $this->assertEquals(0, ParagraphModule::count());

        $response = $this->actingAs($this->teacher)->put('/teacher/paragraphModules', [
            'level' => 1,
            'title' => 'Whitespace Para',
            'content' => '   ',
        ]);

        $response->assertSessionHasErrors('content');
        $this->assertEquals(0, ParagraphModule::count());
    }

    public function test_guest_cannot_access_word_modules(): void
    {
        $response = $this->get('/teacher/wordModules');
        $response->assertRedirect(route('teacher.login'));
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

    public function test_update_word_module_rejects_bad_levels(): void
    {
        foreach ([-1, 'abc', 1.5] as $level) {
            $this->actingAs($this->teacher)->put('/teacher/wordModules', [
                'level' => $level,
                'title' => 'Bad Level',
                'words' => $this->tenUniqueWords(),
            ])->assertSessionHasErrors('level');
        }

        $this->assertEquals(0, WordModule::count());
    }

    public function test_update_word_module_rejects_bad_titles(): void
    {
        $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'words' => $this->tenUniqueWords(),
        ])->assertSessionHasErrors('title');

        $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'title' => str_repeat('A', 256),
            'words' => $this->tenUniqueWords(),
        ])->assertSessionHasErrors('title');

        $this->assertEquals(0, WordModule::count());
    }

    public function test_update_word_module_rejects_non_array_words_and_bad_total_score(): void
    {
        $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'title' => 'Not Array',
            'words' => 'not-an-array',
        ])->assertSessionHasErrors('words');

        $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'title' => 'Bad Score',
            'words' => $this->tenUniqueWords(),
            'totalScore' => 'abc',
        ])->assertSessionHasErrors('totalScore');

        // Nullable totalScore passes when numeric.
        $this->actingAs($this->teacher)->put('/teacher/wordModules', [
            'level' => 1,
            'title' => 'Good Score',
            'words' => $this->tenUniqueWords(),
            'totalScore' => 100,
        ])->assertSessionHasNoErrors();

        $this->assertEquals(1, WordModule::count());
    }

    public function test_update_paragraph_module_rejects_bad_levels_and_titles(): void
    {
        foreach ([-1, 'abc'] as $level) {
            $this->actingAs($this->teacher)->put('/teacher/paragraphModules', [
                'level' => $level,
                'title' => 'Bad Level',
                'content' => 'Some story here.',
            ])->assertSessionHasErrors('level');
        }

        $this->actingAs($this->teacher)->put('/teacher/paragraphModules', [
            'level' => 1,
            'content' => 'Some story here.',
        ])->assertSessionHasErrors('title');

        $this->actingAs($this->teacher)->put('/teacher/paragraphModules', [
            'level' => 1,
            'title' => str_repeat('A', 256),
            'content' => 'Some story here.',
        ])->assertSessionHasErrors('title');

        $this->assertEquals(0, ParagraphModule::count());
    }

    public function test_update_paragraph_module_preserves_case_as_entered(): void
    {
        $this->actingAs($this->teacher)->put('/teacher/paragraphModules', [
            'level' => 1,
            'title' => 'Case',
            'content' => 'MiXeD CaSe WoRdS here now.',
        ])->assertRedirect();

        $module = ParagraphModule::where('level', 1)->firstOrFail();
        $this->assertSame(
            ['MiXeD', 'CaSe', 'WoRdS', 'here', 'now.'],
            $module->words->sortBy('position')->pluck('word')->values()->all(),
        );
    }
}
