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
        Schema::table('game_sessions', function (Blueprint $table) {
            // Permanent attribute: TRUE if the round was played while the report
            // deadline was closed. Sticky — never flipped when the deadline is
            // later cleared, so badge/streak metrics stay historically accurate.
            $table->boolean('is_deadline_hit')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('game_sessions', function (Blueprint $table) {
            $table->dropColumn('is_deadline_hit');
        });
    }
};
