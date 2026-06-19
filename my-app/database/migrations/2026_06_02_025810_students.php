<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->integer('points')->default(0);
            $table->unsignedInteger('read_progress')->default(0);
            $table->text('avatar')->nullable();
            $table->unsignedInteger('speak_progress')->default(0);
            $table->string('badges')->nullable();
            $table->unsignedInteger('words_smashed')->default(0);
            $table->decimal('accuracy', 5, 2)->default(0);
            $table->unsignedInteger('read_level')->default(1);
            $table->unsignedInteger('speak_level')->default(1);
            $table->string('section')->nullable();
            $table->enum('status', ['atRisk', 'excellent', 'support', 'notStarted'])->default('notStarted');
            $table->enum('wordRisk', ['high', 'moderate', 'low', 'N/A'])->default('N/A');
            $table->enum('paragraphRisk', ['high', 'moderate', 'low', 'N/A'])->default('N/A');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
