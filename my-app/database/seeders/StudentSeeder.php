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
                return 5;
            }
            if ($accuracy >= 60) {
                return 3;
            }
            if ($accuracy >= 40) {
                return 2;
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
        $logSession = function (User $user, $moduleId, string $type, int $totalPossible, float $acc) {
            $smashedWords = (int) round($totalPossible * $acc / 100);
            GameSession::create([
                'user_id' => $user->id, 'module_id' => $moduleId, 'module_type' => $type,
                'score' => $smashedWords,
                'accuracy' => $totalPossible > 0 ? round(($smashedWords / $totalPossible) * 100, 2) : 0,
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
                $wAcc = round(rand(20, 90) + rand(0, 99) / 100, 2);
                $sAcc = 0.0;
            } elseif ($roll < 5) {
                $wAcc = round(rand(1, 55) + rand(0, 99) / 100, 2);
                $sAcc = round(rand(1, 55) + rand(0, 99) / 100, 2);
            } elseif ($roll < 7) {
                $wAcc = round(rand(55, 78) + rand(0, 99) / 100, 2);
                $sAcc = round(rand(55, 78) + rand(0, 99) / 100, 2);
            } else {
                $wAcc = round(rand(78, 100) + rand(0, 99) / 100, 2);
                $sAcc = round(rand(78, 100) + rand(0, 99) / 100, 2);
            }

            // Derive via the shared classifier so seeded rows always agree with
            // what recalculateStatus would compute from the same accuracies.
            $status = ProgressService::classify($wAcc, $sAcc, $wAcc != 0, $sAcc != 0);

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
                    'status' => 'completed', 'words_smashed' => $smashed, 'accuracy' => $totalPoints > 0 ? round(($smashed / $totalPoints) * 100, 2) : 0,
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
                    'status' => 'completed', 'words_smashed' => $smashed, 'accuracy' => $totalScore > 0 ? round(($smashed / $totalScore) * 100, 2) : 0,
                ]);

                foreach (ParagraphWord::where('paragraph_module_id', $module->id)->get() as $pw) {
                    $mastered = rand(0, 99) < $sAcc;
                    StudentParagraphMastery::create([
                        'user_id' => $user->id, 'paragraph_word_id' => $pw->id,
                        'status' => $mastered ? 'mastered' : 'training',
                        'failed_attempts' => $failedAttempts($mastered, $sAcc),
                    ]);
                }

                $totalWordsSmashed += $smashed;
                $logSession($user, $module->id, 'paragraph', ParagraphWord::where('paragraph_module_id', $module->id)->count(), $sAcc);
            }

            $user->student()->create([
                'points' => $totalWordsSmashed,
                'avatar' => "/images/avatars/{$avatarChar}/head.png",
                'gender' => $i % 2 === 0 ? 'male' : 'female',
                'read_progress' => $wLevels, 'speak_progress' => $sLevels,
                'read_level' => $wLevels, 'speak_level' => $sLevels,
                'status' => $status, 'wordBlastAcc' => $wAcc, 'storyQuestAcc' => $sAcc,
                'section' => $section,
                'parent_email' => $hasEmail ? "parent.stu{$num}@email.com" : null,
                'tutorial_completed_at' => now(),
            ]);

            app(BadgeService::class)->checkAllEligibleBadges($user);
        }
    }
}
