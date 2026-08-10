<?php

namespace App\Services;

use App\Models\ParagraphModule;
use App\Models\StudentParagraphMastery;
use App\Models\StudentParagraphProgress;
use App\Models\StudentProfile;
use App\Models\StudentWordMastery;
use App\Models\StudentWordProgress;
use App\Models\WordModule;

class ProgressService
{
    public function updateWordProgress(?StudentProfile $student, WordModule $module, int $wordsSmashed, int $wordsProcessed, float $accuracy, bool $isTutorial = false): void
    {
        $this->updateModuleProgress($student, $module, $wordsSmashed, $wordsProcessed, $accuracy,
            StudentWordProgress::class, 'word_module_id',
            StudentWordMastery::class, 'word_id',
            WordModule::class,
            'wordBlastAcc', 'read_level', 'read_progress',
            isTutorial: $isTutorial,
        );
    }

    public function updateParagraphProgress(?StudentProfile $student, ParagraphModule $module, int $wordsSmashed, int $wordsProcessed, float $accuracy, bool $isTutorial = false): void
    {
        $this->updateModuleProgress($student, $module, $wordsSmashed, $wordsProcessed, $accuracy,
            StudentParagraphProgress::class, 'paragraph_module_id',
            StudentParagraphMastery::class, 'paragraph_word_id',
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
        string $masteryClass,
        string $wordKey,
        string $moduleClass,
        string $accColumn,
        string $levelColumn,
        string $progressColumn,
        bool $isTutorial = false,
    ): void {
        if (! $student) {
            return;
        }

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

        if ($isTutorial) {
            return;
        }

        if ($isNewBest) {
            $tutorialModule = $moduleClass::where('is_tutorial', true)->first();
            $avgAccuracy = $progressClass::where('user_id', $student->user_id)
                ->when($tutorialModule, fn ($q) => $q->where($moduleKey, '!=', $tutorialModule->id))
                ->avg('accuracy');
            $student->update([$accColumn => round($avgAccuracy, 2)]);
            $this->recalculateStatus($student);
        }

        if ($progress->status === 'completed' && $module->level >= $student->{$levelColumn}) {
            $student->update([
                $levelColumn => $module->level + 1,
                $progressColumn => $progressClass::where('user_id', $student->user_id)->where('status', 'completed')->count(),
                'points' => StudentWordProgress::where('user_id', $student->user_id)->sum('words_smashed') +
                            StudentParagraphProgress::where('user_id', $student->user_id)->sum('words_smashed'),
            ]);
        } elseif ($isNewBest) {
            $delta = max(0, $wordsSmashed - $previousBest);
            if ($delta > 0) {
                $student->increment('points', $delta);
            }
        }
    }

    private function recalculateStatus(StudentProfile $student): void
    {
        $fresh = $student->fresh();
        // Force float: DECIMAL columns come back as strings ("0.00" is truthy in PHP,
        // which would misclassify a one-skill student as atRisk instead of in_progress).
        $wb = (float) $fresh->wordBlastAcc;
        $sq = (float) $fresh->storyQuestAcc;

        if (! $wb && ! $sq) {
            $status = 'notStarted';
        } elseif (! $wb || ! $sq) {
            $status = 'in_progress';
        } else {
            $avg = ($wb + $sq ) / 2;
            $status = $avg >= 80 ? 'onTrack' : ($avg >= 60 ? 'support' : 'atRisk');
        }

        if ($fresh->status !== $status) {
            $student->update(['status' => $status]);
        }
    }
}
