<?php

namespace App\Http\Controllers;

use App\Models\ParagraphModule;
use App\Models\StudentParagraphProgress;
use App\Models\WordModule;
use Illuminate\Http\Request;
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
        $modules = WordModule::orderBy('level', 'asc')->get();

        return Inertia::render('Student/ReadModeLevels', [
            'modules' => $modules,
        ]);
    }

    public function speakModeLevels()
    {
        $userId = auth()->id();

        // Retrieve modules with the authenticated user's specific progress for each level.
        $modules = ParagraphModule::select(['id', 'level', 'title', 'total_score'])
            ->with(['studentProgress' => function ($query) use ($userId) {
                $query->where('user_id', $userId);
            }])
            ->orderBy('level', 'asc')->get();

        return Inertia::render('Student/SpeakModeLevels', [
            'modules' => $modules,
        ]);
    }

    public function gameplaySpeakMode($id)
    {
        $module = ParagraphModule::select(['id', 'level', 'title', 'content', 'total_score'])->findOrFail($id);

        $userId = auth()->id();
        $progress = StudentParagraphProgress::where('user_id', $userId)
            ->where('paragraph_module_id', $id)
            ->first();

        return Inertia::render('Student/GameplaySpeakMode', [
            'module' => $module,
            'userProgress' => $progress ? $progress->words_smashed : 0,
        ]);
    }

    public function saveParagraphProgress(Request $request)
    {
        $request->validate([
            'module_id' => 'required|exists:paragraph_modules,id',
            'words_smashed' => 'required|integer|min:0',
        ]);

        $userId = auth()->id();

        // Update high score only if the current attempt is better
        $progress = StudentParagraphProgress::firstOrCreate(
            ['user_id' => $userId, 'paragraph_module_id' => $request->module_id],
            ['words_smashed' => 0, 'status' => 'not_started']
        );

        if ($request->words_smashed > $progress->words_smashed) {
            $progress->update([
                'words_smashed' => $request->words_smashed,
                'status' => 'completed',
            ]);

            // Update the global total in StudentProfile (students table)
            $total = StudentParagraphProgress::where('user_id', $userId)->sum('words_smashed');

            $studentProfile = auth()->user()->student;
            if ($studentProfile) {
                $studentProfile->update(['words_smashed' => $total]);
            }
        }

        return redirect()->back();
    }

    public function gameplayReadMode()
    {
        return Inertia::render('Student/GameplayReadMode');
    }
}
