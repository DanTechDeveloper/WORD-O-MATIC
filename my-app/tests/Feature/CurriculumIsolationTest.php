<?php

namespace Tests\Feature;

use App\Models\ParagraphModule;
use App\Models\ParagraphWord;
use App\Models\StudentParagraphMastery;
use App\Models\StudentProfile;
use App\Models\StudentWordMastery;
use App\Models\User;
use App\Models\Word;
use App\Models\WordModule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CurriculumIsolationTest extends TestCase
{
    use RefreshDatabase;

    private User $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->student = User::factory()->create(['role' => 'student']);
        StudentProfile::factory()->for($this->student)->create();
    }

    // ponytail: regression lock for tutorial contamination in StudentDetails.jsx mastery bars.
    public function test_word_curriculum_excludes_tutorial_module(): void
    {
        $tutorial = WordModule::create(['level' => 0, 'title' => 'Tutorial', 'is_tutorial' => true]);
        foreach (['a', 'I', 'see', 'my', 'the'] as $i => $word) {
            Word::create(['word_module_id' => $tutorial->id, 'word' => $word, 'position' => $i + 1]);
        }

        $real = WordModule::create(['level' => 1, 'title' => 'Level 1', 'is_tutorial' => false]);
        $wordIds = [];
        foreach (['cat', 'dog', 'sun'] as $i => $word) {
            $w = Word::create(['word_module_id' => $real->id, 'word' => $word, 'position' => $i + 1]);
            $wordIds[] = $w->id;
        }

        // mark all real words as mastered
        foreach ($wordIds as $wid) {
            StudentWordMastery::create(['user_id' => $this->student->id, 'word_id' => $wid, 'status' => 'mastered']);
        }

        $curriculum = WordModule::curriculumForUser($this->student->id);

        $this->assertCount(1, $curriculum, 'tutorial module must not appear in word curriculum');
        $this->assertCount(3, $curriculum[0]['mastered']);
        $this->assertSame(3, $curriculum[0]['words_count']);
    }

    public function test_paragraph_curriculum_excludes_tutorial_module(): void
    {
        $tutorial = ParagraphModule::create(['level' => 0, 'title' => 'Tutorial', 'is_tutorial' => true]);
        foreach (['I', 'see', 'a', 'cat'] as $i => $w) {
            ParagraphWord::create(['paragraph_module_id' => $tutorial->id, 'word' => $w, 'position' => $i + 1]);
        }

        $real = ParagraphModule::create(['level' => 1, 'title' => 'Level 1', 'is_tutorial' => false]);
        $wordIds = [];
        foreach (['The', 'cat', 'is', 'big'] as $i => $w) {
            $pw = ParagraphWord::create(['paragraph_module_id' => $real->id, 'word' => $w, 'position' => $i + 1]);
            $wordIds[] = $pw->id;
        }

        foreach ($wordIds as $wid) {
            StudentParagraphMastery::create(['user_id' => $this->student->id, 'paragraph_word_id' => $wid, 'status' => 'mastered']);
        }

        $curriculum = ParagraphModule::curriculumForUser($this->student->id);

        $this->assertCount(1, $curriculum, 'tutorial module must not appear in paragraph curriculum');
        $this->assertSame(4, count($curriculum[0]['mastered']));
        $this->assertSame(4, $curriculum[0]['words_count']);
    }
}
