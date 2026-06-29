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
}
