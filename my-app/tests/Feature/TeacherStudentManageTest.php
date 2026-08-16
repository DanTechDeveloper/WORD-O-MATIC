<?php

namespace Tests\Feature;

use App\Models\Badges;
use App\Models\GameSession;
use App\Models\ParagraphModule;
use App\Models\ParagraphWord;
use App\Models\StudentBadges;
use App\Models\StudentParagraphMastery;
use App\Models\StudentParagraphProgress;
use App\Models\StudentProfile;
use App\Models\StudentWordMastery;
use App\Models\StudentWordProgress;
use App\Models\User;
use App\Models\Word;
use App\Models\WordModule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class TeacherStudentManageTest extends TestCase
{
    use RefreshDatabase;

    private User $teacher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->teacher = User::factory()->create(['role' => 'teacher']);
    }

    private function makeStudent(string $name, string $pin = '1234'): User
    {
        $user = User::factory()->create([
            'name' => $name,
            'pin' => Hash::make($pin),
            'role' => 'student',
        ]);
        StudentProfile::factory()->for($user)->create(['section' => 'Sector 7-G']);

        return $user;
    }

    public function test_destroy_cascades_all_student_records(): void
    {
        $student = $this->makeStudent('Doomed Dana', '1111');

        $wordModule = WordModule::create(['level' => 1, 'title' => 'L1']);
        $word = Word::create(['word_module_id' => $wordModule->id, 'word' => 'CAT', 'position' => 1]);
        $paraModule = ParagraphModule::create(['level' => 1, 'title' => 'P1', 'content' => 'The cat.']);
        $paraWord = ParagraphWord::create(['paragraph_module_id' => $paraModule->id, 'word' => 'cat', 'position' => 1]);
        $badge = Badges::create([
            'name' => 'First Steps', 'slug' => 'first-steps', 'description' => 'd',
            'requirement' => 'r', 'metric' => 'total_points', 'operator' => '>=', 'threshold_score' => 5, 'icon' => 'eco',
        ]);

        StudentWordProgress::create(['user_id' => $student->id, 'word_module_id' => $wordModule->id, 'words_smashed' => 5, 'status' => 'completed']);
        StudentParagraphProgress::create(['user_id' => $student->id, 'paragraph_module_id' => $paraModule->id, 'words_smashed' => 3, 'status' => 'in_progress']);
        StudentWordMastery::create(['user_id' => $student->id, 'word_id' => $word->id, 'status' => 'mastered']);
        StudentParagraphMastery::create(['user_id' => $student->id, 'paragraph_word_id' => $paraWord->id, 'status' => 'mastered']);
        GameSession::create(['user_id' => $student->id, 'module_id' => $wordModule->id, 'module_type' => 'word', 'score' => 5, 'accuracy' => 50, 'streak' => 1]);
        StudentBadges::create(['user_id' => $student->id, 'badge_id' => $badge->id, 'earned_at' => now(), 'status' => 'earned']);

        $this->actingAs($this->teacher)
            ->delete("/teacher/students/{$student->id}")
            ->assertRedirect()
            ->assertSessionHas('success', 'Student deleted successfully.');

        $this->assertDatabaseMissing('users', ['id' => $student->id]);
        $this->assertDatabaseMissing('students', ['user_id' => $student->id]);
        $this->assertDatabaseMissing('student_word_progress', ['user_id' => $student->id]);
        $this->assertDatabaseMissing('student_paragraph_progress', ['user_id' => $student->id]);
        $this->assertDatabaseMissing('student_word_mastery', ['user_id' => $student->id]);
        $this->assertDatabaseMissing('student_paragraph_mastery', ['user_id' => $student->id]);
        $this->assertDatabaseMissing('game_sessions', ['user_id' => $student->id]);
        $this->assertDatabaseMissing('student_badges', ['user_id' => $student->id]);
    }

    public function test_update_student_rehashes_pin_and_renames(): void
    {
        $student = $this->makeStudent('Before Name', '1111');

        $this->actingAs($this->teacher)
            ->put("/teacher/students/{$student->id}", [
                'fullName' => 'After Name',
                'section' => 'Sector 7-G',
                'pin' => '2222',
                'gender' => '',
                'parent_email' => '',
            ])
            ->assertRedirect()
            ->assertSessionHas('success', 'Student updated successfully.');

        $fresh = $student->fresh();
        $this->assertEquals('After Name', $fresh->name);
        $this->assertTrue(Hash::check('2222', $fresh->pin));
        $this->assertFalse(Hash::check('1111', $fresh->pin));
    }

    public function test_rename_into_another_students_name_with_that_pin_is_rejected(): void
    {
        $this->makeStudent('Bee B', '1234');
        $student = $this->makeStudent('Old A', '1111');

        // Renaming A to match B's name while reusing B's PIN must collide.
        $this->actingAs($this->teacher)
            ->put("/teacher/students/{$student->id}", [
                'fullName' => 'Bee B',
                'section' => 'Sector 7-G',
                'pin' => '1234',
                'gender' => '',
                'parent_email' => '',
            ])
            ->assertSessionHasErrors('pin');
    }

    public function test_student_details_returns_curricula_and_latest_badge(): void
    {
        $student = $this->makeStudent('Details Dana', '1111');

        WordModule::create(['level' => 1, 'title' => 'L1']);
        ParagraphModule::create(['level' => 1, 'title' => 'P1', 'content' => 'The cat.']);

        $this->actingAs($this->teacher)
            ->get("/teacher/studentDetails/{$student->id}")
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->component('Teacher/StudentDetails')
                ->where('data.id', $student->id)
                ->where('data.name', 'Details Dana')
                ->has('data.readCurriculum')
                ->has('data.speakCurriculum')
                ->where('data.latestBadge', null));
    }

    public function test_teacher_cannot_delete_another_teacher_via_students_endpoint(): void
    {
        $otherTeacher = User::factory()->create(['role' => 'teacher', 'name' => 'Colleague']);

        $this->actingAs($this->teacher)
            ->delete("/teacher/students/{$otherTeacher->id}")
            ->assertNotFound();

        $this->assertDatabaseHas('users', ['id' => $otherTeacher->id]);
    }

    public function test_teacher_cannot_update_another_teacher_via_students_endpoint(): void
    {
        $otherTeacher = User::factory()->create(['role' => 'teacher', 'name' => 'Colleague']);

        $this->actingAs($this->teacher)
            ->put("/teacher/students/{$otherTeacher->id}", [
                'fullName' => 'Hijacked',
                'section' => 'Sector 7-G',
                'pin' => '',
                'gender' => '',
                'parent_email' => '',
            ])
            ->assertNotFound();

        $this->assertDatabaseHas('users', ['id' => $otherTeacher->id, 'name' => 'Colleague']);
    }

    public function test_teacher_cannot_view_another_teacher_via_student_details_endpoint(): void
    {
        $otherTeacher = User::factory()->create(['role' => 'teacher', 'name' => 'Colleague']);

        $this->actingAs($this->teacher)
            ->get("/teacher/studentDetails/{$otherTeacher->id}")
            ->assertNotFound();
    }
}
