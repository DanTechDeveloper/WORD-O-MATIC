<?php

namespace App\Http\Controllers;

use App\Models\ParagraphModule;
use App\Models\WordModule;
use Inertia\Inertia;

class StudentController extends Controller
{

    public function dashboard()
    {
        $data = auth()->user()->student()
            ->with('user:id,name,student_id')
            ->select([
                'user_id',
                'last_active_level', 'read_progress', 'speak_progress',
                'badges', 'read_level', 'speak_level',
            ])
            ->first();

        return Inertia::render('Student/Dashboard', [
            'data' => $data,
        ]);
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

        return Inertia::render('Student/ReadModeLevels', [
            'modules' => $modules,
        ]);
    }

    public function speakModeLevels()
    {

        $modules = ParagraphModule::orderBy('level', 'asc')->get();

        return Inertia::render('Student/SpeakModeLevels', [
            'modules' => $modules,
        ]);
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
