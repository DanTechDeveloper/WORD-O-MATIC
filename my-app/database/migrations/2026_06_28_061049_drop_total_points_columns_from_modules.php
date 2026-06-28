<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('word_modules', function (Blueprint $table) {
            $table->dropColumn('total_points');
        });

        Schema::table('paragraph_modules', function (Blueprint $table) {
            $table->dropColumn('total_score');
        });
    }

    public function down(): void
    {
        Schema::table('word_modules', function (Blueprint $table) {
            $table->integer('total_points')->default(0)->after('title');
        });

        Schema::table('paragraph_modules', function (Blueprint $table) {
            $table->integer('total_score')->default(0);
        });
    }
};
