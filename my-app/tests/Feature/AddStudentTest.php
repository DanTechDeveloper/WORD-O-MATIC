<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AddStudentTest extends TestCase
{
    use RefreshDatabase;

    private $teacher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->teacher = User::factory()->create(['role' => 'teacher']);
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'fullName' => 'LEO JUPITER',
            'studentID' => '2023-000001',
            'section' => '6-STEM-B',
            'pin' => '1234',
            'gender' => 'male',
            'parent_email' => 'parent@example.com',
        ], $overrides);
    }

    public function test_teacher_can_create_student_and_profile(): void
    {
        $response = $this->actingAs($this->teacher)->post('/teacher/addStudent', $this->validPayload());

        $response->assertRedirect();

        $user = User::where('role', 'student')->first();
        $this->assertNotNull($user);
        $this->assertEquals('LEO JUPITER', $user->name);
        $this->assertEquals('2023-000001', $user->student_id);
        $this->assertEquals('1234', $user->pin_plain);
        $this->assertTrue(Hash::check('1234', $user->pin));

        $profile = $user->student;
        $this->assertNotNull($profile);
        $this->assertEquals('6-STEM-B', $profile->section);
        $this->assertEquals('male', $profile->gender);
        $this->assertEquals('parent@example.com', $profile->parent_email);
    }

    public function test_duplicate_student_id_is_rejected(): void
    {
        $this->actingAs($this->teacher)->post('/teacher/addStudent', $this->validPayload());

        $response = $this->actingAs($this->teacher)->post('/teacher/addStudent', $this->validPayload());

        $response->assertSessionHasErrors('studentID');
        $this->assertEquals(1, User::where('role', 'student')->count());
    }

    public function test_duplicate_student_id_with_trailing_space_is_rejected(): void
    {
        $this->actingAs($this->teacher)->post('/teacher/addStudent', $this->validPayload());

        $response = $this->actingAs($this->teacher)->post('/teacher/addStudent', $this->validPayload([
            'studentID' => '2023-000001 ',
        ]));

        $response->assertSessionHasErrors('studentID');
        $this->assertEquals(1, User::where('role', 'student')->count());
    }

    public function test_pin_must_be_four_digits(): void
    {
        foreach (['123', '12345', '12a4', ''] as $badPin) {
            $this->actingAs($this->teacher)->post('/teacher/addStudent', $this->validPayload([
                'pin' => $badPin,
            ]))->assertSessionHasErrors('pin');
        }

        $this->assertEquals(0, User::where('role', 'student')->count());
    }

    public function test_whitespace_only_name_and_section_are_rejected(): void
    {
        $this->actingAs($this->teacher)->post('/teacher/addStudent', $this->validPayload([
            'fullName' => '   ',
        ]))->assertSessionHasErrors('fullName');

        $this->actingAs($this->teacher)->post('/teacher/addStudent', $this->validPayload([
            'section' => '   ',
        ]))->assertSessionHasErrors('section');

        $this->assertEquals(0, User::where('role', 'student')->count());
    }

    public function test_overlong_name_is_rejected(): void
    {
        $this->actingAs($this->teacher)->post('/teacher/addStudent', $this->validPayload([
            'fullName' => str_repeat('A', 256),
        ]))->assertSessionHasErrors('fullName');

        $this->assertEquals(0, User::where('role', 'student')->count());
    }

    public function test_inputs_are_normalized(): void
    {
        $response = $this->actingAs($this->teacher)->post('/teacher/addStudent', $this->validPayload([
            'fullName' => '  LEO JUPITER  ',
            'studentID' => ' 2023-000002 ',
            'section' => ' 6-STEM-C ',
            'parent_email' => '  Parent@Example.COM  ',
        ]));

        $response->assertRedirect();

        $user = User::where('role', 'student')->first();
        $this->assertEquals('LEO JUPITER', $user->name);
        $this->assertEquals('2023-000002', $user->student_id);
        $this->assertEquals('6-STEM-C', $user->student->section);
        $this->assertEquals('parent@example.com', $user->student->parent_email);
    }

    public function test_blank_email_is_stored_as_null(): void
    {
        $response = $this->actingAs($this->teacher)->post('/teacher/addStudent', $this->validPayload([
            'parent_email' => '   ',
        ]));

        $response->assertRedirect();
        $this->assertNull(User::where('role', 'student')->first()->student->parent_email);
    }

    public function test_email_and_gender_are_optional(): void
    {
        $response = $this->actingAs($this->teacher)->post('/teacher/addStudent', $this->validPayload([
            'gender' => '',
            'parent_email' => '',
        ]));

        $response->assertRedirect();

        $profile = User::where('role', 'student')->first()->student;
        $this->assertNull($profile->gender);
        $this->assertNull($profile->parent_email);
    }

    public function test_students_page_exposes_existing_student_ids(): void
    {
        $this->actingAs($this->teacher)->get('/teacher/students')
            ->assertInertia(fn ($page) => $page
                ->component('Teacher/Students')
                ->has('existingStudentIds')
            );
    }

    public function test_student_cannot_add_students(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        $response = $this->actingAs($this->teacher)->post('/teacher/addStudent', $this->validPayload());

        $response->assertForbidden();
        $this->assertEquals(0, User::where('role', 'student')->where('id', '!=', $student->id)->count());
    }

    public function test_updating_gender_switches_default_avatar(): void
    {
        $user = User::factory()->create(['role' => 'student']);
        $user->student()->create([
            'section' => '6-STEM-B',
            'gender' => 'male',
            'avatar' => '/images/boy.svg',
        ]);

        $this->actingAs($this->teacher)->put("/teacher/students/{$user->id}", [
            'fullName' => $user->name,
            'section' => '6-STEM-B',
            'gender' => 'female',
            'parent_email' => '',
        ])->assertRedirect();

        $profile = $user->fresh()->student;
        $this->assertEquals('female', $profile->gender);
        $this->assertEquals('/images/girl.svg', $profile->avatar);
    }

    public function test_updating_gender_preserves_custom_avatar(): void
    {
        $user = User::factory()->create(['role' => 'student']);
        $user->student()->create([
            'section' => '6-STEM-B',
            'gender' => 'male',
            'avatar' => '/images/avatars/ana/head.png',
        ]);

        $this->actingAs($this->teacher)->put("/teacher/students/{$user->id}", [
            'fullName' => $user->name,
            'section' => '6-STEM-B',
            'gender' => 'female',
            'parent_email' => '',
        ])->assertRedirect();

        $profile = $user->fresh()->student;
        $this->assertEquals('female', $profile->gender);
        $this->assertEquals('/images/avatars/ana/head.png', $profile->avatar);
    }
}
