<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ParagraphModule extends Model
{
    use HasFactory;

    protected $fillable = [
        'level', 'title', 'content', 'total_score',
    ];

    protected $table = 'paragraph_modules';
}
