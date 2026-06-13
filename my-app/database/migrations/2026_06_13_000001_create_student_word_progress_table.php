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
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('word_module_id');
            $table->string('status')->default('locked');
            $table->integer('words_smashed')->default(0);
            $table->decimal('accuracy', 5, 2)->default(0);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('word_module_id')->references('id')->on('word_modules')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_word_progress');
    }
};
