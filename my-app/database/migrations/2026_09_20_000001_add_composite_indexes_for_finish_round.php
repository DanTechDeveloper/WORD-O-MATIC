<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_word_progress', function (Blueprint $table) {
            // ponytail: finishRound hot path — where user_id + word_module_id (avg, sum, firstOrNew)
            // INDEX not UNIQUE: same read perf, safe if historic dupes exist
            $table->index(['user_id', 'word_module_id'], 'swp_user_module_index');
        });

        Schema::table('student_paragraph_progress', function (Blueprint $table) {
            $table->index(['user_id', 'paragraph_module_id'], 'spp_user_module_index');
        });

        Schema::table('game_sessions', function (Blueprint $table) {
            // ponytail: results bestScore MAX(score) where user+module+type+deadlineHit
            $table->index(['user_id', 'module_id', 'module_type', 'is_deadline_hit'], 'gs_user_mod_type_deadline_idx');
            // ponytail: bestSessionMetric MAX(streak) where user+deadlineHit+type
            $table->index(['user_id', 'is_deadline_hit', 'module_type'], 'gs_user_deadline_type_idx');
        });
    }

    public function down(): void
    {
        Schema::table('student_word_progress', function (Blueprint $table) {
            $table->dropIndex('swp_user_module_index');
        });

        Schema::table('student_paragraph_progress', function (Blueprint $table) {
            $table->dropIndex('spp_user_module_index');
        });

        Schema::table('game_sessions', function (Blueprint $table) {
            $table->dropIndex('gs_user_mod_type_deadline_idx');
            $table->dropIndex('gs_user_deadline_type_idx');
        });
    }
};
