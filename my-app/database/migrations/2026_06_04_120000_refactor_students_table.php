<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // Link to users table
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete()->after('id');

            // Drop credential columns that now live in users table
            $table->dropColumn(['fullName', 'studentID']);
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');

            $table->string('fullName')->after('id');
            $table->string('studentID')->unique()->after('fullName');
        });
    }
};
