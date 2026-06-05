<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Создание таблицы прогресса слов ученика.
     * Таблица связывает пользователя с конкретными словами и их статусом в учебном плане.
     */
    public function up(): void
    {
        Schema::create('student_word_progress', function (Blueprint $table) {
            // Первичный ключ
            $table->id();
            // Внешний ключ: ссылка на таблицу пользователей
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            // Внешний ключ: ссылка на модуль (уровень Level 1-10)
            $table->foreignId('word_module_id')->constrained('word_modules')->onDelete('cascade');
            // Внешний ключ: ссылка на конкретное слово
            $table->foreignId('word_id')->constrained('words')->onDelete('cascade');
            // Статус прогресса: освоено, в процессе тренировки или заблокировано
            $table->enum('status', ['mastered', 'training', 'locked'])->default('locked');
            $table->timestamps();

            // Индекс для обеспечения уникальности: один статус на пару пользователь-слово
            $table->unique(['user_id', 'word_id'], 'student_word_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_word_progress');
    }
};
