<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\StudentProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    // ─── TEACHER LOGIN ──────────────────────────────────────────────

    public function test_teacher_login_successful(): void
    {
        // Arrange: gumawa ng teacher account
        User::factory()->create([
            'username' => 'admin',
            'password' => 'password',
            'role' => 'teacher',
        ]);

        // Act: i-submit ang login form
        $response = $this->post('/teacher/login', [
            'username' => 'admin',
            'password' => 'password',
        ]);

        // Assert: na-redirect sa dashboard at naka-login
        $response->assertRedirect(route('teacher.dashboard'));
        $this->assertAuthenticated();
    }

    public function test_teacher_login_fails_with_wrong_password(): void
    {
        User::factory()->create([
            'username' => 'admin',
            'password' => 'password',
            'role' => 'teacher',
        ]);

        $response = $this->post('/teacher/login', [
            'username' => 'admin',
            'password' => 'wrongpass',
        ]);

        // Dapat hindi na-authenticate at may error
        $response->assertSessionHasErrors('username');
        $this->assertGuest();
    }

    // ─── STUDENT LOGIN ──────────────────────────────────────────────

    public function test_student_can_login_with_name_and_pin(): void
    {
        // Arrange: student + profile na may avatar
        $user = User::factory()->create([
            'name' => 'Test Student',
            'pin' => '1234',
            'role' => 'student',
        ]);
        StudentProfile::factory()->for($user)->create([
            'avatar' => '/images/avatars/juan/head.png',
        ]);

        // Act: mag-login
        $response = $this->post('/', [
            'name' => 'Test Student',
            'pin' => '1234',
        ]);

        // May avatar → diretso dashboard
        $response->assertRedirect(route('student.dashboard'));
        $this->assertAuthenticated();
    }

    public function test_student_redirected_to_onboarding_when_no_avatar(): void
    {
        $user = User::factory()->create([
            'name' => 'Newbie',
            'pin' => '1234',
            'role' => 'student',
        ]);
        StudentProfile::factory()->for($user)->create([
            'avatar' => null,
        ]);

        $response = $this->post('/', [
            'name' => 'Newbie',
            'pin' => '1234',
        ]);

        // Walang avatar → onboarding muna
        $response->assertRedirect(route('student.splashScreen'));
    }

    // ─── ROLE-BASED ACCESS ──────────────────────────────────────────

    public function test_student_cannot_access_teacher_page(): void
    {
        $user = User::factory()->create([
            'role' => 'student',
        ]);
        StudentProfile::factory()->for($user)->create([
            'avatar' => '/images/avatars/juan/head.png',
        ]);

        // Login as student
        $this->actingAs($user);

        // Subukan pumasok sa teacher reports
        $response = $this->get(route('teacher.reports'));

        // Dapat ma-block
        $response->assertStatus(403);
    }

    public function test_teacher_cannot_access_student_page(): void
    {
        $teacher = User::factory()->create([
            'role' => 'teacher',
        ]);

        $this->actingAs($teacher);

        $response = $this->get(route('student.dashboard'));

        $response->assertStatus(403);
    }

    public function test_guest_is_redirected_to_login(): void
    {
        // Hindi naka-login, diretso sa student login page
        $response = $this->get('/student/dashboard');

        $response->assertRedirect('/');
    }
}
