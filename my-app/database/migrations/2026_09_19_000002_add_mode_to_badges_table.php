<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('badges', function (Blueprint $table) {
            // ponytail: which mode a badge belongs to (word | paragraph | shared).
            // Display grouping lives here, not in slug conventions or frontend maps.
            $table->string('mode', 16)->default('shared')->after('metric');
        });

        DB::table('badges')->whereIn('metric', ['word_completion', 'streak'])->update(['mode' => 'word']);
        DB::table('badges')->where('metric', 'paragraph_completion')->update(['mode' => 'paragraph']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('badges', function (Blueprint $table) {
            $table->dropColumn('mode');
        });
    }
};
