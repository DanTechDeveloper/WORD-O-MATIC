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
        'last_active_level',
        'read_progress',
        'speak_progress',
        'unlocked_badges',
        'status',
        'wordRisk',
        'paragraphRisk',
    ];

    protected $casts = [
        'unlocked_badges' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
