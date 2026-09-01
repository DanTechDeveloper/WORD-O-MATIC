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
        'wordBlastAcc',
        'storyQuestAcc',
        'read_level',
        'speak_level',
        'section',
        'tutorial_completed_at',
        'gender',
        'parent_email',
        'report_sent_at',
    ];

    protected $casts = [
        'tutorial_completed_at' => 'datetime',
        'wordBlastAcc' => 'float',
        'storyQuestAcc' => 'float',
    ];

    protected $appends = ['finalAverage'];

    public function getFinalAverageAttribute(): ?float
    {
        // ponytail: pure (wb+sq)/2 — null when either is 0 (notStarted/in_progress).
        // Started-row check lives in ProgressService::finalAverage(); accessor keeps
        // the simple acc==0 guard so it never fires a query on attribute access.
        $wb = (float) ($this->wordBlastAcc ?? 0);
        $sq = (float) ($this->storyQuestAcc ?? 0);
        if ($wb == 0 || $sq == 0) {
            return null;
        }
        return round(($wb + $sq) / 2, 2);
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
}
