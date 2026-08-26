<?php

namespace Tests\Feature;

use App\Models\ParagraphModule;
use App\Models\ParagraphWord;
use App\Models\Setting;
use App\Models\StudentProfile;
use App\Models\StudentWordMastery;
use App\Models\User;
use App\Models\Word;
use App\Models\WordModule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MasteryAttemptTest extends TestCase
{
    use RefreshDatabase;

    private User $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->student = User::factory()->create(['role' => 'student']);
        StudentProfile::factory()->for($this->student)->create();
    }

    private function makeWord(string $text = 'cat', int $position = 1): Word
    {
        $module = WordModule::create(['level' => 1, 'title' => 'Level 1']);

        return Word::create([
            'word_module_id' => $module->id,
            'word' => $text,
            'position' => $position,
        ]);
    }

    private function makeParagraphWord(string $text = 'cat'): ParagraphWord
    {
        $module = ParagraphModule::create([
            'level' => 1,
            'title' => 'Level 1',
            'content' => $text,
            'is_tutorial' => false,
        ]);

        return ParagraphWord::create([
            'paragraph_module_id' => $module->id,
            'word' => $text,
            'position' => 1,
        ]);
    }

    private function postWordMastery(Word $word, string $status): void
    {
        $this->actingAs($this->student, 'web')
            ->post('/student/updateWordMastery', ['word_id' => $word->id, 'status' => $status]);
    }

    public function test_training_post_increments_failed_attempts(): void
    {
        $word = $this->makeWord();

        $this->postWordMastery($word, 'training');
        $this->postWordMastery($word, 'training');

        $row = StudentWordMastery::where('user_id', $this->student->id)
            ->where('word_id', $word->id)->first();
        $this->assertSame('training', $row->status);
        $this->assertSame(2, $row->failed_attempts);
    }

    public function test_mastery_freezes_counter_and_rejects_regression(): void
    {
        $word = $this->makeWord();

        // two failures, mastered on the third attempt
        $this->postWordMastery($word, 'training');
        $this->postWordMastery($word, 'training');
        $this->postWordMastery($word, 'mastered');

        // replay mispronounce after mastery must change nothing
        $this->postWordMastery($word, 'training');

        $row = StudentWordMastery::where('user_id', $this->student->id)
            ->where('word_id', $word->id)->first();
        $this->assertSame('mastered', $row->status);
        $this->assertSame(2, $row->failed_attempts);
    }

    public function test_fresh_mastery_starts_at_zero(): void
    {
        $word = $this->makeWord();

        $this->postWordMastery($word, 'mastered');

        $row = StudentWordMastery::where('user_id', $this->student->id)
            ->where('word_id', $word->id)->first();
        $this->assertSame('mastered', $row->status);
        $this->assertSame(0, $row->failed_attempts);
    }

    public function test_paragraph_endpoint_mirrors_word_behavior(): void
    {
        $word = $this->makeParagraphWord();

        foreach ([1, 2] as $_) {
            $this->actingAs($this->student, 'web')
                ->post('/student/updateParagraphMastery', [
                    'paragraph_word_id' => $word->id,
                    'status' => 'training',
                ]);
        }
        $this->actingAs($this->student, 'web')
            ->post('/student/updateParagraphMastery', [
                'paragraph_word_id' => $word->id,
                'status' => 'mastered',
            ]);
        $this->actingAs($this->student, 'web')
            ->post('/student/updateParagraphMastery', [
                'paragraph_word_id' => $word->id,
                'status' => 'training',
            ]);

        $row = \App\Models\StudentParagraphMastery::where('user_id', $this->student->id)
            ->where('paragraph_word_id', $word->id)->first();
        $this->assertSame('mastered', $row->status);
        $this->assertSame(2, $row->failed_attempts);
    }

    public function test_post_deadline_training_post_writes_nothing(): void
    {
        Setting::setValue('report_deadline', now()->subMinute()->format('Y-m-d H:i:s'));
        $word = $this->makeWord();

        $this->postWordMastery($word, 'training');

        $this->assertDatabaseMissing('student_word_mastery', [
            'user_id' => $this->student->id,
        ]);
    }

    public function test_first_training_creates_row_at_one(): void
    {
        $word = $this->makeWord();

        $this->postWordMastery($word, 'training');

        $row = StudentWordMastery::where('user_id', $this->student->id)
            ->where('word_id', $word->id)->first();
        $this->assertSame('training', $row->status);
        $this->assertSame(1, $row->failed_attempts);
    }

    public function test_mastery_preserves_accumulated_failed_attempts(): void
    {
        $word = $this->makeWord();

        $this->postWordMastery($word, 'training');
        $this->postWordMastery($word, 'training');
        $this->postWordMastery($word, 'training');
        $this->postWordMastery($word, 'mastered');

        $row = StudentWordMastery::where('user_id', $this->student->id)
            ->where('word_id', $word->id)->first();
        $this->assertSame('mastered', $row->status);
        $this->assertSame(3, $row->failed_attempts);
    }

    public function test_training_after_mastery_never_clobbers_sticky_row(): void
    {
        // Simulates the race the atomic WHERE closes: a mastered row already
        // exists when a training request lands. The create branch must detect
        // the mastered row and write nothing.
        $word = $this->makeWord();
        StudentWordMastery::create([
            'user_id' => $this->student->id,
            'word_id' => $word->id,
            'status' => 'mastered',
            'failed_attempts' => 4,
        ]);

        $this->postWordMastery($word, 'training');

        $row = StudentWordMastery::where('user_id', $this->student->id)
            ->where('word_id', $word->id)->first();
        $this->assertSame('mastered', $row->status);
        $this->assertSame(4, $row->failed_attempts);
    }

    public function test_sticky_mastery_is_idempotent_on_repeated_mastery(): void
    {
        $word = $this->makeWord();

        $this->postWordMastery($word, 'training');
        $this->postWordMastery($word, 'mastered');
        $this->postWordMastery($word, 'mastered');

        $row = StudentWordMastery::where('user_id', $this->student->id)
            ->where('word_id', $word->id)->first();
        $this->assertSame('mastered', $row->status);
        $this->assertSame(1, $row->failed_attempts);
    }

    public function test_student_isolation_no_cross_leak(): void
    {
        $other = User::factory()->create(['role' => 'student']);
        StudentProfile::factory()->for($other)->create();
        $word = $this->makeWord();

        $this->postWordMastery($word, 'training');
        $this->postWordMastery($word, 'training');

        $this->assertDatabaseMissing('student_word_mastery', [
            'user_id' => $other->id,
        ]);
        $this->assertSame(2, StudentWordMastery::where('user_id', $this->student->id)
            ->where('word_id', $word->id)->first()->failed_attempts);
    }

    public function test_invalid_status_is_rejected(): void
    {
        $word = $this->makeWord();

        $this->actingAs($this->student, 'web')
            ->postJson('/student/updateWordMastery', ['word_id' => $word->id, 'status' => 'foo'])
            ->assertStatus(422);

        $this->assertDatabaseMissing('student_word_mastery', [
            'user_id' => $this->student->id,
            'word_id' => $word->id,
        ]);
    }

    public function test_missing_word_id_is_rejected(): void
    {
        $this->actingAs($this->student, 'web')
            ->postJson('/student/updateWordMastery', ['status' => 'training'])
            ->assertStatus(422);
    }

    public function test_unknown_word_id_is_rejected(): void
    {
        $this->actingAs($this->student, 'web')
            ->postJson('/student/updateWordMastery', ['word_id' => 99999, 'status' => 'training'])
            ->assertStatus(422);
    }

    public function test_paragraph_first_training_creates_row_at_one(): void
    {
        $word = $this->makeParagraphWord();

        $this->actingAs($this->student, 'web')
            ->post('/student/updateParagraphMastery', [
                'paragraph_word_id' => $word->id,
                'status' => 'training',
            ])
            ->assertStatus(204);

        $row = \App\Models\StudentParagraphMastery::where('user_id', $this->student->id)
            ->where('paragraph_word_id', $word->id)->first();
        $this->assertSame('training', $row->status);
        $this->assertSame(1, $row->failed_attempts);
    }

    public function test_student_details_word_stats_include_unseen_words_at_zero(): void
    {
        $module = WordModule::create(['level' => 1, 'title' => 'Level 1']);
        $cat = Word::create(['word_module_id' => $module->id, 'word' => 'CAT', 'position' => 1]);
        $dog = Word::create(['word_module_id' => $module->id, 'word' => 'DOG', 'position' => 2]);
        Word::create(['word_module_id' => $module->id, 'word' => 'BIRD', 'position' => 3]);

        // cat: two fails then mastered; dog: one fail; bird: unseen
        $this->postWordMastery($cat, 'training');
        $this->postWordMastery($cat, 'training');
        $this->postWordMastery($cat, 'mastered');
        $this->postWordMastery($dog, 'training');

        $teacher = User::factory()->create(['role' => 'teacher']);
        $this->actingAs($teacher, 'web')
            ->get(route('teacher.studentDetails.show', $this->student))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Teacher/StudentDetails')
                ->has('data.readCurriculum.0.word_stats', 3)
                ->where('data.readCurriculum.0.word_stats.0.word', 'CAT')
                ->where('data.readCurriculum.0.word_stats.0.mastery', 'mastered')
                ->where('data.readCurriculum.0.word_stats.0.failed_attempts', 2)
                ->where('data.readCurriculum.0.word_stats.1.mastery', 'training')
                ->where('data.readCurriculum.0.word_stats.1.failed_attempts', 1)
                ->where('data.readCurriculum.0.word_stats.2.mastery', 'unseen')
                ->where('data.readCurriculum.0.word_stats.2.failed_attempts', 0)
            );
    }

    public function test_four_training_then_mastery_drives_recovered_data(): void
    {
        // 4 failed attempts, then mastered on the 5th call. failed_attempts is
        // frozen at 4; the frontend turns (mastered, >=3) into "Recovered".
        $word = $this->makeWord();

        foreach ([1, 2, 3, 4] as $_) {
            $this->postWordMastery($word, 'training');
        }
        $this->postWordMastery($word, 'mastered');

        $row = StudentWordMastery::where('user_id', $this->student->id)
            ->where('word_id', $word->id)->first();
        $this->assertSame('mastered', $row->status);
        $this->assertSame(4, $row->failed_attempts);
    }

    public function test_three_training_without_mastery_drives_needs_attention_data(): void
    {
        // 3 failed attempts, still training -> frontend shows "Needs Attention".
        $word = $this->makeWord();

        foreach ([1, 2, 3] as $_) {
            $this->postWordMastery($word, 'training');
        }

        $row = StudentWordMastery::where('user_id', $this->student->id)
            ->where('word_id', $word->id)->first();
        $this->assertSame('training', $row->status);
        $this->assertSame(3, $row->failed_attempts);
    }

    public function test_two_training_without_mastery_is_below_threshold(): void
    {
        // 2 failed attempts stays under NEEDS_ATTENTION_ATTEMPTS -> no label.
        $word = $this->makeWord();

        $this->postWordMastery($word, 'training');
        $this->postWordMastery($word, 'training');

        $row = StudentWordMastery::where('user_id', $this->student->id)
            ->where('word_id', $word->id)->first();
        $this->assertSame('training', $row->status);
        $this->assertSame(2, $row->failed_attempts);
    }
}
