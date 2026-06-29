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
            // SQLite doesn't support ENUM — recreate column without CHECK constraint
            Schema::table('students', function (Blueprint $table) {
                $table->string('status', 20)->default('notStarted')->change();
            });

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
