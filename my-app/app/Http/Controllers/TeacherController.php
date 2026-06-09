<?php

namespace App\Http\Controllers;

use App\Models\ParagraphModule;
use App\Models\User;
use App\Models\WordModule;
use App\Models\StudentProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class TeacherController extends Controller
{
  

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
        $students = User::with('student')
            ->where('role', 'student')
            ->orderBy('name', 'asc')
            ->get()
            ->map(fn ($user) => [
                'id' => $user->id,
                'fullName' => $user->name,
                'studentID' => $user->student_id,
                'wordRisk' => $user->student?->wordRisk ?? 'na',
                'paragraphRisk' => $user->student?->paragraphRisk ?? 'na',
                'status' => $user->student?->status ?? 'notStarted',
            ]);

        return Inertia::render('Teacher/Students', [
            'data' => $students,
        ]);
    }

    public function show($studentId)
    {
        $student = User::with('student')->where('id', $studentId)->first();
        return Inertia::render('Teacher/StudentDetails', [
            'data' => $student,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'fullName' => 'required',
            'studentID' => 'required',
            'section' => 'required',
            'pin' => 'required',
        ]);

        $student = User::create([
            'name' => $request->fullName,
            'student_id' => $request->studentID,
            'pin' => Hash::make($request->pin),
            'role' => 'student',
        ]);

        $student->student()->create([
            'points' => 0,
            'avatar' => null,
            'last_active_level' => null,
            'read_progress' => 0,
            'speak_progress' => 0,
            'status' => 'notStarted',
            'wordRisk' => 'N/A',
            'paragraphRisk' => 'N/A',
            'section' => $request->section,
        ]);

        return redirect()->back();
    }

    public function wordModules()
    {
        $modules = WordModule::with('words')->get();

        $transformedModules = $modules->map(function ($module) {
            return [
                'id' => $module->id,
                'level' => $module->level,
                'title' => $module->title,
                'total_points' => $module->total_points,
                'words' => $module->words->map(function ($word) {
                    return [
                        'id' => $word->id,
                        'word' => $word->word,
                        'points' => $word->points,
                        'position' => $word->position,
                    ];
                }),
            ];
        });

        return Inertia::render('Teacher/Word', [
            'modules' => $transformedModules,
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
            'totalScore' => 'nullable|numeric',
        ]);

        $module = WordModule::updateOrCreate(
            ['level' => $request->level],
            ['title' => $request->title]
        );

        $module->words()->delete();

        $totalPoints = 0;

        foreach ($request->words as $index => $wordData) {
            $wordText = trim($wordData['word'] ?? '');
            if (! empty($wordText)) {
                $points = (isset($wordData['points']) && $wordData['points'] !== '') ? (int) $wordData['points'] : 1;

                $module->words()->create([
                    'word' => strtoupper($wordText),
                    'points' => $points,
                    'position' => $index + 1,
                ]);
                $totalPoints += $points;
            }
        }

        $module->update(['total_points' => $request->totalScore ?? $totalPoints]);

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
