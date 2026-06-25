<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class ParagraphWord extends Model
{
    protected $table = 'paragraph_words';

    protected $fillable = [
        'paragraph_module_id',
        'word',
        'position',
    ];

    public function paragraphModule(): BelongsTo
    {
        return $this->belongsTo(ParagraphModule::class);
    }
}
