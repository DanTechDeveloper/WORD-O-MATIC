<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('word_modules', function (Blueprint $table) {
            $table->boolean('is_tutorial')->default(false)->after('title');
        });

        Schema::table('paragraph_modules', function (Blueprint $table) {
            $table->boolean('is_tutorial')->default(false)->after('content');
        });
    }

    public function down(): void
    {
        Schema::table('word_modules', function (Blueprint $table) {
            $table->dropColumn('is_tutorial');
        });

        Schema::table('paragraph_modules', function (Blueprint $table) {
            $table->dropColumn('is_tutorial');
        });
    }
};
