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

        $totalWords = $module->words()->count();
        $progress->status = $wordsSmashed >= $totalWords ? 'completed' : 'in_progress';
        $progress->save();

        if ($progress->status === 'completed') {
            $wordIds = $module->words()->pluck('id');
            StudentWordMastery::where('user_id', $student->user_id)
                ->whereIn('word_id', $wordIds)
                ->where('status', 'training')
                ->update(['status' => 'mastered']);
        }

        if ($isNewBest || $isBetterAccuracy) {
            $student->update(['wordBlastAcc' => $accuracy]);
            $this->recalculateStatus($student);
        }

        if ($progress->status === 'completed' && $module->level >= $student->read_level) {
            $student->update([
                'read_level' => $module->level + 1,
                'read_progress' => StudentWordProgress::where('user_id', $student->user_id)->where('status', 'completed')->count(),
                'points' => StudentWordProgress::where('user_id', $student->user_id)->sum('words_smashed') +
                            StudentParagraphProgress::where('user_id', $student->user_id)->sum('words_smashed'),
            ]);
        } elseif ($isNewBest || $isBetterAccuracy) {
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

        $totalWords = $module->words()->count();
        $progress->status = $wordsSmashed >= $totalWords ? 'completed' : 'in_progress';
        $progress->save();

        if ($progress->status === 'completed') {
            $paraWordIds = $module->words()->pluck('id');
            StudentParagraphMastery::where('user_id', $student->user_id)
                ->whereIn('paragraph_word_id', $paraWordIds)
                ->where('status', 'training')
                ->update(['status' => 'mastered']);
        }

        if ($isNewBest || $isBetterAccuracy) {
            $student->update(['storyQuestAcc' => $accuracy]);
            $this->recalculateStatus($student);
        }

        if ($progress->status === 'completed' && $module->level >= $student->speak_level) {
            $student->update([
                'speak_level' => $module->level + 1,
                'speak_progress' => StudentParagraphProgress::where('user_id', $student->user_id)->where('status', 'completed')->count(),
                'points' => StudentWordProgress::where('user_id', $student->user_id)->sum('words_smashed') +
                            StudentParagraphProgress::where('user_id', $student->user_id)->sum('words_smashed'),
            ]);
        } elseif ($isNewBest || $isBetterAccuracy) {
            $delta = max(0, $wordsSmashed - $previousBest);
            if ($delta > 0) {
                $student->increment('points', $delta);
            }
        }
    }

    private function recalculateStatus(StudentProfile $student): void
    {
        $fresh = $student->fresh();
        $wb = $fresh->wordBlastAcc;
        $sq = $fresh->storyQuestAcc;

        if (!$wb && !$sq) {
            $status = 'notStarted';
        } elseif (!$wb || !$sq) {
            $status = 'in_progress';
        } else {
            $avg = ($wb + $sq) / 2;
            $status = $avg >= 80 ? 'onTrack' : ($avg >= 60 ? 'support' : 'atRisk');
        }

        if ($fresh->status !== $status) {
            $student->update(['status' => $status]);
        }
    }
}
