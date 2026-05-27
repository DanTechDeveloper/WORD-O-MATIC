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
    public function greetings()
    {
        return Inertia::render("Student/Greetings");
    }


}
