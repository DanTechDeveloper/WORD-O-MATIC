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
            // ponytail: L1 replaced — Levenshtein-safe (d<=1 alone). Old cat/dog/sun/hat/run/big/red/cup/box/pen had 9+ d=1 real neighbors (cat→bat/cot/mat). New 4-letter set has ≤1 neighbor, so Levenshtein alone is not over-permissive. If a word still not pabor, replace again and keep d<=1.
            1 => ['fish', 'bird', 'book', 'lamp', 'jump', 'farm', 'chip', 'desk', 'moon', 'iron'],
            2 => ['cake', 'tree', 'kite', 'road', 'cube', 'snow', 'boat', 'seed', 'lime', 'bone'],
            3 => ['star', 'drum', 'frog', 'milk', 'nest', 'sand', 'belt', 'grip', 'golf', 'palm'],
            4 => ['grass', 'train', 'plate', 'broom', 'snake', 'grape', 'track', 'flame', 'press', 'brick'],
            5 => ['rabbit', 'window', 'pencil', 'basket', 'kitten', 'napkin', 'picnic', 'helmet', 'muffin', 'lantern'],
            6 => ['replay', 'prefix', 'unseen', 'redo', 'undo', 'preview', 'unhappy', 'reload', 'rewrite', 'subway'],
            7 => ['slowly', 'joyful', 'fearless', 'quickly', 'useful', 'careful', 'loudly', 'kindly', 'sadly', 'painful'],
            8 => ['rainbow', 'sunset', 'popcorn', 'bedroom', 'toothbrush', 'football', 'pancake', 'firefly', 'starfish', 'cupcake'],
            9 => ['explore', 'beautiful', 'adventure', 'dinosaur', 'enormous', 'fantastic', 'astronaut', 'discover', 'important', 'vegetable'],
            10 => ['perseverance', 'accomplishment', 'extraordinary', 'responsibility', 'determination', 'communication', 'collaboration', 'environment', 'celebration', 'imagination'],
        ];

        $titles = [
            1 => 'Phonics Foundation', 2 => 'Vowel Voyage', 3 => 'Consonant Quest',
            4 => 'Blend Brigade', 5 => 'Syllable Sprint', 6 => 'Prefix Patrol',
            7 => 'Suffix Squad', 8 => 'Compound Crusade', 9 => 'Vocabulary Vortex',
            10 => 'Mastery Marathon',
        ];

        // ponytail: Chapter 1-10 connected story — Milo + map arc, 2 sentences/level, 20 sentences total
        // Clean split on (?<=[.!?])\s+ — keep exactly "Sentence. Sentence." no extra punctuation
        $paragraphsByLevel = [
            1 => 'Milo finds a map. He feels brave.',
            2 => 'The map shows a hill. Milo climbs slowly.',
            3 => 'A frog sits on a rock. It jumps high.',
            4 => 'Milo sees tall grass. A track leads ahead.',
            5 => 'A rabbit naps by a window. Milo waves hello.',
            6 => 'He can replay the path. He will not undo it.',
            7 => 'He walks slowly and careful. Joy feels useful.',
            8 => 'A rainbow lights the sky. Milo eats popcorn.',
            9 => 'They explore a bright adventure. It feels fantastic.',
            10 => 'With perseverance they find home. Imagination wins today.',
        ];

        $paraTitles = [
            1 => 'Chapter 1: The Map', 2 => 'Chapter 2: The Hill', 3 => 'Chapter 3: The Rock',
            4 => 'Chapter 4: The Grass', 5 => 'Chapter 5: The Rabbit', 6 => 'Chapter 6: The Path',
            7 => 'Chapter 7: The Climb', 8 => 'Chapter 8: The Rainbow', 9 => 'Chapter 9: The Adventure',
            10 => 'Chapter 10: Home Again',
        ];

        foreach (range(1, 10) as $level) {
            if ($level > 10) {
                throw new \RuntimeException("Curriculum level {$level} exceeds maximum 10");
            }
            $module = WordModule::updateOrCreate(
                ['level' => $level],
                ['title' => $titles[$level], 'is_tutorial' => false]
            );
            // idempotent: wipe and recreate words so re-seed without fresh doesn't duplicate levels
            $module->words()->delete();
            foreach ($wordsByModule[$level] as $position => $word) {
                Word::create([
                    'word_module_id' => $module->id,
                    'word' => $word,
                    'position' => $position + 1,
                ]);
            }

            $paraModule = ParagraphModule::updateOrCreate(
                ['level' => $level],
                ['title' => $paraTitles[$level], 'content' => $paragraphsByLevel[$level], 'is_tutorial' => false]
            );
            $paraModule->words()->delete();
            $contentWords = preg_split('/\s+/', trim($paragraphsByLevel[$level]), -1, PREG_SPLIT_NO_EMPTY);
            foreach ($contentWords as $pos => $word) {
                ParagraphWord::create([
                    'paragraph_module_id' => $paraModule->id,
                    'word' => $word,
                    'position' => $pos + 1,
                ]);
            }

            $tutorialWords = ['a', 'I', 'see', 'my', 'the'];
            $tutorialWordModule = WordModule::firstOrCreate(
                ['level' => 0],
                ['title' => 'Tutorial', 'is_tutorial' => true],
            );
            if ($tutorialWordModule->wasRecentlyCreated) {
                foreach ($tutorialWords as $pos => $word) {
                    Word::create([
                        'word_module_id' => $tutorialWordModule->id,
                        'word' => $word,
                        'position' => $pos + 1,
                    ]);
                }
            }

            $tutorialContent = 'I see a cat.';
            $tutorialParaModule = ParagraphModule::firstOrCreate(
                ['level' => 0],
                ['title' => 'Tutorial', 'content' => $tutorialContent, 'is_tutorial' => true],
            );
            if ($tutorialParaModule->wasRecentlyCreated) {
                $contentWords = preg_split('/\s+/', trim($tutorialContent), -1, PREG_SPLIT_NO_EMPTY);
                foreach ($contentWords as $pos => $word) {
                    ParagraphWord::create([
                        'paragraph_module_id' => $tutorialParaModule->id,
                        'word' => $word,
                        'position' => $pos + 1,
                    ]);
                }
            }
        }
    }
}
