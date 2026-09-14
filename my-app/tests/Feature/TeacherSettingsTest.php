<?php

namespace Tests\Feature;

use App\Mail\StudentReportMail;
use App\Models\Setting;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class TeacherSettingsTest extends TestCase
{
    use RefreshDatabase;

    private User $teacher;

    protected function setUp(): void
    {
        parent::setUp();
        $this->teacher = User::factory()->create([
            'role' => 'teacher',
            'email' => 'teacher@wordomatic.edu',
            'name' => 'Admin Teacher',
            'username' => 'admin',
            'password' => bcrypt('password'),
        ]);
    }

    // ── SENDER IDENTITY ──────────────────────────────────

    public function test_teacher_can_update_sender_identity(): void
    {
        $this->actingAs($this->teacher);

        $response = $this->put(route('teacher.settings.sender'), [
            'email' => 'New@Example.COM',
            'name' => '  New Name  ',
        ]);

        $response->assertRedirect()->assertSessionHas('success', 'Sender identity updated.');
        $this->teacher->refresh();
        $this->assertSame('new@example.com', $this->teacher->email);
        $this->assertSame('New Name', $this->teacher->name);
    }

    public function test_sender_rejects_invalid_email(): void
    {
        $this->actingAs($this->teacher);
        $response = $this->put(route('teacher.settings.sender'), [
            'email' => 'not-an-email',
            'name' => 'Admin',
        ]);
        $response->assertSessionHasErrors('email');
        $this->assertSame('teacher@wordomatic.edu', $this->teacher->refresh()->email);
    }

    public function test_sender_rejects_empty_name(): void
    {
        $this->actingAs($this->teacher);
        $response = $this->put(route('teacher.settings.sender'), [
            'email' => 'a@b.com',
            'name' => '',
        ]);
        $response->assertSessionHasErrors('name');
    }

    public function test_sender_rejects_email_over_255(): void
    {
        $this->actingAs($this->teacher);
        $response = $this->put(route('teacher.settings.sender'), [
            'email' => str_repeat('a', 250) . '@b.com',
            'name' => 'Admin',
        ]);
        $response->assertSessionHasErrors('email');
    }

    // ── PASSWORD ─────────────────────────────────────────

    public function test_teacher_can_update_password(): void
    {
        $this->actingAs($this->teacher);
        $response = $this->put(route('teacher.settings.password'), [
            'current_password' => 'password',
            'password' => 'newpass123',
            'password_confirmation' => 'newpass123',
        ]);
        $response->assertRedirect()->assertSessionHas('success', 'Password updated.');
        $this->assertTrue(Hash::check('newpass123', $this->teacher->refresh()->password));
    }

    public function test_password_rejects_wrong_current(): void
    {
        $this->actingAs($this->teacher);
        $response = $this->put(route('teacher.settings.password'), [
            'current_password' => 'wrong',
            'password' => 'newpass123',
            'password_confirmation' => 'newpass123',
        ]);
        $response->assertSessionHasErrors('current_password');
        $this->assertTrue(Hash::check('password', $this->teacher->refresh()->password));
    }

    public function test_password_rejects_short_and_mismatch(): void
    {
        $this->actingAs($this->teacher);
        // too short
        $this->put(route('teacher.settings.password'), [
            'current_password' => 'password',
            'password' => 'short',
            'password_confirmation' => 'short',
        ])->assertSessionHasErrors('password');

        // mismatch
        $this->put(route('teacher.settings.password'), [
            'current_password' => 'password',
            'password' => 'newpass123',
            'password_confirmation' => 'different',
        ])->assertSessionHasErrors('password');
    }

    // ── INERTIA SHARE ────────────────────────────────────

    public function test_handle_inertia_shares_has_email(): void
    {
        $this->actingAs($this->teacher)->get(route('teacher.reports'))
            ->assertInertia(fn ($p) => $p->where('teacher.has_email', true)->where('teacher.email', 'teacher@wordomatic.edu'));

        // student gets null teacher share
        $student = User::factory()->create(['role' => 'student']);
        $student->student()->create(['avatar' => '/images/avatars/ana/head.png', 'tutorial_completed_at' => now()]);
        $this->actingAs($student)->get(route('student.dashboard'))->assertInertia(fn ($p) => $p->where('teacher', null));
    }

    // ── REPORT GATING (hybrid) ───────────────────────────

    public function test_send_blocked_when_teacher_email_missing_past_deadline(): void
    {
        $noEmailTeacher = User::factory()->create(['role' => 'teacher', 'email' => null, 'password' => bcrypt('password')]);
        $student = User::factory()->create(['role' => 'student']);
        StudentProfile::factory()->for($student)->create(['parent_email' => 'p@test.com', 'tutorial_completed_at' => now()]);
        Setting::setValue('report_deadline', now()->subMinute()->format('Y-m-d H:i:s'));

        Mail::fake();
        $this->actingAs($noEmailTeacher)->post(route('teacher.reports.sendEmails'), ['student_ids' => [$student->id]])
            ->assertRedirect()->assertSessionHas('error', 'Set your sender email in Settings before sending reports.');
        Mail::assertNothingQueued();
    }

    public function test_send_allowed_when_future_even_without_email(): void
    {
        $noEmailTeacher = User::factory()->create(['role' => 'teacher', 'email' => null, 'password' => bcrypt('password')]);
        $student = User::factory()->create(['role' => 'student']);
        StudentProfile::factory()->for($student)->create(['parent_email' => 'p@test.com', 'tutorial_completed_at' => now()]);
        Setting::setValue('report_deadline', now()->addDays(7)->format('Y-m-d H:i:s'));
        // should hit future error, not sender error
        $this->actingAs($noEmailTeacher)->post(route('teacher.reports.sendEmails'), ['student_ids' => [$student->id]])
            ->assertSessionHas('error', 'Report deadline has not yet been reached.');
    }

    // ── MAIL REPLYTO ─────────────────────────────────────

    public function test_mail_uses_teacher_reply_to(): void
    {
        Mail::fake();
        $student = User::factory()->create(['role' => 'student']);
        StudentProfile::factory()->for($student)->create(['parent_email' => 'parent@test.com', 'tutorial_completed_at' => now()]);
        Setting::setValue('report_deadline', now()->subMinute()->format('Y-m-d H:i:s'));

        $this->actingAs($this->teacher)->post(route('teacher.reports.sendEmails'), ['student_ids' => [$student->id]])->assertRedirect();

        Mail::assertQueued(StudentReportMail::class, function (StudentReportMail $mail) {
            return $mail->data['teacher_email'] === 'teacher@wordomatic.edu'
                && $mail->data['teacher_name'] === 'Admin Teacher'
                && $mail->envelope()->replyTo[0]->address === 'teacher@wordomatic.edu';
        });
    }

    public function test_mail_fallback_to_config_when_teacher_email_missing_but_deadline_not_past(): void
    {
        // Direct envelope fallback (unit) — when teacher_email is config value
        $mail = new StudentReportMail([
            'name' => 'Kid', 'status' => 'onTrack',
            'teacher_email' => config('mail.from.address'), 'teacher_name' => config('mail.from.name'),
        ]);
        $this->assertSame(config('mail.from.address'), $mail->envelope()->replyTo[0]->address);
    }

    // ── SENDER TRIMS / DIRTY EDGES ─────────────────────────

    public function test_sender_trims_spaces_and_lowercases(): void
    {
        $this->actingAs($this->teacher);
        $this->put(route('teacher.settings.sender'), [
            'email' => '  NEW@EXAMPLE.COM  ',
            'name' => '  New  ',
        ])->assertRedirect();
        $this->teacher->refresh();
        $this->assertSame('new@example.com', $this->teacher->email);
        $this->assertSame('New', $this->teacher->name);
    }

    public function test_sender_same_case_insensitive_still_succeeds_backend(): void
    {
        $this->actingAs($this->teacher);
        // Frontend dirty disables, but backend is idempotent — same lowercased email should still succeed
        $this->put(route('teacher.settings.sender'), [
            'email' => 'TEACHER@WORDOMATIC.EDU',
            'name' => 'Admin Teacher',
        ])->assertRedirect()->assertSessionHas('success');
    }

    public function test_sender_allows_email_same_name_change(): void
    {
        $this->actingAs($this->teacher);
        $this->put(route('teacher.settings.sender'), [
            'email' => 'teacher@wordomatic.edu',
            'name' => 'Changed Name',
        ])->assertRedirect()->assertSessionHas('success');
        $this->assertSame('Changed Name', $this->teacher->refresh()->name);
    }

    public function test_password_exactly_eight_passes(): void
    {
        $this->actingAs($this->teacher);
        $this->put(route('teacher.settings.password'), [
            'current_password' => 'password',
            'password' => '12345678',
            'password_confirmation' => '12345678',
        ])->assertRedirect()->assertSessionHas('success');
        $this->assertTrue(Hash::check('12345678', $this->teacher->refresh()->password));
    }

    public function test_password_requires_confirmation(): void
    {
        $this->actingAs($this->teacher);
        $this->put(route('teacher.settings.password'), [
            'current_password' => 'password',
            'password' => 'newpass123',
            'password_confirmation' => null,
        ])->assertSessionHasErrors('password');
    }

    public function test_student_and_guest_cannot_update_sender(): void
    {
        $student = User::factory()->create(['role' => 'student', 'password' => bcrypt('password')]);
        $student->student()->create(['avatar' => '/images/avatars/ana/head.png', 'tutorial_completed_at' => now()]);
        $this->actingAs($student)->put(route('teacher.settings.sender'), ['email' => 'a@b.com', 'name' => 'X'])
            ->assertForbidden();
        $response = $this->put(route('teacher.settings.sender'), ['email' => 'a@b.com', 'name' => 'X']);
        $this->assertTrue(in_array($response->status(), [302, 303, 401, 403], true));
    }

    public function test_old_password_fails_after_update(): void
    {
        $this->actingAs($this->teacher);
        $this->put(route('teacher.settings.password'), [
            'current_password' => 'password',
            'password' => 'newpass123',
            'password_confirmation' => 'newpass123',
        ])->assertRedirect();
        $this->assertTrue(Hash::check('newpass123', $this->teacher->refresh()->password));
        $this->assertFalse(Hash::check('password', $this->teacher->refresh()->password));
        // login with old fails, new succeeds (via controller check)
        $this->assertFalse(Hash::check('password', $this->teacher->password));
    }
}
