<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class TeacherController extends Controller
{
    public function login()
    {
        return Inertia::render('Teacher/Login');
    }

    public function dashboard()
    {
        return Inertia::render('Teacher/Dashboard');
    }

    public function students()
    {
        return Inertia::render('Teacher/Students');
    }

    public function reports()
    {
        return Inertia::render('Teacher/Reports');
    }

    public function studentDetails()
    {
        return Inertia::render('Teacher/StudentDetails');
    }
}
