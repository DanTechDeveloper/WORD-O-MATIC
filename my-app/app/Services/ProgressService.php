<?php

namespace App\Services;

use App\Models\ParagraphModule;
use App\Models\StudentParagraphProgress;
use App\Models\StudentProfile;
use App\Models\StudentWordProgress;
use App\Models\WordModule;
use Illuminate\Support\Facades\DB;

class ProgressService
{
    public function updateWordProgress(?StudentProfile $student, WordModule $module, int $wordsSmashed, int $wordsProcessed, float $accuracy, bool $isTutorial = false): void
    {
        $this->updateModuleProgress($student, $module, $wordsSmashed, $wordsProcessed, $accuracy,
            StudentWordProgress::class, 'word_module_id',
            WordModule::class,
            'wordBlastAcc', 'read_level', 'read_progress',
            isTutorial: $isTutorial,
        );
    }

    public function updateParagraphProgress(?StudentProfile $student, ParagraphModule $module, int $wordsSmashed, int $wordsProcessed, float $accuracy, bool $isTutorial = false): void
    {
        $this->updateModuleProgress($student, $module, $wordsSmashed, $wordsProcessed, $accuracy,
            StudentParagraphProgress::class, 'paragraph_module_id',
            ParagraphModule::class,
            'storyQuestAcc', 'speak_level', 'speak_progress',
            isTutorial: $isTutorial,
        );
    }

    private function updateModuleProgress(
        ?StudentProfile $student,
        WordModule|ParagraphModule $module,
        int $wordsSmashed,
        int $wordsProcessed,
        float $accuracy,
        string $progressClass,
        string $moduleKey,
        string $moduleClass,
        string $accColumn,
        string $levelColumn,
        string $progressColumn,
        bool $isTutorial = false,
    ): void {
        if (! $student) {
            return;
        }
        DB::transaction(function () use (
            $student, $module, $wordsSmashed, $wordsProcessed, $accuracy,
            $progressClass, $moduleKey, $moduleClass,
            $accColumn, $levelColumn, $progressColumn, $isTutorial,
        ) {
            StudentProfile::where('id', $student->id)->lockForUpdate()->first();

            $wordsProcessed = max(0, $wordsProcessed);
            $wordsSmashed = max(0, min($wordsSmashed, $wordsProcessed));
            $accuracy = (int) round(max(0, min(100, (float) $accuracy)));

            $progress = $progressClass::firstOrNew([
                'user_id' => $student->user_id,
                $moduleKey => $module->id,
            ]);

            $previousBest = $progress->exists ? $progress->words_smashed : 0;

            $isNewBest = ! $progress->exists || $wordsSmashed > $progress->words_smashed;

            if ($isNewBest) {
                $progress->words_smashed = $wordsSmashed;
                $progress->accuracy = $accuracy;
            }

            $totalWords = $module->words()->count();
            // Status is sticky: a worse replay must not regress a completed module,
            // since LevelsPage now allows replaying completed levels (regression guard).
            $progress->status = ($progress->status === 'completed' || ($totalWords > 0 && $wordsProcessed >= $totalWords))
                ? 'completed'
                : 'in_progress';
            $progress->save();

            // Tutorial plays never count toward accuracy/points/status, but they
            // still advance the student out of level 0 (0 -> 1) so the tutorial
            // is reflected as the starting level (mirrors CurriculumSeeder's
            // level-0 tutorial module). Non-tutorial behavior is unchanged below.
            if (! $isTutorial && $isNewBest) {
                $tutorialModule = $moduleClass::where('is_tutorial', true)->first();
                $avgAccuracy = $progressClass::where('user_id', $student->user_id)
                    ->when($tutorialModule, fn ($q) => $q->where($moduleKey, '!=', $tutorialModule->id))
                    ->avg('accuracy');

                // A tutorial replay as the very first play leaves no non-tutorial
                // rows to average — keep the stored accuracy instead of crashing
                // on round(null).
                if ($avgAccuracy !== null) {
                    $student->update([$accColumn => (int) round($avgAccuracy)]);
                }
                $this->recalculateStatus($student);
            }

            // Tutorial modules advance the student out of level 0; a flagged
            // tutorial replay on a non-tutorial module must not (BF24).
            if ($progress->status === 'completed' && $module->level >= $student->{$levelColumn} && (! $isTutorial || $module->is_tutorial)) {
                // Mirror StudentController::dashboard(): tutorial plays never count
                // as earned points. Without these exclusions, a post-onboarding
                // tutorial replay inflates students.points while the dashboard
                // (which excludes tutorial modules) stays flat — silent drift.
                $tutWordId = WordModule::where('is_tutorial', true)->value('id');
                $tutParaId = ParagraphModule::where('is_tutorial', true)->value('id');

                $student->update([
                    $levelColumn => $module->level + 1,
                    $progressColumn => $progressClass::where('user_id', $student->user_id)->where('status', 'completed')->count(),
                    'points' => StudentWordProgress::where('user_id', $student->user_id)
                        ->when($tutWordId, fn ($q) => $q->where('word_module_id', '!=', $tutWordId))
                        ->sum('words_smashed') +
                        StudentParagraphProgress::where('user_id', $student->user_id)
                            ->when($tutParaId, fn ($q) => $q->where('paragraph_module_id', '!=', $tutParaId))
                            ->sum('words_smashed'),
                ]);
            } elseif ($isNewBest && ! $module->is_tutorial) {
                // Same rule for the delta path: an unflagged tutorial replay must
                // not award points the dashboard will never show.
                $delta = max(0, $wordsSmashed - $previousBest);
                if ($delta > 0) {
                    $student->increment('points', $delta);
                }
            }
        });
    }

    // Single source of truth for student risk status. Callers must pass floats
    // plus whether each skill has any non-tutorial progress rows. A 0.00 accuracy
    // is ambiguous (never played vs played and scored zero), so "started" is
    // decided by progress-row existence, never by the accuracy value alone.
    // DECIMAL columns still come back as strings ("0.00" is truthy in PHP), which
    // is why the accuracies are cast to float by every caller.
    public static function classify(
        float $wordBlastAcc,
        float $storyQuestAcc,
        bool $wordStarted,
        bool $storyStarted,
    ): string {
        if (! $wordStarted && ! $storyStarted) {
            return 'notStarted';
        }

        if (! $wordStarted || ! $storyStarted || $wordBlastAcc == 0 || $storyQuestAcc == 0) {
            return 'in_progress';
        }

        $avg = ($wordBlastAcc + $storyQuestAcc) / 2;

        return $avg >= 80 ? 'onTrack' : ($avg >= 60 ? 'support' : 'atRisk');
    }

    // SOT for numeric Final Average — same guards as classify(), null until both
    // skills have a real started signal (otherwise (80+0)/2=40 would mislead).
    // Whole number per DepEd (DO 8 s.2015 Table 8): Final Grade & General Average
    // are reported as whole numbers, 0.5 rounds up.
    public static function finalAverage(
        float $wordBlastAcc,
        float $storyQuestAcc,
        bool $wordStarted,
        bool $storyStarted,
    ): ?int {
        if (! $wordStarted && ! $storyStarted) {
            return null;
        }
        if (! $wordStarted || ! $storyStarted || $wordBlastAcc == 0 || $storyQuestAcc == 0) {
            return null;
        }
        return (int) round(($wordBlastAcc + $storyQuestAcc) / 2);
    }



    private function recalculateStatus(StudentProfile $student): void
    {
        $fresh = $student->fresh();

        // "Started" = the skill has a real (non-empty) best score. A 0% play still
        // counts (progress row with words_processed > 0); an empty-module play does
        // not. Accuracy > 0 alone also counts, covering direct column sets. This is
        // what fixes the both-zero collision without regressing empty-module plays.
        $tutWordId = WordModule::where('is_tutorial', true)->value('id');
        $tutParaId = ParagraphModule::where('is_tutorial', true)->value('id');

        $hasWordProgress = (float) $fresh->wordBlastAcc > 0
            || StudentWordProgress::where('user_id', $fresh->user_id)
                ->when($tutWordId, fn ($q) => $q->where('word_module_id', '!=', $tutWordId))
                ->whereHas('wordModule', fn ($m) => $m->has('words'))
                ->exists();

        $hasParagraphProgress = (float) $fresh->storyQuestAcc > 0
            || StudentParagraphProgress::where('user_id', $fresh->user_id)
                ->when($tutParaId, fn ($q) => $q->where('paragraph_module_id', '!=', $tutParaId))
                ->whereHas('paragraphModule', fn ($m) => $m->has('words'))
                ->exists();

        $status = self::classify(
            (float) $fresh->wordBlastAcc,
            (float) $fresh->storyQuestAcc,
            $hasWordProgress,
            $hasParagraphProgress,
        );

        if ($fresh->status !== $status) {
            $student->update(['status' => $status]);
        }
    }
}
