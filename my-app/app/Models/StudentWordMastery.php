<?php

namespace App\Models;

use App\Services\ProgressService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class StudentWordMastery extends Model
{
    protected $table = 'student_word_mastery';

    protected $fillable = [
        'user_id',
        'word_id',
        'status',
        'failed_attempts',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function word()
    {
        return $this->belongsTo(Word::class);
    }

    // ── Class-wide hardest-module adapters (whole class, not one student) ──
    //
    // The Excel export used to carry a per-student scope of this metric beside
    // its Top Struggle column. It was cut (it re-ranked the words the "Words
    // Needing Practice" sheet already lists one by one), and with it went the
    // array adapter that fed it — so the class-wide card is now the only
    // consumer of ProgressService::hardestFrom(), and the only scope that has
    // to agree with it.
    //
    // So this adapter only SUMS. Every decision (zero guard, label format,
    // tiebreak, return shape) is delegated to ProgressService::hardestFrom(),
    // the SSOT. That `attempts` value is therefore not decoration: it is the
    // SSOT's only ranking signal.
    //
    // status = 'training' — "where is the class STILL stuck", not "which module
    // was historically hardest". This matches the whole report vocabulary:
    // struggleRowsFrom / trainingAttemptsFrom / NEEDS_ATTENTION_ATTEMPTS and
    // the email Training Zone are all training-only, so Top Struggle and the
    // Hardest card count the same set of rows. A mastered row's counter is
    // frozen at "attempts needed to master" — real history, but a DIFFERENT
    // metric, and mixing the two in one row is what makes a column unreadable.
    //
    // is_tutorial = 0 in the join is mandatory: the tutorial module's words get
    // failed_attempts like any other, so without it "hardest module" is always
    // Level 0 — a plausible-looking wrong answer, not an obvious one.
    //
    // No HAVING attempts > 0 here on purpose: the SSOT skips zero, so the guard
    // exists in exactly one place instead of two that could drift.

    public static function hardestModule(): ?array
    {
        $row = DB::table('student_word_mastery')
            ->join('words', 'words.id', '=', 'student_word_mastery.word_id')
            ->join('word_modules', 'word_modules.id', '=', 'words.word_module_id')
            ->where('word_modules.is_tutorial', false)
            ->where('student_word_mastery.status', 'training')
            ->groupBy('word_modules.id', 'word_modules.level', 'word_modules.title')
            ->selectRaw(
                'word_modules.level AS level_num, word_modules.title AS title,'
                .' SUM(student_word_mastery.failed_attempts) AS attempts'
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

    public static function hardestWord(): ?array
    {
        $row = DB::table('student_word_mastery')
            ->join('words', 'words.id', '=', 'student_word_mastery.word_id')
            ->join('word_modules', 'word_modules.id', '=', 'words.word_module_id')
            ->where('word_modules.is_tutorial', false)
            ->where('student_word_mastery.status', 'training')
            // Grouped by the word ROW, not the word string: the module editor
            // already blocks cross-level reuse, but id is the real key.
            ->groupBy('words.id', 'words.word', 'word_modules.level', 'word_modules.title')
            ->selectRaw(
                'words.word AS word, word_modules.level AS level_num, word_modules.title AS title,'
                .' SUM(student_word_mastery.failed_attempts) AS attempts'
            )
            ->orderByDesc('attempts')
            ->limit(1)
            ->first();

        if ($row === null) {
            return null;
        }

        // Label comes from the SSOT, so this can never print a different
        // "Level N: Title" format than hardestModule() does. No count — the
        // Excel's Top Struggle column already names each word and its attempts.
        $module = ProgressService::hardestFrom([
            $row->level_num => ['title' => $row->title, 'attempts' => $row->attempts],
        ]);

        if ($module === null) {
            return null;
        }

        return [
            'word' => $row->word,
            'level' => $module['level'],
        ];
    }
}
