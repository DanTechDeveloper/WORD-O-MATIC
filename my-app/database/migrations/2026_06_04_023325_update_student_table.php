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
        Schema::table('students', function (Blueprint $table) {
            $table->enum('status', ['atRisk', 'excellent', 'support', 'notStarted'])->default("notStarted");
            $table->enum('wordRisk', ['high', 'moderate', 'low', 'N/A'])->default("N/A");
            $table->enum('paragraphRisk', ['high', 'moderate', 'low', 'N/A'])->default("N/A");

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            //
        });
    }
};
