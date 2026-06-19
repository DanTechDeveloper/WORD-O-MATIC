<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Badges extends Model
{
    protected $table = 'badges';

    protected $fillable = [
        'name',
        'description',
        'icon',
        'slug',
        'requirement',
        'metric',
        'operator',
        'threshold_score',
    ];

    public function studentBadges()
    {
        return $this->hasMany(StudentBadges::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'student_badges', 'badge_id', 'user_id')
            ->withPivot('earned_at', 'progress', 'status', 'unlocked_session_id')
            ->withTimestamps();
    }
}
