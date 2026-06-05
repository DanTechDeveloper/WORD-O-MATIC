<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->renameColumn('unlocked_badges', 'badges');
        });

        Schema::table('students', function (Blueprint $table) {
            $table->enum('badges', ['word master', 'story finisher', 'clear speaker'])
                ->nullable()
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->renameColumn('badges', 'unlocked_badges');
            // Возврат типа данных к JSON (исходное состояние)
            $table->json('unlocked_badges')->nullable()->change();
        });
    }
};
