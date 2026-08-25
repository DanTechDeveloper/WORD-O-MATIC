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

        $cutoff = $this->reportService->cutoff();

        $sent = 0;
        $failed = 0;

        foreach ($students as $user) {
            $parentEmail = $user->student?->parent_email;

            if (empty($parentEmail)) {
                $failed++;

                continue;
            }

            // One curriculum read per mode feeds progress %, training groups,
            // and attention flags — a single source of truth per student.
            $wbCurriculum = WordModule::curriculumForUser($user->id, $cutoff);
            $sqCurriculum = ParagraphModule::curriculumForUser($user->id, $cutoff);

            Mail::to($parentEmail)->queue(new StudentReportMail([
                'name' => $user->name,
                'section' => $user->student?->section ?? '',
                'wordBlastAcc' => $user->student?->wordBlastAcc ?? 0,
                'storyQuestAcc' => $user->student?->storyQuestAcc ?? 0,
                'read_level' => $user->student?->read_level ?? 1,
                'speak_level' => $user->student?->speak_level ?? 1,
                'wordBlastProg' => $this->reportService->curriculumPercent($wbCurriculum),
                'storyQuestProg' => $this->reportService->curriculumPercent($sqCurriculum),
                'status' => $user->student?->status ?? 'notStarted',
                'latestBadge' => $this->reportService->latestBadge($user->id),
                'trainingWords' => $this->reportService->trainingGroupsFrom($wbCurriculum),
                'paragraphTrainingWords' => $this->reportService->trainingGroupsFrom($sqCurriculum),
                'wordAttempts' => $this->reportService->trainingAttemptsFrom($wbCurriculum),
                'paragraphWordAttempts' => $this->reportService->trainingAttemptsFrom($sqCurriculum),
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

    public function updateParentEmail(Request $request, $id)
    {
        $data = $request->validate([
            'parent_email' => 'nullable|email|max:255',
        ]);

        $user = User::where('role', 'student')->findOrFail($id);
        $user->student()->update([
            'parent_email' => $data['parent_email'] !== null
                ? strtolower($data['parent_email'])
                : null,
        ]);

        return redirect()->back();
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

        $cutoff = $this->reportService->cutoff();

        $wordTitles = WordModule::where('is_tutorial', false)->pluck('title', 'level');
        $paraTitles = ParagraphModule::where('is_tutorial', false)->pluck('title', 'level');

        $formattedStudents = $students->map(function ($user) use ($cutoff, $wordTitles, $paraTitles) {
            $readLevel = $user->student?->read_level ?? 1;
            $speakLevel = $user->student?->speak_level ?? 1;

            // Same single-source-per-student read as sendReportEmails(): one
            // curriculum per mode feeds Top Struggle and the drill-down rows,
            // so the export can never disagree with the emailed report.
            $rows = array_merge(
                $this->struggleRows('Word Blast', WordModule::curriculumForUser($user->id, $cutoff)),
                $this->struggleRows('Story Quest', ParagraphModule::curriculumForUser($user->id, $cutoff)),
            );

            usort($rows, fn ($a, $b) => $b['attempts'] <=> $a['attempts']);

            $topStruggle = implode(' · ', array_map(
                fn ($row) => ($row['mode'] === 'Word Blast' ? 'WB' : 'SQ').': '.$row['word'].' ×'.$row['attempts'],
                array_slice($rows, 0, 2),
            ));

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
                'struggleRows' => $rows,
                'topStruggle' => $topStruggle,
            ];
        })->toArray();

        return Excel::download(new ReportsExport($formattedStudents), 'class-report.xlsx');
    }

    private function struggleRows(string $mode, array $curriculum): array
    {
        return array_map(
            fn ($row) => ['mode' => $mode] + $row,
            $this->reportService->struggleRowsFrom($curriculum),
        );
    }
}
