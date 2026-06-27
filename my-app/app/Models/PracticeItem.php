<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PracticeItem extends Model
{
    protected $fillable = [
        'practice_set_id',
        'content',
        'position',
    ];

    public function set(): BelongsTo
    {
        return $this->belongsTo(PracticeSet::class, 'practice_set_id');
    }
}
