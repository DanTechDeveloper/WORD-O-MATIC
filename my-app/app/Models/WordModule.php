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
    ];

    protected $appends = ['total_points'];

    public function words(): HasMany
    {
        return $this->hasMany(Word::class)->orderBy('position');
    }

    public function getTotalPointsAttribute()
    {
        return (int) $this->words->sum('points');
    }
}
