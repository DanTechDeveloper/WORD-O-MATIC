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
        return self::statusGroups($userIds, 'training', $cutoff);
    }

    public static function masteredWordsForUsers(array $userIds, ?string $cutoff = null): Collection
    {
        return self::statusGroups($userIds, 'mastered', $cutoff);
    }

    private static function masteryQuery(array $userIds, ?string $cutoff = null)
    {
        $query = DB::table('student_paragraph_mastery')->whereIn('user_id', $userIds);

        if ($cutoff) {
            $query->where('created_at', '<=', Carbon::parse($cutoff)->format('Y-m-d H:i:s'));
        }

        return $query;
    }

    private static function modules(): Collection
    {
        return self::with('words')->where('is_tutorial', false)->orderBy('level')->get();
    }

    // The single traversal over modules × mastery that every public reader
    // projects from — curriculumForUser and the batched wrappers alike.
    // Mastery rows are keyed by paragraph_word_id; one row per user+word by design.
    private static function buildLevels($modules, $mastery): array
    {
        return $modules->map(function ($module) use ($mastery) {
            return [
                'level' => "Level {$module->level}: {$module->title}",
                'level_num' => $module->level,
                'words_count' => $module->words->count(),
                'mastered' => $module->words->filter(function ($word) use ($mastery) {
                    return isset($mastery[$word->id]) && $mastery[$word->id]->status === 'mastered';
                })->pluck('word')->values()->all(),
                'training' => $module->words->filter(function ($word) use ($mastery) {
                    return isset($mastery[$word->id]) && $mastery[$word->id]->status === 'training';
                })->pluck('word')->values()->all(),
                'word_stats' => $module->words->map(function ($word) use ($mastery) {
                    $row = $mastery[$word->id] ?? null;

                    return [
                        'word' => $word->word,
                        'mastery' => $row?->status ?? 'unseen',
                        'failed_attempts' => $row->failed_attempts ?? 0,
                    ];
                })->values()->all(),
            ];
        })->toArray();
    }

    // Batched multi-user read; projects one status out of buildLevels().
    private static function statusGroups(array $userIds, string $status, ?string $cutoff): Collection
    {
        $masteryByUser = self::masteryQuery($userIds, $cutoff)->get()->groupBy('user_id');

        return collect($userIds)->mapWithKeys(fn ($id) => [
            $id => collect(self::buildLevels(self::modules(), ($masteryByUser->get($id) ?? collect())->keyBy('paragraph_word_id')))
                ->filter(fn ($level) => $level[$status] !== [])
                ->mapWithKeys(fn ($level) => [$level['level'] => $level[$status]])
                ->all(),
        ]);
    }

    public static function curriculumForUser(int $userId, ?string $cutoff = null): array
    {
        $query = DB::table('student_paragraph_mastery')->where('user_id', $userId);

        if ($cutoff) {
            $query->where('created_at', '<=', Carbon::parse($cutoff)->format('Y-m-d H:i:s'));
        }

        return self::buildLevels(self::modules(), $query->get()->keyBy('paragraph_word_id'));
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
