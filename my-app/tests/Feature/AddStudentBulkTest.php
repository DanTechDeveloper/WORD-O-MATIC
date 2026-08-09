<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AddStudentBulkTest extends TestCase
{
    use RefreshDatabase;

    private $teacher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->teacher = User::factory()->create(['role' => 'teacher']);
    }

    private function bulkPayload(array $rows = [], int $count = 3): array
    {
        if (empty($rows)) {
            $rows = collect(range(1, $count))->map(fn ($i) => [
                'fullName' => "STUDENT $i",
                'studentID' => "2023-00$i",
                'section' => '6-STEM-B',
                'pin' => sprintf('%04d', $i),
            ])->all();
        }

        return ['students' => $rows];
    }

    public function test_teacher_can_bulk_create_students_and_profiles(): void
    {
        $response = $this->actingAs($this->teacher)->post('/teacher/addStudents', $this->bulkPayload());

        $response->assertRedirect();

        $this->assertEquals(3, User::where('role', 'student')->count());

        $first = User::where('role', 'student')->where('student_id', '2023-001')->first();
        $this->assertNotNull($first);
        $this->assertEquals('STUDENT 1', $first->name);
        $this->assertEquals('0001', $first->pin_plain);
        $this->assertTrue(Hash::check('0001', $first->pin));
        $this->assertEquals('6-STEM-B', $first->student->section);
        $this->assertNull($first->student->gender);
        $this->assertNull($first->student->parent_email);
    }

    public function test_intra_batch_duplicate_id_is_rejected_without_writing_anything(): void
    {
        $rows = [
            ['fullName' => 'A', 'studentID' => '2023-0001', 'section' => 'S', 'pin' => '1111'],
            ['fullName' => 'B', 'studentID' => '2023-0002', 'section' => 'S', 'pin' => '2222'],
            ['fullName' => 'C', 'studentID' => '2023-0001', 'section' => 'S', 'pin' => '3333'],
        ];

        $response = $this->actingAs($this->teacher)->post('/teacher/addStudents', $this->bulkPayload($rows));

        $response->assertSessionHasErrors('students.2.studentID', '"2023-0001" appears twice in this list.');
        $this->assertEquals(0, User::where('role', 'student')->count());
    }

    public function test_duplicate_against_existing_student_is_rejected(): void
    {
        User::factory()->create(['role' => 'student', 'student_id' => '2023-001']);

        $response = $this->actingAs($this->teacher)->post('/teacher/addStudents', $this->bulkPayload());

        $response->assertSessionHasErrors('students.0.studentID');
        $this->assertEquals(1, User::where('role', 'student')->count());
    }

    public function test_blank_name_is_rejected_per_row(): void
    {
        $rows = [
            ['fullName' => '   ', 'studentID' => '2023-0001', 'section' => 'S', 'pin' => '1111'],
            ['fullName' => 'B', 'studentID' => '2023-0002', 'section' => 'S', 'pin' => '2222'],
        ];

        $response = $this->actingAs($this->teacher)->post('/teacher/addStudents', $this->bulkPayload($rows));

        $response->assertSessionHasErrors('students.0.fullName');
        $this->assertEquals(0, User::where('role', 'student')->count());
    }

    public function test_more_than_fifty_rows_is_rejected(): void
    {
        $response = $this->actingAs($this->teacher)->post('/teacher/addStudents', $this->bulkPayload([], 51));

        $response->assertSessionHasErrors('students');
        $this->assertEquals(0, User::where('role', 'student')->count());
    }

    public function test_empty_students_array_is_rejected(): void
    {
        $response = $this->actingAs($this->teacher)->post('/teacher/addStudents', ['students' => []]);

        $response->assertSessionHasErrors('students');
        $this->assertEquals(0, User::where('role', 'student')->count());
    }

    public function test_rows_are_normalized(): void
    {
        $rows = [
            ['fullName' => '  LEO JUPITER  ', 'studentID' => ' 2023-001 ', 'section' => ' 6-STEM-C ', 'pin' => '1111'],
        ];

        $response = $this->actingAs($this->teacher)->post('/teacher/addStudents', $this->bulkPayload($rows));

        $response->assertRedirect();

        $user = User::where('role', 'student')->first();
        $this->assertEquals('LEO JUPITER', $user->name);
        $this->assertEquals('2023-001', $user->student_id);
        $this->assertEquals('6-STEM-C', $user->student->section);
    }

    public function test_invalid_pin_is_rejected_per_row(): void
    {
        $rows = [
            ['fullName' => 'A', 'studentID' => '2023-0001', 'section' => 'S', 'pin' => 'abc'],
        ];

        $response = $this->actingAs($this->teacher)->post('/teacher/addStudents', $this->bulkPayload($rows));

        $response->assertSessionHasErrors('students.0.pin');
        $this->assertEquals(0, User::where('role', 'student')->count());
    }

    public function test_bad_row_rolls_back_the_whole_batch(): void
    {
        $rows = collect(range(1, 20))->map(fn ($i) => [
            'fullName' => "STUDENT $i",
            'studentID' => "2023-0$i",
            'section' => $i === 20 ? '   ' : '6-STEM-B',
            'pin' => sprintf('%04d', $i),
        ])->all();

        $response = $this->actingAs($this->teacher)->post('/teacher/addStudents', $this->bulkPayload($rows));

        $response->assertSessionHasErrors('students.19.section');
        $this->assertEquals(0, User::where('role', 'student')->count());
    }

    public function test_bulk_accepts_gender_and_parent_email(): void
    {
        $rows = [
            ['fullName' => 'A', 'studentID' => '2023-0001', 'section' => 'S', 'pin' => '1111',
                'gender' => 'female', 'parent_email' => 'Parent@Example.COM'],
            ['fullName' => 'B', 'studentID' => '2023-0002', 'section' => 'S', 'pin' => '2222',
                'gender' => 'male', 'parent_email' => ''],
        ];

        $response = $this->actingAs($this->teacher)->post('/teacher/addStudents', $this->bulkPayload($rows));

        $response->assertRedirect();

        $a = User::where('student_id', '2023-0001')->first();
        $this->assertEquals('female', $a->student->gender);
        $this->assertEquals('parent@example.com', $a->student->parent_email);

        $b = User::where('student_id', '2023-0002')->first();
        $this->assertEquals('male', $b->student->gender);
        $this->assertNull($b->student->parent_email);
    }

    public function test_exactly_fifty_rows_are_accepted(): void
    {
        $response = $this->actingAs($this->teacher)->post('/teacher/addStudents', $this->bulkPayload([], 50));

        $response->assertRedirect();
        $this->assertEquals(50, User::where('role', 'student')->count());
    }

    public function test_intra_batch_duplicate_is_case_and_whitespace_insensitive(): void
    {
        $rows = [
            ['fullName' => 'A', 'studentID' => 'ABC-0001 ', 'section' => 'S', 'pin' => '1111'],
            ['fullName' => 'B', 'studentID' => 'abc-0001', 'section' => 'S', 'pin' => '2222'],
        ];

        $response = $this->actingAs($this->teacher)->post('/teacher/addStudents', $this->bulkPayload($rows));

        $response->assertSessionHasErrors('students.1.studentID', '"abc-0001" appears twice in this list.');
        $this->assertArrayNotHasKey('students.0.studentID', session('errors')->getBag('default')->messages());
        $this->assertEquals(0, User::where('role', 'student')->count());
    }

    public function test_duplicate_against_existing_with_trailing_space_is_rejected(): void
    {
        User::factory()->create(['role' => 'student', 'student_id' => '2023-001']);

        $rows = [
            ['fullName' => 'A', 'studentID' => '2023-001 ', 'section' => 'S', 'pin' => '1111'],
        ];

        $response = $this->actingAs($this->teacher)->post('/teacher/addStudents', $this->bulkPayload($rows));

        $response->assertSessionHasErrors('students.0.studentID');
        $this->assertEquals(1, User::where('role', 'student')->count());
    }

    public function test_overlong_name_is_rejected_per_row(): void
    {
        $rows = [
            ['fullName' => str_repeat('A', 256), 'studentID' => '2023-0001', 'section' => 'S', 'pin' => '1111'],
        ];

        $response = $this->actingAs($this->teacher)->post('/teacher/addStudents', $this->bulkPayload($rows));

        $response->assertSessionHasErrors('students.0.fullName');
        $this->assertEquals(0, User::where('role', 'student')->count());
    }

    public function test_invalid_gender_is_rejected_per_row(): void
    {
        $rows = [
            ['fullName' => 'A', 'studentID' => '2023-0001', 'section' => 'S', 'pin' => '1111', 'gender' => 'other'],
        ];

        $response = $this->actingAs($this->teacher)->post('/teacher/addStudents', $this->bulkPayload($rows));

        $response->assertSessionHasErrors('students.0.gender');
        $this->assertEquals(0, User::where('role', 'student')->count());
    }

    public function test_invalid_email_is_rejected_per_row(): void
    {
        $rows = [
            ['fullName' => 'A', 'studentID' => '2023-0001', 'section' => 'S', 'pin' => '1111', 'parent_email' => 'not-an-email'],
        ];

        $response = $this->actingAs($this->teacher)->post('/teacher/addStudents', $this->bulkPayload($rows));

        $response->assertSessionHasErrors('students.0.parent_email');
        $this->assertEquals(0, User::where('role', 'student')->count());
    }

    public function test_missing_section_key_is_rejected_per_row(): void
    {
        $rows = [
            ['fullName' => 'A', 'studentID' => '2023-0001', 'pin' => '1111'],
        ];

        $response = $this->actingAs($this->teacher)->post('/teacher/addStudents', $this->bulkPayload($rows));

        $response->assertSessionHasErrors('students.0.section');
        $this->assertEquals(0, User::where('role', 'student')->count());
    }

    public function test_multiple_bad_rows_report_their_own_indices(): void
    {
        $rows = [
            ['fullName' => '   ', 'studentID' => '2023-0001', 'section' => 'S', 'pin' => '1111'],
            ['fullName' => 'B', 'studentID' => '2023-0002', 'section' => 'S', 'pin' => '2222'],
            ['fullName' => 'C', 'studentID' => '2023-0003', 'section' => 'S', 'pin' => '12a4'],
        ];

        $response = $this->actingAs($this->teacher)->post('/teacher/addStudents', $this->bulkPayload($rows));

        $response->assertSessionHasErrors('students.0.fullName');
        $response->assertSessionHasErrors('students.2.pin');
        $this->assertEquals(0, User::where('role', 'student')->count());
    }

    public function test_non_array_students_is_rejected(): void
    {
        $response = $this->actingAs($this->teacher)->post('/teacher/addStudents', ['students' => 'oops']);

        $response->assertSessionHasErrors('students.0.fullName');
        $this->assertEquals(0, User::where('role', 'student')->count());
    }

    public function test_empty_gender_passes_and_stores_null(): void
    {
        $rows = [
            ['fullName' => 'A', 'studentID' => '2023-0001', 'section' => 'S', 'pin' => '1111', 'gender' => ''],
        ];

        $response = $this->actingAs($this->teacher)->post('/teacher/addStudents', $this->bulkPayload($rows));

        $response->assertRedirect();

        $user = User::where('role', 'student')->first();
        $this->assertNull($user->student->gender);
        $this->assertNull($user->student->parent_email);
    }

    public function test_student_cannot_bulk_add_students(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        $response = $this->actingAs($student)->post('/teacher/addStudents', $this->bulkPayload());

        $response->assertForbidden();
        $this->assertEquals(1, User::where('role', 'student')->count());
    }

    public function test_guest_is_redirected_from_bulk_add(): void
    {
        $response = $this->post('/teacher/addStudents', $this->bulkPayload());

        $response->assertRedirect();
        $this->assertEquals(0, User::where('role', 'student')->count());
    }
}
