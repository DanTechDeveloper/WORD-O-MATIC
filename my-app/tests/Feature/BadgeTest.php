<?php

namespace Tests\Feature;

use App\Models\Badges;
use App\Models\GameSession;
use App\Models\StudentBadges;
use App\Models\StudentProfile;
use App\Models\User;
use App\Models\Word;
use App\Models\WordModule;
use App\Services\BadgeService;
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

    private function seedGameplayBadges(): void
    {
        $extra = [
            ['name' => 'On Fire', 'slug' => 'on-fire', 'description' => 'Got 3 correct in a row.', 'requirement' => 'Get a 3-game streak.', 'metric' => 'streak', 'operator' => '>=', 'threshold_score' => 3, 'icon' => 'local_fire_department'],
            ['name' => 'Blazing Streak', 'slug' => 'blazing-streak', 'description' => 'Got 5 correct in a row.', 'requirement' => 'Get a 5-game streak.', 'metric' => 'streak', 'operator' => '>=', 'threshold_score' => 5, 'icon' => 'whatshot'],
            ['name' => 'Unstoppable', 'slug' => 'unstoppable', 'description' => 'Got 10 correct in a row.', 'requirement' => 'Get a 10-game streak.', 'metric' => 'streak', 'operator' => '>=', 'threshold_score' => 10, 'icon' => 'bolt'],
            ['name' => 'Clear Speaker', 'slug' => 'clear-speaker', 'description' => 'Achieved 80% accuracy.', 'requirement' => 'Get 80% accuracy or higher.', 'metric' => 'accuracy', 'operator' => '>=', 'threshold_score' => 80, 'icon' => 'mic'],
            ['name' => 'Perfect Round', 'slug' => 'perfect-round', 'description' => 'Flawless 100% accuracy.', 'requirement' => 'Get 100% accuracy.', 'metric' => 'accuracy', 'operator' => '>=', 'threshold_score' => 100, 'icon' => 'workspace_premium'],
        ];

        foreach ($extra as $badge) {
            Badges::create($badge);
        }
    }

    private function makeWordModule(int $level = 1, int $words = 10): WordModule
    {
        $module = WordModule::create(['level' => $level, 'title' => "Level {$level}"]);
        foreach (range(1, $words) as $i) {
            Word::create(['word_module_id' => $module->id, 'word' => "w{$i}", 'position' => $i]);
        }

        return $module;
    }

    private function makeStudent(string $name): array
    {
        $user = User::factory()->create(['name' => $name, 'pin' => '1234', 'role' => 'student']);
        StudentProfile::factory()->for($user)->create([
            'avatar' => '/images/avatars/sam/head.png',
            'points' => 0,
            'wordBlastAcc' => 0,
            'storyQuestAcc' => 0,
        ]);

        return [$user, $user->student];
    }

    // ponytail: pins current level-1 first-play burst (see docs/CAVEATS.md H4).
    // Expect this to turn red when min_level tiering ships.
    public function test_perfect_first_level_awards_expected_badge_set(): void
    {
        $this->seedBadges();
        $this->seedGameplayBadges();

        $module = $this->makeWordModule(1, 10);
        [$user] = $this->makeStudent('Perfect First Level');

        $student = $user->student;
        $student->update(['points' => 10, 'wordBlastAcc' => 100, 'read_level' => 2, 'status' => 'onTrack']);

        $session = GameSession::create([
            'user_id' => $user->id,
            'module_id' => $module->id,
            'module_type' => 'word',
            'score' => 10,
            'accuracy' => 100,
            'streak' => 10,
        ]);

        $badgeService = new BadgeService;
        $awarded = $badgeService->checkGameplayBadges($user, $session->id, 100.0);

        $slugs = collect($awarded)->map(fn ($b) => $b->slug)->sort()->values()->all();

        $this->assertSame(
            ['blazing-streak', 'clear-speaker', 'first-steps', 'on-fire', 'perfect-round', 'unstoppable'],
            $this->normalize($slugs),
            'A perfect 10/10 first level should award the documented 6-badge burst.'
        );
    }

    public function test_partial_streak_only_awards_lower_tier_badges(): void
    {
        $this->seedBadges();
        $this->seedGameplayBadges();

        $module = $this->makeWordModule(1, 10);
        [$user] = $this->makeStudent('Partial Streak');

        $student = $user->student;
        $student->update(['points' => 5, 'wordBlastAcc' => 90, 'read_level' => 1, 'status' => 'in_progress']);

        $session = GameSession::create([
            'user_id' => $user->id,
            'module_id' => $module->id,
            'module_type' => 'word',
            'score' => 10,
            'accuracy' => 90,
            'streak' => 5,
        ]);

        $badgeService = new BadgeService;
        $awarded = $badgeService->checkGameplayBadges($user, $session->id, 90.0);

        $this->assertCount(4, $awarded);
        $this->assertTrue($this->hasBadge($user, 'on-fire'));
        $this->assertTrue($this->hasBadge($user, 'blazing-streak'));
        $this->assertTrue($this->hasBadge($user, 'clear-speaker'));
        $this->assertTrue($this->hasBadge($user, 'first-steps'));
        $this->assertFalse($this->hasBadge($user, 'unstoppable'));
        $this->assertFalse($this->hasBadge($user, 'perfect-round'));
    }

    private function normalize(array $slugs): array
    {
        $sorted = $slugs;
        sort($sorted);

        return array_values($sorted);
    }
}
