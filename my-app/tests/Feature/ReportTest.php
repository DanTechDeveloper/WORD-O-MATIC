<?php

namespace Tests\Feature;

use App\Exports\ReportsExport;
use App\Exports\SessionHistorySheet;
use App\Exports\SquHardestWordSheet;
use App\Exports\StruggleSummarySheet;
use App\Mail\StudentReportMail;
use App\Models\GameSession;
use App\Models\ParagraphModule;
use App\Models\ParagraphWord;
use App\Models\Setting;
use App\Models\StudentParagraphMastery;
use App\Models\StudentProfile;
use App\Models\StudentWordMastery;
use App\Models\User;
use App\Models\Word;
use App\Models\WordModule;
use App\Services\ReportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    // ─── SETUP ──────────────────────────────────────────────────────

    private User $teacher;

    private User $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->teacher = User::factory()->create([
            'role' => 'teacher',
        ]);

        $this->student = User::factory()->create([
            'name' => 'Test Student',
            'role' => 'student',
        ]);

        StudentProfile::factory()->for($this->student)->create([
            'wordBlastAcc' => 85,
            'storyQuestAcc' => 90,
            'status' => 'onTrack',
            'parent_email' => 'parent@email.com',
        ]);
    }

    // ─── REPORTS PAGE ───────────────────────────────────────────────

    public function test_teacher_can_view_reports_page(): void
    {
        $this->actingAs($this->teacher);

        $response = $this->get(route('teacher.reports'));

        $response->assertStatus(200);
        // Dapat may grouped students data
        $response->assertInertia(fn ($page) => $page
            ->component('Teacher/Reports')
            ->has('grouped')
        );
    }

    public function test_reports_page_lists_students_grouped_by_status(): void
    {
        $this->actingAs($this->teacher);

        $response = $this->get(route('teacher.reports'));

        $response->assertInertia(fn ($page) => $page
            ->where('grouped.onTrack.0.name', 'Test Student')
            ->where('grouped.onTrack.0.wordBlastAcc', 85)
            ->where('grouped.onTrack.0.finalAverage', 88)
        );
    }

    // ─── DEADLINE ───────────────────────────────────────────────────

    public function test_teacher_can_set_report_deadline(): void
    {
        $this->actingAs($this->teacher);

        $futureDate = now()->addDays(7)->format('Y-m-d\TH:i');

        $response = $this->post(route('teacher.reports.deadline'), [
            'deadline' => $futureDate,
        ]);

        $response->assertSessionHas('deadline_set');
        $this->assertEquals(
            $futureDate,
            Setting::getValue('report_deadline')
        );
    }

    public function test_teacher_can_set_deadline_within_current_minute(): void
    {
        $this->actingAs($this->teacher);

        $sameMinute = now()->startOfMinute()->format('Y-m-d\TH:i');

        $response = $this->post(route('teacher.reports.deadline'), [
            'deadline' => $sameMinute,
        ]);

        $response->assertSessionHas('deadline_set');
        $this->assertEquals($sameMinute, Setting::getValue('report_deadline'));
    }

    public function test_teacher_can_clear_deadline(): void
    {
        $this->actingAs($this->teacher);

        Setting::setValue('report_deadline', now()->addDays(7));

        $response = $this->post(route('teacher.reports.deadline'), [
            'deadline' => '',
        ]);

        $response->assertSessionHas('deadline_cleared');
        $this->assertNull(Setting::getValue('report_deadline'));
    }

    public function test_reports_page_passes_deadline_to_frontend(): void
    {
        $this->actingAs($this->teacher);

        Setting::setValue('report_deadline', '2026-12-25T23:59');

        $response = $this->get(route('teacher.reports'));

        $response->assertInertia(fn ($page) => $page
            ->where('deadline', '2026-12-25T23:59')
        );
    }

    // ─── SEND EMAILS ────────────────────────────────────────────────

    public function test_teacher_can_send_report_emails(): void
    {
        $this->actingAs($this->teacher);

        Setting::setValue('report_deadline', now()->subDay()->format('Y-m-d\TH:i'));

        $response = $this->post(route('teacher.reports.sendEmails'), [
            'student_ids' => [$this->student->id],
        ]);

        $response->assertSessionHas('sent', 1);
    }

    public function test_send_emails_counts_students_without_email_as_failed(): void
    {
        // Gumawa ng student na walang parent_email
        $noEmailStudent = User::factory()->create(['role' => 'student']);
        StudentProfile::factory()->for($noEmailStudent)->create([
            'parent_email' => null,
        ]);

        $this->actingAs($this->teacher);

        Setting::setValue('report_deadline', now()->subDay()->format('Y-m-d\TH:i'));

        $response = $this->post(route('teacher.reports.sendEmails'), [
            'student_ids' => [$this->student->id, $noEmailStudent->id],
        ]);

        // 1 na-send (may email), 1 failed (walang email)
        $response->assertSessionHas('sent', 1);
        $response->assertSessionHas('failed', 1);
    }

    public function test_send_emails_rejects_bad_student_ids(): void
    {
        Setting::setValue('report_deadline', now()->subDay()->format('Y-m-d\TH:i'));
        $this->actingAs($this->teacher);

        $this->post(route('teacher.reports.sendEmails'), [])
            ->assertSessionHasErrors('student_ids');
        $this->post(route('teacher.reports.sendEmails'), ['student_ids' => 'not-an-array'])
            ->assertSessionHasErrors('student_ids');
        $this->post(route('teacher.reports.sendEmails'), ['student_ids' => []])
            ->assertSessionHasErrors('student_ids');
        $this->post(route('teacher.reports.sendEmails'), ['student_ids' => [999999]])
            ->assertSessionHasErrors('student_ids.0');
    }

    public function test_send_emails_counts_teacher_id_as_failed_without_crash(): void
    {
        // A non-student id passes exists:users but has no profile/email — failed, not a crash.
        Setting::setValue('report_deadline', now()->subDay()->format('Y-m-d\TH:i'));

        $response = $this->actingAs($this->teacher)
            ->post(route('teacher.reports.sendEmails'), [
                'student_ids' => [$this->teacher->id],
            ]);

        $response->assertSessionHas('sent', 0);
        $response->assertSessionHas('failed', 1);
    }

    public function test_send_emails_requires_a_deadline(): void
    {
        Setting::where('key', 'report_deadline')->delete();

        $this->actingAs($this->teacher)
            ->post(route('teacher.reports.sendEmails'), [
                'student_ids' => [$this->student->id],
            ])
            ->assertSessionHas('error');
    }

    public function test_send_emails_blocked_before_deadline_passes(): void
    {
        Setting::setValue('report_deadline', now()->addDays(7)->format('Y-m-d\TH:i'));

        $this->actingAs($this->teacher)
            ->post(route('teacher.reports.sendEmails'), [
                'student_ids' => [$this->student->id],
            ])
            ->assertSessionHas('error');
    }

    public function test_send_emails_deduplicates_repeat_ids(): void
    {
        Setting::setValue('report_deadline', now()->subDay()->format('Y-m-d\TH:i'));

        $response = $this->actingAs($this->teacher)
            ->post(route('teacher.reports.sendEmails'), [
                'student_ids' => [$this->student->id, $this->student->id],
            ]);

        // whereIn collapses duplicates — one email, one stamp.
        $response->assertSessionHas('sent', 1);
        $response->assertSessionHas('failed', 0);
    }

    public function test_send_emails_stamps_sent_at_only_on_sent_and_redirects_to_thanks(): void
    {
        $noEmailStudent = User::factory()->create(['role' => 'student']);
        StudentProfile::factory()->for($noEmailStudent)->create([
            'parent_email' => null,
        ]);

        Setting::setValue('report_deadline', now()->subDay()->format('Y-m-d\TH:i'));

        $response = $this->actingAs($this->teacher)
            ->post(route('teacher.reports.sendEmails'), [
                'student_ids' => [$this->student->id, $noEmailStudent->id],
            ]);

        $response->assertRedirect(route('teacher.reports.thanks'));
        $response->assertSessionHas('sent', 1);
        $response->assertSessionHas('failed', 1);
        $response->assertSessionHas('reported_at');

        $this->assertNotNull($this->student->student->refresh()->report_sent_at);
        $this->assertNull($noEmailStudent->student->refresh()->report_sent_at);
    }

    // ─── WORD ATTEMPT ANALYTICS ─────────────────────────────────────

    private function seedWordMastery(string $text, int $fails, string $status = 'training'): void
    {
        $module = WordModule::create(['level' => 1, 'title' => 'Level 1']);
        $word = Word::create(['word_module_id' => $module->id, 'word' => $text, 'position' => 1]);

        StudentWordMastery::create([
            'user_id' => $this->student->id,
            'word_id' => $word->id,
            'status' => $status,
            'failed_attempts' => $fails,
        ]);
    }

    public function test_training_groups_from_skips_empty_levels_and_keeps_labels(): void
    {
        // Real curriculum shape: a non-empty training list always has matching
        // word_stats rows (both project from the same words).
        $groups = (new ReportService())->trainingGroupsFrom([
            ['level' => 'Level 1: Alpha', 'training' => ['CAT'], 'mastered' => [], 'words_count' => 2,
             'word_stats' => [['word' => 'CAT', 'mastery' => 'training', 'failed_attempts' => 1]]],
            ['level' => 'Level 2: Beta', 'training' => [], 'mastered' => ['DOG'], 'words_count' => 1, 'word_stats' => []],
        ]);

        $this->assertSame(['Level 1: Alpha' => ['CAT']], $groups);
    }

    public function test_training_attempts_from_lists_every_training_word(): void
    {
        $attempts = (new ReportService())->trainingAttemptsFrom([
            ['level' => 'Level 1: Alpha', 'word_stats' => [
                ['word' => 'CAT', 'mastery' => 'training', 'failed_attempts' => 3],
                ['word' => 'BAT', 'mastery' => 'training', 'failed_attempts' => 2],
                ['word' => 'HAT', 'mastery' => 'mastered', 'failed_attempts' => 5],
                ['word' => 'RAT', 'mastery' => 'unseen', 'failed_attempts' => 0],
            ]],
        ]);

        $this->assertSame(['CAT' => 3, 'BAT' => 2], $attempts);
    }

    public function test_attention_words_flag_training_words_at_exact_threshold(): void
    {
        $this->seedWordMastery('CAT', 3);

        // Story Quest side mirrors the same rule
        $module = ParagraphModule::create(['level' => 1, 'title' => 'Level 1', 'content' => 'dog', 'is_tutorial' => false]);
        $pWord = ParagraphWord::create(['paragraph_module_id' => $module->id, 'word' => 'dog', 'position' => 1]);
        StudentParagraphMastery::create([
            'user_id' => $this->student->id,
            'paragraph_word_id' => $pWord->id,
            'status' => 'training',
            'failed_attempts' => 4,
        ]);

        $service = new ReportService();

        $this->assertSame(
            ['CAT' => 3],
            $service->trainingAttemptsFrom(WordModule::curriculumForUser($this->student->id)),
        );
        $this->assertSame(
            ['dog' => 4],
            $service->trainingAttemptsFrom(ParagraphModule::curriculumForUser($this->student->id)),
        );
    }

    public function test_training_attempts_include_words_below_threshold(): void
    {
        $this->seedWordMastery('CAT', ReportService::NEEDS_ATTENTION_ATTEMPTS - 1);

        $service = new ReportService();

        $this->assertSame(['CAT' => 2], $service->trainingAttemptsFrom(WordModule::curriculumForUser($this->student->id)));
        $this->assertSame([], $service->trainingAttemptsFrom(ParagraphModule::curriculumForUser($this->student->id)));
    }

    public function test_attention_words_exclude_mastered_words(): void
    {
        // Recovered history stays teacher-facing; parents never see it.
        $this->seedWordMastery('CAT', 5, 'mastered');

        $service = new ReportService();

        $this->assertSame([], $service->trainingAttemptsFrom(WordModule::curriculumForUser($this->student->id)));
        $this->assertSame([], $service->trainingAttemptsFrom(ParagraphModule::curriculumForUser($this->student->id)));
    }

    public function test_training_attempts_sum_duplicate_texts_within_a_level(): void
    {
        // Word Blast has 10 unique words/level (dedup removed) — duplicate
        // texts are now last-write-wins (no sum). Legacy sum behavior retired.
        $module = WordModule::create(['level' => 1, 'title' => 'Dupes']);
        foreach ([1, 2] as $i => $fails) {
            $word = Word::create(['word_module_id' => $module->id, 'word' => 'cat', 'position' => $i + 1]);
            StudentWordMastery::create([
                'user_id' => $this->student->id,
                'word_id' => $word->id,
                'status' => 'training',
                'failed_attempts' => $fails,
            ]);
        }

        $this->assertSame(
            ['cat' => 2],
            (new ReportService())->trainingAttemptsFrom(WordModule::curriculumForUser($this->student->id)),
        );
    }

    public function test_training_attempts_merge_casing_and_trailing_punctuation(): void
    {
        // Word Blast dedup removed — casing/punctuation variants are now distinct keys.
        $module = WordModule::create(['level' => 1, 'title' => 'Casing']);
        foreach ([['Cat.', 2], ['cat', 1], ['CAT', 4]] as $i => [$text, $fails]) {
            $word = Word::create(['word_module_id' => $module->id, 'word' => $text, 'position' => $i + 1]);
            StudentWordMastery::create([
                'user_id' => $this->student->id,
                'word_id' => $word->id,
                'status' => 'training',
                'failed_attempts' => $fails,
            ]);
        }

        $this->assertSame(
            ['Cat.' => 2, 'cat' => 1, 'CAT' => 4],
            (new ReportService())->trainingAttemptsFrom(WordModule::curriculumForUser($this->student->id)),
        );
    }

    public function test_attention_words_respect_report_cutoff(): void
    {
        Setting::setValue('report_deadline', now()->subDay()->format('Y-m-d\TH:i'));

        $module = WordModule::create(['level' => 1, 'title' => 'Level 1']);
        $old = Word::create(['word_module_id' => $module->id, 'word' => 'OLD', 'position' => 1]);
        $new = Word::create(['word_module_id' => $module->id, 'word' => 'NEW', 'position' => 2]);

        $oldRow = StudentWordMastery::create([
            'user_id' => $this->student->id,
            'word_id' => $old->id,
            'status' => 'training',
            'failed_attempts' => 3,
        ]);
        $oldRow->created_at = now()->subDays(2);
        $oldRow->save();

        // created after the cutoff — excluded even with 3 fails
        StudentWordMastery::create([
            'user_id' => $this->student->id,
            'word_id' => $new->id,
            'status' => 'training',
            'failed_attempts' => 3,
        ]);

        $cutoff = (new ReportService())->cutoff();

        $this->assertSame(
            ['OLD' => 3],
            (new ReportService())->trainingAttemptsFrom(WordModule::curriculumForUser($this->student->id, $cutoff)),
        );
    }

    public function test_send_emails_payload_flags_attention_words(): void
    {
        Mail::fake();
        Setting::setValue('report_deadline', now()->subDay()->format('Y-m-d\TH:i'));
        $this->seedWordMastery('CAT', 3);

        // backdate so the report cutoff includes the row
        StudentWordMastery::where('user_id', $this->student->id)
            ->update(['created_at' => now()->subDays(2)]);

        $response = $this->actingAs($this->teacher)
            ->post(route('teacher.reports.sendEmails'), [
                'student_ids' => [$this->student->id],
            ]);

        Mail::assertQueued(StudentReportMail::class, function ($mail) {
            return $mail->data['wordAttempts'] === ['CAT' => 3]
                && $mail->data['paragraphWordAttempts'] === []
                && $mail->data['finalAverage'] === 88;
        });
        $response->assertSessionHas('sent', 1);
    }

    // Cross-surface parity: the parent email and the StudentDetails page must
    // be projections of the SAME curriculumForUser data. Expectations here are
    // derived from what the JSX zones render (labels, training lists,
    // word_stats flags) — never from the service helpers — so any divergence
    // between show() and sendReportEmails() fails this test.
    public function test_email_payload_matches_student_details_view_data(): void
    {
        Mail::fake();
        Setting::setValue('report_deadline', now()->subDay()->format('Y-m-d\TH:i'));

        // Word Blast: quiet training word, flagged word, Recovered word
        $wbModule = WordModule::create(['level' => 1, 'title' => 'Phonics']);
        foreach ([['CAT', 1, 'training'], ['SUN', 7, 'training'], ['HAT', 3, 'mastered']] as $i => [$text, $fails, $status]) {
            $word = Word::create(['word_module_id' => $wbModule->id, 'word' => $text, 'position' => $i + 1]);
            $this->backdatedMastery(StudentWordMastery::class, [
                'user_id' => $this->student->id,
                'word_id' => $word->id,
                'status' => $status,
                'failed_attempts' => $fails,
            ]);
        }

        // Story Quest: flagged sentence words + a Recovered one
        $sqModule = ParagraphModule::create(['level' => 1, 'title' => 'First Sentences', 'content' => 'The dog can run.', 'is_tutorial' => false]);
        foreach ([['dog', 7, 'training'], ['run', 9, 'mastered'], ['The', 0, 'mastered']] as $i => [$text, $fails, $status]) {
            $pWord = ParagraphWord::create(['paragraph_module_id' => $sqModule->id, 'word' => $text, 'position' => $i + 1]);
            $this->backdatedMastery(StudentParagraphMastery::class, [
                'user_id' => $this->student->id,
                'paragraph_word_id' => $pWord->id,
                'status' => $status,
                'failed_attempts' => $fails,
            ]);
        }

        // A FULLY MASTERED sentence that still carries history. This is the row
        // the old `mastery === 'training'` filter dropped on the floor, taking
        // the child's hard-won attempts with it.
        $sqDone = ParagraphModule::create(['level' => 2, 'title' => 'Second Sentences', 'content' => 'A big fox jumps.', 'is_tutorial' => false]);
        foreach ([['fox', 5, 'mastered'], ['jumps', 0, 'mastered'], ['A', 0, 'mastered'], ['big', 0, 'mastered']] as $i => [$text, $fails, $status]) {
            $pWord = ParagraphWord::create(['paragraph_module_id' => $sqDone->id, 'word' => $text, 'position' => $i + 1]);
            $this->backdatedMastery(StudentParagraphMastery::class, [
                'user_id' => $this->student->id,
                'paragraph_word_id' => $pWord->id,
                'status' => $status,
                'failed_attempts' => $fails,
            ]);
        }

        // PATH A — exactly what TeacherController@show hands to StudentDetails.jsx
        $details = null;
        $this->actingAs($this->teacher)
            ->get(route('teacher.studentDetails.show', $this->student))
            ->assertInertia(function (Assert $page) use (&$details) {
                $details = $page->toArray()['props']['data'] ?? null;
            });

        $readCur = $details['readCurriculum'];
        $speakCur = $details['speakCurriculum'];

        // Display normalization: the real SSOT, which mirrors the ASR's
        // speechUtils.js normalizeText() (BF25). This closure used to be
        // defined TWICE here while its comment claimed ReportService owned it.
        $normalize = fn (string $word) => ReportService::normalizeWord($word);

        // The rendering contract of the JSX zones: Word Blast uses word_stats
        // (normalize + SUM — mirrors aggregateZoneRows), Story Quest uses
        // sentence_stats (one chip per sentence, attempts = sum(word attempts)).
        $zoneTrainingGroups = fn (array $curriculum) => collect($curriculum)
            ->mapWithKeys(function ($level) use ($normalize) {
                $rows = collect($level['word_stats'] ?? [])
                    ->filter(fn ($stat) => $stat['mastery'] === 'training')
                    ->groupBy(fn ($stat) => $normalize($stat['word']));

                return [$level['level'] => $rows->map(fn ($group) => $group->first()['word'])->values()->all()];
            })
            ->filter(fn ($words) => $words !== [])
            ->all();

        $zoneSentenceTrainingGroups = fn (array $curriculum) => collect($curriculum)
            ->mapWithKeys(fn ($level) => [$level['level'] => collect($level['sentence_stats'] ?? [])->filter(fn ($s) => $s['mastery'] === 'training')->pluck('sentence')->all()])
            ->filter(fn ($s) => $s !== [])
            ->all();

        // What the JSX chips would flag: training + >= threshold (Needs Attention).
        $zoneAttention = fn (array $curriculum) => collect($curriculum)
            ->flatMap(fn ($level) => $level['word_stats'])
            ->filter(fn ($stat) => $stat['mastery'] === 'training')
            ->groupBy(fn ($stat) => $normalize($stat['word']))
            ->filter(fn ($rows) => $rows->sum('failed_attempts') >= ReportService::NEEDS_ATTENTION_ATTEMPTS)
            ->mapWithKeys(fn ($rows, $key) => [$rows->first()['word'] => $rows->sum('failed_attempts')])
            ->all();

        $zoneSentenceAttention = fn (array $curriculum) => collect($curriculum)
            ->flatMap(fn ($level) => $level['sentence_stats'] ?? [])
            ->filter(fn ($stat) => $stat['mastery'] === 'training' && (int) $stat['failed_attempts'] >= ReportService::NEEDS_ATTENTION_ATTEMPTS)
            ->mapWithKeys(fn ($stat) => [$stat['sentence'] => (int) $stat['failed_attempts']])
            ->all();

        // Recorded tries for EVERY still-training word, as the zones see them.
        $zoneTries = fn (array $curriculum) => collect($curriculum)
            ->flatMap(fn ($level) => $level['word_stats'])
            ->filter(fn ($stat) => $stat['mastery'] === 'training')
            ->groupBy(fn ($stat) => $normalize($stat['word']))
            ->mapWithKeys(fn ($rows, $key) => [$rows->first()['word'] => $rows->sum('failed_attempts')])
            ->all();

        $zoneSentenceTries = fn (array $curriculum) => collect($curriculum)
            ->flatMap(fn ($level) => $level['sentence_stats'] ?? [])
            ->filter(fn ($stat) => $stat['mastery'] === 'training')
            ->mapWithKeys(fn ($stat) => [$stat['sentence'] => (int) $stat['failed_attempts']])
            ->all();

        // PATH B — the queued parent email
        $this->post(route('teacher.reports.sendEmails'), [
            'student_ids' => [$this->student->id],
        ]);

        $mailData = null;
        Mail::assertQueued(StudentReportMail::class, function ($mail) use (&$mailData) {
            $mailData = $mail->data;

            return true;
        });

        $this->assertSame($zoneTrainingGroups($readCur), $mailData['trainingWords']);
        $this->assertSame($zoneSentenceTrainingGroups($speakCur), $mailData['paragraphTrainingWords']);
        $this->assertSame($zoneTries($readCur), $mailData['wordAttempts']);
        $this->assertSame($zoneSentenceTries($speakCur), $mailData['paragraphWordAttempts']);

        // The >=threshold slice of the email attempts must equal the flags the
        // JSX chips would show (Needs Attention / Needs More Practice).
        $mailNeedsWb = array_filter(
            $mailData['wordAttempts'],
            fn ($tries) => $tries >= ReportService::NEEDS_ATTENTION_ATTEMPTS,
        );
        $mailNeedsSq = array_filter(
            $mailData['paragraphWordAttempts'],
            fn ($tries) => $tries >= ReportService::NEEDS_ATTENTION_ATTEMPTS,
        );
        $this->assertSame($zoneAttention($readCur), $mailNeedsWb);
        $this->assertSame($zoneSentenceAttention($speakCur), $mailNeedsSq);

        // Recovered words stay in the teacher's zones but never reach parents.
        $hatStat = collect($readCur)->flatMap(fn ($level) => $level['word_stats'])->firstWhere('word', 'HAT');
        $this->assertSame(3, $hatStat['failed_attempts']);
        $this->assertArrayNotHasKey('HAT', $mailData['wordAttempts']);
        $this->assertArrayNotHasKey('run', $mailData['paragraphWordAttempts']);

        // ── Word-level verdicts (the sentence map above is untouched) ──
        $verdicts = $mailData['paragraphWordVerdicts']['The dog can run.'] ?? [];
        $this->assertSame(
            ['dog' => ReportService::VERDICT_NEEDS_ATTENTION, 'run' => ReportService::VERDICT_RECOVERED, 'The' => ReportService::VERDICT_MASTERED],
            array_column($verdicts, 'verdict', 'word'),
            'Each word carries its OWN verdict inside a still-training sentence.',
        );

        // The recovered gate: a mastered sentence with history now reaches the
        // parent, which it never did before.
        $recovered = $mailData['paragraphRecovered'];
        $this->assertSame(['A big fox jumps.'], array_keys($recovered));
        $this->assertSame(
            [['word' => 'fox', 'mastery' => 'mastered', 'failed_attempts' => 5, 'verdict' => ReportService::VERDICT_RECOVERED]],
            $recovered['A big fox jumps.'],
            'Only the words that actually took work — a first-try fox is not reported.',
        );

        // Progress % parity: Word Blast word-based, Story Quest sentence-based.
        $jsWordProgress = fn (array $curriculum) => collect($curriculum)->sum('words_count') > 0
            ? (int) round(collect($curriculum)->sum(fn ($level) => count($level['mastered']))
                / collect($curriculum)->sum('words_count') * 100)
            : 0;
        $jsSentenceProgress = fn (array $curriculum) => collect($curriculum)->sum(fn ($l) => $l['total_sentences'] ?? count($l['sentence_stats'] ?? [])) > 0
            ? (int) round(collect($curriculum)->sum(fn ($l) => $l['mastered_sentences'] ?? collect($l['sentence_stats'] ?? [])->where('mastery', 'mastered')->count())
                / collect($curriculum)->sum(fn ($l) => $l['total_sentences'] ?? count($l['sentence_stats'] ?? [])) * 100)
            : 0;

        $this->assertSame($jsWordProgress($readCur), $mailData['wordBlastProg']);
        $this->assertSame($jsSentenceProgress($speakCur), $mailData['storyQuestProg']);
    }

    private function backdatedMastery(string $model, array $attrs): void
    {
        $row = $model::create($attrs);
        $row->created_at = now()->subDays(2);
        $row->save();
    }

    public function test_report_email_renders_training_attention_and_status_sections(): void
    {
        $html = (new StudentReportMail([
            'name' => 'Test Student',
            'section' => '7-G',
            'wordBlastAcc' => 85,
            'storyQuestAcc' => 90,
            'read_level' => 1,
            'speak_level' => 1,
            'wordBlastProg' => 50,
            'storyQuestProg' => 40,
            'status' => 'in_progress',
            'latestBadge' => [],
            'trainingWords' => ['Level 1: Alpha' => ['CAT', 'BAT']],
            'paragraphTrainingWords' => ['Level 1: Stories' => ['dog']],
            'wordAttempts' => ['CAT' => 3, 'BAT' => 1],
            'paragraphWordAttempts' => ['dog' => 2],
            'reported_at' => 'August 23, 2026 at 9:00 AM',
        ]))->render();

        // The blade puts the try count and its label on separate template
        // lines, so rendered HTML carries newlines inside phrases like
        // "1\n recorded attempt". Collapse whitespace before substring checks.
        $html = preg_replace('/\s+/', ' ', $html);

        $this->assertStringContainsString('Training Zone', $html);
        $this->assertStringContainsString('Words that are not mastered yet', $html);
        $this->assertStringContainsString('recorded practice history', $html);

        // Two-tier grouping: BAT (below threshold) vs CAT (>= threshold)
        $this->assertStringContainsString('Still Practicing', $html);
        $this->assertStringContainsString('Needs More Practice', $html);
        $this->assertStringContainsString('1 recorded attempt', $html);
        $this->assertStringContainsString('3 recorded attempts', $html);
        $this->assertStringContainsString('Not yet mastered', $html);
        $this->assertStringContainsString('#f59e0b', $html);

        // in_progress banner (user-redesigned recommendation copy)
        $this->assertStringContainsString('Progress is underway. Completing both reading and speaking activities will advance the student through the curriculum.', $html);
    }

    public function test_report_email_renders_story_quest_word_verdicts_and_recovered(): void
    {
        $html = (new StudentReportMail([
            'name' => 'Test Student',
            'section' => '7-G',
            'wordBlastAcc' => 85,
            'storyQuestAcc' => 90,
            'read_level' => 1,
            'speak_level' => 2,
            'wordBlastProg' => 50,
            'storyQuestProg' => 40,
            'status' => 'in_progress',
            'latestBadge' => [],
            'trainingWords' => [],
            'paragraphTrainingWords' => ['Level 1: Stories' => ['The cat is very big.']],
            'wordAttempts' => [],
            'paragraphWordAttempts' => ['The cat is very big.' => 7],
            // 'cat' still failing at 3, 'is' conquered after 4, 'big' untouched.
            // 'is' is 4 not 2 on purpose: the recovered floor equals the
            // attention floor, so a 2-failure word is plain MASTERED and this
            // fixture must not claim otherwise.
            'paragraphWordVerdicts' => ['The cat is very big.' => [
                ['word' => 'The', 'mastery' => 'mastered', 'failed_attempts' => 0, 'verdict' => ReportService::VERDICT_MASTERED],
                ['word' => 'cat', 'mastery' => 'training', 'failed_attempts' => 3, 'verdict' => ReportService::VERDICT_NEEDS_ATTENTION],
                ['word' => 'is', 'mastery' => 'mastered', 'failed_attempts' => 4, 'verdict' => ReportService::VERDICT_RECOVERED],
                ['word' => 'very', 'mastery' => 'mastered', 'failed_attempts' => 0, 'verdict' => ReportService::VERDICT_MASTERED],
                ['word' => 'big', 'mastery' => 'unseen', 'failed_attempts' => 0, 'verdict' => ReportService::VERDICT_NOT_ATTEMPTED],
            ]],
            'paragraphRecovered' => ['A bold fox jumps.' => [
                ['word' => 'fox', 'mastery' => 'mastered', 'failed_attempts' => 4, 'verdict' => ReportService::VERDICT_RECOVERED],
            ]],
            'reported_at' => 'August 23, 2026 at 9:00 AM',
        ]))->render();

        $html = preg_replace('/\s+/', ' ', $html);

        // The sentence chip still leads, so a parent knows WHERE the trouble is.
        // 7 = 0 (The) + 3 (cat) + 4 (is) + 0 (very) + 0 (big).
        $this->assertStringContainsString('The cat is very big.', $html);
        $this->assertStringContainsString('7 recorded attempts', $html);

        // The words that produced it, each with its OWN count and verdict.
        $this->assertStringContainsString('cat', $html);
        $this->assertStringContainsString('3 recorded attempts', $html);
        $this->assertStringContainsString('Needs More Practice', $html);
        $this->assertStringContainsString('is', $html);
        $this->assertStringContainsString('4 recorded attempts', $html);
        $this->assertStringContainsString('Recovered', $html);

        // A word with NO history gets no row of its own — 'The', 'very' and
        // 'big' all cleared on the first try, and a 0-attempt line under a
        // sentence is noise. Matches the teacher page's drill-list filter.
        $this->assertStringNotContainsString('0 recorded attempts', $html);
        $this->assertStringNotContainsString('Not Attempted', $html);

        // The recovered group: a mastered sentence that the old training-only
        // filter could never show.
        $this->assertStringContainsString('Recently Conquered', $html);
        $this->assertStringContainsString('A bold fox jumps.', $html);
        $this->assertStringContainsString('4 recorded attempts to conquer', $html);
    }

    public function test_report_email_prints_recorded_failures_raw_never_a_winning_try(): void
    {
        // THE CROSS-SURFACE LOCK, email half.
        //
        // A word's number is `failed_attempts` — the recorded failure events, and
        // nothing else. It is NOT attempts: the 5s-silence watchdog increments
        // failed_attempts on pure silence, so a word the child stalled on and
        // never tried carries a "failure" that was not a pronunciation attempt.
        // Adding 1 to invent a "winning try" therefore reports tries that never
        // happened, AND desynchronises the email from the teacher page, which
        // used to print exactly that +1 for every mastered word.
        //
        // This half is GREEN as written — the blade was always right. It pins the
        // email so the page can be brought into line without the parent side
        // moving, and it fails loudly if anyone reintroduces the +1 here.
        $html = (new StudentReportMail([
            'name' => 'Test Student',
            'section' => '7-G',
            'wordBlastAcc' => 85,
            'storyQuestAcc' => 90,
            'read_level' => 1,
            'speak_level' => 2,
            'wordBlastProg' => 50,
            'storyQuestProg' => 40,
            'status' => 'in_progress',
            'latestBadge' => [],
            'trainingWords' => [],
            // A TRAINING sentence that CONTAINS mastered words — the band the
            // teacher page got wrong. The sentence total is deliberately 20 so it
            // collides with no word count below.
            'paragraphTrainingWords' => ['Level 1: Stories' => ['The cat is very big.']],
            'wordAttempts' => [],
            'paragraphWordAttempts' => ['The cat is very big.' => 20],
            'paragraphWordVerdicts' => ['The cat is very big.' => [
                ['word' => 'zerofail', 'mastery' => 'mastered', 'failed_attempts' => 0, 'verdict' => ReportService::VERDICT_MASTERED],
                ['word' => 'one', 'mastery' => 'mastered', 'failed_attempts' => 1, 'verdict' => ReportService::VERDICT_MASTERED],
                ['word' => 'two', 'mastery' => 'mastered', 'failed_attempts' => 2, 'verdict' => ReportService::VERDICT_MASTERED],
                ['word' => 'cat', 'mastery' => 'training', 'failed_attempts' => 4, 'verdict' => ReportService::VERDICT_NEEDS_ATTENTION],
            ]],
            // Recovered, i.e. the band a teacher actually reteaches from.
            'paragraphRecovered' => ['A bold fox jumps.' => [
                ['word' => 'brave', 'mastery' => 'mastered', 'failed_attempts' => 4, 'verdict' => ReportService::VERDICT_RECOVERED],
                ['word' => 'crane', 'mastery' => 'mastered', 'failed_attempts' => 6, 'verdict' => ReportService::VERDICT_RECOVERED],
                ['word' => 'lands', 'mastery' => 'mastered', 'failed_attempts' => 9, 'verdict' => ReportService::VERDICT_RECOVERED],
            ]],
            'reported_at' => 'August 23, 2026 at 9:00 AM',
        ]))->render();

        $html = preg_replace('/\s+/', ' ', $html);

        // Raw, exactly as stored. A 4-failure word reads 4, never 5.
        $this->assertStringContainsString('4 recorded attempts to conquer', $html);
        $this->assertStringContainsString('6 recorded attempts to conquer', $html);
        $this->assertStringContainsString('9 recorded attempts to conquer', $html);
        $this->assertStringContainsString('1 recorded attempt', $html);
        $this->assertStringContainsString('2 recorded attempts', $html);
        $this->assertStringContainsString('20 recorded attempts', $html);

        // The +1 the teacher page used to invent is nowhere in the email. If a
        // future change reintroduces it, the parent and the teacher will quote
        // different numbers for the same word and this fails.
        foreach ([5, 7, 10] as $invented) {
            $this->assertStringNotContainsString(
                "{$invented} recorded attempts to conquer",
                $html,
                "the email invented a winning try: printed {$invented} where failed_attempts says otherwise",
            );
        }

        // A word with NO history gets no row at all — the rule the page's drill
        // list and Word Blast chip now follow, so "Attempts: 1" for a first-try
        // read can never appear on one surface while the other stays silent.
        //
        // Asserted by WORD, not by number: '0 recorded attempt' is a substring of
        // '20 recorded attempts', so the numeric form passes vacuously. (The
        // sibling test above has the same latent trap and only escapes it because
        // its fixture happens to have no count ending in zero.)
        $this->assertStringNotContainsString('zerofail', $html);
    }

    public function test_report_email_renders_not_started_banner_without_training_sections(): void
    {
        $html = (new StudentReportMail([
            'name' => 'Test Student',
            'section' => '7-G',
            'wordBlastAcc' => 0,
            'storyQuestAcc' => 0,
            'read_level' => 1,
            'speak_level' => 1,
            'wordBlastProg' => 0,
            'storyQuestProg' => 0,
            'status' => 'notStarted',
            'latestBadge' => [],
            'trainingWords' => [],
            'paragraphTrainingWords' => [],
            'wordAttempts' => [],
            'paragraphWordAttempts' => [],
            'reported_at' => 'August 23, 2026 at 9:00 AM',
        ]))->render();

        $this->assertStringContainsString('Encourage the student to begin Word Blast and Story Quest activities.', $html);
        $this->assertStringNotContainsString('Training Zone', $html);
        $this->assertStringNotContainsString('recorded attempt', $html);
    }

    public function test_attention_words_ignore_tutorial_modules(): void
    {
        $module = WordModule::create(['level' => 99, 'title' => 'Tutorial', 'is_tutorial' => true]);
        $word = Word::create(['word_module_id' => $module->id, 'word' => 'GHOST', 'position' => 1]);
        StudentWordMastery::create([
            'user_id' => $this->student->id,
            'word_id' => $word->id,
            'status' => 'training',
            'failed_attempts' => 9,
        ]);

        $this->assertSame(
            [],
            (new ReportService())->trainingAttemptsFrom(WordModule::curriculumForUser($this->student->id)),
        );
    }

    public function test_attention_words_skip_unseen_words(): void
    {
        // word in the module but the student never touched it — no row, no flag
        $module = WordModule::create(['level' => 1, 'title' => 'Level 1']);
        Word::create(['word_module_id' => $module->id, 'word' => 'GHOST', 'position' => 1]);

        $this->assertSame(
            [],
            (new ReportService())->trainingAttemptsFrom(WordModule::curriculumForUser($this->student->id)),
        );
    }

    public function test_attention_words_aggregate_across_modules_and_levels(): void
    {
        foreach ([['level' => 1, 'title' => 'Alpha', 'text' => 'BAT'], ['level' => 2, 'title' => 'Beta', 'text' => 'RAT']] as $seed) {
            $module = WordModule::create(['level' => $seed['level'], 'title' => $seed['title']]);
            $word = Word::create(['word_module_id' => $module->id, 'word' => $seed['text'], 'position' => 1]);
            StudentWordMastery::create([
                'user_id' => $this->student->id,
                'word_id' => $word->id,
                'status' => 'training',
                'failed_attempts' => $seed['level'] * 3,
            ]);
        }

        $this->assertSame(
            ['BAT' => 3, 'RAT' => 6],
            (new ReportService())->trainingAttemptsFrom(WordModule::curriculumForUser($this->student->id)),
        );
    }

    public function test_attention_words_are_isolated_per_student(): void
    {
        $flagged = User::factory()->create(['role' => 'student']);
        $clean = User::factory()->create(['role' => 'student']);

        $module = WordModule::create(['level' => 1, 'title' => 'Level 1']);
        $word = Word::create(['word_module_id' => $module->id, 'word' => 'CAT', 'position' => 1]);
        StudentWordMastery::create([
            'user_id' => $flagged->id,
            'word_id' => $word->id,
            'status' => 'training',
            'failed_attempts' => 3,
        ]);

        $service = new ReportService();

        $this->assertSame(['CAT' => 3], $service->trainingAttemptsFrom(WordModule::curriculumForUser($flagged->id)));
        $this->assertSame([], $service->trainingAttemptsFrom(WordModule::curriculumForUser($clean->id)));
    }

    public function test_attention_threshold_is_shared_to_teachers_only(): void
    {
        $this->actingAs($this->teacher)
            ->get(route('teacher.reports'))
            ->assertInertia(fn ($page) => $page
                ->component('Teacher/Reports')
                ->where('teacher.attention_threshold', ReportService::NEEDS_ATTENTION_ATTEMPTS)
            );

        // avatar-complete students land on the dashboard; splashScreen bounces them
        $this->student->student->update(['avatar' => 'https://example.com/a.png']);

        $this->actingAs($this->student)
            ->get(route('student.dashboard'))
            ->assertInertia(fn ($page) => $page
                ->where('teacher', null)
            );
    }

    // ─── PARENT EMAIL ───────────────────────────────────────────────

    public function test_teacher_can_update_parent_email(): void
    {
        $this->actingAs($this->teacher);

        $noEmailStudent = User::factory()->create(['role' => 'student']);
        StudentProfile::factory()->for($noEmailStudent)->create([
            'parent_email' => null,
        ]);

        $response = $this->put(route('teacher.reports.parentEmail', $noEmailStudent->id), [
            'parent_email' => 'NewParent@Email.com',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('students', [
            'user_id' => $noEmailStudent->id,
            'parent_email' => 'newparent@email.com',
        ]);
    }

    public function test_update_parent_email_rejects_invalid_email(): void
    {
        $this->actingAs($this->teacher);

        $response = $this->put(route('teacher.reports.parentEmail', $this->student->id), [
            'parent_email' => 'not-an-email',
        ]);

        $response->assertSessionHasErrors('parent_email');
        $this->assertDatabaseHas('students', [
            'user_id' => $this->student->id,
            'parent_email' => 'parent@email.com',
        ]);
    }

    public function test_update_parent_email_404s_for_non_student_id(): void
    {
        $this->actingAs($this->teacher);

        $response = $this->put(route('teacher.reports.parentEmail', $this->teacher->id), [
            'parent_email' => 'x@y.com',
        ]);

        $response->assertStatus(404);
    }

    public function test_update_parent_email_clears_when_null(): void
    {
        $this->actingAs($this->teacher);

        $response = $this->put(route('teacher.reports.parentEmail', $this->student->id), [
            'parent_email' => null,
        ]);

        $response->assertRedirect();
        $this->assertNull($this->student->student->refresh()->parent_email);
    }

    public function test_update_parent_email_rejects_overlong(): void
    {
        $this->actingAs($this->teacher);

        $response = $this->put(route('teacher.reports.parentEmail', $this->student->id), [
            'parent_email' => str_repeat('a', 250).'@example.com',
        ]);

        $response->assertSessionHasErrors('parent_email');
        $this->assertEquals('parent@email.com', $this->student->student->refresh()->parent_email);
    }

    public function test_student_and_guest_cannot_update_parent_email(): void
    {
        $other = User::factory()->create(['role' => 'student']);

        // Guest first — actingAs persists for the rest of the test.
        $this->put(route('teacher.reports.parentEmail', $this->student->id), [
            'parent_email' => 'x@y.com',
        ])->assertRedirect(route('teacher.login'));

        $this->actingAs($other)
            ->put(route('teacher.reports.parentEmail', $this->student->id), [
                'parent_email' => 'x@y.com',
            ])
            ->assertRedirect(route('student.dashboard'));

        $this->assertEquals('parent@email.com', $this->student->student->refresh()->parent_email);
    }

    public function test_latest_badge_returns_null_without_badges(): void
    {
        $service = new ReportService();

        $this->assertNull($service->latestBadge(null));
        $this->assertNull($service->latestBadge(999999));
        $this->assertNull($service->latestBadge($this->student->id));
    }

    // ─── EXCEL EXPORT ────────────────────────────────────────────────

    public function test_teacher_can_export_reports_after_deadline(): void
    {
        $this->actingAs($this->teacher);

        Setting::setValue('report_deadline', now()->subDay()->format('Y-m-d\TH:i'));

        $response = $this->get(route('teacher.reports.export'));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $response->assertHeader('Content-Disposition');
    }

    public function test_export_reports_requires_deadline(): void
    {
        $this->actingAs($this->teacher);

        $response = $this->get(route('teacher.reports.export'));

        $response->assertRedirect();
        $response->assertSessionHas('error');
    }

    public function test_export_reports_requires_deadline_to_have_passed(): void
    {
        $this->actingAs($this->teacher);

        Setting::setValue('report_deadline', now()->addDays(7)->format('Y-m-d\TH:i'));

        $response = $this->get(route('teacher.reports.export'));

        $response->assertRedirect();
        $response->assertSessionHas('error');
    }

    public function test_export_contains_three_sheets(): void
    {
        $sheets = (new ReportsExport([]))->sheets();

        $this->assertCount(3, $sheets);
        $this->assertArrayHasKey('Struggle Summary', $sheets);
        $this->assertArrayHasKey('Session History', $sheets);
        $this->assertArrayHasKey('Hardest Words - Story Quest', $sheets);
    }


    public function test_struggle_summary_sheet_has_correct_headings(): void
    {
        $sheet = new StruggleSummarySheet([[
            'name' => 'Test Student',
            'student_id' => 'S7-001',
            'section' => 'Section A',
            'hardestWbModule' => 'Level 4: Orchard Basket',
            'hardestWbWord' => 'biscuit',
        ]]);

        $this->assertEquals([
            'Student Name',
            'Student ID',
            'Section',
            'Hardest Module (Word Blast)',
            'Hardest Word (Word Blast)',
        ], $sheet->headings());

        $row = $sheet->collection()->first();
        $this->assertEquals('Test Student', $row[0]);
        $this->assertEquals('S7-001', $row[1]);
        $this->assertEquals('Section A', $row[2]);
        $this->assertEquals('Level 4: Orchard Basket', $row[3]);
        $this->assertEquals('biscuit', $row[4]);
    }

    public function test_squ_hardest_word_sheet_has_correct_headings(): void
    {
        $sheet = new SquHardestWordSheet([[
            'name' => 'Test Student',
            'hardestSqModule' => 'Level 2: Pet Pals',
            'hardestSqWord' => 'hedgehog',
            'hardestSqAttempts' => 6,
        ]]);

        $this->assertEquals([
            'Student Name',
            'Hardest Module (Story Quest)',
            'Hardest Word (Story Quest)',
            'Recorded Attempts',
        ], $sheet->headings());

        $row = $sheet->collection()->first();
        $this->assertEquals('Test Student', $row[0]);
        $this->assertEquals('Level 2: Pet Pals', $row[1]);
        $this->assertEquals('hedgehog', $row[2]);
        $this->assertEquals(6, $row[3]);
    }


    public function test_session_history_sheet_has_correct_headings(): void
    {
        $sheet = new SessionHistorySheet([]);

        // Streak is gone: a within-round word mechanic that answered no report
        // question. game_sessions.streak itself stays (badges read it).
        $this->assertEquals([
            'Student Name',
            'Student ID',
            'Section',
            'Date/Time Played',
            'Mode',
            'Level',
            'Score',
            'Accuracy (%)',
        ], $sheet->headings());
    }

    public function test_session_history_sheet_maps_session_fields(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = User::factory()->create([
            'role' => 'student',
            'student_id' => 'S7-100',
            'name' => 'Session Tester',
        ]);
        $studentProfile = StudentProfile::create([
            'user_id' => $student->id,
            'section' => 'Section Z',
            'status' => 'notStarted',
        ]);

        $wordModule = WordModule::create(['level' => 1, 'title' => 'Test Words', 'is_tutorial' => false]);
        $session = GameSession::create([
            'user_id' => $student->id,
            'module_id' => $wordModule->id,
            'module_type' => 'word',
            'score' => 8,
            'accuracy' => 80.00,
            'streak' => 3,
        ]);
        $playedAt = $session->created_at;

        $sheet = new SessionHistorySheet([]);
        $collection = $sheet->collection();

        $this->assertCount(1, $collection);
        $row = $collection->first();
        $this->assertCount(8, $row);
        $this->assertEquals('Session Tester', $row[0]);
        $this->assertEquals('S7-100', $row[1]);
        $this->assertEquals('Section Z', $row[2]);
        $this->assertEquals($playedAt->format('F j, Y g:i A'), $row[3]);
        $this->assertEquals('Word Blast', $row[4]);
        $this->assertEquals('Level 1 - Test Words', $row[5]);
        $this->assertEquals(8, $row[6]);
        $this->assertEquals(80.00, $row[7]);
    }

    public function test_session_history_sheet_handles_deleted_module(): void
    {
        $student = User::factory()->create([
            'role' => 'student',
            'student_id' => 'S7-101',
            'name' => 'Deleted Module Student',
        ]);
        StudentProfile::create([
            'user_id' => $student->id,
            'section' => 'Section A',
            'status' => 'notStarted',
        ]);

        $session = GameSession::create([
            'user_id' => $student->id,
            'module_id' => 9999,
            'module_type' => 'word',
            'score' => 0,
            'accuracy' => 0,
            'streak' => 0,
            'created_at' => now(),
        ]);

        $sheet = new SessionHistorySheet([]);
        $collection = $sheet->collection();

        $this->assertCount(1, $collection);
        $this->assertEquals('Module #9999', $collection->first()[5]);
    }

    public function test_session_history_sheet_excludes_tutorial_sessions(): void
    {
        $student = User::factory()->create([
            'role' => 'student',
            'student_id' => 'S7-102',
            'name' => 'Tutorial Student',
        ]);
        StudentProfile::create([
            'user_id' => $student->id,
            'section' => 'Section A',
            'status' => 'notStarted',
        ]);

        $tutorialModule = WordModule::create(['level' => 0, 'title' => 'Tutorial', 'is_tutorial' => true]);
        $realModule = WordModule::create(['level' => 1, 'title' => 'Real Words', 'is_tutorial' => false]);

        GameSession::create([
            'user_id' => $student->id,
            'module_id' => $tutorialModule->id,
            'module_type' => 'word',
            'score' => 5,
            'accuracy' => 100.00,
            'streak' => 5,
            'created_at' => now()->subMinutes(5),
        ]);

        GameSession::create([
            'user_id' => $student->id,
            'module_id' => $realModule->id,
            'module_type' => 'word',
            'score' => 8,
            'accuracy' => 80.00,
            'streak' => 3,
            'created_at' => now(),
        ]);

        $sheet = new SessionHistorySheet([]);
        $collection = $sheet->collection();

        $this->assertCount(1, $collection);
        $this->assertEquals('Level 1 - Real Words', $collection->first()[5]);
    }

    public function test_export_with_no_students_returns_file(): void
    {
        Setting::setValue('report_deadline', now()->subDay()->format('Y-m-d\TH:i'));
        $this->student->delete();

        $this->actingAs($this->teacher)
            ->get(route('teacher.reports.export'))
            ->assertStatus(200)
            ->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    public function test_export_row_carries_hardest_module_and_word(): void
    {
        Setting::setValue('report_deadline', now()->subDay()->format('Y-m-d\TH:i'));

        $module = WordModule::create(['level' => 1, 'title' => 'Level 1']);
        foreach ([['CAT', 5], ['BIRD', 4], ['ZOO', 1]] as $i => [$text, $fails]) {
            $word = Word::create(['word_module_id' => $module->id, 'word' => $text, 'position' => $i + 1]);
            $row = StudentWordMastery::create([
                'user_id' => $this->student->id,
                'word_id' => $word->id,
                'status' => 'training',
                'failed_attempts' => $fails,
            ]);
            // Backdate inside the report cutoff.
            $row->created_at = now()->subDays(2);
            $row->save();
        }

        // Fake the writer (CLI has no ZipArchive) and inspect the export payload.
        \Maatwebsite\Excel\Facades\Excel::fake();

        $this->actingAs($this->teacher)
            ->get(route('teacher.reports.export'))
            ->assertSuccessful();

        \Maatwebsite\Excel\Facades\Excel::assertDownloaded('class-report.xlsx', function (ReportsExport $export) {
            $prop = new \ReflectionProperty(ReportsExport::class, 'students');
            $row = collect($prop->getValue($export))->firstWhere('name', 'Test Student');

            return $row['hardestWbWord'] === 'CAT'
                && $row['hardestWbModule'] === 'Level 1: Level 1'
                && $row['hardestSqModule'] === 'N/A'
                && $row['hardestSqWord'] === 'N/A'
                && $row['hardestSqAttempts'] === 0;
        });
    }
}
