<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::rename('students', 'students_old');

        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['atRisk', 'excellent', 'support', 'notStarted'])->default('notStarted');
            $table->enum('wordRisk', ['high', 'moderate', 'low', 'N/A'])->default('N/A');
            $table->enum('paragraphRisk', ['high', 'moderate', 'low', 'N/A'])->default('N/A');
            $table->timestamps();
        });

        $oldStudents = DB::table('students_old')->get();
        foreach ($oldStudents as $oldStudent) {
            $user = DB::table('users')->where('student_id', $oldStudent->studentID)->first();
            DB::table('students')->insert([
                'id' => $oldStudent->id,
                'user_id' => $user ? $user->id : null,
                'status' => $oldStudent->status ?? 'notStarted',
                'wordRisk' => $oldStudent->wordRisk ?? 'N/A',
                'paragraphRisk' => $oldStudent->paragraphRisk ?? 'N/A',
                'created_at' => $oldStudent->created_at,
                'updated_at' => $oldStudent->updated_at,
            ]);
        }

        Schema::dropIfExists('students_old');
    }

    public function down(): void
    {
        Schema::rename('students', 'students_new');

        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('fullName');
            $table->string('studentID')->unique();
            $table->enum('status', ['atRisk', 'excellent', 'support', 'notStarted'])->default('notStarted');
            $table->enum('wordRisk', ['high', 'moderate', 'low', 'N/A'])->default('N/A');
            $table->enum('paragraphRisk', ['high', 'moderate', 'low', 'N/A'])->default('N/A');
            $table->timestamps();
        });

        $newStudents = DB::table('students_new')->get();
        foreach ($newStudents as $newStudent) {
            $user = DB::table('users')->where('id', $newStudent->user_id)->first();
            DB::table('students')->insert([
                'id' => $newStudent->id,
                'fullName' => $user ? $user->name : '',
                'studentID' => $user ? $user->student_id : '',
                'status' => $newStudent->status ?? 'notStarted',
                'wordRisk' => $newStudent->wordRisk ?? 'N/A',
                'paragraphRisk' => $newStudent->paragraphRisk ?? 'N/A',
                'created_at' => $newStudent->created_at,
                'updated_at' => $newStudent->updated_at,
            ]);
        }

        Schema::dropIfExists('students_new');
    }
};
