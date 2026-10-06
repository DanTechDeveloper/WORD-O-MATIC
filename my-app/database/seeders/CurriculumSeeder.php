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
            //
            // 2026-10-03 common-word reseed: the old ladder was phonics/prefix/suffix/compound
            // (Phonics Foundation -> Mastery Marathon). Replaced with concrete, kid-facing
            // vocabulary grouped by theme and ordered concrete -> multi-syllable, nouns -> verbs.
            // 30 of the proposed words were bagsak and got replaced (cat/dog/pig/cow/fox/rat/owl,
            // bear/ant/bee, sun/sky/ice, peach/pear/egg/nut/pea, bed/pen/bag/hat/cup/car/bus,
            // go/run/sit/write/fly) — 26 were under the 4-letter floor, 6 hit RISKY_PAIRS.
            // Seven further swaps are NOT gate-enforced but close a 1-char-apart pair, which is an
            // unfixable false verdict under strict: star->storm (the tutorial says "start"),
            // wall->shelf, bread->biscuit (vs read), book->paper (vs look), boat->canoe (vs
            // goat/coat), coat->jacket, ship->raft (vs the tutorial's "skip").
            1 => ['lion', 'frog', 'fish', 'bird', 'duck', 'goat', 'wolf', 'deer', 'crab', 'shark'],
            2 => ['kitten', 'puppy', 'calf', 'pony', 'pigeon', 'turtle', 'hamster', 'monkey', 'mouse', 'hedgehog'],
            3 => ['moon', 'storm', 'rain', 'snow', 'wind', 'cloud', 'fire', 'sunshine', 'breeze', 'frost'],
            4 => ['apple', 'banana', 'grape', 'melon', 'lemon', 'plum', 'corn', 'milk', 'rice', 'cake'],
            5 => ['cheese', 'mango', 'honey', 'walnut', 'radish', 'meat', 'soup', 'biscuit', 'salt', 'bean'],
            6 => ['desk', 'chair', 'table', 'door', 'window', 'shelf', 'lamp', 'paper', 'shoe', 'shirt'],
            7 => ['jacket', 'plate', 'spoon', 'fork', 'knife', 'blanket', 'crayon', 'backpack', 'helmet', 'bottle'],
            8 => ['bike', 'canoe', 'raft', 'truck', 'taxi', 'tractor', 'wagon', 'scooter', 'ladder', 'basket'],
            9 => ['stop', 'jump', 'walk', 'stand', 'look', 'sing', 'open', 'close', 'push', 'pull'],
            10 => ['drop', 'pick', 'swim', 'climb', 'trace', 'travel', 'dash', 'kneel', 'sketch', 'leap'],
        ];
    }

    public static function titles(): array
    {
        return [
            1 => 'Creature Calls', 2 => 'Pet Pals', 3 => 'Sky Watch',
            4 => 'Orchard Basket', 5 => 'Farm and Table', 6 => 'Around the House',
            7 => 'Kitchen Counter', 8 => "Let's Go", 9 => 'Action Time',
            10 => "Let's Move",
        ];
    }

    public static function paragraphsByLevel(): array
    {
        // Decodable 3+3 rhythm, echo of exact level words (1-2 each) — inflected
        // forms (paints/paint) are WRONG under strict, so chapters use base forms only.
        // Clean split on (?<=[.!?])\s+ — keep exactly "Sentence. Sentence.", 3-5 words each.
        //
        // Key 0 IS the Story Quest tutorial chapter. It used to live in its own
        // provider (tutorialContent()), so the tutorial text had two homes and the
        // shape/echo rules had to be applied to it by hand. One array, one loop.
        //
        // Every chapter echoes its own level's Word Blast words — that tie is
        // gate-enforced (CurriculumStrictTest::test_chapters_echo_exact_level_words),
        // and it is why the content words below are not the everyday words they would
        // otherwise be (cat/dog/sun are all banned in the Word Blast list).
        //
        // NO LEADING DETERMINER (the/a/an) — this is an ASR decision, not a style one.
        // isWordMatch's filler skip (speechUtils.js:101-102) discards an EXTRA token on
        // the SPOKEN side; a determiner in the TARGET is a required slot, not a filler.
        // So "the sun is bright" as a target FAILS a child who says "sun is bright",
        // while "sun is bright" as a target accepts both readings. Determiner-free
        // targets are strictly more forgiving, and this chapter set is read aloud
        // one whole sentence at a time — one skipped function word kills the score.
        //
        // 2026-10-06: replaced the "The X <verb> Y. A Z <verb> W." Milo-era copy with a
        // water/adventure arc, determiner-free. The echo tie and the 3+3 shape are
        // unchanged; only the wording is new. The 2026-10-06 rewording keeps the
        // submitted wording wherever the gates allow — the only forced swaps are the
        // echo word per level, "boat" -> "canoe" (banned: 1 char from L1 "goat"), and
        // "rock" -> "frog" (this list put "rock" in L1 and "lock" in L7 — a 1-char
        // pair, and a transcript of one for the other is unfixable under strict).
        return [
            0 => 'The game can start. Now we play.',
            1 => 'Water drips down. Frog feels cold.',
            2 => 'Stream flows fast. Puppy runs wide.',
            3 => 'Canoe glides soft. Wind blows hard.',
            4 => 'Fish swims deep. Melon rolls down.',
            5 => 'Rope pulls tight. Bean arrives safe.',
            6 => 'Gold shines bright. Lamp holds treasure.',
            7 => 'Key turns smooth. Knife slides apart.',
            8 => 'Hand takes prize. Basket fills up.',
            9 => 'Child can walk. Road looks clear.',
            10 => 'Camp fire burns. We drop the gear.',
        ];
    }

    public static function paraTitles(): array
    {
        return [
            1 => 'Chapter 1: The Waterfall', 2 => 'Chapter 2: The Stream', 3 => 'Chapter 3: The Wind',
            4 => 'Chapter 4: The Deep Pond', 5 => 'Chapter 5: The Mango Tree', 6 => 'Chapter 6: The Golden Coin',
            7 => 'Chapter 7: The Lock', 8 => 'Chapter 8: The Wagon', 9 => 'Chapter 9: The Road Home',
            10 => 'Chapter 10: Campfire Night',
        ];
    }

    public static function tutorialWords(): array
    {
        // Strict-era tutorial — 5-6 letter distinctive words. Short words
        // mistranscribe most in isolation, and strict has no second chance.
        // 2026-10-03: swapped from apple/banana/puppy/kitten/hamster (the old
        // L1/L4/L2 words) to UI-label words. Side effect: "start" and "skip" now
        // sit one letter from potential module targets, hence star->storm and
        // ship->raft above. Keep them apart.
        return ['start', 'next', 'skip', 'play', 'help'];
    }

    public function run(): void
    {
        $wordsByModule = self::wordsByModule();
        $titles = self::titles();
        $paragraphsByLevel = self::paragraphsByLevel();
        $paraTitles = self::paraTitles();
        $tutorialWords = self::tutorialWords();

        // The Story Quest tutorial chapter is paragraphsByLevel()[0] — same array as
        // the levels, so the shape + echo gates cover it with no second provider.
        $tutorialContent = $paragraphsByLevel[0];

        foreach (range(1, 10) as $level) {
            if ($level > 10) {
                throw new \RuntimeException("Curriculum level {$level} exceeds maximum 10");
            }

            // ponytail: routes through the SAME save path the teacher UI uses.
            // This seeder used to do words()->delete() then create() — the exact
            // pattern saveWithWords was changed to stop doing, because the
            // student_*_mastery FK cascade wiped the class's record on every
            // re-seed. It was the last destructive writer left in the app.
            //
            // saveWithWords reuses the row at each position, so re-seeding is
            // idempotent AND non-destructive: word ids stay stable, mastery
            // survives, and a re-seed no longer renumbers a mid-round student's
            // word ids. Side effect: words are stored uppercased, same as any
            // teacher-saved module. Matching is unaffected — normalizeText()
            // lowercases both sides before comparing.
            WordModule::saveWithWords([
                'level' => $level,
                'title' => $titles[$level],
                'words' => array_map(fn ($word) => ['word' => $word], $wordsByModule[$level]),
            ]);

            ParagraphModule::saveWithContent([
                'level' => $level,
                'title' => $paraTitles[$level],
                'content' => $paragraphsByLevel[$level],
            ]);

            // Tutorial rows seed once (firstOrCreate + wasRecentlyCreated) — a wording
            // change only applies on migrate:fresh --seed.
            //
            // ponytail: deliberately NOT routed through saveWithWords/
            // saveWithContent. Those do updateOrCreate on `level` alone and do
            // not carry `is_tutorial`, whose column default is FALSE — routing
            // level 0 through them would create a non-tutorial row and
            // WordModule::tutorial() would return null, breaking onboarding.
            // The wasRecentlyCreated gate also means a re-seed never touches
            // the tutorial words at all, so there is no cascade to avoid here.
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
