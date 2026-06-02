<?php

use App\Http\Controllers\StudentController;
use App\Http\Controllers\TeacherController;
use Illuminate\Support\Facades\Route;

Route::prefix('teacher')->name('teacher.')->group(function () {
    Route::post('/addStudent', [TeacherController::class, 'store'])->name('addStudent.store');
    Route::get('/addStudent', [TeacherController::class, 'addStudent'])->name('addStudent');
    Route::get('/login', [TeacherController::class, 'login'])->name('login');
    Route::get('/dashboard', [TeacherController::class, 'dashboard'])->name('dashboard');
    Route::get('/classes', [TeacherController::class, 'classes'])->name('classes');
    Route::get('/students', [TeacherController::class, 'students'])->name('students');
    Route::get('/reports', [TeacherController::class, 'reports'])->name('reports');
    Route::get('/studentDetails', [TeacherController::class, 'studentDetails'])->name('studentDetails');
    Route::get('/wordModules', [TeacherController::class, 'wordModules'])->name('wordModules');
    Route::get('/paragraphModules', [TeacherController::class, 'paragraphModules'])->name('paragraphModules');
    Route::get('/leaderboards', [TeacherController::class, 'leaderboards'])->name('leaderboards');
    Route::get('/assignments', [TeacherController::class, 'assignments'])->name('assignments');
});

Route::get('/', [StudentController::class, 'index']);
Route::get('/student/welcome', [StudentController::class, 'welcome']);
Route::get('/student/greetings', [StudentController::class, 'greetings']);
Route::get('/student/dashboard', [StudentController::class, 'dashboard']);
Route::get('/student/tutorial', [StudentController::class, 'tutorial']);
Route::get('/student/leaderboards', [StudentController::class, 'leaderboard']);
Route::get('/student/badges', [StudentController::class, 'badges']);
Route::get('/student/readModeLevels', [StudentController::class, 'readModeLevels']);
Route::get('/student/speakModeLevels', [StudentController::class, 'speakModeLevels']);
Route::get('/student/gameplaySpeakMode', [StudentController::class, 'gameplaySpeakMode']);
Route::get('/student/gameplayReadMode', [StudentController::class, 'gameplayReadMode']);
