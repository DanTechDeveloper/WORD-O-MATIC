<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class WordModule extends Model
{
    protected $table = 'word_modules';

    protected $fillable = [
        'level',
        'title',
        'total_points',
    ];

    public function words(): HasMany
    {
        return $this->hasMany(Word::class)->orderBy('position');
    }

    public static function trainingWordsForUser(int $userId): array
    {
        $modules = self::with('words')->orderBy('level', 'asc')->get();

        $masteryProgress = DB::table('student_word_mastery')
            ->where('user_id', $userId)
            ->get()
            ->groupBy('word_id');

        $training = [];

        foreach ($modules as $module) {
            $trainingWords = $module->words->filter(function ($word) use ($masteryProgress) {
                return isset($masteryProgress[$word->id]) && $masteryProgress[$word->id][0]->status === 'training';
            })->pluck('word')->values();

            if ($trainingWords->isNotEmpty()) {
                $training["Level {$module->level}: {$module->title}"] = $trainingWords->toArray();
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

        $totalPoints = 0;

        foreach ($data['words'] as $index => $wordData) {
            $wordText = trim($wordData['word'] ?? '');

            if ($wordText !== '') {
                $points = (isset($wordData['points']) && $wordData['points'] !== '') ? (int) $wordData['points'] : 1;

                $module->words()->create([
                    'word' => strtoupper($wordText),
                    'points' => $points,
                    'position' => $index + 1,
                ]);

                $totalPoints += $points;
            }
        }

        $module->update(['total_points' => $data['totalScore'] ?? $totalPoints]);
    }
}
