<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class IndexesExistTest extends TestCase
{
    use RefreshDatabase;

    public function test_students_status_section_index_exists(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            $this->markTestSkipped('MySQL only — sqlite does not have information_schema indexes');
        }

        $indexes = collect(DB::select("SHOW INDEX FROM students"))->pluck('Key_name');
        $this->assertTrue($indexes->contains('students_status_section_index'), 'Missing students_status_section_index from 06b648f');
        $this->assertTrue($indexes->contains('students_points_index'), 'Missing students_points_index');
    }

    public function test_student_badges_index_exists(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            $this->markTestSkipped('MySQL only');
        }

        $indexes = collect(DB::select("SHOW INDEX FROM student_badges"))->pluck('Key_name');
        $this->assertTrue($indexes->contains('student_badges_user_badge_index'));
    }
}
