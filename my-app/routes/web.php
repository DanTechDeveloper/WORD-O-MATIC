<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
Route::inertia("/", "Auth/Student");
Route::get("/greetings", function () {
    return Inertia::render("Student/Greetings");
});



?>

