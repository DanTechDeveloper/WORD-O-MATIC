<?php

namespace App\Services;

use App\Models\GameSession;
use App\Models\ParagraphModule;
use App\Models\User;
use App\Models\WordModule;

class GameSessionService
{
    public function saveWordResult(User $user, WordModule $module, int $wordsSmashed, ?int $streak): array
    {
        return $this->saveResult(
            user: $user,
            module: $module,
            moduleType: 'word',
            wordsSmashed: $wordsSmashed,
            streak: $streak,
            totalField: 'total_points',
            updateProgress: fn($m, $w, $a) => $user->student?->updateWordProgress($m, $w, $a),
        );
    }

    public function saveParagraphResult(User $user, ParagraphModule $module, int $wordsSmashed, ?int $streak): array
    {
        return $this->saveResult(
            user: $user,
            module: $module,
            moduleType: 'paragraph',
            wordsSmashed: $wordsSmashed,
            streak: $streak,
            totalField: 'total_score',
            updateProgress: fn($m, $w, $a) => $user->student?->updateParagraphProgress($m, $w, $a),
        );
    }

    private function saveResult(
        User $user,
        WordModule|ParagraphModule $module,
        string $moduleType,
        int $wordsSmashed,
        ?int $streak,
        string $totalField,
        callable $updateProgress,
    ): array {
        $totalPoints = $module->{$totalField};

        $accuracy = $totalPoints > 0
            ? round(min(($wordsSmashed / $totalPoints) * 100, 100), 2)
            : 0;

        $session = GameSession::logSession(
            $user->id,
            $module->id,
            $moduleType,
            $wordsSmashed,
            $accuracy,
            $streak ?? 0,
        );

        $updateProgress($module, $wordsSmashed, $accuracy);

        return [$session, $accuracy];
    }
}
