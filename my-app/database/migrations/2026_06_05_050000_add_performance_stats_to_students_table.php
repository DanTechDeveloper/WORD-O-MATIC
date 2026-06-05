<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (! Schema::hasColumn('students', 'words_smashed')) {
                $table->integer('words_smashed')->default(0);
            }
            if (! Schema::hasColumn('students', 'accuracy')) {
                $table->decimal('accuracy', 5, 2)->nullable();
            }
            if (! Schema::hasColumn('students', 'read_level')) {
                $table->integer('read_level')->default(1);
            }
            if (! Schema::hasColumn('students', 'speak_level')) {
                $table->integer('speak_level')->default(1);
            }
        });
    }

    
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $cols = ['words_smashed', 'accuracy', 'read_level', 'speak_level'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('students', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
