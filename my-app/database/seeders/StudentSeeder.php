<?php

namespace Database\Seeders;

use App\Models\GameSession;
use App\Models\ParagraphModule;
use App\Models\ParagraphWord;
use App\Models\StudentParagraphMastery;
use App\Models\StudentParagraphProgress;
use App\Models\StudentWordMastery;
use App\Models\StudentWordProgress;
use App\Models\User;
use App\Models\Word;
use App\Models\WordModule;
use App\Services\BadgeService;
use App\Services\ProgressService;
use Illuminate\Database\Seeder;

class StudentSeeder extends Seeder
{
    public function run(): void
    {
        // ponytail: idempotent — truncate student data so re-seed without fresh doesn't stack levels/points
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0');
        StudentWordMastery::truncate();
        StudentParagraphMastery::truncate();
        StudentWordProgress::truncate();
        StudentParagraphProgress::truncate();
        GameSession::truncate();
        \App\Models\StudentProfile::truncate();
        User::where('role', 'student')->delete();
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $wordModules = WordModule::all()->keyBy('level');
        $paragraphModules = ParagraphModule::all()->keyBy('level');

        $firstNames = [
            'Dan', 'Bianca', 'Carlos', 'Diana', 'Ethan', 'Fiona', 'Gian', 'Hannah',
            'Ivan', 'Julia', 'Kyle', 'Lea', 'Marco', 'Nina', 'Oscar', 'Paula',
            'Quinn', 'Rafa', 'Sofia', 'Tomas', 'Uma', 'Victor', 'Wendy', 'Xander',
            'Aria', 'Ben', 'Chloe', 'Diego', 'Elena', 'Felix', 'Gemma', 'Hugo',
            'Isla', 'Jake', 'Kira', 'Luis', 'Mia', 'Noah', 'Olivia', 'Pablo',
            'Rosa', 'Sam', 'Tara', 'Ulysses', 'Vera', 'Will', 'Yara', 'Zion',
            'Amy', 'Brent', 'Cara', 'Derek', 'Eliza', 'Finn', 'Gwen', 'Heath',
            'Iris', 'Jade', 'Kurt', 'Lara', 'Milo', 'Nora', 'Owen', 'Perla',
            'Rex', 'Sage', 'Troy', 'Vince', 'Zara', 'Ace', 'Bea', 'Cole',
            'Dawn', 'Erik', 'Faye', 'Greg', 'Holly', 'Jett', 'Kai', 'Lexi',
            'Mae', 'Nico', 'Omar', 'Pearl', 'Rian', 'Skye', 'Theo', 'Una',
            'Viv', 'Wade', 'Xia', 'York', 'Zeke', 'Ayla', 'Blue', 'Cruz',
            'Dez', 'Echo', 'Gage', 'Haze',
        ];

        $sections = ['Sector 7-G', 'Sector Alpha', 'Sector Bravo'];
        $avatarChars = ['juan', 'kyle', 'leo', 'sam', 'zoe', 'ana'];

        // Shuffle of a full range guarantees 100 unique random PINs (no collisions).
        $pins = range(1000, 9999);
        shuffle($pins);

        $completedLevels = function ($accuracy) {
            if ($accuracy === null || $accuracy == 0) {
                return 0;
            }
            if ($accuracy >= 80) {
                return 8;
            }
            if ($accuracy >= 60) {
                return 5;
            }
            if ($accuracy >= 40) {
                return 3;
            }

            return 1;
        };

        // Word Analysis demo spread: low-accuracy students rack up more failed
        // attempts, so seeded rosters exercise Normal / Needs Attention / Recovered.
        $failedAttempts = fn (bool $mastered, float $acc): int => rand(0, 99) < $acc
            ? rand($mastered ? 0 : 1, 2)
            : rand(3, $mastered ? 5 : 8);

        // Mirrors finishRound: score is a word count derived from accuracy,
        // accuracy recomputed from that count, streak capped at the count.
        // ponytail: whole number per DepEd (DO 8 s.2015) — accuracy as int
        $logSession = function (User $user, $moduleId, string $type, int $totalPossible, float $acc) {
            $smashedWords = (int) round($totalPossible * $acc / 100);
            GameSession::create([
                'user_id' => $user->id, 'module_id' => $moduleId, 'module_type' => $type,
                'score' => $smashedWords,
                'accuracy' => $totalPossible > 0 ? (int) round(($smashedWords / $totalPossible) * 100) : 0,
                'streak' => $smashedWords,
                'is_deadline_hit' => rand(0, 9) === 0,
            ]);
        };

        for ($i = 0; $i < 100; $i++) {
            $section = $sections[$i % 3];
            $avatarChar = $avatarChars[$i % 6];
            $hasEmail = $i % 5 !== 0;

            $roll = $i % 10;
            if ($roll < 2) {
                $wAcc = 0.0;
                $sAcc = 0.0;
            } elseif ($roll < 3) {
                $wAcc = rand(20, 90);
                $sAcc = 0.0;
            } elseif ($roll < 5) {
                $wAcc = rand(1, 55);
                $sAcc = rand(1, 55);
            } elseif ($roll < 7) {
                $wAcc = rand(55, 78);
                $sAcc = rand(55, 78);
            } else {
                $wAcc = rand(78, 100);
                $sAcc = rand(78, 100);
            }

            // $status is derived after the progress rows are written (below) so it
            // matches the cached accuracy columns produced from those rows.

            $num = str_pad($i + 1, 3, '0', STR_PAD_LEFT);
            $wLevels = $completedLevels($wAcc);
            $sLevels = $completedLevels($sAcc);
            $totalWordsSmashed = 0;

            $user = User::create([
                'name' => $firstNames[$i],
                'student_id' => "STU-{$num}",
                'pin' => (string) $pins[$i],
                'role' => 'student',
            ]);

            for ($lvl = 1; $lvl <= $wLevels; $lvl++) {
                $module = $wordModules[$lvl];
                $totalPoints = $module->total_points;
                $smashed = (int) round($totalPoints * $wAcc / 100);

                StudentWordProgress::create([
                    'user_id' => $user->id, 'word_module_id' => $module->id,
                    'status' => 'completed', 'words_smashed' => $smashed, 'accuracy' => $totalPoints > 0 ? (int) round(($smashed / $totalPoints) * 100) : 0,
                ]);

                foreach (Word::where('word_module_id', $module->id)->get() as $word) {
                    $mastered = rand(0, 99) < $wAcc;
                    StudentWordMastery::create([
                        'user_id' => $user->id, 'word_id' => $word->id,
                        'status' => $mastered ? 'mastered' : 'training',
                        'failed_attempts' => $failedAttempts($mastered, $wAcc),
                    ]);
                }

                $totalWordsSmashed += $smashed;
                $logSession($user, $module->id, 'word', 10, $wAcc);
            }

            for ($lvl = 1; $lvl <= $sLevels; $lvl++) {
                $module = $paragraphModules[$lvl];
                $totalScore = $module->total_score;
                $smashed = (int) round($totalScore * $sAcc / 100);

                StudentParagraphProgress::create([
                    'user_id' => $user->id, 'paragraph_module_id' => $module->id,
                    'status' => 'completed', 'words_smashed' => $smashed, 'accuracy' => $totalScore > 0 ? (int) round(($smashed / $totalScore) * 100) : 0,
                ]);

                // Sentence-coherent mastery: per sentence roll, all words in that sentence share same mastery
                // so sentence_stats `mastery=every word mastered` + `failed_attempts=sum(word)` yields clean Mastery/Training chips
                $sentences = ParagraphModule::sentencesFromContent($module->content ?? '');
                $pws = ParagraphWord::where('paragraph_module_id', $module->id)->orderBy('position')->get()->values();
                $cursor = 0;
                foreach ($sentences as $sentence) {
                    $cnt = $sentence === '' ? 0 : count(preg_split('/\s+/', trim($sentence), -1, PREG_SPLIT_NO_EMPTY));
                    $slice = $pws->slice($cursor, $cnt);
                    $cursor += $cnt;
                    $masteredSentence = rand(0, 99) < $sAcc;
                    foreach ($slice as $pw) {
                        StudentParagraphMastery::create([
                            'user_id' => $user->id, 'paragraph_word_id' => $pw->id,
                            'status' => $masteredSentence ? 'mastered' : 'training',
                            'failed_attempts' => $failedAttempts($masteredSentence, $sAcc),
                        ]);
                    }
                }
                // Fallback for modules where content split mismatches word count (legacy)
                if ($pws->count() > $cursor) {
                    foreach ($pws->slice($cursor) as $pw) {
                        $mastered = rand(0, 99) < $sAcc;
                        StudentParagraphMastery::create([
                            'user_id' => $user->id, 'paragraph_word_id' => $pw->id,
                            'status' => $mastered ? 'mastered' : 'training',
                            'failed_attempts' => $failedAttempts($mastered, $sAcc),
                        ]);
                    }
                }

                $totalWordsSmashed += $smashed;
                $logSession($user, $module->id, 'paragraph', ParagraphWord::where('paragraph_module_id', $module->id)->count(), $sAcc);
            }

            // Recompute the cached accuracy columns from the rows just written so
            // wordBlastAcc/storyQuestAcc equal the true module average (per-module
            // accuracy is integer-rounded, so the random target never matched).
            $wAcc = (int) round(StudentWordProgress::where('user_id', $user->id)->avg('accuracy') ?? 0);
            $sAcc = (int) round(StudentParagraphProgress::where('user_id', $user->id)->avg('accuracy') ?? 0);
            $status = ProgressService::classify($wAcc, $sAcc, $wAcc != 0, $sAcc != 0);

            $user->student()->create([
                'points' => $totalWordsSmashed,
                'avatar' => "/images/avatars/{$avatarChar}/head.png",
                'gender' => $i % 2 === 0 ? 'male' : 'female',
                'read_progress' => $wLevels, 'speak_progress' => $sLevels,
                'read_level' => $wLevels + 1, 'speak_level' => $sLevels + 1,
                'status' => $status, 'wordBlastAcc' => $wAcc, 'storyQuestAcc' => $sAcc,
                'section' => $section,
                'parent_email' => $hasEmail ? "parent.stu{$num}@email.com" : null,
                'tutorial_completed_at' => now(),
            ]);

            app(BadgeService::class)->checkAllEligibleBadges($user);
        }

        // Perfect Level 10 demo students — 10/10 both modes, with Recovered in Mastery Zone
        // Ensures StudentDetails shows LV10, 100% progress, and both Needs Attention + Recovered chips.
        // Guard: ProgressService caps at 10 and throws beyond, so these are the max.
        $perfectStudents = [
            ['name' => 'Astra Perfect', 'student_id' => 'STU-101', 'section' => 'Sector 7-G', 'avatarChar' => 'ana', 'gender' => 'female'],
            ['name' => 'Nova Stellar', 'student_id' => 'STU-102', 'section' => 'Sector Alpha', 'avatarChar' => 'leo', 'gender' => 'male'],
            ['name' => 'Stellar Apex', 'student_id' => 'STU-103', 'section' => 'Sector Bravo', 'avatarChar' => 'zoe', 'gender' => 'female'],
        ];
        foreach ($perfectStudents as $idx => $p) {
            $user = User::create([
                'name' => $p['name'],
                'student_id' => $p['student_id'],
                'pin' => (string) $pins[100 + $idx], // use remaining shuffled pins
                'role' => 'student',
            ]);
            $totalWordsSmashed = 0;
            // Word Blast 10/10
            for ($lvl = 1; $lvl <= 10; $lvl++) {
                $module = $wordModules[$lvl];
                $totalPoints = $module->total_points;
                $smashed = $totalPoints; // 100%
                StudentWordProgress::create([
                    'user_id' => $user->id, 'word_module_id' => $module->id,
                    'status' => 'completed', 'words_smashed' => $smashed, 'accuracy' => 100,
                ]);
                $words = Word::where('word_module_id', $module->id)->get();
                foreach ($words as $pos => $word) {
                    // 70% Normal mastered (0-2), 20% Recovered (mastered 3-5), 10% Needs Attention (training 3-8)
                    $roll = rand(0, 99);
                    if ($roll < 70) {
                        $mastered = true; $attempts = rand(0, 2);
                    } elseif ($roll < 90) {
                        $mastered = true; $attempts = rand(3, 5); // Recovered
                    } else {
                        $mastered = false; $attempts = rand(3, 8); // Needs Attention
                    }
                    StudentWordMastery::create([
                        'user_id' => $user->id, 'word_id' => $word->id,
                        'status' => $mastered ? 'mastered' : 'training',
                        'failed_attempts' => $attempts,
                    ]);
                }
                $totalWordsSmashed += $smashed;
                $logSession($user, $module->id, 'word', 10, 100);
            }
            // Story Quest 10/10
            for ($lvl = 1; $lvl <= 10; $lvl++) {
                $module = $paragraphModules[$lvl];
                $totalScore = $module->total_score;
                $smashed = $totalScore;
                StudentParagraphProgress::create([
                    'user_id' => $user->id, 'paragraph_module_id' => $module->id,
                    'status' => 'completed', 'words_smashed' => $smashed, 'accuracy' => 100,
                ]);
                $sentences = ParagraphModule::sentencesFromContent($module->content ?? '');
                $pws = ParagraphWord::where('paragraph_module_id', $module->id)->orderBy('position')->get()->values();
                $cursor = 0;
                foreach ($sentences as $sentence) {
                    $cnt = $sentence === '' ? 0 : count(preg_split('/\s+/', trim($sentence), -1, PREG_SPLIT_NO_EMPTY));
                    $slice = $pws->slice($cursor, $cnt);
                    $cursor += $cnt;
                    // Sentence-level Recovered: 80% mastered (half of those Recovered), 20% training
                    $roll = rand(0, 99);
                    if ($roll < 60) {
                        $masteredSentence = true; $attempts = rand(0, 2);
                    } elseif ($roll < 80) {
                        $masteredSentence = true; $attempts = rand(3, 5);
                    } else {
                        $masteredSentence = false; $attempts = rand(3, 8);
                    }
                    // Distribute attempts across words in sentence for sum
                    $perWord = $cnt > 0 ? intdiv($attempts, $cnt) : 0;
                    $rem = $cnt > 0 ? $attempts % $cnt : 0;
                    foreach ($slice as $i => $pw) {
                        $a = $perWord + ($i < $rem ? 1 : 0);
                        StudentParagraphMastery::create([
                            'user_id' => $user->id, 'paragraph_word_id' => $pw->id,
                            'status' => $masteredSentence ? 'mastered' : 'training',
                            'failed_attempts' => $a,
                        ]);
                    }
                }
                if ($pws->count() > $cursor) {
                    foreach ($pws->slice($cursor) as $pw) {
                        StudentParagraphMastery::create([
                            'user_id' => $user->id, 'paragraph_word_id' => $pw->id,
                            'status' => 'training',
                            'failed_attempts' => rand(3, 8),
                        ]);
                    }
                }
                $totalWordsSmashed += $smashed;
                $logSession($user, $module->id, 'paragraph', ParagraphWord::where('paragraph_module_id', $module->id)->count(), 100);
            }
            $user->student()->create([
                'points' => $totalWordsSmashed,
                'avatar' => "/images/avatars/{$p['avatarChar']}/head.png",
                'gender' => $p['gender'],
                'read_progress' => 10, 'speak_progress' => 10,
                'read_level' => 10, 'speak_level' => 10, // capped at 10, not 11
                'status' => 'onTrack', 'wordBlastAcc' => 100, 'storyQuestAcc' => 100,
                'section' => $p['section'],
                'parent_email' => "parent.".strtolower(str_replace(' ', '', $p['student_id']))."@email.com",
                'tutorial_completed_at' => now(),
            ]);
            app(BadgeService::class)->checkAllEligibleBadges($user);
        }
    }
}
