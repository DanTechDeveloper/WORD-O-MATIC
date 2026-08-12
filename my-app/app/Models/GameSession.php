<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
        'is_deadline_hit',
    ];

    public static function logSession($userId, $moduleId, $moduleType, $score, $accuracy, $streak, $isDeadlineHit = false)
    {
        return self::create([
            'user_id' => $userId,
            'module_id' => $moduleId,
            'module_type' => $moduleType,
            'score' => $score,
            'accuracy' => $accuracy,
            'streak' => $streak ?? 0,
            'is_deadline_hit' => $isDeadlineHit,
        ]);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
