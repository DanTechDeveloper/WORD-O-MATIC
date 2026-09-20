<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\BadgeService;
use App\Services\ProgressService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class FinalizeGameSession implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $userId,
        public int $sessionId,
        public string $moduleType, // word|paragraph
        public float $accuracy,
    ) {}

    public function handle(BadgeService $badgeService, ProgressService $progressService): void
    {
        $t0 = microtime(true);
        $user = User::with('student')->find($this->userId);
        if (! $user || ! $user->student) return;

        // ponytail: heavy derived recalc (avg + status) — was inside the locked TX on every finishRound
        try {
            $progressService->recalculateDerived($user->student);
        } catch (\Throwable $e) {
            Log::warning('FinalizeGameSession recalc failed', ['user' => $this->userId, 'err' => $e->getMessage()]);
        }

        $t1 = microtime(true);
        // ponytail: badge fan-out (curriculum + bestSentence) — heaviest sync step, now off-request
        try {
            $badgeService->checkGameplayBadges($user, $this->sessionId, $this->accuracy);
        } catch (\Throwable $e) {
            Log::warning('FinalizeGameSession badges failed', ['user' => $this->userId, 'err' => $e->getMessage()]);
        }
        // ponytail: catch-up for tutorial-complete edge (award is idempotent)
        try {
            $badgeService->checkAllEligibleBadges($user);
        } catch (\Throwable $e) {
            Log::warning('FinalizeGameSession catchup failed', ['err' => $e->getMessage()]);
        }

        if (app()->hasDebugModeEnabled()) {
            Log::info('FinalizeGameSession', ['user' => $this->userId, 'ms' => (int) ((microtime(true) - $t0) * 1000), 'recalc_ms' => (int) (($t1 - $t0) * 1000)]);
        }
    }
}
