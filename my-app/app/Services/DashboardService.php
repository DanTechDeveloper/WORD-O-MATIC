<?php

namespace App\Services;

use App\Models\StudentProfile;
use App\Models\User;

class DashboardService
{
    public function stats(): array
    {
        $allStudents = StudentProfile::join('users', 'users.id', '=', 'students.user_id')
            ->where('users.role', 'student')
            ->select('students.*')
            ->get();

        $avgReadAccuracy = $allStudents->avg('wordBlastAcc') ?? 0;
        $avgSpeakAccuracy = $allStudents->avg('storyQuestAcc') ?? 0;
        $totalClassPoints = $allStudents->sum('points') ?? 0;

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
        })->values();

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
            } elseif ($avg >= 60) {
                $needsSupport++;
            } else {
                $atRisk++;
            }
        }

        $totalStudents = User::where('role', 'student')->count();

        $topStudents = StudentProfile::join('users', 'users.id', '=', 'students.user_id')
            ->where('users.role', 'student')
            ->orderBy('students.points', 'desc')
            ->limit(50)
            ->select('users.name', 'students.section', 'students.points', 'students.wordBlastAcc', 'students.storyQuestAcc')
            ->get();

        return [
            'topStudents' => $topStudents,
            'totalStudents' => $totalStudents,
            'avgReadAccuracy' => round($avgReadAccuracy, 2),
            'avgSpeakAccuracy' => round($avgSpeakAccuracy, 2),
            'totalClassPoints' => $totalClassPoints,
            'sectionPerformance' => $sectionPerformance,
            'chartCounts' => [
                'notStarted' => $notStarted,
                'atRisk' => $atRisk,
                'needsSupport' => $needsSupport,
                'onTrack' => $onTrack,
            ],
        ];
    }
}
