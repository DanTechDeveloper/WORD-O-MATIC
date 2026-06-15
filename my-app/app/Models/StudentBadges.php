<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentBadges extends Model
{
    protected $table = 'user_badges';

    protected $fillable = [
        'user_id',
        'badge_id',
        'earned_at',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function badge()
    {
        return $this->belongsTo(Badges::class);
    }
}
