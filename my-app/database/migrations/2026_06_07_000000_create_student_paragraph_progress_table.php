<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStudentParagraphProgressTable extends Migration
{
    public function up(): void
    {
        Schema::create('student_paragraph_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('paragraph_module_id')->constrained('paragraph_modules')->onDelete('cascade');
            $table->string('status')->default('not_started');
            $table->integer('words_smashed')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_paragraph_progress');
    }
}
