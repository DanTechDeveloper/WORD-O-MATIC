<?php

namespace App\Http\Controllers;

use App\Models\ParagraphModule;
use App\Models\StudentModel;
use App\Models\WordModule;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;

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

    public function classes()
    {
        return Inertia::render('Teacher/Classes');
    }

    public function students()
    {
        return Inertia::render('Teacher/Students');
    }

   

    public function store(Request $request)
    {
        $request->validate([
            'fullName' => 'required',
            'studentID' => 'required',
            'pin' => 'required'
        ]);

        $student = StudentModel::create([
            'fullName' => $request->fullName,
            'studentID' => $request->studentID,
            'pin' => Hash::make($request->pin),
        ]);

        $student->save();

        return redirect()->back();
    }

    public function wordModules()
    {
        $modules = WordModule::with('words')->get();

        return Inertia::render('Teacher/Word', [
            'modules' => $modules,
        ]);
    }

    public function updateWordModule(Request $request)
    {
        $request->validate([
            'level' => 'required|integer',
            'title' => 'required|string|max:255',
            'words' => 'required|array|size:10',
            'words.*.word' => 'nullable|string',
            'words.*.points' => 'nullable|numeric|min:0',
        ]);

        $module = WordModule::updateOrCreate(
            ['level' => $request->level],
            ['title' => $request->title]
        );

        // Linisin ang mga lumang salita at palitan ng bago
        $module->words()->delete();

        foreach ($request->words as $index => $wordData) {
            if (! empty(trim($wordData['word'] ?? ''))) {
                $module->words()->create([
                    'word' => strtoupper(trim($wordData['word'])),
                    'points' => (isset($wordData['points']) && $wordData['points'] !== '') ? (int) $wordData['points'] : 1,
                    'position' => $index + 1,
                ]);
            }
        }

        return redirect()->back();
    }

    public function paragraphModules()
    {
        $modules = ParagraphModule::all();

        return Inertia::render('Teacher/Paragraph', [
            'modules' => $modules,
        ]);
    }

    public function updateParagraphModule(Request $request)
    {
        $request->validate([
            'level' => 'required|integer',
            'title' => 'required|string|max:255',
            'content' => 'nullable|string',
        ]);

        $wordCount = ! empty(trim($request->content))
            ? count(preg_split('/\s+/', trim($request->content), -1, PREG_SPLIT_NO_EMPTY))
            : 0;

        ParagraphModule::updateOrCreate(
            ['level' => $request->level],
            [
                'title' => $request->title,
                'content' => $request->content,
                'total_score' => $wordCount,
            ]
        );

        return redirect()->back();
    }

    public function reports()
    {
        return Inertia::render('Teacher/Reports');
    }

    public function studentDetails()
    {
        return Inertia::render('Teacher/StudentDetails');
    }

    public function assignments()
    {
        return Inertia::render('Teacher/Assignments');
    }

    public function leaderboards()
    {
        return Inertia::render('Teacher/Leaderboards');
    }

    public function createAssignment()
    {
        return Inertia::render('Teacher/Classes');
    }
}
