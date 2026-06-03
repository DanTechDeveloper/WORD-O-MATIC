<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Word extends Model
{
    protected $table = 'words';

    protected $fillable = [
        'word_module_id',
        'word',
        'position',
        'points'
    ];

    public function wordModule(): BelongsTo
    {
        return $this->belongsTo(WordModule::class);
    }
}
