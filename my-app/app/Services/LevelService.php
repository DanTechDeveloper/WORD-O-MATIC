<?php

namespace App\Services;

use App\Models\ParagraphModule;
use App\Models\StudentParagraphProgress;
use App\Models\StudentWordProgress;
use App\Models\WordModule;
use Illuminate\Support\Collection;

class LevelService
{
    public function getWordModuleStatuses(int $userId): Collection
    {
        $modules = WordModule::select(['id', 'level', 'title'])
            ->withCount('words')
            ->orderBy('level', 'asc')
            ->get();

        $progressRecords = StudentWordProgress::where('user_id', $userId)
            ->get()
            ->keyBy('word_module_id');

        return $this->mapStatuses($modules, $progressRecords);
    }

    public function getSpeakModuleStatuses(int $userId): Collection
    {
        $modules = ParagraphModule::select(['id', 'level', 'title'])
            ->withCount('words')
            ->orderBy('level', 'asc')
            ->get();

        $progressRecords = StudentParagraphProgress::where('user_id', $userId)
            ->get()
            ->keyBy('paragraph_module_id');

        return $this->mapStatuses($modules, $progressRecords);
    }

    private function mapStatuses(Collection $modules, Collection $progressRecords): Collection
    {
        $foundCurrent = false;

        return $modules->map(function ($module) use ($progressRecords, &$foundCurrent) {
            $progress = $progressRecords->get($module->id);
            $wordsSmashed = $progress ? $progress->words_smashed : 0;
            $totalWords = $module->words_count ?? 0;

            if ($totalWords > 0 && $wordsSmashed >= $totalWords) {
                $status = 'completed';
            } elseif ($wordsSmashed > 0) {
                $status = 'in_progress';
            } elseif (! $foundCurrent) {
                $status = 'current';
                $foundCurrent = true;
            } else {
                $status = 'locked';
            }

            return [
                'id' => $module->id,
                'level' => $module->level,
                'title' => $module->title,
                'total_points' => $totalWords,
                'status' => $status,
                'words_smashed' => $wordsSmashed,
                'score' => $wordsSmashed,
            ];
        });
    }
}
