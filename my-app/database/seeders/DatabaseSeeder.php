<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\WordModule;
use App\Models\ParagraphModule;
use App\Models\StudentWordProgress;
use App\Models\StudentParagraphProgress;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        User::create([
            'name' => 'Admin Teacher',
            'username' => 'admin',
            'password' => bcrypt('password'),
            'role' => 'teacher',
        ]);

        $wordModules = [];
        foreach (range(1, 10) as $level) {
            $wordModules[$level] = WordModule::create([
                'level' => $level,
                'title' => match ($level) {
                    1 => 'Phonics Foundation',
                    2 => 'Vowel Voyage',
                    3 => 'Consonant Quest',
                    4 => 'Blend Brigade',
                    5 => 'Syllable Sprint',
                    6 => 'Prefix Patrol',
                    7 => 'Suffix Squad',
                    8 => 'Compound Crusade',
                    9 => 'Vocabulary Vortex',
                    10 => 'Mastery Marathon',
                },
                'total_points' => $level <= 5 ? 10 : ($level <= 8 ? 15 : 20),
            ]);
        }

        $paragraphModules = [];
        foreach (range(1, 10) as $level) {
            $paragraphModules[$level] = ParagraphModule::create([
                'level' => $level,
                'title' => match ($level) {
                    1 => 'First Sentences',
                    2 => 'Short Stories',
                    3 => 'Descriptive Scenes',
                    4 => 'Narrative Adventures',
                    5 => 'Opinion Pieces',
                    6 => 'Informative Texts',
                    7 => 'Persuasive Arguments',
                    8 => 'Creative Tales',
                    9 => 'Complex Narratives',
                    10 => 'Masterpiece',
                },
                'content' => "Sample content for level {$level}.",
                'total_score' => $level <= 5 ? 10 : ($level <= 8 ? 15 : 20),
            ]);
        }

        $students = [
            ['name' => 'Dan', 'student_id' => 'STU-001', 'pin' => '1234', 'section' => 'Sector 7-G', 'wordBlastAcc' => 92, 'storyQuestAcc' => 88, 'status' => 'onTrack', 'avatar' => '/images/avatars/ana/head.png'],
            ['name' => 'Bianca Cruz', 'student_id' => 'STU-002', 'pin' => '1234', 'section' => 'Sector 7-G', 'wordBlastAcc' => 45, 'storyQuestAcc' => 52, 'status' => 'atRisk', 'avatar' => '/images/avatars/juan/head.png'],
            ['name' => 'Carlos Diaz', 'student_id' => 'STU-003', 'pin' => '1234', 'section' => 'Sector 7-G', 'wordBlastAcc' => 68, 'storyQuestAcc' => 72, 'status' => 'support', 'avatar' => '/images/avatars/kyle/head.png'],
            ['name' => 'Diana Lim', 'student_id' => 'STU-004', 'pin' => '1234', 'section' => 'Sector 7-G', 'wordBlastAcc' => 0.0, 'storyQuestAcc' => 0.0, 'status' => 'notStarted', 'avatar' => '/images/avatars/leo/head.png'],
            ['name' => 'Ethan Tan', 'student_id' => 'STU-005', 'pin' => '1234', 'section' => 'Sector 7-G', 'wordBlastAcc' => 85, 'storyQuestAcc' => 90, 'status' => 'onTrack', 'avatar' => '/images/avatars/sam/head.png'],
            ['name' => 'Fiona Santos', 'student_id' => 'STU-006', 'pin' => '1234', 'section' => 'Sector 7-G', 'wordBlastAcc' => 30, 'storyQuestAcc' => 25, 'status' => 'atRisk', 'avatar' => '/images/avatars/zoe/head.png'],
            ['name' => 'Gian Garcia', 'student_id' => 'STU-007', 'pin' => '1234', 'section' => 'Sector 7-G', 'wordBlastAcc' => 60, 'storyQuestAcc' => 65, 'status' => 'support', 'avatar' => '/images/avatars/ana/head.png'],
            ['name' => 'Hannah Ramos', 'student_id' => 'STU-008', 'pin' => '1234', 'section' => 'Sector Alpha', 'wordBlastAcc' => 95, 'storyQuestAcc' => 93, 'status' => 'onTrack', 'avatar' => '/images/avatars/juan/head.png'],
            ['name' => 'Ivan Mercado', 'student_id' => 'STU-009', 'pin' => '1234', 'section' => 'Sector Alpha', 'wordBlastAcc' => 40, 'storyQuestAcc' => 38, 'status' => 'atRisk', 'avatar' => '/images/avatars/kyle/head.png'],
            ['name' => 'Julia Torres', 'student_id' => 'STU-010', 'pin' => '1234', 'section' => 'Sector Alpha', 'wordBlastAcc' => 0.0, 'storyQuestAcc' => 0.0, 'status' => 'notStarted', 'avatar' => '/images/avatars/leo/head.png'],
            ['name' => 'Kyle Villanueva', 'student_id' => 'STU-011', 'pin' => '1234', 'section' => 'Sector Alpha', 'wordBlastAcc' => 78, 'storyQuestAcc' => 80, 'status' => 'onTrack', 'avatar' => '/images/avatars/sam/head.png'],
            ['name' => 'Lea Sison', 'student_id' => 'STU-012', 'pin' => '1234', 'section' => 'Sector Alpha', 'wordBlastAcc' => 50, 'storyQuestAcc' => 55, 'status' => 'support', 'avatar' => '/images/avatars/zoe/head.png'],
            ['name' => 'Marco Lopez', 'student_id' => 'STU-013', 'pin' => '1234', 'section' => 'Sector Bravo', 'wordBlastAcc' => 88, 'storyQuestAcc' => 84, 'status' => 'onTrack', 'avatar' => '/images/avatars/ana/head.png'],
            ['name' => 'Nina Fernandez', 'student_id' => 'STU-014', 'pin' => '1234', 'section' => 'Sector Bravo', 'wordBlastAcc' => 35, 'storyQuestAcc' => 42, 'status' => 'atRisk', 'avatar' => '/images/avatars/juan/head.png'],
            ['name' => 'Oscar Dela Cruz', 'student_id' => 'STU-015', 'pin' => '1234', 'section' => 'Sector Bravo', 'wordBlastAcc' => 72, 'storyQuestAcc' => 68, 'status' => 'support', 'avatar' => '/images/avatars/kyle/head.png'],
            ['name' => 'Paula Gomez', 'student_id' => 'STU-016', 'pin' => '1234', 'section' => 'Sector Bravo', 'wordBlastAcc' => 0.0, 'storyQuestAcc' => 0.0, 'status' => 'notStarted', 'avatar' => '/images/avatars/leo/head.png'],
            ['name' => 'Quinn Rivera', 'student_id' => 'STU-017', 'pin' => '1234', 'section' => 'Sector Bravo', 'wordBlastAcc' => 82, 'storyQuestAcc' => 79, 'status' => 'onTrack', 'avatar' => '/images/avatars/sam/head.png'],
            ['name' => 'Rafa Castillo', 'student_id' => 'STU-018', 'pin' => '1234', 'section' => 'Sector Bravo', 'wordBlastAcc' => 20, 'storyQuestAcc' => 15, 'status' => 'atRisk', 'avatar' => '/images/avatars/zoe/head.png'],
            ['name' => 'Sofia Alvarez', 'student_id' => 'STU-019', 'pin' => '1234', 'section' => 'Sector 7-G', 'wordBlastAcc' => 70, 'storyQuestAcc' => 74, 'status' => 'support', 'avatar' => '/images/avatars/ana/head.png'],
            ['name' => 'Tomas Guerrero', 'student_id' => 'STU-020', 'pin' => '1234', 'section' => 'Sector 7-G', 'wordBlastAcc' => 91, 'storyQuestAcc' => 95, 'status' => 'onTrack', 'avatar' => '/images/avatars/juan/head.png'],
            ['name' => 'Uma Patel', 'student_id' => 'STU-021', 'pin' => '1234', 'section' => 'Sector Alpha', 'wordBlastAcc' => 55, 'storyQuestAcc' => 60, 'status' => 'support', 'avatar' => '/images/avatars/kyle/head.png'],
            ['name' => 'Victor Ong', 'student_id' => 'STU-022', 'pin' => '1234', 'section' => 'Sector Alpha', 'wordBlastAcc' => 0.0, 'storyQuestAcc' => 0.0, 'status' => 'notStarted', 'avatar' => '/images/avatars/leo/head.png'],
            ['name' => 'Wendy Chua', 'student_id' => 'STU-023', 'pin' => '1234', 'section' => 'Sector Bravo', 'wordBlastAcc' => 65, 'storyQuestAcc' => 70, 'status' => 'support', 'avatar' => '/images/avatars/sam/head.png'],
            ['name' => 'Xander Bautista', 'student_id' => 'STU-024', 'pin' => '1234', 'section' => 'Sector Bravo', 'wordBlastAcc' => 40, 'storyQuestAcc' => 35, 'status' => 'atRisk', 'avatar' => '/images/avatars/zoe/head.png'],
        ];

        $completedLevels = function ($accuracy) {
            if ($accuracy === null || $accuracy == 0) return 0;
            if ($accuracy >= 80) return 5;
            if ($accuracy >= 60) return 3;
            if ($accuracy >= 40) return 2;
            return 1;
        };

        foreach ($students as $data) {
            $user = User::create([
                'name' => $data['name'],
                'student_id' => $data['student_id'],
                'pin' => $data['pin'],
                'role' => 'student',
            ]);

            $wAcc = $data['wordBlastAcc'] ?? 0;
            $sAcc = $data['storyQuestAcc'] ?? 0;
            $wLevels = $completedLevels($wAcc);
            $sLevels = $completedLevels($sAcc);
            $totalWordsSmashed = 0;

            for ($i = 1; $i <= $wLevels; $i++) {
                $totalPoints = $wordModules[$i]->total_points;
                $smashed = (int) round($totalPoints * $wAcc / 100);

                StudentWordProgress::create([
                    'user_id' => $user->id,
                    'word_module_id' => $wordModules[$i]->id,
                    'status' => 'completed',
                    'words_smashed' => $smashed,
                    'accuracy' => $wAcc,
                ]);

                $totalWordsSmashed += $smashed;
            }

            for ($i = 1; $i <= $sLevels; $i++) {
                $totalScore = $paragraphModules[$i]->total_score;
                $smashed = (int) round($totalScore * $sAcc / 100);

                StudentParagraphProgress::create([
                    'user_id' => $user->id,
                    'paragraph_module_id' => $paragraphModules[$i]->id,
                    'status' => 'completed',
                    'words_smashed' => $smashed,
                    'accuracy' => $sAcc,
                ]);

                $totalWordsSmashed += $smashed;
            }

            $user->student()->create([
                'points' => $totalWordsSmashed,
                'words_smashed' => $totalWordsSmashed,
                'avatar' => $data['avatar'],
                'read_progress' => $wLevels,
                'speak_progress' => $sLevels,
                'read_level' => $wLevels + 1,
                'speak_level' => $sLevels + 1,
                'status' => $data['status'],
                'wordBlastAcc' => $wAcc,
                'storyQuestAcc' => $sAcc,
                'section' => $data['section'],
            ]);
        }

        $this->call([
            BadgesSeeder::class,
        ]);
    }
}
