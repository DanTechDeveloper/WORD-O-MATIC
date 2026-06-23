<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PracticeWord extends Model
{
    protected $fillable = [
        'practice_word_set_id',
        'word',
        'position',
    ];

    public function set(): BelongsTo
    {
        return $this->belongsTo(PracticeWordSet::class, 'practice_word_set_id');
    }
}
