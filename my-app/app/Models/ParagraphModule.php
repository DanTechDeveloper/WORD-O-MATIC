<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\StudentParagraphProgress;

class ParagraphModule extends Model
{
    use HasFactory;

    protected $fillable = [
        'level', 'title', 'content', 'total_score',
    ];

    protected $table = 'paragraph_modules';

    public function studentProgress()
    {
        return $this->hasMany(StudentParagraphProgress::class, 'paragraph_module_id');
    }
}
