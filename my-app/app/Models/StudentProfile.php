<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class StudentProfile extends Model
{
    use HasFactory;

    protected $table = 'students';

    protected $primaryKey = 'id';

    protected $fillable = [
        'user_id',
        'points',
        'avatar',
        'read_progress',
        'speak_progress',
        'badges',
        'status',
        'wordBlastAcc',
        'storyQuestAcc',
        'words_smashed',
        'accuracy',
        'read_level',
        'speak_level',
        'section',
        'tutorial_completed_at'
    ];

    protected $casts = [
        'tutorial_completed_at' => 'datetime',
    ];

    public static function dashboardStats(): array
    {
        $allStudents = self::join('users', 'users.id', '=', 'students.user_id')
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

        $topStudents = self::join('users', 'users.id', '=', 'students.user_id')
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

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function wordProgress()
    {
        return $this->hasMany(StudentWordProgress::class, 'user_id', 'user_id');
    }

    public function paragraphProgress()
    {
        return $this->hasMany(StudentParagraphProgress::class, 'user_id', 'user_id');
    }

    public function updateWordProgress($module, $wordsSmashed, $accuracy)
    {
        $progress = StudentWordProgress::firstOrNew([
            'user_id' => $this->user_id,
            'word_module_id' => $module->id
        ]);

        $previousBest = $progress->exists ? $progress->words_smashed : 0;

        $isNewBest = !$progress->exists || $wordsSmashed > $progress->words_smashed;
        $isBetterAccuracy = $progress->exists && $wordsSmashed == $progress->words_smashed && $accuracy > $progress->accuracy;

        if ($isNewBest || $isBetterAccuracy) {
            $progress->words_smashed = $wordsSmashed;
            $progress->accuracy = $accuracy;
        }

        $progress->status = $wordsSmashed >= $module->total_points ? 'completed' : 'in_progress';
        $progress->save();

        if ($isNewBest || $isBetterAccuracy) {
            $this->update(['wordBlastAcc' => $accuracy]);
        }

        if ($module->level >= $this->read_level) {
            $this->update([
                'read_level' => $module->level + 1,
                'read_progress' => StudentWordProgress::where('user_id', $this->user_id)->where('status', 'completed')->count(),
                'points' => StudentWordProgress::where('user_id', $this->user_id)->sum('words_smashed') +
                            StudentParagraphProgress::where('user_id', $this->user_id)->sum('words_smashed'),
            ]);
        } else {
            $delta = max(0, $wordsSmashed - $previousBest);
            if ($delta > 0) {
                $this->increment('points', $delta);
            }
        }
    }

    public function updateParagraphProgress($module, $wordsSmashed, $accuracy)
    {
        $progress = StudentParagraphProgress::firstOrNew([
            'user_id' => $this->user_id,
            'paragraph_module_id' => $module->id
        ]);

        $previousBest = $progress->exists ? $progress->words_smashed : 0;

        $isNewBest = !$progress->exists || $wordsSmashed > $progress->words_smashed;
        $isBetterAccuracy = $progress->exists && $wordsSmashed == $progress->words_smashed && $accuracy > $progress->accuracy;

        if ($isNewBest || $isBetterAccuracy) {
            $progress->words_smashed = $wordsSmashed;
            $progress->accuracy = $accuracy;
        }

        $progress->status = $wordsSmashed >= $module->total_score ? 'completed' : 'in_progress';
        $progress->save();

        if ($isNewBest || $isBetterAccuracy) {
            $this->update(['storyQuestAcc' => $accuracy]);
        }

        if ($module->level >= $this->speak_level) {
            $this->update([
                'speak_level' => $module->level + 1,
                'speak_progress' => StudentParagraphProgress::where('user_id', $this->user_id)->where('status', 'completed')->count(),
                'points' => StudentWordProgress::where('user_id', $this->user_id)->sum('words_smashed') +
                            StudentParagraphProgress::where('user_id', $this->user_id)->sum('words_smashed'),
            ]);
        } else {
            $delta = max(0, $wordsSmashed - $previousBest);
            if ($delta > 0) {
                $this->increment('points', $delta);
            }
        }
    }

    public function checkAndAwardBadges($sessionId = null, $currentAccuracy = null): array
    {
        $userId = $this->user_id;
        $earnedBadgeIds = $this->user->badges()->pluck('badges.id')->toArray();

        $badgesToCheck = Badges::whereNotIn('id', $earnedBadgeIds)
            ->whereIn('metric', ['total_points', 'streak', 'accuracy'])
            ->get();

        if ($badgesToCheck->isEmpty()) {
            return [];
        }

        $awarded = [];

        foreach ($badgesToCheck as $badge) {
            $qualified = false;
            $currentValue = 0;

            if ($badge->metric === 'total_points') {
                $currentValue = $this->points;
            } elseif ($badge->metric === 'streak') {
                $currentValue = GameSession::where('user_id', $userId)->max('streak') ?? 0;
            } elseif ($badge->metric === 'accuracy') {
                $currentValue = $currentAccuracy ?? 0;
            }

            if ($this->meetsThreshold($currentValue, $badge->operator, $badge->threshold_score)) {
                $this->user->badges()->attach($badge->id, [
                    'earned_at' => now(),
                    'progress' => $currentValue,
                    'status' => 'earned',
                    'unlocked_session_id' => $sessionId,
                ]);
                $awarded[] = $badge;
            }
        }

        return $awarded;
    }

    private function meetsThreshold($value, string $operator, $threshold): bool
    {
        return match ($operator) {
            '>=' => $value >= $threshold,
            '>'  => $value > $threshold,
            '='  => $value == $threshold,
            '<=' => $value <= $threshold,
            '<'  => $value < $threshold,
            default => false,
        };
    }
}
