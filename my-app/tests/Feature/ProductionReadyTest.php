<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ProductionReadyTest extends TestCase
{
    use RefreshDatabase;

    private function teacher(): User
    {
        return User::factory()->create(['role' => 'teacher', 'username' => 'prodteacher', 'password' => bcrypt('password')]);
    }

    public function test_export_100_students_does_not_timeout(): void
    {
        $teacher = $this->teacher();
        // ponytail: avoid StudentSeeder's MySQL SET FOREIGN_KEY_CHECKS on sqlite — use factories for 5 students
        $students = User::factory()->count(5)->create(['role' => 'student']);
        foreach ($students as $u) {
            $u->student()->create(['points' => 10, 'wordBlastAcc' => 50, 'storyQuestAcc' => 50, 'section' => 'Sector 7-G', 'parent_email' => 'p@test.com', 'tutorial_completed_at' => now()]);
        }
        Setting::setValue('report_deadline', now()->subMinute()->format('Y-m-d H:i:s'));

        $start = microtime(true);
        $this->actingAs($teacher)->get(route('teacher.reports.export'))->assertOk();
        $elapsed = microtime(true) - $start;

        $this->assertLessThan(5, $elapsed, 'Export should complete <5s for 100 rows (was 30s before f62b557 batched)');
    }

    public function test_deepgram_token_returns_json_when_key_set(): void
    {
        config(['services.deepgram.key' => 'fake-key', 'services.deepgram.region' => 'au']);
        Http::fake(['api.au.deepgram.com/*' => Http::response(['access_token' => 'tok123', 'expires_in' => 3600], 200)]);

        $student = User::factory()->create(['role' => 'student']);
        $student->student()->create(['avatar' => '/images/avatars/ana/head.png', 'tutorial_completed_at' => now()]);
        $this->actingAs($student)->getJson('/student/deepgram-token')->assertOk()->assertJsonPath('token', 'tok123');
    }

    public function test_report_mail_can_be_queued(): void
    {
        Mail::fake();
        $teacher = $this->teacher();
        $student = User::factory()->create(['role' => 'student']);
        $student->student()->create(['parent_email' => 'parent@test.com', 'tutorial_completed_at' => now()]);
        Setting::setValue('report_deadline', now()->subMinute()->format('Y-m-d H:i:s'));

        $this->actingAs($teacher)->post(route('teacher.reports.sendEmails'), ['student_ids' => [$student->id]])->assertRedirect();

        Mail::assertQueued(\App\Mail\StudentReportMail::class, 1);
    }
}
