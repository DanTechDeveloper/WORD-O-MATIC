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

        $students = [];
        for ($i = 0; $i < 100; $i++) {
            $section = $sections[$i % 3];
            $avatarChar = $avatarChars[$i % 6];
            $hasEmail = $i % 5 !== 0;

            $roll = $i % 10;
            if ($roll < 2) {
                $status = 'notStarted';
                $wAcc = 0.0;
                $sAcc = 0.0;
            } elseif ($roll < 3) {
                $status = 'in_progress';
                $wAcc = round(rand(20, 90) + rand(0, 99) / 100, 2);
                $sAcc = 0.0;
            } elseif ($roll < 5) {
                $status = 'atRisk';
                $wAcc = round(rand(1, 55) + rand(0, 99) / 100, 2);
                $sAcc = round(rand(1, 55) + rand(0, 99) / 100, 2);
            } elseif ($roll < 7) {
                $status = 'support';
                $wAcc = round(rand(55, 78) + rand(0, 99) / 100, 2);
                $sAcc = round(rand(55, 78) + rand(0, 99) / 100, 2);
            } else {
                $status = 'onTrack';
                $wAcc = round(rand(78, 100) + rand(0, 99) / 100, 2);
                $sAcc = round(rand(78, 100) + rand(0, 99) / 100, 2);
            }

            $num = str_pad($i + 1, 3, '0', STR_PAD_LEFT);
            $students[] = [
                'name' => $firstNames[$i],
                'student_id' => "STU-{$num}",
                'pin' => '1234',
                'section' => $section,
                'wordBlastAcc' => $wAcc,
                'storyQuestAcc' => $sAcc,
                'status' => $status,
                'avatar' => "/images/avatars/{$avatarChar}/head.png",
                'parent_email' => $hasEmail ? "parent.stu{$num}@email.com" : null,
                'gender' => $i % 2 === 0 ? 'male' : 'female',
            ];
        }

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
                'avatar' => $data['avatar'],
                'gender' => $data['gender'],
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
