<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE students MODIFY COLUMN status ENUM('atRisk', 'support', 'onTrack', 'notStarted', 'playing') DEFAULT 'notStarted'");
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE students MODIFY COLUMN status ENUM('atRisk', 'support', 'onTrack', 'notStarted') DEFAULT 'notStarted'");
    }
};
