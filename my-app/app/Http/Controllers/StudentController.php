<?php

namespace App\Http\Controllers;

use App\Models\ParagraphModule;
use App\Models\StudentParagraphProgress;
use App\Models\StudentWordProgress;
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
        $userId = auth()->id();

        // Kunin ang mga modules kasama ang bilang ng mga salita sa loob nito
        $modules = WordModule::withCount('words')
            ->orderBy('level', 'asc')
            ->get();

        $foundCurrent = false;
        $transformedModules = $modules->map(function ($module) use ($userId, &$foundCurrent) {
            $totalWords = $module->words_count;

            // Bilangin kung ilang unique words ang natapos na ng student sa module na ito
            $completedWords = StudentWordProgress::where('user_id', $userId)
                ->where('word_module_id', $module->id)
                ->where('status', 'completed')
                ->count();

            // Logic: 'completed' kung lahat ng words ay tapos na.
            // Ang unang module na hindi pa tapos ang magiging 'current'.
            if ($totalWords > 0 && $completedWords === $totalWords) {
                $status = 'completed';
            } elseif (! $foundCurrent) {
                $status = 'current';
                $foundCurrent = true;
            } else {
                $status = 'locked';
            }

            return [
                'id' => $module->id,
                'level' => $module->level,
                'title' => $module->title,
                'total_score' => $totalWords,
                'status' => $status,
                'words_smashed' => $completedWords,
            ];
        });

        return Inertia::render('Student/ReadModeLevels', [
            'modules' => $transformedModules,
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

        $foundCurrent = false;
        $transformedModules = $modules->map(function ($module) use (&$foundCurrent) {
            $progress = $module->studentProgress->first();

            // Logic: Unang module na walang 'completed' status ang magiging 'current'.
            // Lahat ng bago mag-'current' ay 'completed', lahat ng kasunod ay 'locked'.
            if ($progress && $progress->status === 'completed') {
                $status = 'completed';
            } elseif (! $foundCurrent) {
                $status = 'current';
                $foundCurrent = true;
            } else {
                $status = 'locked';
            }

            return [
                'id' => $module->id,
                'level' => $module->level,
                'title' => $module->title,
                'total_score' => $module->total_score,
                'status' => $status,
                'words_smashed' => $progress ? $progress->words_smashed : 0,
            ];
        });

        return Inertia::render('Student/SpeakModeLevels', [
            'modules' => $transformedModules,
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
