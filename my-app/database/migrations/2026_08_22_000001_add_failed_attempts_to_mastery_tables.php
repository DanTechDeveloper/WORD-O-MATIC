<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_word_mastery', function (Blueprint $table) {
            $table->unsignedInteger('failed_attempts')->default(0)->after('status');
        });

        Schema::table('student_paragraph_mastery', function (Blueprint $table) {
            $table->unsignedInteger('failed_attempts')->default(0)->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('student_word_mastery', function (Blueprint $table) {
            $table->dropColumn('failed_attempts');
        });

        Schema::table('student_paragraph_mastery', function (Blueprint $table) {
            $table->dropColumn('failed_attempts');
        });
    }
};
