<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WordModule extends Model
{
    protected $table = 'word_modules';

    protected $fillable = [
        'level',
        'title',
        'total_points',
    ];

    public function words(): HasMany
    {
        return $this->hasMany(Word::class)->orderBy('position');
    }
}
