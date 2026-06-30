<?php

namespace Database\Seeders;

use App\Models\ParagraphModule;
use App\Models\ParagraphWord;
use App\Models\StudentParagraphMastery;
use App\Models\StudentParagraphProgress;
use App\Models\StudentWordMastery;
use App\Models\StudentWordProgress;
use App\Models\User;
use App\Models\Word;
use App\Models\WordModule;
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

        $completedLevels = function ($accuracy) {
            if ($accuracy === null || $accuracy == 0) return 0;
            if ($accuracy >= 80) return 5;
            if ($accuracy >= 60) return 3;
            if ($accuracy >= 40) return 2;
            return 1;
        };

        for ($i = 0; $i < 100; $i++) {
            $section = $sections[$i % 3];
            $avatarChar = $avatarChars[$i % 6];
            $hasEmail = $i % 5 !== 0;

            $roll = $i % 10;
            if ($roll < 2) {
                $status = 'notStarted'; $wAcc = 0.0; $sAcc = 0.0;
            } elseif ($roll < 3) {
                $status = 'in_progress'; $wAcc = round(rand(20, 90) + rand(0, 99) / 100, 2); $sAcc = 0.0;
            } elseif ($roll < 5) {
                $status = 'atRisk'; $wAcc = round(rand(1, 55) + rand(0, 99) / 100, 2); $sAcc = round(rand(1, 55) + rand(0, 99) / 100, 2);
            } elseif ($roll < 7) {
                $status = 'support'; $wAcc = round(rand(55, 78) + rand(0, 99) / 100, 2); $sAcc = round(rand(55, 78) + rand(0, 99) / 100, 2);
            } else {
                $status = 'onTrack'; $wAcc = round(rand(78, 100) + rand(0, 99) / 100, 2); $sAcc = round(rand(78, 100) + rand(0, 99) / 100, 2);
            }

            $num = str_pad($i + 1, 3, '0', STR_PAD_LEFT);
            $wLevels = $completedLevels($wAcc);
            $sLevels = $completedLevels($sAcc);
            $totalWordsSmashed = 0;

            $user = User::create([
                'name' => $firstNames[$i],
                'student_id' => "STU-{$num}",
                'pin' => '1234',
                'role' => 'student',
            ]);

            for ($lvl = 1; $lvl <= $wLevels; $lvl++) {
                $module = $wordModules[$lvl];
                $totalPoints = $module->total_points;
                $smashed = (int) round($totalPoints * $wAcc / 100);

                StudentWordProgress::create([
                    'user_id' => $user->id, 'word_module_id' => $module->id,
                    'status' => 'completed', 'words_smashed' => $smashed, 'accuracy' => $wAcc,
                ]);

                foreach (Word::where('word_module_id', $module->id)->get() as $word) {
                    StudentWordMastery::create([
                        'user_id' => $user->id, 'word_id' => $word->id,
                        'status' => (rand(0, 99) < $wAcc) ? 'mastered' : 'training',
                    ]);
                }

                $totalWordsSmashed += $smashed;
            }

            for ($lvl = 1; $lvl <= $sLevels; $lvl++) {
                $module = $paragraphModules[$lvl];
                $totalScore = $module->total_score;
                $smashed = (int) round($totalScore * $sAcc / 100);

                StudentParagraphProgress::create([
                    'user_id' => $user->id, 'paragraph_module_id' => $module->id,
                    'status' => 'completed', 'words_smashed' => $smashed, 'accuracy' => $sAcc,
                ]);

                foreach (ParagraphWord::where('paragraph_module_id', $module->id)->get() as $pw) {
                    StudentParagraphMastery::create([
                        'user_id' => $user->id, 'paragraph_word_id' => $pw->id,
                        'status' => (rand(0, 99) < $sAcc) ? 'mastered' : 'training',
                    ]);
                }

                $totalWordsSmashed += $smashed;
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
            ]);
        }
    }
}
