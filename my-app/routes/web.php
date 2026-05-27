<?php

use App\Http\Controllers\StudentController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;

Route::get("/", [StudentController::class, "index"]);
Route::get("/greetings", [StudentController::class, "greetings"]);
Route::get("/dashboard", [StudentController::class, "dashboard"]);
Route::get("/tutorial", [StudentController::class, "tutorial"]);
Route::get("/leaderboards", [StudentController::class, "leaderboard"]);
Route::get("/badges", [StudentController::class, "badges"]);
Route::get("/readModeLevels", [StudentController::class, "readModeLevels"]);


?>

