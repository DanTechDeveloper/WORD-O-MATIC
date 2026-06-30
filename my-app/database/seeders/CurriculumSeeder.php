<?php

namespace Database\Seeders;

use App\Models\ParagraphModule;
use App\Models\ParagraphWord;
use App\Models\Word;
use App\Models\WordModule;
use Illuminate\Database\Seeder;

class CurriculumSeeder extends Seeder
{
    public function run(): void
    {
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

        $titles = [
            1 => 'Phonics Foundation', 2 => 'Vowel Voyage', 3 => 'Consonant Quest',
            4 => 'Blend Brigade', 5 => 'Syllable Sprint', 6 => 'Prefix Patrol',
            7 => 'Suffix Squad', 8 => 'Compound Crusade', 9 => 'Vocabulary Vortex',
            10 => 'Mastery Marathon',
        ];

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

        $paraTitles = [
            1 => 'First Sentences', 2 => 'Short Stories', 3 => 'Descriptive Scenes',
            4 => 'Narrative Adventures', 5 => 'Opinion Pieces', 6 => 'Informative Texts',
            7 => 'Persuasive Arguments', 8 => 'Creative Tales', 9 => 'Complex Narratives',
            10 => 'Masterpiece',
        ];

        foreach (range(1, 10) as $level) {
            $module = WordModule::create(['level' => $level, 'title' => $titles[$level]]);

            foreach ($wordsByModule[$level] as $position => $word) {
                Word::create([
                    'word_module_id' => $module->id,
                    'word' => $word,
                    'points' => 1,
                    'position' => $position + 1,
                ]);
            }

            $paraModule = ParagraphModule::create([
                'level' => $level,
                'title' => $paraTitles[$level],
                'content' => $paragraphsByLevel[$level],
            ]);

            $contentWords = preg_split('/\s+/', trim($paragraphsByLevel[$level]), -1, PREG_SPLIT_NO_EMPTY);
            foreach ($contentWords as $pos => $word) {
                ParagraphWord::create([
                    'paragraph_module_id' => $paraModule->id,
                    'word' => $word,
                    'position' => $pos + 1,
                ]);
            }
        }
    }
}
