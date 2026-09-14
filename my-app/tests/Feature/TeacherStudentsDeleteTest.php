<?php

namespace Tests\Feature;

use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherStudentsDeleteTest extends TestCase
{
    use RefreshDatabase;

    public function test_teacher_can_delete_student(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher', 'password' => bcrypt('password')]);
        $student = User::factory()->create(['role' => 'student']);
        StudentProfile::factory()->for($student)->create();

        $this->actingAs($teacher)->delete(route('teacher.students.destroy', $student))
            ->assertRedirect()->assertSessionHas('success', 'Student deleted successfully.');
        $this->assertDatabaseMissing('users', ['id' => $student->id]);
    }

    public function test_student_and_guest_cannot_delete(): void
    {
        $student = User::factory()->create(['role' => 'student', 'password' => bcrypt('password')]);
        $student->student()->create(['avatar' => '/images/boy.svg', 'tutorial_completed_at' => now()]);
        $target = User::factory()->create(['role' => 'student']);
        StudentProfile::factory()->for($target)->create();

        $this->actingAs($student)->delete(route('teacher.students.destroy', $target))->assertForbidden();
        $response = $this->delete(route('teacher.students.destroy', $target));
        $this->assertTrue(in_array($response->status(), [302, 303, 401, 403], true));
    }
}
