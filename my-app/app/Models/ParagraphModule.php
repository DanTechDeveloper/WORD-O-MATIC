<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class ParagraphModule extends Model
{
    use HasFactory;

    protected $fillable = [
        'level', 'title', 'content', 'total_score',
    ];

    protected $table = 'paragraph_modules';

    public function studentProgress(): HasMany
    {
        return $this->hasMany(StudentParagraphProgress::class, 'paragraph_module_id');
    }

    public function words(): HasMany
    {
        return $this->hasMany(ParagraphWord::class)->orderBy('position');
    }

    public static function trainingWordsForUser(int $userId): array
    {
        $modules = self::with('words')->orderBy('level', 'asc')->get();

        $masteryProgress = DB::table('student_paragraph_mastery')
            ->where('user_id', $userId)
            ->get()
            ->groupBy('paragraph_word_id');

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

        $masteryProgress = DB::table('student_paragraph_mastery')
            ->where('user_id', $userId)
            ->get()
            ->groupBy('paragraph_word_id');

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

    public static function saveWithContent(array $data): void
    {
        $wordCount = !empty(trim($data['content'] ?? ''))
            ? count(preg_split('/\s+/', trim($data['content']), -1, PREG_SPLIT_NO_EMPTY))
            : 0;

        $module = self::updateOrCreate(
            ['level' => $data['level']],
            [
                'title' => $data['title'],
                'content' => $data['content'] ?? '',
                'total_score' => $wordCount,
            ],
        );

        $module->words()->delete();

        $contentWords = !empty(trim($data['content'] ?? ''))
            ? preg_split('/\s+/', trim($data['content']), -1, PREG_SPLIT_NO_EMPTY)
            : [];

        foreach ($contentWords as $pos => $word) {
            ParagraphWord::create([
                'paragraph_module_id' => $module->id,
                'word' => $word,
                'position' => $pos + 1,
            ]);
        }
    }
}
