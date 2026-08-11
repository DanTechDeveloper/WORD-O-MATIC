<?php

namespace App\Http\Controllers;

use App\Exports\ReportsExport;
use App\Mail\StudentReportMail;
use App\Models\ParagraphModule;
use App\Models\Setting;
use App\Models\User;
use App\Models\WordModule;
use App\Services\ReportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    public function __construct(
        protected ReportService $reportService,
    ) {}

    public function reports()
    {
        $students = User::with('student')
            ->where('role', 'student')
            ->orderBy('name', 'asc')
            ->get();

        [$wordTraining, $paraTraining] = $this->reportService->trainingWordsFor($students->pluck('id')->all());

        $students = $students->map(fn ($user) => [
            'id' => $user->id,
            'name' => $user->name,
            'section' => $user->student?->section ?? '',
            'wordBlastAcc' => $user->student?->wordBlastAcc ?? 0,
            'storyQuestAcc' => $user->student?->storyQuestAcc ?? 0,
            'read_level' => $user->student?->read_level ?? 1,
            'speak_level' => $user->student?->speak_level ?? 1,
            'status' => $user->student?->status ?? 'notStarted',
            'parent_email' => $user->student?->parent_email,
            'report_sent_at' => $user->student?->report_sent_at,
            'trainingWords' => $wordTraining[$user->id] ?? [],
            'paragraphTrainingWords' => $paraTraining[$user->id] ?? [],
        ]);

        $grouped = [
            'atRisk' => $students->where('status', 'atRisk')->values(),
            'support' => $students->where('status', 'support')->values(),
            'onTrack' => $students->where('status', 'onTrack')->values(),
            'notStarted' => $students->where('status', 'notStarted')->values(),
            'in_progress' => $students->where('status', 'in_progress')->values(),
        ];

        return Inertia::render('Teacher/Reports', [
            'grouped' => $grouped,
            'deadline' => Setting::getValue('report_deadline'),
        ]);
    }

    public function saveDeadline(Request $request)
    {
        if (empty($request->deadline)) {
            Setting::where('key', 'report_deadline')->delete();

            return redirect()->back()->with('deadline_cleared', true);
        }

        $request->validate([
            'deadline' => 'required|date|after_or_equal:'.now()->startOfMinute(),
        ]);

        Setting::setValue('report_deadline', $request->deadline);

        return redirect()->back()->with('deadline_set', true);
    }

    public function sendReportEmails(Request $request)
    {
        $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'integer|exists:users,id',
        ]);

        $deadlineTs = $this->reportService->deadline();

        if (! $deadlineTs) {
            return redirect()->back()->with('error', 'No report deadline set. Set a deadline first.')->withErrors(['No report deadline set. Set a deadline first.']);
        }

        if ($deadlineTs->isFuture()) {
            return redirect()->back()->with('error', 'Report deadline has not yet been reached.')->withErrors(['Report deadline has not yet been reached.']);
        }

        $students = User::with('student')
            ->whereIn('id', $request->student_ids)
            ->get();

        [$wordTraining, $paraTraining] = $this->reportService->trainingWordsFor($request->student_ids);
        $cutoff = $this->reportService->cutoff();

        $sent = 0;
        $failed = 0;

        foreach ($students as $user) {
            $parentEmail = $user->student?->parent_email;

            if (empty($parentEmail)) {
                $failed++;

                continue;
            }

            Mail::to($parentEmail)->queue(new StudentReportMail([
                'name' => $user->name,
                'section' => $user->student?->section ?? '',
                'wordBlastAcc' => $user->student?->wordBlastAcc ?? 0,
                'storyQuestAcc' => $user->student?->storyQuestAcc ?? 0,
                'read_level' => $user->student?->read_level ?? 1,
                'speak_level' => $user->student?->speak_level ?? 1,
                'wordBlastProg' => $this->reportService->curriculumPercent(WordModule::curriculumForUser($user->id, $cutoff)),
                'storyQuestProg' => $this->reportService->curriculumPercent(ParagraphModule::curriculumForUser($user->id, $cutoff)),
                'status' => $user->student?->status ?? 'notStarted',
                'latestBadge' => $this->reportService->latestBadge($user->id),
                'trainingWords' => $wordTraining[$user->id] ?? [],
                'paragraphTrainingWords' => $paraTraining[$user->id] ?? [],
                'reported_at' => $deadlineTs->format('F j, Y \a\t g:i A'),
            ]));

            $user->student->update(['report_sent_at' => now()]);

            $sent++;
        }

        return redirect()->back()
            ->with('sent', $sent)
            ->with('failed', $failed)
            ->with('reported_at', $deadlineTs->format('F j, Y \a\t g:i A'));
    }

    public function exportReports(Request $request)
    {
        $deadlineTs = $this->reportService->deadline();

        if (! $deadlineTs) {
            return redirect()->back()->with('error', 'No report deadline set. Set a deadline first.')->withErrors(['No report deadline set. Set a deadline first.']);
        }

        if ($deadlineTs->isFuture()) {
            return redirect()->back()->with('error', 'Report deadline has not yet been reached.')->withErrors(['Report deadline has not yet been reached.']);
        }

        $students = User::with('student')
            ->where('role', 'student')
            ->orderBy('name', 'asc')
            ->get();

        $studentIds = $students->pluck('id')->all();
        $cutoff = $this->reportService->cutoff();
        [$wordTraining, $paraTraining] = $this->reportService->trainingWordsFor($studentIds);
        $wordMastered = WordModule::masteredWordsForUsers($studentIds, $cutoff);
        $paraMastered = ParagraphModule::masteredWordsForUsers($studentIds, $cutoff);

        $wordTitles = WordModule::where('is_tutorial', false)->pluck('title', 'level');
        $paraTitles = ParagraphModule::where('is_tutorial', false)->pluck('title', 'level');

        $formattedStudents = $students->map(function ($user) use ($wordTraining, $paraTraining, $wordMastered, $paraMastered, $wordTitles, $paraTitles) {
            $readLevel = $user->student?->read_level ?? 1;
            $speakLevel = $user->student?->speak_level ?? 1;

            return [
                'name' => $user->name,
                'student_id' => $user->student_id,
                'section' => $user->student?->section ?? '',
                'status' => $user->student?->status ?? 'notStarted',
                'wordBlastAcc' => $user->student?->wordBlastAcc ?? 0,
                'storyQuestAcc' => $user->student?->storyQuestAcc ?? 0,
                'read_level' => $readLevel,
                'speak_level' => $speakLevel,
                'wbLevelLabel' => "Level {$readLevel} - ".($wordTitles[$readLevel] ?? ''),
                'sqLevelLabel' => "Level {$speakLevel} - ".($paraTitles[$speakLevel] ?? ''),
                'parent_email' => $user->student?->parent_email,
                'report_sent_at' => $user->student?->report_sent_at,
                'trainingWords' => $wordTraining[$user->id] ?? [],
                'paragraphTrainingWords' => $paraTraining[$user->id] ?? [],
                'masteredWords' => $wordMastered[$user->id] ?? [],
                'paragraphMasteredWords' => $paraMastered[$user->id] ?? [],
            ];
        })->toArray();

        return Excel::download(new ReportsExport($formattedStudents), 'class-report.xlsx');
    }
}
