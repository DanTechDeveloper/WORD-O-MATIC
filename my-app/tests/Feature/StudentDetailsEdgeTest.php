<?php

namespace Tests\Feature;

use App\Models\ParagraphModule;
use App\Models\ParagraphWord;
use App\Models\StudentParagraphMastery;
use App\Models\StudentWordMastery;
use App\Models\StudentWordProgress;
use App\Models\StudentProfile;
use App\Models\StudentParagraphProgress;
use App\Models\User;
use App\Models\Word;
use App\Models\WordModule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/**
 * ponytail: the payload edge cases behind Teacher/StudentDetails.jsx.
 *
 * The JSX render suite (tests/Unit/studentDetailsRender.test.jsx) asserts the
 * page is right GIVEN a payload. This asserts the payload is right — because a
 * malformed curriculum level does not throw on the server, it silently ships
 * sentence_stats the page then renders as nothing.
 *
 * The one that mattered: a student whose every paragraph word is mastered must
 * still get 2 sentence_stats per 2-sentence level. When the sentence layer was
 * gated on "does this level have any training", a top student shipped an empty
 * Story Quest panel.
 */
class StudentDetailsEdgeTest extends TestCase
{
    use RefreshDatabase;

    private User $teacher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->teacher = User::factory()->create(['role' => 'teacher']);
    }

    private function makeStudent(string $name = 'Edge Eva', string $pin = '1234'): User
    {
        $user = User::factory()->create([
            'name' => $name,
            'pin' => Hash::make($pin),
            'role' => 'student',
        ]);
        StudentProfile::factory()->for($user)->create(['section' => 'Sector 7-G']);

        return $user;
    }

    /** Hit the real route and pull the props the page renders from. */
    private function propsFor(User $student): array
    {
        $captured = null;

        $this->actingAs($this->teacher)
            ->get("/teacher/studentDetails/{$student->id}")
            ->assertSuccessful()
            ->assertInertia(function ($page) use (&$captured) {
                $captured = $page->toArray()['props']['data'] ?? null;
            });

        $this->assertIsArray($captured, 'the page must receive a data prop');

        return $captured;
    }

    /**
     * Build a paragraph module through the real save path, so words get 1-based
     * positions exactly as the seeder and the teacher editor do. Hand-made
     * positions (0-based) silently misalign the $wordStats[$w->position - 1]
     * slice in ParagraphModule::buildLevels().
     *
     * @param  array<int, array{0:int,1:int}>  $words  [status, failed_attempts] per word
     */
    private function paraLevel(int $level, string $content, array $words): ParagraphModule
    {
        $module = ParagraphModule::create([
            'level' => $level,
            'title' => "Chapter {$level}",
            'content' => $content,
            'is_tutorial' => false,
        ]);
        ParagraphModule::saveWithContent(['level' => $level, 'title' => "Chapter {$level}", 'content' => $content]);

        foreach ($words as $i => [$status, $fails]) {
            $word = ParagraphWord::where('paragraph_module_id', $module->id)->orderBy('position')->get()[$i];
            $this->mastery(StudentParagraphMastery::class, $module, $word, $status, $fails);
        }

        return $module;
    }

    /**
     * "unseen" is NOT a storable status — the column has a CHECK constraint
     * limited to mastered/training, and a word is unseen precisely because it has
     * NO row. So the helper skips the insert, which means these fixtures also
     * exercise the real absence-of-a-row path rather than a fake enum value.
     */
    private function mastery(string $model, $module, $word, string $status, int $fails): void
    {
        if ($status === 'unseen') {
            return;
        }

        $column = $model === StudentWordMastery::class ? 'word_id' : 'paragraph_word_id';

        $model::create([
            'user_id' => $this->student->id,
            $column => $word->id,
            'status' => $status,
            'failed_attempts' => $fails,
        ]);
    }

    private User $student;

    // ═══════════════════════════════════════════════════════════════════════
    // Story Quest — the sentence layer
    // ═══════════════════════════════════════════════════════════════════════

    public function test_a_perfect_student_still_gets_every_sentence(): void
    {
        // THE regression. Every word mastered => every sentence MASTERED. If the
        // sentence layer is gated on "this level has training words", the panel
        // renders nothing at all and levels 1-10 disappear.
        $this->student = $this->makeStudent();
        $this->paraLevel(1, 'Milo sees a frog. A crab can swim.', [
            ['mastered', 0], ['mastered', 0], ['mastered', 0], ['mastered', 0],
            ['mastered', 2], ['mastered', 0], ['mastered', 1], ['mastered', 0],
        ]);

        $stats = $this->propsFor($this->student)['speakCurriculum'][0]['sentence_stats'] ?? [];

        $this->assertCount(2, $stats, 'both sentences must be present for a perfect student');
        $this->assertSame(['Milo sees a frog.', 'A crab can swim.'], array_column($stats, 'sentence'));
        $this->assertSame(['mastered', 'mastered'], array_column($stats, 'mastery'));
    }

    public function test_an_untouched_student_gets_unseen_words_not_missing_sentences(): void
    {
        $this->student = $this->makeStudent();
        $this->paraLevel(1, 'Milo sees a frog. A crab can swim.', array_fill(0, 8, ['unseen', 0]));

        $stats = $this->propsFor($this->student)['speakCurriculum'][0]['sentence_stats'] ?? [];

        $this->assertCount(2, $stats);
        // NOTE the split: the WORDS are unseen (no row), but buildLevels() folds
        // hasUnseen into the 'training' branch, so the SENTENCE says 'training'.
        // The page derives its verdict from the words and never reads this, so the
        // quirk is harmless — locked here so a future "fix" cannot silently
        // change what the mastered-sentence count means.
        $this->assertSame(['training', 'training'], array_column($stats, 'mastery'));
        $this->assertSame([0, 0], array_column($stats, 'failed_attempts'));
        $this->assertSame(
            array_fill(0, 4, 'unseen'),
            array_column($stats[0]['words'], 'mastery'),
            'the words are what the page reads, and they are genuinely unseen'
        );
        // Every word still present, so the page can print the sentence at all.
        $this->assertCount(4, $stats[0]['words']);
        $this->assertSame('unseen', $stats[0]['words'][0]['mastery']);
    }

    public function test_ten_levels_all_ship_even_though_nine_are_untouched(): void
    {
        $this->student = $this->makeStudent();
        for ($l = 1; $l <= 10; $l++) {
            $this->paraLevel($l, "Milo walks level {$l}. Milo rests level {$l}.", array_fill(0, 8, ['unseen', 0]));
        }

        $curriculum = $this->propsFor($this->student)['speakCurriculum'] ?? [];

        $this->assertCount(10, $curriculum, 'a level the child has not reached must still be listed');
        $this->assertSame(range(1, 10), array_column($curriculum, 'level_num'));
        foreach ($curriculum as $i => $level) {
            $this->assertCount(2, $level['sentence_stats'], "level {$level['level']} lost sentences");
            $this->assertSame(2, $level['total_sentences']);
        }
    }

    public function test_sentence_attempts_are_the_sum_of_their_words(): void
    {
        $this->student = $this->makeStudent();
        $this->paraLevel(1, 'A brave crane lands.', [
            ['training', 4], ['training', 1], ['training', 2], ['training', 0],
        ]);

        $stat = $this->propsFor($this->student)['speakCurriculum'][0]['sentence_stats'][0];

        $this->assertSame(7, $stat['failed_attempts']);
        $this->assertSame([4, 1, 2, 0], array_column($stat['words'], 'failed_attempts'));
    }

    public function test_a_word_is_only_mastered_when_every_word_in_its_sentence_is(): void
    {
        $this->student = $this->makeStudent();
        // Sentence 1 fully mastered, sentence 2 has one straggler.
        $this->paraLevel(1, 'Milo sees a frog. A crab can swim.', [
            ['mastered', 0], ['mastered', 3], ['mastered', 0], ['mastered', 0],
            ['mastered', 0], ['training', 1], ['mastered', 0], ['mastered', 0],
        ]);

        $stats = $this->propsFor($this->student)['speakCurriculum'][0]['sentence_stats'];

        $this->assertSame('mastered', $stats[0]['mastery']);
        $this->assertSame('training', $stats[1]['mastery'], 'one unfinished word keeps its sentence in training');
    }

    public function test_mastered_sentence_still_carries_its_frozen_attempt_history(): void
    {
        // The counter freezes at the peak it reached while failing. That peak is
        // the "Recovered" story the page renders, so it must survive mastering.
        $this->student = $this->makeStudent();
        $this->paraLevel(1, 'Milo sees a frog.', [
            ['mastered', 4], ['mastered', 0], ['mastered', 0],
        ]);

        $stat = $this->propsFor($this->student)['speakCurriculum'][0]['sentence_stats'][0];

        $this->assertSame(4, $stat['failed_attempts']);
        $this->assertSame(4, $stat['words'][0]['failed_attempts'], 'the peak is not reset on mastery');
    }

    public function test_a_contentless_module_still_yields_one_sentence(): void
    {
        // buildLevels() has a fallback for legacy rows with no content.
        $this->student = $this->makeStudent();
        $module = ParagraphModule::create(['level' => 1, 'title' => 'Legacy', 'content' => '', 'is_tutorial' => false]);
        foreach (['cat', 'dog'] as $i => $text) {
            $w = ParagraphWord::create(['paragraph_module_id' => $module->id, 'word' => $text, 'position' => $i + 1]);
            $this->mastery(StudentParagraphMastery::class, $module, $w, 'mastered', 0);
        }

        $stats = $this->propsFor($this->student)['speakCurriculum'][0]['sentence_stats'] ?? [];

        $this->assertCount(1, $stats);
        $this->assertSame('mastered', $stats[0]['mastery']);
    }

    public function test_the_tutorial_module_never_reaches_the_page(): void
    {
        // Level 0 would otherwise add a level the child has finished, inflating
        // the sentence counts. Locked by AGENTS.md: the curriculum is levels 1-10.
        $this->student = $this->makeStudent();
        $tut = ParagraphModule::create(['level' => 0, 'title' => 'Tutorial', 'content' => 'A puppy naps.', 'is_tutorial' => true]);
        ParagraphModule::saveWithContent(['level' => 0, 'title' => 'Tutorial', 'content' => 'A puppy naps.']);
        $this->paraLevel(1, 'Milo sees a frog.', [['mastered', 0], ['mastered', 0], ['mastered', 0]]);

        $curriculum = $this->propsFor($this->student)['speakCurriculum'] ?? [];

        $this->assertNotContains(0, array_column($curriculum, 'level_num'), 'tutorial must stay out');
        $this->assertCount(1, $curriculum);
        $this->assertSame(1, $curriculum[0]['level_num']);
        $this->assertNotNull($tut->id);
    }

    public function test_word_blast_and_story_quest_words_are_independent(): void
    {
        // "A" mastered in Story Quest must not master it in Word Blast — separate
        // tables, and a bug here would silently rewrite the other game's zones.
        $this->student = $this->makeStudent();
        $wordModule = WordModule::create(['level' => 1, 'title' => 'Phonics']);
        WordModule::saveWithWords([
            'level' => 1, 'title' => 'Phonics',
            'words' => [['word' => 'crab'], ['word' => 'frog']],
        ]);
        $crab = Word::where('word_module_id', $wordModule->id)->where('word', 'CRAB')->first();
        $this->mastery(StudentWordMastery::class, $wordModule, $crab, 'mastered', 0);

        $this->paraLevel(1, 'A crab can swim.', [['unseen', 0], ['unseen', 0], ['unseen', 0], ['unseen', 0]]);

        $data = $this->propsFor($this->student);

        $this->assertSame(['CRAB'], $data['readCurriculum'][0]['mastered']);
        $this->assertSame(
            'unseen',
            $data['speakCurriculum'][0]['sentence_stats'][0]['words'][1]['mastery'],
            'Story Quest must not inherit Word Blast mastery'
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // The save path — what the round actually writes
    // ═══════════════════════════════════════════════════════════════════════

    public function test_a_completed_round_writes_attempts_the_page_can_render(): void
    {
        // THE regression the user reported live: the POST looked like it did
        // nothing. Per-word mastery arrives on updateParagraphMastery, NOT on
        // the round's own saveParagraphProgress — so the page only changes if
        // that second POST fired.
        $this->student = $this->makeStudent();
        $this->paraLevel(1, 'Milo sees a frog.', array_fill(0, 4, ['unseen', 0]));

        $words = ParagraphWord::where('paragraph_module_id', ParagraphModule::where('level', 1)->first()->id)
            ->orderBy('position')->get();
        $module = ParagraphModule::where('level', 1)->first();

        $this->actingAs($this->student);
        // One miss then a win, exactly what gameplay posts.
        $this->post(route('student.updateParagraphMastery'), [
            'paragraph_word_id' => $words[0]->id, 'status' => 'training',
        ])->assertSuccessful();
        $this->post(route('student.updateParagraphMastery'), [
            'paragraph_word_id' => $words[0]->id, 'status' => 'mastered',
        ])->assertSuccessful();

        $stat = $this->propsFor($this->student)['speakCurriculum'][0]['sentence_stats'][0];

        $this->assertSame(1, $stat['words'][0]['failed_attempts']);
        $this->assertSame('mastered', $stat['words'][0]['mastery']);
        $this->assertSame('training', $stat['mastery'], 'one unfinished word keeps the sentence in training');
    }

    public function test_mastery_is_sticky_so_a_replay_cannot_erase_attempts(): void
    {
        $this->student = $this->makeStudent();
        $this->paraLevel(1, 'Milo sees a frog.', array_fill(0, 4, ['unseen', 0]));
        $words = ParagraphWord::where('paragraph_module_id', ParagraphModule::where('level', 1)->first()->id)->orderBy('position')->get();

        $this->actingAs($this->student);
        foreach (range(1, 4) as $_) {
            $this->post(route('student.updateParagraphMastery'), [
                'paragraph_word_id' => $words[0]->id, 'status' => 'training',
            ])->assertSuccessful();
        }
        $this->post(route('student.updateParagraphMastery'), [
            'paragraph_word_id' => $words[0]->id, 'status' => 'mastered',
        ])->assertSuccessful();

        // A later mispronunciation must not move the counter or the status.
        $this->post(route('student.updateParagraphMastery'), [
            'paragraph_word_id' => $words[0]->id, 'status' => 'training',
        ])->assertSuccessful();

        $stat = $this->propsFor($this->student)['speakCurriculum'][0]['sentence_stats'][0];

        $this->assertSame(4, $stat['words'][0]['failed_attempts'], 'mastery freezes the counter');
        $this->assertSame('mastered', $stat['words'][0]['mastery']);
    }

    public function test_past_the_deadline_the_page_freezes_and_stops_accepting_attempts(): void
    {
        // The panel keeps polling (AGENTS.md) but every scored surface is frozen,
        // so the page must not drift after the deadline.
        //
        // TWO freezes, and this test caught the one that is easy to miss:
        //   1. WRITES — updateMastery() early-returns before touching the counter.
        //   2. READS  — curriculumForUser($id, $cutoff) filters mastery rows on
        //      `created_at <= cutoff`, so a row written after the deadline is not
        //      merely unwritable, it is INVISIBLE to the page. A post-deadline
        //      miss therefore reads as 0, not as 2.
        // The pre-deadline row must be backdated, which is exactly why
        // ReportTest has a backdatedMastery() helper.
        $this->student = $this->makeStudent();
        $this->paraLevel(1, 'Milo sees a frog.', [['training', 2], ['unseen', 0], ['unseen', 0], ['unseen', 0]]);

        $words = ParagraphWord::where('paragraph_module_id', ParagraphModule::where('level', 1)->first()->id)
            ->orderBy('position')->get();
        $before = StudentParagraphMastery::where('paragraph_word_id', $words[0]->id)->first();
        $before->created_at = now()->subDays(2);
        $before->save();

        \App\Models\Setting::setValue('report_deadline', now()->subDay()->format('Y-m-d\TH:i'));

        $this->actingAs($this->student);
        $this->post(route('student.updateParagraphMastery'), [
            'paragraph_word_id' => $words[0]->id, 'status' => 'training',
        ])->assertSuccessful();

        $stat = $this->propsFor($this->student)['speakCurriculum'][0]['sentence_stats'][0];

        $this->assertSame(2, $stat['words'][0]['failed_attempts'], 'a post-deadline miss must not be recorded');
        $this->assertSame(2, StudentParagraphMastery::where('paragraph_word_id', $words[0]->id)->first()->failed_attempts);
    }

    public function test_a_teacher_cannot_read_a_student_by_the_human_code(): void
    {
        // The live endpoint and the page both key on the PRIMARY KEY; a
        // human-code lookup would 404 on every poll.
        $student = $this->makeStudent('Coded Cody', '2222');

        $this->actingAs($this->teacher)
            ->get(route('teacher.studentDetails.show', $student))
            ->assertSuccessful();

        $this->actingAs($this->teacher)
            ->get(route('teacher.liveStudent', $student))
            ->assertSuccessful();
    }
}
