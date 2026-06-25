<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_paragraph_mastery', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('paragraph_word_id')->constrained('paragraph_words')->onDelete('cascade');
            $table->enum('status', ['mastered', 'training'])->default('training');
            $table->timestamps();

            $table->unique(['user_id', 'paragraph_word_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_paragraph_mastery');
    }
};
