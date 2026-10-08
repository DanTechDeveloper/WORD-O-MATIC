<?php

namespace App\Http\Controllers;

use App\Exports\ReportsExport;
use App\Mail\StudentReportMail;
use App\Models\ParagraphModule;
use App\Models\Setting;
use App\Models\StudentProfile;
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
            'finalAverage' => $user->student?->finalAverage,
            'read_level' => $user->student?->read_level ?? 1,
            'speak_level' => $user->student?->speak_level ?? 1,
            'status' => $user->student?->status ?? 'notStarted',
            'parent_email' => $user->student?->parent_email,
            'report_sent_at' => $user->student?->report_sent_at,
        ]);

        $grouped = [
            'atRisk' => $students->where('status', 'atRisk')->values()->toArray(),
            'support' => $students->where('status', 'support')->values()->toArray(),
            'onTrack' => $students->where('status', 'onTrack')->values()->toArray(),
            'notStarted' => $students->where('status', 'notStarted')->values()->toArray(),
            'in_progress' => $students->where('status', 'in_progress')->values()->toArray(),
        ];
        $students = $students->toArray();

        return Inertia::render('Teacher/Reports', [
            'grouped' => $grouped,
            'deadline' => Setting::getValue('report_deadline'),
        ]);
    }

    public function saveDeadline(Request $request)
    {
        if (empty($request->deadline)) {
            Setting::where('key', 'report_deadline')->delete();
            // ponytail: CLEAR = new period — un-stale Already Sent so Juan returns to selectable list
            StudentProfile::query()->update(['report_sent_at' => null]);

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

        if ($deadlineTs->isPast() && empty($request->user()->email)) {
            return redirect()->back()->with('error', 'Set your sender email in Settings before sending reports.')->withErrors(['Set your sender email in Settings before sending reports.']);
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
                'finalAverage' => $user->student?->finalAverage,
                'read_level' => $user->student?->read_level ?? 1,
                'speak_level' => $user->student?->speak_level ?? 1,
                'wordBlastProg' => $this->reportService->curriculumPercent($wbCurriculum),
                'storyQuestProg' => $this->reportService->sentenceCurriculumPercent($sqCurriculum),
                'status' => $user->student?->status ?? 'notStarted',
                'latestBadge' => $this->reportService->latestBadge($user->id),
                'trainingWords' => $this->reportService->trainingGroupsFrom($wbCurriculum),
                'paragraphTrainingWords' => $this->reportService->trainingSentenceGroupsFrom($sqCurriculum),
                'wordAttempts' => $this->reportService->trainingAttemptsFrom($wbCurriculum),
                'paragraphWordAttempts' => $this->reportService->trainingSentenceAttemptsFrom($sqCurriculum),
                // Word-level verdicts. The two keys above stay untouched: the
                // parent report shows the sentence chip (summed attempts) AND
                // the words that produced it, and the per-word recovered
                // history that a mastered sentence would otherwise hide.
                'paragraphWordVerdicts' => $this->reportService->trainingSentenceWordAttemptsFrom($sqCurriculum),
                'paragraphRecovered' => $this->reportService->recoveredSentenceWordsFrom($sqCurriculum),
                'reported_at' => $deadlineTs->format('F j, Y \a\t g:i A'),
                'teacher_email' => $request->user()->email ?? config('mail.from.address'),
                'teacher_name' => $request->user()->name ?? config('mail.from.name'),
            ]));

            $user->student->update(['report_sent_at' => now()]);

            $sent++;
        }

        return redirect()->route('teacher.reports.thanks')
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

        return redirect()->back()->with('success', 'Parent email saved.');
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

        // ponytail: batched 2 queries vs 200 (100×2) — was 60s timeout on sfo 70ms
        $userIds = $students->pluck('id')->all();
        $wordCurriculums = WordModule::curriculumForUsers($userIds, $cutoff);
        $paraCurriculums = ParagraphModule::curriculumForUsers($userIds, $cutoff);

        $formattedStudents = $this->reportService->exportStudents($students->all(), $wordCurriculums, $paraCurriculums);

        return Excel::download(new ReportsExport($formattedStudents), 'class-report.xlsx');
    }
}
