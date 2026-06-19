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
     * BUSINESS LOGIC: Sentralisadong taga-log ng bawat laro
     */
    public static function logSession($userId, $moduleId, $moduleType, $score, $accuracy, $streak)
    {
        return self::create([
            'user_id'     => $userId,
            'module_id'   => $moduleId,
            'module_type' => $moduleType, // Masasave nito ay 'word' o 'paragraph'
            'score'       => $score,
            'accuracy'    => $accuracy,
            'streak'      => $streak ?? 0,
        ]);
    }

    /**
     * Get the user that owns the game session.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the parent module (WordModule or ParagraphModule).
     */
    public function module(): MorphTo
    {
        return $this->morphTo(null, 'module_type', 'module_id');
    }
}