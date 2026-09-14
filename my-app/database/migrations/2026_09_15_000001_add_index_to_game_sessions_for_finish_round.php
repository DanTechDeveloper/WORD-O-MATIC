<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('game_sessions', function (Blueprint $table) {
            // ponytail: finishRound + badges hot path — max(streak) where user_id + is_deadline_hit, and results bestScore
            $table->index(['user_id', 'is_deadline_hit'], 'game_sessions_user_deadline_index');
            $table->index(['user_id', 'module_id', 'module_type'], 'game_sessions_user_module_index');
        });
    }

    public function down(): void
    {
        Schema::table('game_sessions', function (Blueprint $table) {
            $table->dropIndex('game_sessions_user_deadline_index');
            $table->dropIndex('game_sessions_user_module_index');
        });
    }
};
