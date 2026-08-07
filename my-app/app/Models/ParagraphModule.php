<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ParagraphModule extends Model
{
    use HasFactory;

    protected $fillable = [
        'level', 'title', 'content', 'is_tutorial',
    ];

    protected $appends = ['total_score'];

    protected $table = 'paragraph_modules';

    public function studentProgress(): HasMany
    {
        return $this->hasMany(StudentParagraphProgress::class, 'paragraph_module_id');
    }

    public function words(): HasMany
    {
        return $this->hasMany(ParagraphWord::class)->orderBy('position');
    }

    public function getTotalScoreAttribute(): int
    {
        return $this->relationLoaded('words')
            ? $this->words->count()
            : ($this->words_count ?? $this->words()->count());
    }

    public static function trainingWordsForUsers(array $userIds, ?string $cutoff = null): Collection
    {
        $modules = self::with('words')->where('is_tutorial', false)->orderBy('level')->get();

        $masteryByUser = self::masteryQuery($userIds, $cutoff)->get()->groupBy('user_id');

        return collect($userIds)->mapWithKeys(fn ($id) => [
            $id => self::buildStatusWords($modules, 'training', ($masteryByUser->get($id) ?? collect())->keyBy('paragraph_word_id')),
        ]);
    }

    public static function masteredWordsForUsers(array $userIds, ?string $cutoff = null): Collection
    {
        $modules = self::with('words')->where('is_tutorial', false)->orderBy('level')->get();

        $masteryByUser = self::masteryQuery($userIds, $cutoff)->get()->groupBy('user_id');

        return collect($userIds)->mapWithKeys(fn ($id) => [
            $id => self::buildStatusWords($modules, 'mastered', ($masteryByUser->get($id) ?? collect())->keyBy('paragraph_word_id')),
        ]);
    }

    private static function masteryQuery(array $userIds, ?string $cutoff = null)
    {
        $query = DB::table('student_paragraph_mastery')->whereIn('user_id', $userIds);

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

        $query = DB::table('student_paragraph_mastery')->where('user_id', $userId);

        if ($cutoff) {
            $query->where('created_at', '<=', Carbon::parse($cutoff)->format('Y-m-d H:i:s'));
        }

        $masteryProgress = $query->get()->groupBy('paragraph_word_id');

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

    public static function saveWithContent(array $data): void
    {
        $module = self::updateOrCreate(
            ['level' => $data['level']],
            [
                'title' => $data['title'],
                'content' => $data['content'] ?? '',
            ],
        );

        $module->words()->delete();

        $contentWords = ! empty(trim($data['content'] ?? ''))
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
