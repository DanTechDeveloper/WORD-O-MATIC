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
        'status',
        'words_smashed',
        'accuracy',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function wordModule()
    {
        return $this->belongsTo(WordModule::class, 'word_module_id');
    }
}
