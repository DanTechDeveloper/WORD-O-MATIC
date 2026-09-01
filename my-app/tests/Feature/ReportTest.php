<?php

namespace Tests\Feature;

use App\Exports\ClassReportSheet;
use App\Exports\ReportsExport;
use App\Exports\SkillsOverviewSheet;
use App\Exports\SkillsWordsSheet;
use App\Mail\StudentReportMail;
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
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
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
        // "cat" occurs twice in one paragraph module — two mastery rows, one
        // summed email entry instead of the second overwriting the first.
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
            ['cat' => 3],
            (new ReportService())->trainingAttemptsFrom(WordModule::curriculumForUser($this->student->id)),
        );
    }

    public function test_training_attempts_merge_casing_and_trailing_punctuation(): void
    {
        // Natural sentence tokens: "Cat." (sentence-final) vs "cat" vs "CAT"
        // are the same spoken word for reporting purposes.
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
            ['Cat.' => 7],
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

        // PATH A — exactly what TeacherController@show hands to StudentDetails.jsx
        $details = null;
        $this->actingAs($this->teacher)
            ->get(route('teacher.studentDetails.show', $this->student))
            ->assertInertia(function (Assert $page) use (&$details) {
                $details = $page->toArray()['props']['data'] ?? null;
            });

        $readCur = $details['readCurriculum'];
        $speakCur = $details['speakCurriculum'];

        // Display normalization: case- and trailing-punctuation-insensitive
        // grouping — mirrors ReportService::normalizeWord (BF25).
        $normalize = fn (string $word) => mb_strtolower(preg_replace('/[^\p{L}\p{N}]+$/u', '', trim($word)));

        // Display normalization: case- and trailing-punctuation-insensitive
        // grouping — mirrors ReportService::normalizeWord (BF25).
        $normalize = fn (string $word) => mb_strtolower(preg_replace('/[^\p{L}\p{N}]+$/u', '', trim($word)));

        // The rendering contract of the JSX zones: non-empty levels only,
        // duplicate texts merged (normalize + SUM — mirrors aggregateZoneRows).
        $zoneTrainingGroups = fn (array $curriculum) => collect($curriculum)
            ->mapWithKeys(function ($level) use ($normalize) {
                $rows = collect($level['word_stats'] ?? [])
                    ->filter(fn ($stat) => $stat['mastery'] === 'training')
                    ->groupBy(fn ($stat) => $normalize($stat['word']));

                return [$level['level'] => $rows->map(fn ($group) => $group->first()['word'])->values()->all()];
            })
            ->filter(fn ($words) => $words !== [])
            ->all();

        // What the JSX chips would flag: training + >= threshold (Needs Attention).
        $zoneAttention = fn (array $curriculum) => collect($curriculum)
            ->flatMap(fn ($level) => $level['word_stats'])
            ->filter(fn ($stat) => $stat['mastery'] === 'training')
            ->groupBy(fn ($stat) => $normalize($stat['word']))
            ->filter(fn ($rows) => $rows->sum('failed_attempts') >= ReportService::NEEDS_ATTENTION_ATTEMPTS)
            ->mapWithKeys(fn ($rows, $key) => [$rows->first()['word'] => $rows->sum('failed_attempts')])
            ->all();

        // Recorded tries for EVERY still-training word, as the zones see them.
        $zoneTries = fn (array $curriculum) => collect($curriculum)
            ->flatMap(fn ($level) => $level['word_stats'])
            ->filter(fn ($stat) => $stat['mastery'] === 'training')
            ->groupBy(fn ($stat) => $normalize($stat['word']))
            ->mapWithKeys(fn ($rows, $key) => [$rows->first()['word'] => $rows->sum('failed_attempts')])
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
        $this->assertSame($zoneTrainingGroups($speakCur), $mailData['paragraphTrainingWords']);
        $this->assertSame($zoneTries($readCur), $mailData['wordAttempts']);
        $this->assertSame($zoneTries($speakCur), $mailData['paragraphWordAttempts']);

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
        $this->assertSame($zoneAttention($speakCur), $mailNeedsSq);

        // Recovered words stay in the teacher's zones but never reach parents.
        $hatStat = collect($readCur)->flatMap(fn ($level) => $level['word_stats'])->firstWhere('word', 'HAT');
        $this->assertSame(3, $hatStat['failed_attempts']);
        $this->assertArrayNotHasKey('HAT', $mailData['wordAttempts']);
        $this->assertArrayNotHasKey('run', $mailData['paragraphWordAttempts']);

        // Progress % parity: JSX calcOverallProgress ≡ PHP curriculumPercent.
        $jsProgress = fn (array $curriculum) => collect($curriculum)->sum('words_count') > 0
            ? (int) round(collect($curriculum)->sum(fn ($level) => count($level['mastered']))
                / collect($curriculum)->sum('words_count') * 100)
            : 0;

        $this->assertSame($jsProgress($readCur), $mailData['wordBlastProg']);
        $this->assertSame($jsProgress($speakCur), $mailData['storyQuestProg']);
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
        $this->assertArrayHasKey('Class Summary', $sheets);
        $this->assertArrayHasKey('Student Progress Summary', $sheets);
        $this->assertArrayHasKey('Words Needing Practice', $sheets);
    }

    public function test_skills_overview_sheet_has_correct_headings(): void
    {
        $student = [
            'id' => 1,
            'name' => 'Test Student',
            'student_id' => 'S7-001',
            'section' => 'Section A',
            'status' => 'onTrack',
            'wordBlastAcc' => 85,
            'storyQuestAcc' => 90,
            'read_level' => 3,
            'speak_level' => 2,
            'wbLevelLabel' => 'Level 3 - Phonics Fundamentals',
            'sqLevelLabel' => 'Level 2 - Farm Animals',
            'parent_email' => 'test@test.com',
            'report_sent_at' => null,
            'topStruggle' => 'WB: CAT ×4 · SQ: the ×3',
        ];

        $sheet = new SkillsOverviewSheet([$student]);

        $this->assertEquals([
            'Student Name',
            'Student ID',
            'Section',
            'Final Status',
            'Word Blast',
            'Story Quest',
            'Final Average',
            'Top Struggle',
        ], $sheet->headings());

        $collection = $sheet->collection();
        $row = $collection->first();

        $this->assertNotNull($row);
        $this->assertEquals('Test Student', $row[0]);
        $this->assertEquals('S7-001', $row[1]);
        $this->assertEquals('Section A', $row[2]);
        $this->assertEquals('onTrack', $row[3]);
        $this->assertEquals('85% (Level 3 - Phonics Fundamentals)', $row[4]);
        $this->assertEquals('90% (Level 2 - Farm Animals)', $row[5]);
        $this->assertEquals('88%', $row[6]);
        $this->assertEquals('WB: CAT ×4 · SQ: the ×3', $row[7]);
    }

    public function test_skills_words_sheet_has_correct_headings(): void
    {
        $student = [
            'name' => 'Test Student',
            'student_id' => 'S7-002',
            'section' => 'Section B',
            'struggleRows' => [
                ['mode' => 'Word Blast', 'level' => 'Level 3: Around Town', 'word' => 'bird', 'attempts' => 4],
                ['mode' => 'Word Blast', 'level' => 'Level 3: Around Town', 'word' => 'zoo', 'attempts' => 1],
                ['mode' => 'Story Quest', 'level' => 'Level 1: Stories', 'word' => 'word3', 'attempts' => 3],
            ],
        ];

        $sheet = new SkillsWordsSheet([$student]);

        $this->assertEquals([
            'Student Name',
            'Student ID',
            'Section',
            'Mode',
            'Level',
            'Word',
            'Attempts',
        ], $sheet->headings());

        $collection = $sheet->collection();

        $this->assertCount(3, $collection);
        $this->assertEquals('Test Student', $collection[0][0]);
        $this->assertEquals('S7-002', $collection[0][1]);
        $this->assertEquals('Section B', $collection[0][2]);
        $this->assertEquals('Word Blast', $collection[0][3]);
        $this->assertEquals('Level 3: Around Town', $collection[0][4]);
        $this->assertEquals('bird', $collection[0][5]);
        $this->assertEquals(4, $collection[0][6]);

        // Rows at/over NEEDS_ATTENTION_ATTEMPTS get the red flag; sub-threshold
        // rows stay plain. +1 offsets the heading row.
        $styles = $sheet->styles(new Worksheet);
        $this->assertArrayHasKey(2, $styles);
        $this->assertArrayHasKey(4, $styles);
        $this->assertArrayNotHasKey(3, $styles);
    }

    public function test_class_report_sheet_has_correct_headings(): void
    {
        $student = [
            'id' => 1,
            'name' => 'Test Student',
            'section' => 'Section A',
            'status' => 'onTrack',
            'wordBlastAcc' => 85,
            'storyQuestAcc' => 90,
            'read_level' => 3,
            'speak_level' => 2,
            'parent_email' => 'test@test.com',
            'report_sent_at' => null,
        ];

        $sheet = new ClassReportSheet([$student]);

        $this->assertEquals([
            'Student Name',
            'Word Blast Accuracy (%)',
            'Story Quest Accuracy (%)',
            'Final Average (%)',
            'Status Category',
            'Count',
        ], $sheet->headings());
    }

    public function test_class_report_sheet_collection_formats_data_correctly(): void
    {
        $student = [
            'id' => 1,
            'name' => 'Test Student',
            'section' => 'Section A',
            'status' => 'onTrack',
            'wordBlastAcc' => 85,
            'storyQuestAcc' => 90,
            'read_level' => 3,
            'speak_level' => 2,
            'parent_email' => 'test@test.com',
            'report_sent_at' => null,
        ];

        $sheet = new ClassReportSheet([$student]);
        $collection = $sheet->collection();

        $this->assertCount(8, $collection);

        $studentRow = $collection[0];
        $this->assertEquals('Test Student', $studentRow[0]);
        $this->assertEquals(85, $studentRow[1]);
        $this->assertEquals(90, $studentRow[2]);
        $this->assertEquals(88, $studentRow[3]);
        $this->assertEquals('On Track', $studentRow[4]);
        $this->assertEquals('', $studentRow[5]);

        $onTrackSummary = $collection->first(fn ($row) => $row[4] === 'On Track' && is_numeric($row[5]));
        $this->assertEquals(1, $onTrackSummary[5]);
        $notStartedSummary = $collection->first(fn ($row) => $row[4] === 'Not Started' && is_numeric($row[5]));
        $this->assertEquals(0, $notStartedSummary[5]);
    }

    public function test_class_report_sheet_maps_support_status_to_needs_support_count(): void
    {
        $sheet = new ClassReportSheet([
            ['name' => 'A', 'status' => 'support'],
            ['name' => 'B', 'status' => 'onTrack'],
        ]);
        $collection = $sheet->collection();

        // Counts live in the summary block (rows with a numeric Count column),
        // not in the per-student roster rows.
        $summary = $collection->filter(fn ($row) => is_numeric($row[5]) && $row[5] !== '');
        $needsSupport = $summary->first(fn ($row) => $row[4] === 'Needs Support');
        $onTrack = $summary->first(fn ($row) => $row[4] === 'On Track');

        $this->assertEquals(1, $needsSupport[5]);
        $this->assertEquals(1, $onTrack[5]);
    }

    public function test_class_report_sheet_includes_charts(): void
    {
        $sheet = new ClassReportSheet([]);
        $charts = $sheet->charts();

        $this->assertCount(2, $charts);

        $pieChart = $charts[0];
        $this->assertEquals('health_pie_chart', $pieChart->getName());
        $this->assertEquals('Class Health Distribution', $pieChart->getTitle()->getCaption());

        $barChart = $charts[1];
        $this->assertEquals('accuracy_bar_chart', $barChart->getName());
        $this->assertEquals('Student Accuracy Comparison (%)', $barChart->getTitle()->getCaption());
    }
}
