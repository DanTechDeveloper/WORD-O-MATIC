<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class WordModule extends Model
{
    protected $table = 'word_modules';

    protected $fillable = [
        'level',
        'title',
        'is_tutorial',
    ];

    protected $appends = ['total_points'];

    public function words(): HasMany
    {
        return $this->hasMany(Word::class)->orderBy('position');
    }

    public function getTotalPointsAttribute(): int
    {
        return $this->relationLoaded('words') ? $this->words->count() : $this->words()->count();
    }

    public static function trainingWordsForUsers(array $userIds, ?string $cutoff = null): Collection
    {
        $modules = self::with('words')->where('is_tutorial', false)->orderBy('level')->get();

        $masteryByUser = self::masteryQuery($userIds, $cutoff)->get()->groupBy('user_id');

        return collect($userIds)->mapWithKeys(fn ($id) => [
            $id => self::buildStatusWords($modules, 'training', ($masteryByUser->get($id) ?? collect())->keyBy('word_id')),
        ]);
    }

    public static function masteredWordsForUsers(array $userIds, ?string $cutoff = null): Collection
    {
        $modules = self::with('words')->where('is_tutorial', false)->orderBy('level')->get();

        $masteryByUser = self::masteryQuery($userIds, $cutoff)->get()->groupBy('user_id');

        return collect($userIds)->mapWithKeys(fn ($id) => [
            $id => self::buildStatusWords($modules, 'mastered', ($masteryByUser->get($id) ?? collect())->keyBy('word_id')),
        ]);
    }

    private static function masteryQuery(array $userIds, ?string $cutoff = null)
    {
        $query = DB::table('student_word_mastery')->whereIn('user_id', $userIds);

        if ($cutoff) {
            $query->where('created_at', '<=', Carbon::parse($cutoff)->format('Y-m-d H:i:s'));
        }

        return $query;
    }

    private static function buildStatusWords($modules, $status, $mastery): array
    {
        $words = [];
        foreach ($modules as $module) {
            $moduleWords = $module->words->filter(fn ($w) => isset($mastery[$w->id]) && $mastery[$w->id]->status === $status
            )->pluck('word')->values();
            if ($moduleWords->isNotEmpty()) {
                $words["Level {$module->level}: {$module->title}"] = $moduleWords->toArray();
            }
        }

        return $words;
    }

    public static function curriculumForUser(int $userId, ?string $cutoff = null): array
    {
        $modules = self::with('words')->where('is_tutorial', false)->orderBy('level', 'asc')->get();

        $query = DB::table('student_word_mastery')->where('user_id', $userId);

        if ($cutoff) {
            $query->where('created_at', '<=', Carbon::parse($cutoff)->format('Y-m-d H:i:s'));
        }

        $masteryProgress = $query->get()->groupBy('word_id');

        return $modules->map(function ($module) use ($masteryProgress) {
            return [
                'level' => "Level {$module->level}: {$module->title}",
                'level_num' => $module->level,
                'words_count' => $module->words->count(),
                'mastered' => $module->words->filter(function ($word) use ($masteryProgress) {
                    return isset($masteryProgress[$word->id]) && $masteryProgress[$word->id][0]->status === 'mastered';
                })->pluck('word')->values(),
                'training' => $module->words->filter(function ($word) use ($masteryProgress) {
                    return isset($masteryProgress[$word->id]) && $masteryProgress[$word->id][0]->status === 'training';
                })->pluck('word')->values(),
            ];
        })->toArray();
    }

    public static function saveWithWords(array $data): void
    {
        $module = self::updateOrCreate(
            ['level' => $data['level']],
            ['title' => $data['title']],
        );

        $module->words()->delete();

        foreach ($data['words'] as $index => $wordData) {
            $wordText = trim($wordData['word'] ?? '');

            if ($wordText !== '') {
                $module->words()->create([
                    'word' => strtoupper($wordText),
                    'position' => $index + 1,
                ]);
            }
        }
    }
}
