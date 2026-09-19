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
        'sentence_scores',
        'is_deadline_hit',
    ];

    protected $casts = [
        'sentence_scores' => 'array',
    ];

    public static function logSession($userId, $moduleId, $moduleType, $score, $accuracy, $streak, $isDeadlineHit = false, ?array $sentenceScores = null)
    {
        return self::create([
            'user_id' => $userId,
            'module_id' => $moduleId,
            'module_type' => $moduleType,
            'score' => $score,
            'accuracy' => $accuracy,
            'streak' => $streak ?? 0,
            'sentence_scores' => $sentenceScores,
            'is_deadline_hit' => $isDeadlineHit,
        ]);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
