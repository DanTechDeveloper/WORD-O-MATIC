<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class StudentController extends Controller
{
    public function index()
    {
        return Inertia::render('Auth/SessionPage');
    }

    public function welcome()
    {
        return Inertia::render('Student/Welcome');
    }

    public function dashboard()
    {
        return Inertia::render('Student/Dashboard');
    }

    public function greetings()
    {
        return Inertia::render('Student/Greetings');
    }

    public function tutorial()
    {
        return Inertia::render('Student/Tutorial');
    }

    public function leaderboard()
    {
        return Inertia::render('Student/Leaderboards');
    }

    public function badges()
    {
        return Inertia::render('Student/Badges');
    }

    public function readModeLevels()
    {
        return Inertia::render('Student/ReadModeLevels');
    }

    public function speakModeLevels()
    {
        return Inertia::render('Student/SpeakModeLevels');
    }

    public function gameplaySpeakMode()
    {
        return Inertia::render('Student/GameplaySpeakMode');
    }

    public function gameplayReadMode()
    {
        return Inertia::render('Student/GameplayReadMode');
    }
}
