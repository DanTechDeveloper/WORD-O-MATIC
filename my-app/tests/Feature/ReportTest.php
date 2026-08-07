<?php

namespace Tests\Feature;

use App\Exports\ClassReportSheet;
use App\Exports\ReportsExport;
use App\Exports\SkillsOverviewSheet;
use App\Exports\SkillsWordsSheet;
use App\Models\Setting;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
        $this->assertArrayHasKey('Mastered & Training Words', $sheets);
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
            'trainingWords' => [],
            'paragraphTrainingWords' => [],
            'masteredWords' => [],
            'paragraphMasteredWords' => [],
        ];

        $sheet = new SkillsOverviewSheet([$student]);

        $this->assertEquals([
            'Student Name',
            'Student ID',
            'Section',
            'Final Status',
            'Word Blast',
            'Story Quest',
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
    }

    public function test_skills_words_sheet_has_correct_headings(): void
    {
        $student = [
            'id' => 1,
            'name' => 'Test Student',
            'section' => 'Section B',
            'status' => 'atRisk',
            'wordBlastAcc' => 40,
            'storyQuestAcc' => 60,
            'read_level' => 1,
            'speak_level' => 1,
            'parent_email' => 'test2@test.com',
            'report_sent_at' => null,
            'trainingWords' => ['Level 3: Around Town' => ['bird', 'zoo']],
            'paragraphTrainingWords' => ['Level 1: Stories' => ['word3', 'word4', 'word5']],
            'masteredWords' => ['Level 1: Farm Animals' => ['cat', 'dog']],
            'paragraphMasteredWords' => ['Level 2: Seasons' => ['rainy', 'sunny']],
        ];

        $sheet = new SkillsWordsSheet([$student]);

        $this->assertEquals([
            'Student Name',
            'Word Blast Mastered',
            'Word Blast Training',
            'Story Quest Mastered',
            'Story Quest Training',
        ], $sheet->headings());

        $collection = $sheet->collection();
        $row = $collection->first();

        $this->assertNotNull($row);
        $this->assertCount(2, $collection);
        $this->assertEquals('Test Student', $row[0]);
        $this->assertEquals("Level 1 - cat, dog", $row[1]);
        $this->assertEquals("Level 3 - bird, zoo", $row[2]);
        $this->assertEquals("Level 2 - rainy, sunny", $row[3]);
        $this->assertEquals("Level 1 - word3, word4, word5", $row[4]);
        $this->assertEquals(['', '', '', '', ''], $collection[1]);
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

        $this->assertCount(5, $collection);

        $studentRow = $collection[0];
        $this->assertEquals('Test Student', $studentRow[0]);
        $this->assertEquals(85, $studentRow[1]);
        $this->assertEquals(90, $studentRow[2]);

        $statusRow = $collection[4];
        $this->assertEquals('', $statusRow[0]);
        $this->assertEquals('Not Started', $statusRow[3]);
        $this->assertEquals(0, $statusRow[4]);
    }

    public function test_class_report_sheet_maps_support_status_to_needs_support_count(): void
    {
        $sheet = new ClassReportSheet([
            ['name' => 'A', 'status' => 'support'],
            ['name' => 'B', 'status' => 'onTrack'],
        ]);
        $collection = $sheet->collection();

        $needsSupport = $collection->first(fn ($row) => $row[3] === 'Needs Support');
        $onTrack = $collection->first(fn ($row) => $row[3] === 'On Track');

        $this->assertEquals(1, $needsSupport[4]);
        $this->assertEquals(1, $onTrack[4]);
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
