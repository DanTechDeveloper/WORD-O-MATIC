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

    public function test_finish_round_progress_indexes_exist(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            $this->markTestSkipped('MySQL only');
        }

        $swp = collect(DB::select('SHOW INDEX FROM student_word_progress'))->pluck('Key_name');
        $this->assertTrue($swp->contains('swp_user_module_index'), 'Missing swp_user_module_index');

        $spp = collect(DB::select('SHOW INDEX FROM student_paragraph_progress'))->pluck('Key_name');
        $this->assertTrue($spp->contains('spp_user_module_index'), 'Missing spp_user_module_index');
    }

    public function test_finish_round_game_sessions_indexes_exist(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            $this->markTestSkipped('MySQL only');
        }

        $gs = collect(DB::select('SHOW INDEX FROM game_sessions'))->pluck('Key_name');
        $this->assertTrue($gs->contains('game_sessions_user_deadline_index'), 'Missing game_sessions_user_deadline_index from 09_15');
        $this->assertTrue($gs->contains('game_sessions_user_module_index'), 'Missing game_sessions_user_module_index from 09_15');
        $this->assertTrue($gs->contains('gs_user_mod_type_deadline_idx'), 'Missing gs_user_mod_type_deadline_idx');
        $this->assertTrue($gs->contains('gs_user_deadline_type_idx'), 'Missing gs_user_deadline_type_idx');
    }
}
