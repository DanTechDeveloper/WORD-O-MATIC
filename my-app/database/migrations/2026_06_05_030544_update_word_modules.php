<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    
    public function up(): void
    {
        Schema::table('word_modules', function (Blueprint $table) {
            $table->integer('total_points')->default(0)->after('title');
        });
    }

    
    public function down(): void
    {
        Schema::table('word_modules', function (Blueprint $table) {
            $table->dropColumn('total_points');
        });
    }
};
