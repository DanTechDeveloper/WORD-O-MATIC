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

            if (!$avgRead && !$avgSpeak) {
                $status = 'Not Started';
            } elseif (!$avgRead || !$avgSpeak) {
                $status = 'In Progress';
            } else {
                $overallAvg = (($avgRead ?? 0) + ($avgSpeak ?? 0)) / 2;
                $status = $overallAvg >= 80 ? 'On Track' : ($overallAvg >= 60 ? 'Needs Support' : 'At Risk');
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
        $inProgress = 0;

        foreach ($allStudents as $student) {
            $wordBlast = (float) $student->wordBlastAcc;
            $storyQuest = (float) $student->storyQuestAcc;

            if (!$wordBlast && !$storyQuest) {
                $notStarted++;

                continue;
            }

            if (!$wordBlast || !$storyQuest) {
                $inProgress++;

                continue;
            }

            $overallAvg = ($wordBlast + $storyQuest) / 2;

            if ($overallAvg >= 80) {
                $onTrack++;
            } elseif ($overallAvg >= 60) {
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
                'in_progress' => $inProgress,
                'atRisk' => $atRisk,
                'needsSupport' => $needsSupport,
                'onTrack' => $onTrack,
            ],
        ];
    }
}
