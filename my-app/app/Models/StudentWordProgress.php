<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentWordProgress extends Model
{
    use HasFactory;

    protected $table = 'student_word_progress';

    protected $fillable = [
        'user_id',
        'word_module_id',
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

    public function module()
    {
        return $this->belongsTo(WordModule::class, 'word_module_id');
    }
}
