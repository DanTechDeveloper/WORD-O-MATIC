<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('badges', function (Blueprint $table) {
            if (Schema::hasColumn('badges', 'operator')) {
                $table->dropColumn('operator');
            }
            if (Schema::hasColumn('badges', 'requirement')) {
                $table->dropColumn('requirement');
            }
        });
    }

    public function down(): void
    {
        Schema::table('badges', function (Blueprint $table) {
            if (! Schema::hasColumn('badges', 'operator')) {
                $table->string('operator')->nullable()->after('metric');
            }
            if (! Schema::hasColumn('badges', 'requirement')) {
                $table->string('requirement')->nullable()->after('threshold_score');
            }
        });
    }
};
