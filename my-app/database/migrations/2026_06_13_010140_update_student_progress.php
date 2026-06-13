<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
      

        DB::statement("ALTER TABLE student_word_progress MODIFY COLUMN status ENUM('masteryZone', 'learningZone') NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE student_word_progress MODIFY COLUMN status ENUM('masteryZone', 'learningZone') NULL");
    }
};