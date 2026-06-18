<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class GameSession extends Model
{
    protected $table = 'game_sessions';

    protected $fillable = [
        'user_id',
        'module_id',
        'module_type',
        'score',
        'accuracy',
        'streak',
    ];

    /**
     * Get the user that owns the game session.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the parent module (WordModule or ParagraphModule).
     *
     * To make this work with 'word' and 'paragraph' strings, ensure you
     * have defined a Relation::morphMap in your AppServiceProvider.
     */
    public function module(): MorphTo
    {
        return $this->morphTo(null, 'module_type', 'module_id');
    }
}
