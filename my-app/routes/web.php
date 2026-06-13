<?php

use App\Http\Controllers\StudentController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\UserController;
use App\Http\Middleware\CheckStudentOnboarding;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

 Route::middleware('guest')->group(function () {
    Route::get('/', [UserController::class, 'index'])->name('login');
     Route::post('/', [UserController::class, 'login']);
 });

// Route::inertia("/", "Testing/Microphone");

Route::middleware(['auth'])->group(function () {
    Route::post('/logout', [UserController::class, 'logout'])->name('logout');

    Route::prefix('teacher')
        ->name('teacher.')
        ->middleware('role:teacher')
        ->group(function () {
            Route::post('/addStudent', [TeacherController::class, 'store'])->name('addStudent.store');
            Route::get('/addStudent', [TeacherController::class, 'addStudent'])->name('addStudent');

            Route::get('/wordModules', [TeacherController::class, 'wordModules'])->name('wordModules');
            Route::put('/wordModules', [TeacherController::class, 'updateWordModule'])->name('wordModules.update');

            Route::get('/paragraphModules', [TeacherController::class, 'paragraphModules'])->name('paragraphModules');

            Route::put('/paragraphModules', [TeacherController::class, 'updateParagraphModule'])->name('paragraphModules.update');

            Route::get('/dashboard', [TeacherController::class, 'dashboard'])->name('dashboard');
             Route::get('/classes', [TeacherController::class, 'classes'])->name('classes');
             Route::get('/students', [TeacherController::class, 'students'])->name('students');
             Route::get('/studentDetails/{student}', [TeacherController::class, 'show'])->name('studentDetails.show');
             Route::get('/reports', [TeacherController::class, 'reports'])->name('reports');
             Route::get('/leaderboards', [TeacherController::class, 'leaderboards'])->name('leaderboards');
             Route::get('/assignments', [TeacherController::class, 'assignments'])->name('assignments');
         });

     Route::prefix('student')
         ->name('student.')
         ->middleware(['role:student', CheckStudentOnboarding::class])
         ->group(function () {
             // Onboarding Routes (now protected by the same middleware to prevent re-entry)
             Route::get('/splashScreen', [StudentController::class, 'splashScreen'])->name('splashScreen');
             Route::get('/avatarSelection', [StudentController::class, 'avatarSelection'])->name('avatarSelection');
             Route::post('/avatar', [StudentController::class, 'updateAvatar'])->name('updateAvatar');
             Route::get('/greetings', [StudentController::class, 'greetings'])->name('greetings');

             // Main Application Routes
             Route::get('/dashboard', [StudentController::class, 'dashboard'])->name('dashboard');
             Route::get('/tutorial', [StudentController::class, 'tutorial'])->name('tutorial');
             Route::get('/leaderboards', [StudentController::class, 'leaderboards'])->name('leaderboards');
             Route::get('/badges', [StudentController::class, 'badges'])->name('badges');
             Route::get('/readModeLevels', [StudentController::class, 'readModeLevels'])->name('readModeLevels');
             Route::get('/speakModeLevels', [StudentController::class, 'speakModeLevels'])->name('speakModeLevels');
             Route::get('/gameplaySpeakMode/{id}', [StudentController::class, 'gameplaySpeakMode'])->name('gameplaySpeakMode');
             Route::get('/gameplayReadMode/{id}', [StudentController::class, 'gameplayReadMode'])->name('gameplayReadMode');
             Route::post('/saveParagraphProgress', [StudentController::class, 'saveParagraphProgress'])->name('saveParagraphProgress');
             Route::post('/saveWordProgress', [StudentController::class, 'saveWordProgress'])->name('saveWordProgress');
             Route::post('/updateWordMastery', [StudentController::class, 'updateWordMastery'])->name('updateWordMastery');
         });
 });
