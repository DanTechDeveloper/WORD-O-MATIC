<?php

namespace Tests\Feature;

use Database\Seeders\CurriculumSeeder;
use Tests\TestCase;

// ponytail: the seeder-content gate — reads CurriculumSeeder's static providers
// directly (no hardcoded copy), so a bagsak word fails here by name and must be
// replaced in the seeder. Strict era: isWordMatch is exact-only, so every word
// must survive on transcript fidelity alone (4+ letters, no confusable pairs,
// chapters in exact base forms). The JS verdict gate (curriculumVerdict.test.js)
// covers the processor side; this covers the source of truth.
class CurriculumStrictTest extends TestCase
{
    // Transcript-risk blocklist: homophones / confusable transcripts. NEITHER side
    // of a pair may be seeded — under strict exact matching, a Deepgram transcript
    // of one side for the other is an unfixable false verdict.
    private const RISKY_PAIRS = [
        ['sea', 'see'], ['eye', 'i'], ['right', 'write'], ['son', 'sun'],
        ['hello', 'hollow'], ['weak', 'week'], ['hear', 'here'], ['buy', 'by'],
        ['to', 'too'], ['to', 'two'], ['ate', 'eight'], ['pair', 'pear'],
        ['bare', 'bear'], ['ant', 'aunt'], ['harbour', 'harbor'], ['lite', 'light'],
        ['prints', 'prince'], ['retail', 'retell'], ['bacon', 'beacon'],
        ['sheet', 'sheep'], ['beach', 'peach'], ['clown', 'crown'], ['nurse', 'purse'],
        ['coast', 'toast'], ['brake', 'break'], ['flower', 'flour'], ['knight', 'night'],
    ];

    // Story Quest chapter words are read inside a sentence, so short function
    // words survive here where Word Blast's isolated 4+ floor would ban them. This
    // is the allowlist: a NEW sub-4-letter chapter word fails the gate. Key 0 (the
    // tutorial chapter) is frozen — it only changes with migrate:fresh — so it is
    // listed rather than special-cased. L10 "the" and L8 "up" are the two weakest
    // entries (mid-sentence required slot / sentence-final); they are documented
    // exposure, not oversights.
    private const SHORT_CHAPTER_WORDS = ['can', 'key', 'now', 'the', 'up', 'we'];

    // One-edit pairs where at least one side is a chapter word — chapter↔chapter
    // (hard/hand, flows/blows, glides/slides, turns/burns, cold/gold), chapter↔Word
    // Blast (deer/deep, lamp/camp, snow/now) and stem/`-s` (look/looks, pull/pulls,
    // swim/swims). Under strict exact matching a transcript of one side for the
    // other is an unfixable false verdict, so a NEW pair fails here. Fixing a listed
    // pair is a CONTENT change: re-seed, and check ParagraphModule::saveWithContent
    // — it reuses rows by position, so a swap re-points already-earned mastery to
    // the replacement word.
    private const CHAPTER_CONFUSABLE_PAIRS = [
        ['blows', 'flows'], ['burns', 'turns'], ['camp', 'lamp'], ['cold', 'gold'],
        ['deep', 'deer'], ['glides', 'slides'], ['hand', 'hard'], ['look', 'looks'],
        ['now', 'snow'], ['pull', 'pulls'], ['swim', 'swims'],
    ];

    private function allWords(): array
    {
        return [...CurriculumSeeder::tutorialWords(), ...array_merge(...array_values(CurriculumSeeder::wordsByModule()))];
    }

    // ponytail: chapter words, not just Word Blast words. They are the Story Quest
    // targets (one ParagraphWord per token), and until now nothing audited them —
    // RISKY_PAIRS is applied to allWords() only.
    private function chapterWords(): array
    {
        $words = [];
        foreach (CurriculumSeeder::paragraphsByLevel() as $text) {
            foreach (preg_split('/[\s.]+/', strtolower($text), -1, PREG_SPLIT_NO_EMPTY) as $word) {
                $words[$word] = true;
            }
        }

        return array_keys($words);
    }

    public function test_word_lists_shape(): void
    {
        $wordsByModule = CurriculumSeeder::wordsByModule();

        $this->assertCount(10, $wordsByModule);
        foreach (range(1, 10) as $level) {
            $this->assertArrayHasKey($level, $wordsByModule);
            $this->assertCount(10, $wordsByModule[$level], "level {$level} must have exactly 10 words");
        }
        $this->assertCount(5, CurriculumSeeder::tutorialWords());
    }

    public function test_words_are_lowercase_4_to_20_chars(): void
    {
        foreach ($this->allWords() as $word) {
            $this->assertSame(strtolower($word), $word, "bagsak: \"{$word}\" — must be lowercase");
            $this->assertGreaterThanOrEqual(4, strlen($word), "bagsak: \"{$word}\" — shorter than 4 letters mistranscribes most in isolation");
            $this->assertLessThanOrEqual(20, strlen($word), "bagsak: \"{$word}\" — exceeds max:20");
        }
    }

    public function test_no_duplicates_across_all_levels_including_tutorial(): void
    {
        $all = $this->allWords();
        $dupes = array_diff_assoc($all, array_unique($all));

        $this->assertSame([], array_values($dupes), 'bagsak duplicates: '.implode(', ', $dupes));
    }

    public function test_no_confusable_pair_side_is_seeded(): void
    {
        $seeded = array_flip($this->allWords());

        foreach (self::RISKY_PAIRS as [$x, $y]) {
            $this->assertArrayNotHasKey($x, $seeded, "bagsak: \"{$x}\" — confusable with \"{$y}\", replace it");
            $this->assertArrayNotHasKey($y, $seeded, "bagsak: \"{$y}\" — confusable with \"{$x}\", replace it");
        }
    }

    public function test_chapters_split_into_two_short_sentences(): void
    {
        $paragraphs = CurriculumSeeder::paragraphsByLevel();

        // ponytail: chapters are keyed 0-10 and key 0 IS the Story Quest tutorial
        // chapter. It used to live in a second provider (tutorialContent()), which
        // meant the tutorial text had two homes and the shape rules below had to
        // be applied to it by hand. One array, one loop, no second source.
        $this->assertSame(range(0, 10), array_keys($paragraphs), 'chapters must be keyed 0-10 contiguous, where 0 is the Story Quest tutorial');

        foreach ($paragraphs as $text) {
            $parts = preg_split('/(?<=[.!?])\s+/', trim($text));
            $this->assertCount(2, $parts, "bagsak chapter: \"{$text}\" — must be exactly \"Sentence. Sentence.\"");
            foreach ($parts as $sentence) {
                $count = count(preg_split('/\s+/', trim($sentence), -1, PREG_SPLIT_NO_EMPTY));
                $this->assertGreaterThanOrEqual(3, $count, "bagsak sentence: \"{$sentence}\"");
                $this->assertLessThanOrEqual(5, $count, "bagsak sentence: \"{$sentence}\"");
            }
        }
    }

    public function test_chapter_short_words_are_allowlisted(): void
    {
        $found = array_values(array_filter($this->chapterWords(), fn ($w) => strlen($w) < 4));
        sort($found);

        $this->assertSame(self::SHORT_CHAPTER_WORDS, $found, 'bagsak: chapter short-word set changed — found '.implode(', ', $found));
    }

    public function test_chapter_one_edit_pairs_are_documented(): void
    {
        $chapterWords = $this->chapterWords();
        $all = array_values(array_unique([...$this->allWords(), ...$chapterWords]));
        $pairs = [];

        for ($i = 0; $i < count($all); $i++) {
            for ($j = $i + 1; $j < count($all); $j++) {
                if (levenshtein($all[$i], $all[$j]) > 1) {
                    continue;
                }
                if (! in_array($all[$i], $chapterWords, true) && ! in_array($all[$j], $chapterWords, true)) {
                    continue;
                }
                $pair = [$all[$i], $all[$j]];
                sort($pair);
                $pairs[] = $pair;
            }
        }
        usort($pairs, fn ($a, $b) => strcmp($a[0].$a[1], $b[0].$b[1]));

        $this->assertSame(
            self::CHAPTER_CONFUSABLE_PAIRS,
            $pairs,
            'bagsak: chapter one-edit pair set changed — found '.implode(', ', array_map(fn ($p) => implode('/', $p), $pairs))
        );
    }

    public function test_chapters_echo_exact_level_words(): void
    {
        $paragraphs = CurriculumSeeder::paragraphsByLevel();
        $wordsByModule = CurriculumSeeder::wordsByModule();

        foreach (range(1, 10) as $level) {
            $vocab = preg_split('/[\s.]+/', strtolower(trim($paragraphs[$level])), -1, PREG_SPLIT_NO_EMPTY);
            $echoes = array_intersect($wordsByModule[$level], $vocab);

            $this->assertNotEmpty($echoes, "bagsak chapter {$level}: no exact level-word echo");
        }

        $tutVocab = preg_split('/[\s.]+/', strtolower(trim($paragraphs[0])), -1, PREG_SPLIT_NO_EMPTY);
        $this->assertNotEmpty(
            array_intersect(CurriculumSeeder::tutorialWords(), $tutVocab),
            'bagsak tutorial chapter (key 0): no exact tutorial-word echo'
        );
    }
}
