<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentWordMastery extends Model
{
    protected $table = 'student_word_mastery';

    protected $fillable = [
        'user_id',
        'word_id',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function word()
    {
        return $this->belongsTo(Word::class);
    }
}