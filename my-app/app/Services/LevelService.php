<?php

namespace App\Services;

use App\Models\ParagraphModule;
use App\Models\StudentParagraphProgress;
use App\Models\StudentWordProgress;
use App\Models\WordModule;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class LevelService
{
    public function getWordModuleStatuses(int $userId): Collection
    {
        $modules = WordModule::withCount('words')
            ->select(['id', 'level', 'title', 'total_points'])
            ->orderBy('level', 'asc')
            ->get();

        $progressRecords = StudentWordProgress::where('user_id', $userId)
            ->get()
            ->keyBy('word_module_id');

        return $this->mapStatuses($modules, $progressRecords, 'total_points');
    }

    public function getSpeakModuleStatuses(int $userId): Collection
    {
        $modules = ParagraphModule::select(['id', 'level', 'title', 'total_score'])
            ->orderBy('level', 'asc')
            ->get();

        $progressRecords = StudentParagraphProgress::where('user_id', $userId)
            ->get()
            ->keyBy('paragraph_module_id');

        return $this->mapStatuses($modules, $progressRecords, 'total_score');
    }

    private function mapStatuses(Collection $modules, Collection $progressRecords, string $totalField): Collection
    {
        $foundCurrent = false;

        return $modules->map(function ($module) use ($progressRecords, &$foundCurrent, $totalField) {
            $progress = $progressRecords->get($module->id);

            if ($progress && $progress->status === 'completed') {
                $status = 'completed';
            } elseif ($progress && $progress->status === 'in_progress') {
                $status = 'in_progress';
                $foundCurrent = true;
            } elseif (!$foundCurrent) {
                $status = 'current';
                $foundCurrent = true;
            } else {
                $status = 'locked';
            }

            return [
                'id' => $module->id,
                'level' => $module->level,
                'title' => $module->title,
                'total_points' => $module->{$totalField},
                'status' => $status,
                'words_smashed' => $progress ? $progress->words_smashed : 0,
                'score' => $progress ? $progress->words_smashed : 0,
            ];
        });
    }
}
