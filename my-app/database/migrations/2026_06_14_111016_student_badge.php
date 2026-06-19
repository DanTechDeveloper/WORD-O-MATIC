<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_badges', function (Blueprint $table) {

            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('badge_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->timestamp('earned_at')->nullable();

            // % progress toward badge (0 - 100)
            $table->decimal('progress', 5, 2)->default(0);

            // badge state tracking
            $table->enum('status', ['earned', 'claimable', 'in_progress'])
                ->default('in_progress');

            // optional: link to game session
            $table->unsignedBigInteger('unlocked_session_id')->nullable();

            $table->timestamps();

            $table->unique(['user_id', 'badge_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_badges');
    }
};