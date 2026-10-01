<?php

namespace Tests\Feature;

use App\Models\ParagraphModule;
use App\Models\ParagraphWord;
use App\Models\StudentParagraphMastery;
use App\Models\StudentWordMastery;
use App\Models\User;
use App\Models\Word;
use App\Models\WordModule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * THE TUTORIAL BOUNDARY, from the teacher's side.
 *
 * Both gameplay modes gate the mastery POST on `!isTutorialModule`, so a
 * well-behaved client writes nothing during the tutorial — a word stays `unseen`
 * with no row and lands in neither Word Blast zone. But updateMastery() has no
 * server-side is_tutorial check, so the client is the ONLY thing preventing a
 * tutorial word from acquiring a mastery row.
 *
 * These tests assume the guard is bypassed (a row is written directly) and prove
 * the row is still invisible: modules() filters `is_tutorial = false` for both
 * curricula, so a stray tutorial row can never reach the teacher page, the
 * dashboard's "hardest" cards, or the parent report. Each assertion also checks
 * the row is STILL IN THE DATABASE, because a test that passes because the row
 * does not exist proves nothing about filtering.
 */
class TutorialMasteryLeakTest extends TestCase
{
    use RefreshDatabase;

    private User $teacher;

    private User $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->teacher = User::factory()->create(['role' => 'teacher']);
        $this->student = User::factory()->create(['role' => 'student']);
    }

    private function makeTutoredWordModule(): Word
    {
        $tutorial = WordModule::create(['level' => 0, 'title' => 'Tutorial', 'is_tutorial' => true]);
        Word::create(['word_module_id' => $tutorial->id, 'word' => 'TUTWORD', 'position' => 1]);

        return Word::where('word', 'TUTWORD')->firstOrFail();
    }

    private function makeRealWordModule(): Word
    {
        $real = WordModule::create(['level' => 1, 'title' => 'Real', 'is_tutorial' => false]);
        Word::create(['word_module_id' => $real->id, 'word' => 'REALWORD', 'position' => 1]);

        return Word::where('word', 'REALWORD')->firstOrFail();
    }

    public function test_a_bypassed_tutorial_mastery_write_never_reaches_the_word_blast_curriculum(): void
    {
        $tutWord = $this->makeTutoredWordModule();
        $realWord = $this->makeRealWordModule();

        // The bypass this file is about: a training row for the tutorial word.
        StudentWordMastery::create([
            'user_id' => $this->student->id,
            'word_id' => $tutWord->id,
            'status' => 'training',
            'failed_attempts' => 9,
        ]);
        StudentWordMastery::create([
            'user_id' => $this->student->id,
            'word_id' => $realWord->id,
            'status' => 'training',
            'failed_attempts' => 2,
        ]);

        $curriculum = WordModule::curriculumForUser($this->student->id);
        $rendered = json_encode($curriculum);

        // Sanity: the row EXISTS. Without this, every assertion below is vacuous.
        $this->assertDatabaseHas('student_word_mastery', [
            'user_id' => $this->student->id,
            'word_id' => $tutWord->id,
            'failed_attempts' => 9,
        ]);

        $this->assertStringNotContainsString('TUTWORD', $rendered);
        $this->assertStringNotContainsString('Tutorial', $rendered);

        // And the real word IS there, so this is filtering and not an empty read.
        $this->assertStringContainsString('REALWORD', $rendered);
        $this->assertSame(['Real'], array_column($curriculum, 'title'));
    }

    public function test_a_bypassed_tutorial_mastery_write_never_reaches_the_story_quest_curriculum(): void
    {
        $tutorial = ParagraphModule::create([
            'level' => 0, 'title' => 'Tutorial', 'content' => 'Tutword big.', 'is_tutorial' => true,
        ]);
        ParagraphWord::create(['paragraph_module_id' => $tutorial->id, 'word' => 'Tutword', 'position' => 1]);
        ParagraphWord::create(['paragraph_module_id' => $tutorial->id, 'word' => 'big', 'position' => 2]);

        $real = ParagraphModule::create([
            'level' => 1, 'title' => 'Real', 'content' => 'The cat naps.', 'is_tutorial' => false,
        ]);
        ParagraphWord::create(['paragraph_module_id' => $real->id, 'word' => 'The', 'position' => 1]);
        ParagraphWord::create(['paragraph_module_id' => $real->id, 'word' => 'cat', 'position' => 2]);
        ParagraphWord::create(['paragraph_module_id' => $real->id, 'word' => 'naps', 'position' => 3]);

        $tutWordId = ParagraphWord::where('word', 'Tutword')->value('id');
        $catId = ParagraphWord::where('word', 'cat')->value('id');

        StudentParagraphMastery::create([
            'user_id' => $this->student->id,
            'paragraph_word_id' => $tutWordId,
            'status' => 'training',
            'failed_attempts' => 9,
        ]);
        StudentParagraphMastery::create([
            'user_id' => $this->student->id,
            'paragraph_word_id' => $catId,
            'status' => 'training',
            'failed_attempts' => 2,
        ]);

        $curriculum = ParagraphModule::curriculumForUser($this->student->id);
        $rendered = json_encode($curriculum);

        $this->assertDatabaseHas('student_paragraph_mastery', [
            'user_id' => $this->student->id,
            'paragraph_word_id' => $tutWordId,
            'failed_attempts' => 9,
        ]);

        $this->assertStringNotContainsString('Tutword', $rendered);
        $this->assertStringNotContainsString('Tutorial', $rendered);

        // A drilled sentence's stats DO come through — the contrast is the point.
        $this->assertStringContainsString('cat', $rendered);
        $this->assertSame(['Real'], array_column($curriculum, 'title'));
    }

    public function test_a_tutorial_word_never_becomes_the_dashboard_hardest_word(): void
    {
        $tutWord = $this->makeTutoredWordModule();
        $realWord = $this->makeRealWordModule();

        // The tutorial word is far worse, so if the filter ever lapses it wins.
        StudentWordMastery::create([
            'user_id' => $this->student->id, 'word_id' => $tutWord->id,
            'status' => 'training', 'failed_attempts' => 99,
        ]);
        StudentWordMastery::create([
            'user_id' => $this->student->id, 'word_id' => $realWord->id,
            'status' => 'training', 'failed_attempts' => 1,
        ]);

        $hardest = StudentWordMastery::hardestWord();
        $this->assertNotNull($hardest);
        $this->assertNotSame('TUTWORD', $hardest['word'] ?? null);
    }

    public function test_the_teacher_student_page_ships_no_tutorial_word_even_after_a_bypass(): void
    {
        $tutWord = $this->makeTutoredWordModule();
        $realWord = $this->makeRealWordModule();

        StudentWordMastery::create([
            'user_id' => $this->student->id, 'word_id' => $tutWord->id,
            'status' => 'mastered', 'failed_attempts' => 0,
        ]);
        StudentWordMastery::create([
            'user_id' => $this->student->id, 'word_id' => $realWord->id,
            'status' => 'mastered', 'failed_attempts' => 0,
        ]);

        $this->actingAs($this->teacher)
            ->get(route('teacher.studentDetails.show', $this->student->id))
            ->assertOk()
            ->assertDontSee('TUTWORD')
            ->assertSee('REALWORD');
    }

    /**
     * The count that makes the "Recorded: 0" question answerable: a word the
     * child read first try is `mastered` with failed_attempts 0, and that is a
     * REAL measurement produced by a real round — never by the tutorial, which
     * writes no rows at all. So "0" cannot be an artifact of onboarding.
     */
    public function test_a_first_try_read_is_a_real_zero_not_a_tutorial_artifact(): void
    {
        $realWord = $this->makeRealWordModule();

        // No tutorial play, no progress row at all — the post-tutorial state.
        $this->assertSame([], StudentWordMastery::where('user_id', $this->student->id)->get()->toArray());
        $curriculum = WordModule::curriculumForUser($this->student->id);
        $this->assertSame('unseen', $curriculum[0]['word_stats'][0]['mastery']);
        $this->assertSame(0, $curriculum[0]['word_stats'][0]['failed_attempts']);

        // One real correct read creates the row the tutorial never would.
        StudentWordMastery::create([
            'user_id' => $this->student->id, 'word_id' => $realWord->id,
            'status' => 'mastered', 'failed_attempts' => 0,
        ]);

        $after = WordModule::curriculumForUser($this->student->id);
        $this->assertSame('mastered', $after[0]['word_stats'][0]['mastery']);
        $this->assertSame(0, $after[0]['word_stats'][0]['failed_attempts']);
        $this->assertSame(['REALWORD'], $after[0]['mastered']);
    }
}
