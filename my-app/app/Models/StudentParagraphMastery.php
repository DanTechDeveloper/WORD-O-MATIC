<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentParagraphMastery extends Model
{
    protected $table = 'student_paragraph_mastery';

    protected $fillable = [
        'user_id',
        'paragraph_word_id',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function paragraphWord()
    {
        return $this->belongsTo(ParagraphWord::class);
    }
}
