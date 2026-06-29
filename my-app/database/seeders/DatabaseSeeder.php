<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Word;
use App\Models\WordModule;
use App\Models\ParagraphModule;
use App\Models\PracticeSet;
use App\Models\PracticeItem;
use App\Models\StudentWordProgress;
use App\Models\StudentParagraphProgress;
use App\Models\ParagraphWord;
use App\Models\StudentParagraphMastery;
use App\Models\StudentWordMastery;
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
            'email' => 'teacher@wordomatic.edu',
            'password' => bcrypt('password'),
            'role' => 'teacher',
        ]);

        $wordModules = [];
        $wordsByModule = [
            1 => ['cat', 'dog', 'sun', 'hat', 'run', 'big', 'red', 'cup', 'box', 'pen'],
            2 => ['cake', 'tree', 'kite', 'road', 'cube', 'rain', 'boat', 'seed', 'lime', 'bone'],
            3 => ['star', 'drum', 'frog', 'milk', 'nest', 'sand', 'belt', 'fist', 'golf', 'hand'],
            4 => ['grass', 'train', 'plate', 'broom', 'snake', 'grape', 'trail', 'flame', 'clamp', 'brick'],
            5 => ['rabbit', 'window', 'pencil', 'basket', 'kitten', 'napkin', 'picnic', 'helmet', 'muffin', 'lantern'],
            6 => ['replay', 'prefix', 'unseen', 'redo', 'undo', 'preview', 'unhappy', 'reload', 'rewrite', 'subway', 'midair', 'midday', 'outrun', 'outside', 'overact'],
            7 => ['slowly', 'joyful', 'fearless', 'quickly', 'useful', 'careful', 'loudly', 'kindly', 'sadly', 'painful', 'weakly', 'lovely', 'helpless', 'powerful', 'gladly'],
            8 => ['rainbow', 'sunset', 'popcorn', 'bedroom', 'toothbrush', 'football', 'pancake', 'firefly', 'starfish', 'cupcake', 'airplane', 'snowman', 'bookshelf', 'earring', 'moonlight'],
            9 => ['explore', 'beautiful', 'adventure', 'dinosaur', 'enormous', 'fantastic', 'astronaut', 'discover', 'important', 'vegetable', 'volcano', 'tropical', 'magnificent', 'mysterious', 'extraordinary', 'courageous', 'legendary', 'remarkable', 'spectacular', 'unbelievable'],
            10 => ['perseverance', 'accomplishment', 'extraordinary', 'responsibility', 'determination', 'communication', 'collaboration', 'environment', 'celebration', 'imagination', 'investigation', 'organization', 'transformation', 'appreciation', 'multiplication', 'transportation', 'pronunciation', 'experimentation', 'interpretation', 'representation'],
        ];

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
            ]);

            foreach ($wordsByModule[$level] as $position => $word) {
                Word::create([
                    'word_module_id' => $wordModules[$level]->id,
                    'word' => $word,
                    'points' => 1,
                    'position' => $position + 1,
                ]);
            }
        }

        $paragraphModules = [];
        $paragraphsByLevel = [
            1 => 'I see a cat. The cat is big and fat.',
            2 => 'The sun is hot. A dog can run fast in the park.',
            3 => 'Once upon a time a little frog sat on a rock. He liked to jump into the pond.',
            4 => 'The boy went to the store to buy some milk. He also got a loaf of bread and fresh eggs for his mom.',
            5 => 'My favorite pet is a kitten. It has soft white fur and bright green eyes. I play with it every day after school.',
            6 => 'The prefix re means again so replay means to play again. The word unhappy means not happy. Learning prefixes helps us understand new words.',
            7 => 'She walked slowly through the garden. The flowers were beautiful and colorful. She felt joyful as she picked a sunflower for her mother.',
            8 => 'A rainbow appears after the rain when the sun shines. It has many beautiful colors like red orange yellow green blue indigo and violet.',
            9 => 'Exploring a rainforest is an adventure. You can discover enormous trees colorful birds and magnificent butterflies. It is an extraordinary place to visit and learn about nature.',
            10 => 'Perseverance means never giving up even when things are difficult. With determination and collaboration we can accomplish anything. Every challenge is an opportunity for growth and learning.',
        ];

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
                'content' => $paragraphsByLevel[$level],
            ]);

            $contentWords = preg_split('/\s+/', trim($paragraphsByLevel[$level]), -1, PREG_SPLIT_NO_EMPTY);
            foreach ($contentWords as $pos => $word) {
                ParagraphWord::create([
                    'paragraph_module_id' => $paragraphModules[$level]->id,
                    'word' => $word,
                    'position' => $pos + 1,
                ]);
            }
        }

        $students = [
            ['name' => 'Dan', 'student_id' => 'STU-001', 'pin' => '1234', 'section' => 'Sector 7-G', 'wordBlastAcc' => 92, 'storyQuestAcc' => 88, 'status' => 'onTrack', 'avatar' => null, 'parent_email' => 'jogayim665@adsprite.com'],
            ['name' => 'Bianca Cruz', 'student_id' => 'STU-002', 'pin' => '1234', 'section' => 'Sector 7-G', 'wordBlastAcc' => 45, 'storyQuestAcc' => 52, 'status' => 'atRisk', 'avatar' => '/images/avatars/juan/head.png', 'parent_email' => 'parent.bianca@email.com'],
            ['name' => 'Carlos Diaz', 'student_id' => 'STU-003', 'pin' => '1234', 'section' => 'Sector 7-G', 'wordBlastAcc' => 68, 'storyQuestAcc' => 72, 'status' => 'support', 'avatar' => '/images/avatars/kyle/head.png', 'parent_email' => 'parent.carlos@email.com'],
            ['name' => 'Diana Lim', 'student_id' => 'STU-004', 'pin' => '1234', 'section' => 'Sector 7-G', 'wordBlastAcc' => 0.0, 'storyQuestAcc' => 0.0, 'status' => 'notStarted', 'avatar' => '/images/avatars/leo/head.png', 'parent_email' => null],
            ['name' => 'Ethan Tan', 'student_id' => 'STU-005', 'pin' => '1234', 'section' => 'Sector 7-G', 'wordBlastAcc' => 85, 'storyQuestAcc' => 90, 'status' => 'onTrack', 'avatar' => '/images/avatars/sam/head.png', 'parent_email' => 'parent.ethan@email.com'],
            ['name' => 'Fiona Santos', 'student_id' => 'STU-006', 'pin' => '1234', 'section' => 'Sector 7-G', 'wordBlastAcc' => 30, 'storyQuestAcc' => 25, 'status' => 'atRisk', 'avatar' => '/images/avatars/zoe/head.png', 'parent_email' => 'parent.fiona@email.com'],
            ['name' => 'Gian Garcia', 'student_id' => 'STU-007', 'pin' => '1234', 'section' => 'Sector 7-G', 'wordBlastAcc' => 60, 'storyQuestAcc' => 65, 'status' => 'support', 'avatar' => '/images/avatars/ana/head.png', 'parent_email' => 'parent.gian@email.com'],
            ['name' => 'Hannah Ramos', 'student_id' => 'STU-008', 'pin' => '1234', 'section' => 'Sector Alpha', 'wordBlastAcc' => 95, 'storyQuestAcc' => 93, 'status' => 'onTrack', 'avatar' => '/images/avatars/juan/head.png', 'parent_email' => 'parent.hannah@email.com'],
            ['name' => 'Ivan Mercado', 'student_id' => 'STU-009', 'pin' => '1234', 'section' => 'Sector Alpha', 'wordBlastAcc' => 40, 'storyQuestAcc' => 38, 'status' => 'atRisk', 'avatar' => '/images/avatars/kyle/head.png', 'parent_email' => 'parent.ivan@email.com'],
            ['name' => 'Julia Torres', 'student_id' => 'STU-010', 'pin' => '1234', 'section' => 'Sector Alpha', 'wordBlastAcc' => 0.0, 'storyQuestAcc' => 0.0, 'status' => 'notStarted', 'avatar' => '/images/avatars/leo/head.png', 'parent_email' => 'parent.julia@email.com'],
            ['name' => 'Kyle Villanueva', 'student_id' => 'STU-011', 'pin' => '1234', 'section' => 'Sector Alpha', 'wordBlastAcc' => 78, 'storyQuestAcc' => 80, 'status' => 'onTrack', 'avatar' => '/images/avatars/sam/head.png', 'parent_email' => 'parent.kyle@email.com'],
            ['name' => 'Lea Sison', 'student_id' => 'STU-012', 'pin' => '1234', 'section' => 'Sector Alpha', 'wordBlastAcc' => 50, 'storyQuestAcc' => 55, 'status' => 'support', 'avatar' => '/images/avatars/zoe/head.png', 'parent_email' => 'parent.lea@email.com'],
            ['name' => 'Marco Lopez', 'student_id' => 'STU-013', 'pin' => '1234', 'section' => 'Sector Bravo', 'wordBlastAcc' => 88, 'storyQuestAcc' => 84, 'status' => 'onTrack', 'avatar' => '/images/avatars/ana/head.png', 'parent_email' => 'parent.marco@email.com'],
            ['name' => 'Nina Fernandez', 'student_id' => 'STU-014', 'pin' => '1234', 'section' => 'Sector Bravo', 'wordBlastAcc' => 35, 'storyQuestAcc' => 42, 'status' => 'atRisk', 'avatar' => '/images/avatars/juan/head.png', 'parent_email' => 'parent.nina@email.com'],
            ['name' => 'Oscar Dela Cruz', 'student_id' => 'STU-015', 'pin' => '1234', 'section' => 'Sector Bravo', 'wordBlastAcc' => 72, 'storyQuestAcc' => 68, 'status' => 'support', 'avatar' => '/images/avatars/kyle/head.png', 'parent_email' => 'parent.oscar@email.com'],
            ['name' => 'Paula Gomez', 'student_id' => 'STU-016', 'pin' => '1234', 'section' => 'Sector Bravo', 'wordBlastAcc' => 0.0, 'storyQuestAcc' => 0.0, 'status' => 'notStarted', 'avatar' => '/images/avatars/leo/head.png', 'parent_email' => null],
            ['name' => 'Quinn Rivera', 'student_id' => 'STU-017', 'pin' => '1234', 'section' => 'Sector Bravo', 'wordBlastAcc' => 82, 'storyQuestAcc' => 79, 'status' => 'onTrack', 'avatar' => '/images/avatars/sam/head.png', 'parent_email' => 'parent.quinn@email.com'],
            ['name' => 'Rafa Castillo', 'student_id' => 'STU-018', 'pin' => '1234', 'section' => 'Sector Bravo', 'wordBlastAcc' => 20, 'storyQuestAcc' => 15, 'status' => 'atRisk', 'avatar' => '/images/avatars/zoe/head.png', 'parent_email' => 'parent.rafa@email.com'],
            ['name' => 'Sofia Alvarez', 'student_id' => 'STU-019', 'pin' => '1234', 'section' => 'Sector 7-G', 'wordBlastAcc' => 70, 'storyQuestAcc' => 74, 'status' => 'support', 'avatar' => '/images/avatars/ana/head.png', 'parent_email' => 'parent.sofia@email.com'],
            ['name' => 'Tomas Guerrero', 'student_id' => 'STU-020', 'pin' => '1234', 'section' => 'Sector 7-G', 'wordBlastAcc' => 91, 'storyQuestAcc' => 95, 'status' => 'onTrack', 'avatar' => '/images/avatars/juan/head.png', 'parent_email' => 'parent.tomas@email.com'],
            ['name' => 'Uma Patel', 'student_id' => 'STU-021', 'pin' => '1234', 'section' => 'Sector Alpha', 'wordBlastAcc' => 55, 'storyQuestAcc' => 60, 'status' => 'support', 'avatar' => '/images/avatars/kyle/head.png', 'parent_email' => 'parent.uma@email.com'],
            ['name' => 'Victor Ong', 'student_id' => 'STU-022', 'pin' => '1234', 'section' => 'Sector Alpha', 'wordBlastAcc' => 0.0, 'storyQuestAcc' => 0.0, 'status' => 'notStarted', 'avatar' => '/images/avatars/leo/head.png', 'parent_email' => 'parent.victor@email.com'],
            ['name' => 'Wendy Chua', 'student_id' => 'STU-023', 'pin' => '1234', 'section' => 'Sector Bravo', 'wordBlastAcc' => 65, 'storyQuestAcc' => 70, 'status' => 'support', 'avatar' => '/images/avatars/sam/head.png', 'parent_email' => 'parent.wendy@email.com'],
            ['name' => 'Xander Bautista', 'student_id' => 'STU-024', 'pin' => '1234', 'section' => 'Sector Bravo', 'wordBlastAcc' => 40, 'storyQuestAcc' => 35, 'status' => 'atRisk', 'avatar' => '/images/avatars/zoe/head.png', 'parent_email' => 'parent.xander@email.com'],
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

                $words = Word::where('word_module_id', $wordModules[$i]->id)->get();
                foreach ($words as $word) {
                    $isMastered = (rand(0, 99) < $wAcc);
                    StudentWordMastery::create([
                        'user_id' => $user->id,
                        'word_id' => $word->id,
                        'status' => $isMastered ? 'mastered' : 'training',
                    ]);
                }

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

                $paraWords = ParagraphWord::where('paragraph_module_id', $paragraphModules[$i]->id)->get();
                foreach ($paraWords as $paraWord) {
                    $isMastered = (rand(0, 99) < $sAcc);
                    StudentParagraphMastery::create([
                        'user_id' => $user->id,
                        'paragraph_word_id' => $paraWord->id,
                        'status' => $isMastered ? 'mastered' : 'training',
                    ]);
                }

                $totalWordsSmashed += $smashed;
            }

            $user->student()->create([
                'points' => $totalWordsSmashed,
                'words_smashed' => $totalWordsSmashed,
                'avatar' => $data['avatar'],
                'read_progress' => $wLevels,
                'speak_progress' => $sLevels,
                'read_level' => $wLevels,
                'speak_level' => $sLevels,
                'status' => $data['status'],
                'wordBlastAcc' => $wAcc,
                'storyQuestAcc' => $sAcc,
                'section' => $data['section'],
                'parent_email' => $data['parent_email'],
            ]);
        }

        $practiceReadSet = PracticeSet::create([
            'name' => 'Tutorial Practice - Read',
            'slug' => 'tutorial-practice-read',
            'type' => 'word',
            'total_items' => 5,
        ]);

        foreach (['cat', 'dog', 'sun', 'hat', 'run'] as $position => $word) {
            PracticeItem::create([
                'practice_set_id' => $practiceReadSet->id,
                'content' => $word,
                'position' => $position + 1,
            ]);
        }

        $practiceSpeakSet = PracticeSet::create([
            'name' => 'Tutorial Practice - Speak',
            'slug' => 'tutorial-practice-speak',
            'type' => 'sentence',
            'content' => 'I like to play with my cat.',
            'total_items' => 7,
        ]);

        $speakWords = ['I', 'like', 'to', 'play', 'with', 'my', 'cat.'];
        foreach ($speakWords as $position => $word) {
            PracticeItem::create([
                'practice_set_id' => $practiceSpeakSet->id,
                'content' => $word,
                'position' => $position + 1,
            ]);
        }

        $this->call([
            BadgesSeeder::class,
        ]);
    }
}
