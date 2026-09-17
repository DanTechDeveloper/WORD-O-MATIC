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

    private function allWords(): array
    {
        return [...CurriculumSeeder::tutorialWords(), ...array_merge(...array_values(CurriculumSeeder::wordsByModule()))];
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
        $this->assertCount(10, $paragraphs);

        $texts = [...$paragraphs, CurriculumSeeder::tutorialContent()];
        foreach ($texts as $text) {
            $parts = preg_split('/(?<=[.!?])\s+/', trim($text));
            $this->assertCount(2, $parts, "bagsak chapter: \"{$text}\" — must be exactly \"Sentence. Sentence.\"");
            foreach ($parts as $sentence) {
                $count = count(preg_split('/\s+/', trim($sentence), -1, PREG_SPLIT_NO_EMPTY));
                $this->assertGreaterThanOrEqual(3, $count, "bagsak sentence: \"{$sentence}\"");
                $this->assertLessThanOrEqual(5, $count, "bagsak sentence: \"{$sentence}\"");
            }
        }
    }

    public function test_chapters_echo_exact_level_words(): void
    {
        $paragraphs = CurriculumSeeder::paragraphsByLevel();
        $wordsByModule = CurriculumSeeder::wordsByModule();

        foreach ($paragraphs as $level => $text) {
            $vocab = preg_split('/[\s.]+/', strtolower(trim($text)), -1, PREG_SPLIT_NO_EMPTY);
            $echoes = array_intersect($wordsByModule[$level], $vocab);

            $this->assertNotEmpty($echoes, "bagsak chapter {$level}: no exact level-word echo");
        }

        $tutVocab = preg_split('/[\s.]+/', strtolower(trim(CurriculumSeeder::tutorialContent())), -1, PREG_SPLIT_NO_EMPTY);
        $this->assertNotEmpty(
            array_intersect(CurriculumSeeder::tutorialWords(), $tutVocab),
            'bagsak tutorial sentence: no exact tutorial-word echo'
        );
    }
}
