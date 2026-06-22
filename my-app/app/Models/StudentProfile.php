<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
        'wordRisk',
        'paragraphRisk',
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
        // 1. I-save o i-update ang high score sa StudentWordProgress table
        $progress = StudentWordProgress::firstOrNew([
            'user_id' => $this->user_id,
            'word_module_id' => $module->id
        ]);

        if (!$progress->exists || $wordsSmashed > $progress->words_smashed) {
            $progress->words_smashed = $wordsSmashed;
            $progress->accuracy = $accuracy;
        }

        $progress->status = 'completed';
        $progress->save();

        if ($module->level >= $this->read_level) {
            $this->update([
                'read_level' => $module->level + 1,
                'read_progress' => StudentWordProgress::where('user_id', $this->user_id)->where('status', 'completed')->count(),
                'points' => StudentWordProgress::where('user_id', $this->user_id)->sum('words_smashed') +
                            StudentParagraphProgress::where('user_id', $this->user_id)->sum('words_smashed'),
            ]);
        } else {
            $this->increment('points', $wordsSmashed);
        }
    }

    public function updateParagraphProgress($module, $wordsSmashed, $accuracy)
    {
        // 1. I-save o i-update ang high score sa StudentParagraphProgress table
        $progress = StudentParagraphProgress::firstOrNew([
            'user_id' => $this->user_id,
            'paragraph_module_id' => $module->id
        ]);

        if (!$progress->exists || $wordsSmashed > $progress->words_smashed) {
            $progress->words_smashed = $wordsSmashed;
            $progress->accuracy = $accuracy;
        }

        $progress->status = 'completed';
        $progress->save();

        // 2. I-update ang speak_level at total points
        if ($module->level >= $this->speak_level) {
            $this->update([
                'speak_level' => $module->level + 1,
                'speak_progress' => StudentParagraphProgress::where('user_id', $this->user_id)->where('status', 'completed')->count(),
                'points' => StudentWordProgress::where('user_id', $this->user_id)->sum('words_smashed') +
                            StudentParagraphProgress::where('user_id', $this->user_id)->sum('words_smashed'),
            ]);
        } else {
            $this->increment('points', $wordsSmashed);
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
