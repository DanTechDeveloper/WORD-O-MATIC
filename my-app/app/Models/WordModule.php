<?php

namespace App\Models;

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

    public static function trainingWordsForUser(int $userId): array
    {
        $mastery = DB::table('student_word_mastery')
            ->where('user_id', $userId)
            ->get()
            ->keyBy('word_id');

        return self::buildTrainingWords(self::with('words')->orderBy('level')->get(), $mastery);
    }

    public static function trainingWordsForUsers(array $userIds, ?string $cutoff = null): Collection
    {
        $modules = self::with('words')->orderBy('level')->get();

        $query = DB::table('student_word_mastery')
            ->whereIn('user_id', $userIds);

        if ($cutoff) {
            $query->where('created_at', '<=', $cutoff);
        }

        $masteryByUser = $query->get()->groupBy('user_id');

        return collect($userIds)->mapWithKeys(fn ($id) => [
            $id => self::buildTrainingWords($modules, ($masteryByUser->get($id) ?? collect())->keyBy('word_id')),
        ]);
    }

    private static function buildTrainingWords($modules, $mastery): array
    {
        $training = [];
        foreach ($modules as $module) {
            $words = $module->words->filter(fn ($w) =>
                isset($mastery[$w->id]) && $mastery[$w->id]->status === 'training'
            )->pluck('word')->values();
            if ($words->isNotEmpty()) {
                $training["Level {$module->level}: {$module->title}"] = $words->toArray();
            }
        }
        return $training;
    }

    public static function curriculumForUser(int $userId): array
    {
        $modules = self::with('words')->orderBy('level', 'asc')->get();

        $masteryProgress = DB::table('student_word_mastery')
            ->where('user_id', $userId)
            ->get()
            ->groupBy('word_id');

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
