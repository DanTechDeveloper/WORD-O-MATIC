<?php

use App\Http\Controllers\StudentController;
use App\Http\Controllers\TeacherController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;


Route::get("/teacher/login", [TeacherController::class, "login"]);
Route::get("/teacher/dashboard", [TeacherController::class, "dashboard"]);
Route::get("/teacher/students", [TeacherController::class, "students"]);
Route::get("/teacher/reports", [TeacherController::class, "reports"]);


Route::get("/", [StudentController::class, "index"]);
Route::get("/student/welcome", [StudentController::class, "welcome"]);  
Route::get("/student/greetings", [StudentController::class, "greetings"]);
Route::get("/student/dashboard", [StudentController::class, "dashboard"]);
Route::get("/student/tutorial", [StudentController::class, "tutorial"]);
Route::get("/student/leaderboards", [StudentController::class, "leaderboard"]);
Route::get("/student/badges", [StudentController::class, "badges"]);
Route::get("/student/readModeLevels", [StudentController::class, "readModeLevels"]);
Route::get("/student/speakModeLevels", [StudentController::class, "speakModeLevels"]);
Route::get("/student/gameplaySpeakMode", [StudentController::class, "gameplaySpeakMode"]);
Route::get("/student/gameplayReadMode", [StudentController::class, "gameplayReadMode"]);


?>

