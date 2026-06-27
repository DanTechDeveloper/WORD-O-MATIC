<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PracticeSet extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'type',
        'content',
        'total_items',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(PracticeItem::class, 'practice_set_id')->orderBy('position');
    }
}
