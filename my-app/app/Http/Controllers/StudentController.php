<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\WordModule;

class StudentController extends Controller
{

    public function index()
    {
        return Inertia::render('Student/Login');
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

    public function leaderboards()
    {
        return Inertia::render('Student/Leaderboards');
    }

    public function badges()
    {
        return Inertia::render('Student/Badges');
    }

    public function readModeLevels()
    {
        $modules = WordModule::with('words')->orderBy('level', 'asc')->get();
        return Inertia::render('Student/ReadModeLevels' ,[
            'modules' => $modules,
        ]);
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
