<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentParagraphProgress extends Model
{
    use HasFactory;

    protected $table = 'student_paragraph_progress';

    protected $fillable = [
        'user_id',
        'paragraph_module_id',
        'status',
        'score',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function paragraphModule()
    {
        return $this->belongsTo(ParagraphModule::class, 'paragraph_module_id');
    }
}
