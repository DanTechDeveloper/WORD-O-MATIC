<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PracticeWordSet extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'total_words',
    ];

    public function words(): HasMany
    {
        return $this->hasMany(PracticeWord::class, 'practice_word_set_id')->orderBy('position');
    }
}
