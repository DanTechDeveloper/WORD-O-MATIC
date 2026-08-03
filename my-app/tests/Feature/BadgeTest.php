<?php

namespace Tests\Feature;

use App\Models\Badges;
use App\Models\StudentBadges;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BadgeTest extends TestCase
{
    use RefreshDatabase;

    private function seedBadges(): void
    {
        $badges = [
            [
                'name' => 'Profile Pioneer',
                'slug' => 'profile-pioneer',
                'description' => 'Looking sharp! Awarded for successfully personalizing your profile with an avatar.',
                'requirement' => 'Upload your first profile avatar.',
                'metric' => 'action',
                'operator' => '=',
                'threshold_score' => null,
                'icon' => 'person',
            ],
            [
                'name' => 'Tutorial Complete',
                'slug' => 'tutorial-complete',
                'description' => 'Welcome aboard! Awarded for successfully completing the introductory guide.',
                'requirement' => 'Finish the student tutorial guide.',
                'metric' => 'action',
                'operator' => '=',
                'threshold_score' => null,
                'icon' => 'rocket_launch',
            ],
            [
                'name' => 'First Steps',
                'slug' => 'first-steps',
                'description' => 'Great start! You have accumulated your first 5 total points.',
                'requirement' => 'Reach 5 total points.',
                'metric' => 'total_points',
                'operator' => '>=',
                'threshold_score' => 5,
                'icon' => 'eco',
            ],
            [
                'name' => 'Word Master',
                'slug' => 'word-master',
                'description' => 'Recognized for mastering words across modules by earning 30 total points.',
                'requirement' => 'Reach 30 total points.',
                'metric' => 'total_points',
                'operator' => '>=',
                'threshold_score' => 30,
                'icon' => 'emoji_events',
            ],
        ];

        foreach ($badges as $badge) {
            Badges::create($badge);
        }
    }

    private function hasBadge(User $user, string $slug): bool
    {
        return StudentBadges::where('user_id', $user->id)
            ->whereHas('badge', fn ($q) => $q->where('slug', $slug))
            ->exists();
    }

    public function test_student_with_avatar_gets_profile_pioneer_on_login(): void
    {
        $this->seedBadges();

        $user = User::factory()->create([
            'name' => 'Test Student',
            'pin' => '1234',
            'role' => 'student',
        ]);
        StudentProfile::factory()->for($user)->create([
            'avatar' => '/images/avatars/juan/head.png',
        ]);

        $this->post('/', [
            'name' => 'Test Student',
            'pin' => '1234',
        ]);

        $this->assertTrue($this->hasBadge($user, 'profile-pioneer'));
    }

    public function test_student_without_custom_avatar_does_not_get_badge(): void
    {
        $this->seedBadges();

        $user = User::factory()->create([
            'name' => 'No Avatar',
            'pin' => '1234',
            'role' => 'student',
        ]);
        StudentProfile::factory()->for($user)->create([
            'avatar' => null,
        ]);

        $this->post('/', [
            'name' => 'No Avatar',
            'pin' => '1234',
        ]);

        $this->assertFalse($this->hasBadge($user, 'profile-pioneer'));
    }

    public function test_profile_pioneer_badge_not_duplicated_on_relogin(): void
    {
        $this->seedBadges();

        $user = User::factory()->create([
            'name' => 'Repeat Login',
            'pin' => '1234',
            'role' => 'student',
        ]);
        StudentProfile::factory()->for($user)->create([
            'avatar' => '/images/avatars/kyle/head.png',
        ]);

        $this->post('/', ['name' => 'Repeat Login', 'pin' => '1234']);
        $this->post('/', ['name' => 'Repeat Login', 'pin' => '1234']);

        $this->assertSame(1, StudentBadges::where('user_id', $user->id)->count());
    }

    public function test_student_gets_tutorial_complete_on_login(): void
    {
        $this->seedBadges();

        $user = User::factory()->create([
            'name' => 'Tutorial Done',
            'pin' => '1234',
            'role' => 'student',
        ]);
        StudentProfile::factory()->for($user)->create([
            'avatar' => '/images/avatars/ana/head.png',
            'tutorial_completed_at' => now(),
        ]);

        $this->post('/', [
            'name' => 'Tutorial Done',
            'pin' => '1234',
        ]);

        $this->assertTrue($this->hasBadge($user, 'tutorial-complete'));
    }

    public function test_student_gets_first_steps_on_login(): void
    {
        $this->seedBadges();

        $user = User::factory()->create([
            'name' => 'Point Earner',
            'pin' => '1234',
            'role' => 'student',
        ]);
        StudentProfile::factory()->for($user)->create([
            'avatar' => '/images/avatars/leo/head.png',
            'points' => 10,
        ]);

        $this->post('/', [
            'name' => 'Point Earner',
            'pin' => '1234',
        ]);

        $this->assertTrue($this->hasBadge($user, 'first-steps'));
    }

    public function test_student_gets_word_master_on_login(): void
    {
        $this->seedBadges();

        $user = User::factory()->create([
            'name' => 'Word Master',
            'pin' => '1234',
            'role' => 'student',
        ]);
        StudentProfile::factory()->for($user)->create([
            'avatar' => '/images/avatars/zoe/head.png',
            'points' => 35,
            'wordBlastAcc' => 85,
            'storyQuestAcc' => 0,
        ]);

        $this->post('/', [
            'name' => 'Word Master',
            'pin' => '1234',
        ]);

        $this->assertTrue($this->hasBadge($user, 'word-master'));
        $this->assertTrue($this->hasBadge($user, 'first-steps'));
    }

    public function test_student_gets_clear_speaker_on_login(): void
    {
        $this->seedBadges();

        Badges::create([
            'name' => 'Clear Speaker',
            'slug' => 'clear-speaker',
            'description' => 'Earned by achieving 80% accuracy in a single game.',
            'requirement' => 'Get 80% accuracy or higher.',
            'metric' => 'accuracy',
            'operator' => '>=',
            'threshold_score' => 80,
            'icon' => 'mic',
        ]);

        $user = User::factory()->create([
            'name' => 'High Accuracy',
            'pin' => '1234',
            'role' => 'student',
        ]);
        StudentProfile::factory()->for($user)->create([
            'avatar' => '/images/avatars/sam/head.png',
            'points' => 0,
            'wordBlastAcc' => 82,
            'storyQuestAcc' => 70,
        ]);

        $this->post('/', [
            'name' => 'High Accuracy',
            'pin' => '1234',
        ]);

        $this->assertTrue($this->hasBadge($user, 'clear-speaker'));
    }

    public function test_update_avatar_awards_profile_pioneer(): void
    {
        $this->seedBadges();

        $user = User::factory()->create([
            'name' => 'Avatar Changer',
            'pin' => '1234',
            'role' => 'student',
        ]);
        StudentProfile::factory()->for($user)->create([
            'avatar' => '/images/boy.svg',
        ]);

        $this->actingAs($user)
            ->post(route('student.updateAvatar'), [
                'avatar_url' => '/images/avatars/sam/head.png',
            ]);

        $this->assertTrue($this->hasBadge($user, 'profile-pioneer'));
    }
}
