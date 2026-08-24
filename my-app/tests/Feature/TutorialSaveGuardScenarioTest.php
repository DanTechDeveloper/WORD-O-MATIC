<?php

namespace Tests\Feature;

use App\Models\ParagraphModule;
use App\Models\ParagraphWord;
use App\Models\User;
use App\Models\Word;
use App\Models\WordModule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Regression lock: the module editors must never touch the tutorial.
 *
 * PUT /teacher/wordModules and PUT /teacher/paragraphModules validate level
 * as min:1, because saveWithWords()/saveWithContent() upsert by level — a
 * level=0 request used to match the tutorial row and wipe its words via
 * words()->delete() while the row stayed flagged is_tutorial (invisible to
 * curriculum readers, still served to onboarding). These tests pin the
 * rejection AND the survival of the tutorial content.
 */
class TutorialSaveGuardScenarioTest extends TestCase
{
    use RefreshDatabase;

    private User $teacher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->teacher = User::factory()->create(['role' => 'teacher']);
    }

    public function test_word_module_editor_rejects_level_zero_and_leaves_tutorial_intact(): void
    {
        $tutorial = WordModule::create(['level' => 0, 'title' => 'Tutorial', 'is_tutorial' => true]);
        foreach (['a', 'i', 'see', 'my', 'the'] as $i => $word) {
            Word::create(['word_module_id' => $tutorial->id, 'word' => strtoupper($word), 'position' => $i + 1]);
        }

        $response = $this->actingAs($this->teacher)
            ->put('/teacher/wordModules', [
                'level' => 0,
                'title' => 'Tutorial',
                'totalScore' => null,
                'words' => collect(range(1, 10))
                    ->map(fn ($i) => ['word' => 'hacked'.$i])
                    ->all(),
            ]);

        $response->assertSessionHasErrors('level');

        $tutorial->refresh();
        $this->assertSame(
            ['A', 'I', 'SEE', 'MY', 'THE'],
            $tutorial->words()->orderBy('position')->pluck('word')->all(),
        );
    }

    public function test_paragraph_module_editor_rejects_level_zero_and_leaves_tutorial_intact(): void
    {
        $tutorial = ParagraphModule::create([
            'level' => 0,
            'title' => 'Tutorial',
            'content' => 'I see a cat',
            'is_tutorial' => true,
        ]);
        foreach (['I', 'see', 'a', 'cat'] as $i => $w) {
            ParagraphWord::create(['paragraph_module_id' => $tutorial->id, 'word' => $w, 'position' => $i + 1]);
        }

        $response = $this->actingAs($this->teacher)
            ->put('/teacher/paragraphModules', [
                'level' => 0,
                'title' => 'Tutorial',
                'content' => 'totally different hacked paragraph',
            ]);

        $response->assertSessionHasErrors('level');

        $tutorial->refresh();
        $this->assertSame('I see a cat', $tutorial->content);
        $this->assertSame(
            ['I', 'see', 'a', 'cat'],
            $tutorial->words()->orderBy('position')->pluck('word')->all(),
        );
    }
}
