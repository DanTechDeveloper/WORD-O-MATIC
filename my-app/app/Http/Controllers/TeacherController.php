<?php

namespace App\Http\Controllers;

use App\Models\ParagraphModule;
use App\Models\StudentParagraphProgress;
use App\Models\StudentWordProgress;
use App\Models\User;
use App\Models\WordModule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class TeacherController extends Controller
{
    public function dashboard()
    {
        $totalStudents = User::where('role', 'student')->count();
        $avgReadAccuracy = StudentWordProgress::avg('accuracy') ?? 0;
        $avgSpeakAccuracy = StudentParagraphProgress::avg('accuracy') ?? 0;
        $totalClassPoints = (StudentWordProgress::sum('words_smashed') ?? 0) +
        (StudentParagraphProgress::sum('words_smashed') ?? 0);

        // Section Performance Aggregation
        $sections = \DB::table('students')->select('section')->distinct()->pluck('section');

        $sectionPerformance = $sections->map(function ($section) {
            $studentIds = \DB::table('students')->where('section', $section)->pluck('user_id');

            $readAcc = StudentWordProgress::whereIn('user_id', $studentIds)->avg('accuracy') ?? 0;
            $speakAcc = StudentParagraphProgress::whereIn('user_id', $studentIds)->avg('accuracy') ?? 0;
            $points = (StudentWordProgress::whereIn('user_id', $studentIds)->sum('words_smashed') ?? 0) +
                      (StudentParagraphProgress::whereIn('user_id', $studentIds)->sum('words_smashed') ?? 0);

            $overall = ($readAcc + $speakAcc) / 2;
            $status = $overall >= 80 ? 'On Track' : ($overall >= 60 ? 'Needs Support' : 'At Risk');

            return [
                'section' => $section,
                'student_count' => $studentIds->count(),
                'avg_read' => round($readAcc, 2),
                'avg_speak' => round($speakAcc, 2),
                'total_points' => $points,
                'status' => $status,
            ];
        });

        // Chart Counts Aggregation
        $atRisk = 0;
        $needsSupport = 0;
        $onTrack = 0;
        $allStudents = \DB::table('students')->get();
        foreach ($allStudents as $s) {
            $r = StudentWordProgress::where('user_id', $s->user_id)->avg('accuracy') ?? 0;
            $sp = StudentParagraphProgress::where('user_id', $s->user_id)->avg('accuracy') ?? 0;
            $avg = ($r + $sp) / 2;

            if ($avg >= 80) {
                $onTrack++;
            } elseif ($avg >= 60) {
                $needsSupport++;
            } else {
                $atRisk++;
            }
        }

        return Inertia::render('Teacher/Dashboard', [
            'totalStudents' => $totalStudents,
            'avgReadAccuracy' => round($avgReadAccuracy, 2),
            'avgSpeakAccuracy' => round($avgSpeakAccuracy, 2),
            'totalClassPoints' => $totalClassPoints,
            'sectionPerformance' => $sectionPerformance,
            'chartCounts' => [
                'atRisk' => $atRisk,
                'needsSupport' => $needsSupport,
                'onTrack' => $onTrack,
            ],
        ]);
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
                'wordBlastAcc' => $user->student?->wordBlastAcc ?? 'na',
                'storyQuestAcc' => $user->student?->storyQuestAcc ?? 'na',
                'status' => $user->student?->status ?? 'notStarted',
            ]);

        return Inertia::render('Teacher/Students', [
            'data' => $students,
        ]);
    }

    public function show($studentId)
    {
        $user = User::with(['student'])->findOrFail($studentId);

        // Fetch all modules and their words
        $modules = WordModule::with('words')->orderBy('level', 'asc')->get();

        // Fetch word-level progress for this student
        $progress = \DB::table('student_word_mastery')
            ->where('user_id', $studentId)
            ->get()
            ->groupBy('word_id');

        $curriculum = $modules->map(function ($module) use ($progress) {
            return [
                'level' => "Level {$module->level}: {$module->title}",
                'mastered' => $module->words->filter(function ($word) use ($progress) {
                    return isset($progress[$word->id]) && $progress[$word->id][0]->status === 'mastered';
                })->pluck('word')->values(),
                'training' => $module->words->filter(function ($word) use ($progress) {
                    return ! isset($progress[$word->id]) || $progress[$word->id][0]->status === 'training';
                })->pluck('word')->values(),
            ];
        });

        return Inertia::render('Teacher/StudentDetails', [
            'data' => array_merge($user->toArray(), ['curriculum' => $curriculum]),
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
            'read_progress' => 0,
            'speak_progress' => 0,
            'status' => 'notStarted',
            'wordBlastAcc' => 0.0,
            'storyQuestAcc' => 0.0,
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

    public function badges()
    {
        return Inertia::render('Teacher/Badges');
    }
}
