<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->integer('points')->default(0)->after('user_id');
            $table->text('avatar')->nullable()->after('points');
            $table->string('last_active_level')->nullable()->after('avatar');
            $table->integer('read_progress')->default(0)->after('last_active_level');
            $table->integer('speak_progress')->default(0)->after('read_progress');
            $table->json('unlocked_badges')->nullable()->after('speak_progress');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                'points',
                'avatar',
                'last_active_level',
                'read_progress',
                'speak_progress',
                'unlocked_badges'
            ]);
        });
    }
};
