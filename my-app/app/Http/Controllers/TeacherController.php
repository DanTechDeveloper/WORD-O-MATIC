<?php

namespace App\Http\Controllers;

use App\Mail\StudentReportMail;
use App\Models\ParagraphModule;
use App\Models\User;
use App\Models\WordModule;
use App\Services\DashboardService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class TeacherController extends Controller
{
    public function __construct(
        protected DashboardService $dashboardService,
    ) {}

    public function dashboard()
    {
        return Inertia::render('Teacher/Dashboard',
            $this->dashboardService->stats()
        );
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
                'rotation' => 'rotate-['.rand(-3, 3).'deg]',
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

        return Inertia::render('Teacher/StudentDetails', [
            'data' => array_merge($user->toArray(), [
                'readCurriculum' => WordModule::curriculumForUser($studentId),
                'speakCurriculum' => ParagraphModule::curriculumForUser($studentId),
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

        WordModule::saveWithWords($request->all());

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

        ParagraphModule::saveWithContent($request->all());

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
                'trainingWords' => WordModule::trainingWordsForUser($user->id),
                'paragraphTrainingWords' => ParagraphModule::trainingWordsForUser($user->id),
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

            Mail::to($parentEmail)->send(new StudentReportMail([
                'name' => $user->name,
                'section' => $user->student?->section ?? '',
                'wordBlastAcc' => $user->student?->wordBlastAcc ?? 0,
                'storyQuestAcc' => $user->student?->storyQuestAcc ?? 0,
                'read_level' => $user->student?->read_level ?? 1,
                'speak_level' => $user->student?->speak_level ?? 1,
                'status' => $user->student?->status ?? 'notStarted',
                'trainingWords' => WordModule::trainingWordsForUser($user->id),
                'paragraphTrainingWords' => ParagraphModule::trainingWordsForUser($user->id),
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
