<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('email')->nullable()->after('name');
        });

        Schema::table('students', function (Blueprint $table) {
            $table->string('parent_email')->nullable()->after('section');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('email');
        });

        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn('parent_email');
        });
    }
};
