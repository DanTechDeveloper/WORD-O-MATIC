<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            DB::update("UPDATE students SET status = 'in_progress' WHERE status = 'playing'");

            return;
        }

        DB::statement("ALTER TABLE students MODIFY COLUMN status ENUM('atRisk', 'support', 'onTrack', 'notStarted', 'playing', 'in_progress') DEFAULT 'notStarted'");
        DB::update("UPDATE students SET status = 'in_progress' WHERE status = 'playing'");
        DB::statement("ALTER TABLE students MODIFY COLUMN status ENUM('atRisk', 'support', 'onTrack', 'notStarted', 'in_progress') DEFAULT 'notStarted'");
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE students MODIFY COLUMN status ENUM('atRisk', 'support', 'onTrack', 'notStarted', 'in_progress', 'playing') DEFAULT 'notStarted'");
        DB::update("UPDATE students SET status = 'playing' WHERE status = 'in_progress'");
        DB::statement("ALTER TABLE students MODIFY COLUMN status ENUM('atRisk', 'support', 'onTrack', 'notStarted', 'playing') DEFAULT 'notStarted'");
    }
};
