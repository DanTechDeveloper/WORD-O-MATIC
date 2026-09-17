<?php

namespace Database\Seeders;

use App\Models\ParagraphModule;
use App\Models\ParagraphWord;
use App\Models\Word;
use App\Models\WordModule;
use Illuminate\Database\Seeder;

class CurriculumSeeder extends Seeder
{
    // ponytail: seeder lists are SSOT via these providers — CurriculumStrictTest reads
    // them directly (no hardcoded copy), and run() below seeds exactly these. The JS
    // mirrors (curriculumVerdict.test.js) are locked to the same content by the gate.
    public static function wordsByModule(): array
    {
        return [
            // ponytail: strict-era reseed — isWordMatch is exact-only (normalize + ===), so
            // every word must survive on transcript fidelity alone. No 3-letter words (isolated
            // short utterances mistranscribe most), no homophone/confusable picks (audit blocklist
            // in curriculumVerdict.test.js: sea/see, prints/prince, bacon/beacon, sheet/sheep...).
            // Chapters use exact base forms only (paints/paint is now WRONG). Gate: curriculumVerdict.
            // If a word turns bagsak, replace the word — never loosen the matcher.
            1 => ['frog', 'crab', 'drum', 'swim', 'snack', 'slide', 'stone', 'bloom', 'grape', 'grill'],
            2 => ['dream', 'cloud', 'snail', 'green', 'shade', 'train', 'queen', 'roast', 'paint', 'cloak'],
            3 => ['brush', 'clock', 'smile', 'plant', 'crash', 'dress', 'frost', 'twist', 'shark', 'phone'],
            4 => ['splash', 'street', 'stripe', 'crane', 'flute', 'skate', 'brave', 'brick', 'spark', 'blast'],
            5 => ['tiger', 'river', 'lemon', 'pocket', 'circus', 'magnet', 'violin', 'planet', 'robot', 'camel'],
            6 => ['remake', 'unlock', 'rewrite', 'unzip', 'dislike', 'distrust', 'misplace', 'misspell', 'reopen', 'recycle'],
            7 => ['thankful', 'endless', 'softly', 'muddy', 'wishful', 'harmless', 'neatly', 'sleepy', 'sticky', 'kindly'],
            8 => ['airplane', 'sailboat', 'mailbox', 'raincoat', 'suitcase', 'bookshelf', 'campground', 'dragonfly', 'wheelchair', 'keyboard'],
            9 => ['thunder', 'journey', 'whisper', 'meadow', 'clever', 'spirit', 'voyage', 'village', 'comet', 'canyon'],
            10 => ['architecture', 'temperature', 'electricity', 'expedition', 'horizon', 'fortress', 'galaxy', 'lagoon', 'mosaic', 'pyramid'],
        ];
    }

    public static function titles(): array
    {
        return [
            1 => 'Phonics Foundation', 2 => 'Vowel Voyage', 3 => 'Consonant Quest',
            4 => 'Blend Brigade', 5 => 'Syllable Sprint', 6 => 'Prefix Patrol',
            7 => 'Suffix Squad', 8 => 'Compound Crusade', 9 => 'Vocabulary Vortex',
            10 => 'Mastery Marathon',
        ];
    }

    public static function paragraphsByLevel(): array
    {
        // Milo arc, sentences echo exact level words (1-2 each) — inflected
        // forms (paints/paint) are WRONG under strict, so chapters use base forms only.
        // Clean split on (?<=[.!?])\s+ — keep exactly "Sentence. Sentence.", 3-5 words each.
        return [
            1 => 'Milo sees a frog. A crab can swim.',
            2 => 'A green cloud floats. The queen sees a train.',
            3 => 'The clock ticks. Milo holds a brush.',
            4 => 'A brave crane lands. Milo finds a brick.',
            5 => 'A tiger crosses the river. A robot holds a lemon.',
            6 => 'Milo will recycle paper. He can reopen it.',
            7 => 'Milo walks softly. He feels thankful.',
            8 => 'A sailboat crosses the lake. Milo finds a mailbox.',
            9 => 'They hear low thunder. Milo finds a village.',
            10 => 'The fortress stands tall. Milo joins the expedition.',
        ];
    }

    public static function paraTitles(): array
    {
        return [
            1 => 'Chapter 1: The Map', 2 => 'Chapter 2: The Hill', 3 => 'Chapter 3: The Rock',
            4 => 'Chapter 4: The Grass', 5 => 'Chapter 5: The Rabbit', 6 => 'Chapter 6: The Path',
            7 => 'Chapter 7: The Climb', 8 => 'Chapter 8: The Rainbow', 9 => 'Chapter 9: The Adventure',
            10 => 'Chapter 10: Home Again',
        ];
    }

    public static function tutorialWords(): array
    {
        // Strict-era tutorial — 5-6 letter distinctive words. Short words
        // mistranscribe most in isolation, and strict has no second chance.
        return ['apple', 'banana', 'puppy', 'kitten', 'hamster'];
    }

    public static function tutorialContent(): string
    {
        return 'A puppy naps. A hamster runs.';
    }

    public function run(): void
    {
        $wordsByModule = self::wordsByModule();
        $titles = self::titles();
        $paragraphsByLevel = self::paragraphsByLevel();
        $paraTitles = self::paraTitles();
        $tutorialWords = self::tutorialWords();
        $tutorialContent = self::tutorialContent();

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

            // Tutorial rows seed once (firstOrCreate + wasRecentlyCreated) — a wording
            // change only applies on migrate:fresh --seed.
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
