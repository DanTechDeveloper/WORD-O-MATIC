<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->index(['status', 'section'], 'students_status_section_index');
            $table->index('points', 'students_points_index');
        });

        Schema::table('student_badges', function (Blueprint $table) {
            $table->index(['user_id', 'badge_id'], 'student_badges_user_badge_index');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropIndex('students_status_section_index');
            $table->dropIndex('students_points_index');
        });

        Schema::table('student_badges', function (Blueprint $table) {
            $table->dropIndex('student_badges_user_badge_index');
        });
    }
};
