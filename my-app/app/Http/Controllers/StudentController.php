<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentController extends Controller

{
    public function index()
    {
        return Inertia::render("Auth/Student");
    }
    public function dashboard(){
        return Inertia::render("Student/Dashboard");
    }
    public function greetings()
    {
        return Inertia::render("Student/Greetings");
    }
    public function tutorial(){
        return Inertia::render("Student/Tutorial");
    }
    public function leaderboard(){
        return Inertia::render("Student/Leaderboards");
    }
    public function badges(){
        return Inertia::render("Student/Badges");
    }


}
