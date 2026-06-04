<?php

use App\Http\Controllers\StudentController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('teacher')->name('teacher.')->group(function () {
    Route::post('/addStudent', [TeacherController::class, 'store'])->name('addStudent.store');
    Route::get('/addStudent', [TeacherController::class, 'addStudent'])->name('addStudent');

    Route::get('/wordModules', [TeacherController::class, 'wordModules'])->name('wordModules');
    Route::put('/wordModules', [TeacherController::class, 'updateWordModule'])->name('wordModules.update');

    Route::get('/paragraphModules', [TeacherController::class, 'paragraphModules'])->name('paragraphModules');

    Route::put('/paragraphModules', [TeacherController::class, 'updateParagraphModule'])->name('paragraphModules.update');

    Route::get('/login', [TeacherController::class, 'login'])->name('login');
    Route::get('/dashboard', [TeacherController::class, 'dashboard'])->name('dashboard');
    Route::get('/classes', [TeacherController::class, 'classes'])->name('classes');
    Route::get('/students', [TeacherController::class, 'students'])->name('students');
    Route::get('/reports', [TeacherController::class, 'reports'])->name('reports');
    Route::get('/studentDetails', [TeacherController::class, 'studentDetails'])->name('studentDetails');
    Route::get('/leaderboards', [TeacherController::class, 'leaderboards'])->name('leaderboards');
    Route::get('/assignments', [TeacherController::class, 'assignments'])->name('assignments');
});

Route::get('/', [StudentController::class, 'index'])->name('home');
Route::post('/', [UserController::class, 'login']);



Route::prefix('student')->name('student.')->group(function () {

    Route::get('/greetings', [StudentController::class, 'greetings'])->name('greetings');
    Route::get('/dashboard', [StudentController::class, 'dashboard'])->name('dashboard');
    Route::get('/tutorial', [StudentController::class, 'tutorial'])->name('tutorial');
    Route::get('/leaderboards', [StudentController::class, 'leaderboards'])->name('leaderboards');
    Route::get('/badges', [StudentController::class, 'badges'])->name('badges');
    Route::get('/readModeLevels', [StudentController::class, 'readModeLevels'])->name('readModeLevels');
    Route::get('/speakModeLevels', [StudentController::class, 'speakModeLevels'])->name('speakModeLevels');
    Route::get('/gameplaySpeakMode', [StudentController::class, 'gameplaySpeakMode'])->name('gameplaySpeakMode');
    Route::get('/gameplayReadMode', [StudentController::class, 'gameplayReadMode'])->name('gameplayReadMode');
});
