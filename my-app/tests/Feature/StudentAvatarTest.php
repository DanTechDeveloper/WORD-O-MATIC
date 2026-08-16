<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentAvatarTest extends TestCase
{
    use RefreshDatabase;

    public function test_avatar_url_is_required(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $student->student()->create(['avatar' => '/images/boy.svg']);

        $this->actingAs($student)
            ->post(route('student.updateAvatar'), [])
            ->assertSessionHasErrors('avatar_url');
    }

    public function test_avatar_update_without_student_profile_redirects_with_error(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        $this->from(route('student.avatarSelection'))
            ->actingAs($student)
            ->post(route('student.updateAvatar'), [
                'avatar_url' => '/images/avatars/sam/head.png',
            ])
            ->assertRedirect(route('student.avatarSelection'))
            ->assertSessionHas('error', 'Student profile not found.');
    }
}
