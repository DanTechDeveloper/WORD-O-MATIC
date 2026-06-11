<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::create('student_word_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('word_module_id')->constrained('word_modules')->onDelete('cascade');
            $table->foreignId('word_id')->constrained('words')->onDelete('cascade');
            $table->enum('status', ['mastered', 'training', 'locked'])->default('locked');
            $table->timestamps();

            $table->unique(['user_id', 'word_id'], 'student_word_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_word_progress');
    }
};
