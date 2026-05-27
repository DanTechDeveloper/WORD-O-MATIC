<?php

use App\Http\Controllers\StudentController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get("/", [StudentController::class, "index"]);
Route::get("/greetings", [StudentController::class, "greetings"]);



?>

