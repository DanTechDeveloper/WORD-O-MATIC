<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Запуск миграции для добавления полей статистики и уровней.
     * Добавляет 4 колонки согласно спецификации в запросе.
     */
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // words_smashed: integer, default 0 (Общее количество слов)
            $table->integer('words_smashed')->default(0);
            // accuracy: decimal(5,2), nullable (Процент точности)
            $table->decimal('accuracy', 5, 2)->nullable();
            // read_level: integer, default 1 (Уровень чтения)
            $table->integer('read_level')->default(1);
            // speak_level: integer, default 1 (Уровень говорения)
            $table->integer('speak_level')->default(1);
        });
    }

    /**
     * Откат миграции: удаление созданных колонок.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['words_smashed', 'accuracy', 'read_level', 'speak_level']);
        });
    }
};
