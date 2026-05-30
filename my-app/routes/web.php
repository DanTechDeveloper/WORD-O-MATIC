<?php

use App\Http\Controllers\StudentController;
use App\Http\Controllers\TeacherController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;


Route::get("/teacher/dashboard", [TeacherController::class, "dashboard"]);
Route::get("/teacher/students", [TeacherController::class, "students"]);
Route::get("/teacher/reports", [TeacherController::class, "reports"]);


Route::get("/", [StudentController::class, "index"]);
Route::get("/welcome", [StudentController::class, "welcome"]);
Route::get("/greetings", [StudentController::class, "greetings"]);
Route::get("/dashboard", [StudentController::class, "dashboard"]);
Route::get("/tutorial", [StudentController::class, "tutorial"]);
Route::get("/leaderboards", [StudentController::class, "leaderboard"]);
Route::get("/badges", [StudentController::class, "badges"]);
Route::get("/readModeLevels", [StudentController::class, "readModeLevels"]);
Route::get("/speakModeLevels", [StudentController::class, "speakModeLevels"]);
Route::get("/gameplaySpeakMode", [StudentController::class, "gameplaySpeakMode"]);
Route::get("/gameplayReadMode", [StudentController::class, "gameplayReadMode"]);


?>

