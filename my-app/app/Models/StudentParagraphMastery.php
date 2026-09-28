<?php

namespace App\Models;

use App\Services\ProgressService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class StudentParagraphMastery extends Model
{
    protected $table = 'student_paragraph_mastery';

    protected $fillable = [
        'user_id',
        'paragraph_word_id',
        'status',
        'failed_attempts',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function paragraphWord()
    {
        return $this->belongsTo(ParagraphWord::class);
    }

    // Story Quest twin of StudentWordMastery::hardestModule(). Same shape, same
    // delegation to the ProgressService::hardestFrom() SSOT, same is_tutorial
    // exclusion — read the note there before changing anything here.
    public static function hardestModule(): ?array
    {
        $row = DB::table('student_paragraph_mastery')
            ->join('paragraph_words', 'paragraph_words.id', '=', 'student_paragraph_mastery.paragraph_word_id')
            ->join('paragraph_modules', 'paragraph_modules.id', '=', 'paragraph_words.paragraph_module_id')
            ->where('paragraph_modules.is_tutorial', false)
            ->where('student_paragraph_mastery.status', 'training')
            ->groupBy('paragraph_modules.id', 'paragraph_modules.level', 'paragraph_modules.title')
            ->selectRaw(
                'paragraph_modules.level AS level_num, paragraph_modules.title AS title,'
                .' SUM(student_paragraph_mastery.failed_attempts) AS attempts'
            )
            ->orderByDesc('attempts')
            ->limit(1)
            ->first();

        if ($row === null) {
            return null;
        }

        return ProgressService::hardestFrom([
            $row->level_num => ['title' => $row->title, 'attempts' => $row->attempts],
        ]);
    }
}
