<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_paragraph_progress', function (Blueprint $table) {
            $table->decimal('accuracy', 5, 2)->default(0)->after('words_smashed');
        });
    }

    public function down(): void
    {
        Schema::table('student_paragraph_progress', function (Blueprint $table) {
            $table->dropColumn('accuracy');
        });
    }
};
