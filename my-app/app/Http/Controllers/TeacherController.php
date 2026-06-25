<?php

namespace App\Http\Controllers;

use App\Mail\StudentReportMail;
use App\Models\ParagraphModule;
use App\Models\ParagraphWord;
use App\Models\StudentParagraphMastery;
use App\Models\StudentParagraphProgress;
use App\Models\StudentWordProgress;
use App\Models\User;
use App\Models\WordModule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class TeacherController extends Controller
{
    public function dashboard()
    {
        $totalStudents = User::where('role', 'student')->count();

        $allStudents = \DB::table('students')
            ->join('users', 'users.id', '=', 'students.user_id')
            ->where('users.role', 'student')
            ->select('students.*')
            ->get();

        $avgReadAccuracy = $allStudents->avg('wordBlastAcc') ?? 0;
        $avgSpeakAccuracy = $allStudents->avg('storyQuestAcc') ?? 0;
        $totalClassPoints = $allStudents->sum('points') ?? 0;

        // Section Performance Aggregation
        $sections = $allStudents->pluck('section')->unique()->filter();

        $sectionPerformance = $sections->map(function ($section) use ($allStudents) {
            $sectionStudents = $allStudents->where('section', $section);

            $avgRead = $sectionStudents->avg('wordBlastAcc');
            $avgSpeak = $sectionStudents->avg('storyQuestAcc');

            if ($avgRead === null && $avgSpeak === null || ($avgRead == 0.0 && $avgSpeak == 0.0)) {
                $status = 'Not Started';
            } else {
                $overall = (($avgRead ?? 0) + ($avgSpeak ?? 0)) / 2;
                $status = $overall >= 80 ? 'On Track' : ($overall >= 60 ? 'Needs Support' : 'At Risk');
            }

            return [
                'section' => $section,
                'student_count' => $sectionStudents->count(),
                'avg_read' => round($avgRead ?? 0, 2),
                'avg_speak' => round($avgSpeak ?? 0, 2),
                'total_points' => $sectionStudents->sum('points'),
                'status' => $status,
            ];
        });

        // Chart Counts Aggregation
        $atRisk = 0;
        $needsSupport = 0;
        $onTrack = 0;
        $notStarted = 0;

        foreach ($allStudents as $s) {
            $r = $s->wordBlastAcc;
            $sp = $s->storyQuestAcc;

            if ($r == 0 && $sp == 0) {
                $notStarted++;
                continue;
            }

            $avg = (($r ?? 0) + ($sp ?? 0)) / 2;

            if ($avg >= 80) {
                $onTrack++;
            } else if ($avg >= 60) {
                $needsSupport++;
            } else {
                $atRisk++;
            }
        }

        $topStudents = \DB::table('students')
            ->join('users', 'users.id', '=', 'students.user_id')
            ->where('users.role', 'student')
            ->orderBy('students.points', 'desc')
            ->limit(50)
            ->select('users.name', 'students.section', 'students.points', 'students.wordBlastAcc', 'students.storyQuestAcc')
            ->get();

        return Inertia::render('Teacher/Dashboard', [
            'topStudents' => $topStudents,
            'totalStudents' => $totalStudents,
            'avgReadAccuracy' => round($avgReadAccuracy, 2),
            'avgSpeakAccuracy' => round($avgSpeakAccuracy, 2),
            'totalClassPoints' => $totalClassPoints,
            'sectionPerformance' => $sectionPerformance->values(),
            'chartCounts' => [
                'notStarted' => $notStarted,
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
                'avatar' => $user->student?->avatar,
                'section' => $user->student?->section ?? '',
                'rotation' => 'rotate-[' . rand(-3, 3) . 'deg]',
                'wordBlastAcc' => $user->student?->wordBlastAcc,
                'storyQuestAcc' => $user->student?->storyQuestAcc,
                'status' => $this->computeStatus($user->student?->status ?? 'notStarted'),
            ]);

        return Inertia::render('Teacher/Students', [
            'data' => $students,
        ]);
    }

    private function computeStatus(string $status): array
    {
        $labels = [
            'onTrack' => 'On Track',
            'atRisk' => 'At Risk',
            'support' => 'Needs Support',
            'notStarted' => 'Not Started',
        ];

        return [
            'type' => $status,
            'label' => $labels[$status] ?? 'Not Started',
        ];
    }

    public function show($studentId)
    {
        $user = User::with(['student'])->findOrFail($studentId);

        // Read Curriculum: from student_word_mastery
        $modules = WordModule::with('words')->orderBy('level', 'asc')->get();

        $masteryProgress = \DB::table('student_word_mastery')
            ->where('user_id', $studentId)
            ->get()
            ->groupBy('word_id');

        $readCurriculum = $modules->map(function ($module) use ($masteryProgress) {
            return [
                'level' => "Level {$module->level}: {$module->title}",
                'mastered' => $module->words->filter(function ($word) use ($masteryProgress) {
                    return isset($masteryProgress[$word->id]) && $masteryProgress[$word->id][0]->status === 'mastered';
                })->pluck('word')->values(),
                'training' => $module->words->filter(function ($word) use ($masteryProgress) {
                    return isset($masteryProgress[$word->id]) && $masteryProgress[$word->id][0]->status === 'training';
                })->pluck('word')->values(),
            ];
        });

        // Speak Curriculum: from student_paragraph_mastery
        $paragraphModules = ParagraphModule::with('words')->orderBy('level', 'asc')->get();

        $paragraphMastery = \DB::table('student_paragraph_mastery')
            ->where('user_id', $studentId)
            ->get()
            ->groupBy('paragraph_word_id');

        $speakCurriculum = $paragraphModules->map(function ($module) use ($paragraphMastery) {
            return [
                'level' => "Level {$module->level}: {$module->title}",
                'mastered' => $module->words->filter(function ($word) use ($paragraphMastery) {
                    return isset($paragraphMastery[$word->id]) && $paragraphMastery[$word->id][0]->status === 'mastered';
                })->pluck('word')->values(),
                'training' => $module->words->filter(function ($word) use ($paragraphMastery) {
                    return isset($paragraphMastery[$word->id]) && $paragraphMastery[$word->id][0]->status === 'training';
                })->pluck('word')->values(),
            ];
        });

        return Inertia::render('Teacher/StudentDetails', [
            'data' => array_merge($user->toArray(), [
                'readCurriculum' => $readCurriculum,
                'speakCurriculum' => $speakCurriculum,
            ]),
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

        $module = ParagraphModule::updateOrCreate(
            ['level' => $request->level],
            [
                'title' => $request->title,
                'content' => $request->content,
                'total_score' => $wordCount,
            ]
        );

        $contentWords = ! empty(trim($request->content))
            ? preg_split('/\s+/', trim($request->content), -1, PREG_SPLIT_NO_EMPTY)
            : [];

        $module->words()->delete();
        foreach ($contentWords as $pos => $word) {
            ParagraphWord::create([
                'paragraph_module_id' => $module->id,
                'word' => $word,
                'position' => $pos + 1,
            ]);
        }

        return redirect()->back();
    }

    public function reports()
    {
        $students = User::with('student')
            ->where('role', 'student')
            ->orderBy('name', 'asc')
            ->get()
            ->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'section' => $user->student?->section ?? '',
                'wordBlastAcc' => $user->student?->wordBlastAcc ?? 0,
                'storyQuestAcc' => $user->student?->storyQuestAcc ?? 0,
                'read_level' => $user->student?->read_level ?? 1,
                'speak_level' => $user->student?->speak_level ?? 1,
                'status' => $user->student?->status ?? 'notStarted',
                'parent_email' => $user->student?->parent_email,
                'trainingWords' => $this->getTrainingWords($user->id),
                'paragraphTrainingWords' => $this->getParagraphTrainingWords($user->id),
            ]);

        $grouped = [
            'atRisk' => $students->where('status', 'atRisk')->values(),
            'support' => $students->where('status', 'support')->values(),
            'onTrack' => $students->where('status', 'onTrack')->values(),
            'notStarted' => $students->where('status', 'notStarted')->values(),
        ];

        return Inertia::render('Teacher/Reports', [
            'grouped' => $grouped,
        ]);
    }

    private function getTrainingWords($userId): array
    {
        $modules = WordModule::with('words')->orderBy('level', 'asc')->get();

        $masteryProgress = \DB::table('student_word_mastery')
            ->where('user_id', $userId)
            ->get()
            ->groupBy('word_id');

        $training = [];

        foreach ($modules as $module) {
            $trainingWords = $module->words->filter(function ($word) use ($masteryProgress) {
                return isset($masteryProgress[$word->id]) && $masteryProgress[$word->id][0]->status === 'training';
            })->pluck('word')->values();

            if ($trainingWords->isNotEmpty()) {
                $training["Level {$module->level}: {$module->title}"] = $trainingWords->toArray();
            }
        }

        return $training;
    }

    private function getParagraphTrainingWords($userId): array
    {
        $modules = ParagraphModule::with('words')->orderBy('level', 'asc')->get();

        $masteryProgress = \DB::table('student_paragraph_mastery')
            ->where('user_id', $userId)
            ->get()
            ->groupBy('paragraph_word_id');

        $training = [];

        foreach ($modules as $module) {
            $trainingWords = $module->words->filter(function ($word) use ($masteryProgress) {
                return isset($masteryProgress[$word->id]) && $masteryProgress[$word->id][0]->status === 'training';
            })->pluck('word')->values();

            if ($trainingWords->isNotEmpty()) {
                $training["Level {$module->level}: {$module->title}"] = $trainingWords->toArray();
            }
        }

        return $training;
    }

    public function sendReportEmails(Request $request)
    {
        $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'integer|exists:users,id',
        ]);

        $students = User::with('student')
            ->whereIn('id', $request->student_ids)
            ->get();

        $sent = 0;
        $failed = 0;

        foreach ($students as $user) {
            $parentEmail = $user->student?->parent_email;

            if (empty($parentEmail)) {
                $failed++;
                continue;
            }

            $trainingWords = $this->getTrainingWords($user->id);

            Mail::to($parentEmail)->send(new StudentReportMail([
                'name' => $user->name,
                'section' => $user->student?->section ?? '',
                'wordBlastAcc' => $user->student?->wordBlastAcc ?? 0,
                'storyQuestAcc' => $user->student?->storyQuestAcc ?? 0,
                'read_level' => $user->student?->read_level ?? 1,
                'speak_level' => $user->student?->speak_level ?? 1,
                'status' => $user->student?->status ?? 'notStarted',
                'trainingWords' => $trainingWords,
                'paragraphTrainingWords' => $this->getParagraphTrainingWords($user->id),
            ]));

            $sent++;
        }

        return redirect()->back()
            ->with('sent', $sent)
            ->with('failed', $failed);
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
