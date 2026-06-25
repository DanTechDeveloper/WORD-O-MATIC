<?php

namespace App\Services;

use App\Models\ParagraphModule;
use App\Models\StudentParagraphProgress;
use App\Models\StudentProfile;
use App\Models\StudentWordProgress;
use App\Models\WordModule;

class ProgressService
{
    public function updateWordProgress(?StudentProfile $student, WordModule $module, int $wordsSmashed, float $accuracy): void
    {
        if (! $student) {
            return;
        }

        $progress = StudentWordProgress::firstOrNew([
            'user_id' => $student->user_id,
            'word_module_id' => $module->id,
        ]);

        $previousBest = $progress->exists ? $progress->words_smashed : 0;

        $isNewBest = ! $progress->exists || $wordsSmashed > $progress->words_smashed;
        $isBetterAccuracy = $progress->exists && $wordsSmashed == $progress->words_smashed && $accuracy > $progress->accuracy;

        if ($isNewBest || $isBetterAccuracy) {
            $progress->words_smashed = $wordsSmashed;
            $progress->accuracy = $accuracy;
        }

        $progress->status = $wordsSmashed >= $module->total_points ? 'completed' : 'in_progress';
        $progress->save();

        if ($isNewBest || $isBetterAccuracy) {
            $student->update(['wordBlastAcc' => $accuracy]);
        }

        if ($module->level >= $student->read_level) {
            $student->update([
                'read_level' => $module->level + 1,
                'read_progress' => StudentWordProgress::where('user_id', $student->user_id)->where('status', 'completed')->count(),
                'points' => StudentWordProgress::where('user_id', $student->user_id)->sum('words_smashed') +
                            StudentParagraphProgress::where('user_id', $student->user_id)->sum('words_smashed'),
            ]);
        } else {
            $delta = max(0, $wordsSmashed - $previousBest);
            if ($delta > 0) {
                $student->increment('points', $delta);
            }
        }
    }

    public function updateParagraphProgress(?StudentProfile $student, ParagraphModule $module, int $wordsSmashed, float $accuracy): void
    {
        if (! $student) {
            return;
        }

        $progress = StudentParagraphProgress::firstOrNew([
            'user_id' => $student->user_id,
            'paragraph_module_id' => $module->id,
        ]);

        $previousBest = $progress->exists ? $progress->words_smashed : 0;

        $isNewBest = ! $progress->exists || $wordsSmashed > $progress->words_smashed;
        $isBetterAccuracy = $progress->exists && $wordsSmashed == $progress->words_smashed && $accuracy > $progress->accuracy;

        if ($isNewBest || $isBetterAccuracy) {
            $progress->words_smashed = $wordsSmashed;
            $progress->accuracy = $accuracy;
        }

        $progress->status = $wordsSmashed >= $module->total_score ? 'completed' : 'in_progress';
        $progress->save();

        if ($isNewBest || $isBetterAccuracy) {
            $student->update(['storyQuestAcc' => $accuracy]);
        }

        if ($module->level >= $student->speak_level) {
            $student->update([
                'speak_level' => $module->level + 1,
                'speak_progress' => StudentParagraphProgress::where('user_id', $student->user_id)->where('status', 'completed')->count(),
                'points' => StudentWordProgress::where('user_id', $student->user_id)->sum('words_smashed') +
                            StudentParagraphProgress::where('user_id', $student->user_id)->sum('words_smashed'),
            ]);
        } else {
            $delta = max(0, $wordsSmashed - $previousBest);
            if ($delta > 0) {
                $student->increment('points', $delta);
            }
        }
    }
}
