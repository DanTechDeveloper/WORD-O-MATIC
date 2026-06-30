<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\StudentProfile;
use App\Models\Setting;
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
}
