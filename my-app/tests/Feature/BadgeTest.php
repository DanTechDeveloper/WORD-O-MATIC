<?php

namespace Tests\Feature;

use App\Models\Badges;
use App\Models\GameSession;
use App\Models\ParagraphModule;
use App\Models\ParagraphWord;
use App\Models\StudentBadges;
use App\Models\StudentParagraphProgress;
use App\Models\StudentProfile;
use App\Models\StudentWordProgress;
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

    private function seedCompletionBadges(): void
    {
        foreach ([
            ['name' => 'Word Blast Finisher', 'slug' => 'word-blast-finisher', 'description' => 'All word modules done.', 'requirement' => 'Complete 100% of word modules.', 'metric' => 'word_completion', 'operator' => '>=', 'threshold_score' => 100, 'icon' => 'sports_esports'],
            ['name' => 'Story Quest Finisher', 'slug' => 'story-finisher', 'description' => 'All paragraph modules done.', 'requirement' => 'Complete 100% of paragraph modules.', 'metric' => 'paragraph_completion', 'operator' => '>=', 'threshold_score' => 100, 'icon' => 'auto_stories'],
        ] as $badge) {
            Badges::create($badge);
        }
    }

    public function test_award_onboarding_badge_returns_badge_shape(): void
    {
        $this->seedBadges();
        [$user] = $this->makeStudent('Onboarding Shape');

        $awarded = (new BadgeService)->awardOnboardingBadge($user, 'profile-pioneer');

        $this->assertSame('Profile Pioneer', $awarded['name']);
        $this->assertSame('profile-pioneer', $awarded['slug']);
        $this->assertSame('person', $awarded['icon']);
        $this->assertNotEmpty($awarded['description']);
        $this->assertTrue($this->hasBadge($user, 'profile-pioneer'));
        $this->assertNotNull(StudentBadges::where('user_id', $user->id)->first()->earned_at);
    }

    public function test_award_onboarding_badge_unknown_slug_returns_null(): void
    {
        [$user] = $this->makeStudent('Onboarding Unknown');

        $this->assertNull((new BadgeService)->awardOnboardingBadge($user, 'does-not-exist'));
    }

    public function test_award_onboarding_badge_already_earned_returns_null(): void
    {
        $this->seedBadges();
        [$user] = $this->makeStudent('Onboarding Repeat');

        $service = new BadgeService;
        $service->awardOnboardingBadge($user, 'profile-pioneer');

        $this->assertNull($service->awardOnboardingBadge($user, 'profile-pioneer'));
        $this->assertSame(1, StudentBadges::where('user_id', $user->id)->count());
    }

    public function test_check_all_eligible_no_student_profile_returns_empty(): void
    {
        $this->seedBadges();
        $user = User::factory()->create(['name' => 'No Profile', 'role' => 'student']);

        $this->assertSame([], (new BadgeService)->checkAllEligibleBadges($user));
    }

    public function test_check_all_eligible_awards_action_badges(): void
    {
        $this->seedBadges();
        [$user] = $this->makeStudent('Action Badges');
        $user->student->update(['tutorial_completed_at' => now()]);

        $awarded = (new BadgeService)->checkAllEligibleBadges($user);
        $slugs = collect($awarded)->pluck('slug')->sort()->values()->all();

        $this->assertSame(['profile-pioneer', 'tutorial-complete'], $slugs);
    }

    public function test_check_all_eligible_default_avatar_does_not_award_profile_pioneer(): void
    {
        $this->seedBadges();
        $user = User::factory()->create(['name' => 'Default Avatar', 'role' => 'student']);
        StudentProfile::factory()->for($user)->create([
            'avatar' => '/images/boy.svg',
            'tutorial_completed_at' => now(),
        ]);

        $awarded = (new BadgeService)->checkAllEligibleBadges($user);
        $slugs = collect($awarded)->pluck('slug')->all();

        $this->assertNotContains('profile-pioneer', $slugs);
        $this->assertContains('tutorial-complete', $slugs);
        $this->assertFalse($this->hasBadge($user, 'profile-pioneer'));
    }

    public function test_check_all_eligible_awards_points_badges(): void
    {
        $this->seedBadges();
        [$user] = $this->makeStudent('Point Badges');
        $user->student->update(['points' => 35]);

        $awarded = (new BadgeService)->checkAllEligibleBadges($user);
        $slugs = collect($awarded)->pluck('slug')->sort()->values()->all();

        $this->assertSame(['first-steps', 'profile-pioneer', 'word-master'], $slugs);
    }

    public function test_check_all_eligible_accuracy_uses_max_of_both_accuracies(): void
    {
        $this->seedBadges();
        $this->seedGameplayBadges();
        [$user] = $this->makeStudent('Max Accuracy');
        $user->student->update(['wordBlastAcc' => 70, 'storyQuestAcc' => 90]);

        (new BadgeService)->checkAllEligibleBadges($user);

        $this->assertTrue($this->hasBadge($user, 'clear-speaker'));
    }

    public function test_check_all_eligible_streak_ignores_deadline_hit_sessions(): void
    {
        $this->seedBadges();
        $this->seedGameplayBadges();
        $module = $this->makeWordModule(1, 10);
        [$user] = $this->makeStudent('Streak Excl');

        GameSession::create([
            'user_id' => $user->id, 'module_id' => $module->id, 'module_type' => 'word',
            'score' => 8, 'accuracy' => 80, 'streak' => 8, 'is_deadline_hit' => false,
        ]);
        GameSession::create([
            'user_id' => $user->id, 'module_id' => $module->id, 'module_type' => 'word',
            'score' => 12, 'accuracy' => 100, 'streak' => 12, 'is_deadline_hit' => true,
        ]);

        (new BadgeService)->checkAllEligibleBadges($user);

        $this->assertTrue($this->hasBadge($user, 'on-fire'));
        $this->assertTrue($this->hasBadge($user, 'blazing-streak'));
        $this->assertFalse($this->hasBadge($user, 'unstoppable'));
    }

    public function test_check_all_eligible_word_finisher_requires_full_completion(): void
    {
        $this->seedBadges();
        $this->seedCompletionBadges();
        [$user] = $this->makeStudent('Word Finisher');

        $module1 = $this->makeWordModule(1, 5);
        $module2 = $this->makeWordModule(2, 5);

        StudentWordProgress::create([
            'user_id' => $user->id, 'word_module_id' => $module1->id, 'words_smashed' => 5, 'status' => 'completed',
        ]);
        StudentWordProgress::create([
            'user_id' => $user->id, 'word_module_id' => $module2->id, 'words_smashed' => 3, 'status' => 'in_progress',
        ]);

        (new BadgeService)->checkAllEligibleBadges($user);
        $this->assertFalse($this->hasBadge($user, 'word-blast-finisher'));

        StudentWordProgress::where('user_id', $user->id)->where('word_module_id', $module2->id)
            ->update(['words_smashed' => 5, 'status' => 'completed']);

        (new BadgeService)->checkAllEligibleBadges($user);
        $this->assertTrue($this->hasBadge($user, 'word-blast-finisher'));
    }

    public function test_check_all_eligible_paragraph_finisher(): void
    {
        $this->seedBadges();
        $this->seedCompletionBadges();
        [$user] = $this->makeStudent('Para Finisher');

        $module = ParagraphModule::create(['level' => 1, 'title' => 'Level 1', 'content' => 'a b c d e']);
        foreach (['a', 'b', 'c', 'd', 'e'] as $i => $w) {
            ParagraphWord::create(['paragraph_module_id' => $module->id, 'word' => $w, 'position' => $i + 1]);
        }
        StudentParagraphProgress::create([
            'user_id' => $user->id, 'paragraph_module_id' => $module->id, 'words_smashed' => 5, 'status' => 'completed',
        ]);

        (new BadgeService)->checkAllEligibleBadges($user);

        $this->assertTrue($this->hasBadge($user, 'story-finisher'));
    }

    public function test_check_all_eligible_tutorial_does_not_count_toward_completion(): void
    {
        $this->seedBadges();
        $this->seedCompletionBadges();
        [$user] = $this->makeStudent('Tutorial Excl');

        $tutorial = WordModule::create(['level' => 0, 'title' => 'Tutorial', 'is_tutorial' => true]);
        foreach (range(1, 5) as $i) {
            Word::create(['word_module_id' => $tutorial->id, 'word' => "t{$i}", 'position' => $i]);
        }
        $module = $this->makeWordModule(1, 10);

        StudentWordProgress::create([
            'user_id' => $user->id, 'word_module_id' => $tutorial->id, 'words_smashed' => 10, 'status' => 'completed',
        ]);

        $service = new BadgeService;
        $this->assertSame(0.0, $service->calculateModuleCompletion($user, 'word'));

        $service->checkAllEligibleBadges($user);
        $this->assertFalse($this->hasBadge($user, 'word-blast-finisher'));

        StudentWordProgress::create([
            'user_id' => $user->id, 'word_module_id' => $module->id, 'words_smashed' => 10, 'status' => 'completed',
        ]);

        $service->checkAllEligibleBadges($user);
        $this->assertTrue($this->hasBadge($user, 'word-blast-finisher'));
    }

    public function test_check_all_eligible_no_duplicates_on_second_call(): void
    {
        $this->seedBadges();
        [$user] = $this->makeStudent('No Dup');
        $user->student->update(['points' => 35]);

        (new BadgeService)->checkAllEligibleBadges($user);
        $second = (new BadgeService)->checkAllEligibleBadges($user);

        $this->assertSame([], $second);
        $this->assertSame(3, StudentBadges::where('user_id', $user->id)->count());
    }

    // ponytail: pins CAVEATS F1 — an empty non-tutorial curriculum evaluates to
    // 100% completion, so a fresh install awards the finisher badges immediately.
    public function test_check_all_eligible_empty_curriculum_awards_finishers(): void
    {
        $this->seedBadges();
        $this->seedCompletionBadges();
        [$user] = $this->makeStudent('Empty Curriculum');

        (new BadgeService)->checkAllEligibleBadges($user);

        $this->assertTrue($this->hasBadge($user, 'word-blast-finisher'));
        $this->assertTrue($this->hasBadge($user, 'story-finisher'));
    }

    public function test_meets_threshold_operator_variants(): void
    {
        Badges::create(['name' => 'GT Five', 'slug' => 'gt-five', 'description' => 'd', 'metric' => 'total_points', 'operator' => '>', 'threshold_score' => 5, 'icon' => 'x']);
        Badges::create(['name' => 'EQ Ten', 'slug' => 'eq-ten', 'description' => 'd', 'metric' => 'total_points', 'operator' => '=', 'threshold_score' => 10, 'icon' => 'x']);
        Badges::create(['name' => 'LTE Ten', 'slug' => 'lte-ten', 'description' => 'd', 'metric' => 'total_points', 'operator' => '<=', 'threshold_score' => 10, 'icon' => 'x']);
        Badges::create(['name' => 'Weird Op', 'slug' => 'weird-op', 'description' => 'd', 'metric' => 'total_points', 'operator' => '??', 'threshold_score' => 1, 'icon' => 'x']);

        foreach ([
            ['points' => 5, 'expected' => ['lte-ten']],
            ['points' => 6, 'expected' => ['gt-five', 'lte-ten']],
            ['points' => 10, 'expected' => ['eq-ten', 'gt-five', 'lte-ten']],
            ['points' => 11, 'expected' => ['gt-five']],
        ] as $case) {
            [$user] = $this->makeStudent('Operator ' . $case['points']);
            $user->student->update(['points' => $case['points']]);

            (new BadgeService)->checkAllEligibleBadges($user);

            $slugs = StudentBadges::where('user_id', $user->id)->with('badge')->get()
                ->map(fn ($sb) => $sb->badge->slug)->sort()->values()->all();

            $this->assertSame($case['expected'], $slugs);
        }
    }

    public function test_check_gameplay_no_student_returns_empty(): void
    {
        $this->seedBadges();
        $this->seedGameplayBadges();
        $user = User::factory()->create(['name' => 'No Profile Game', 'role' => 'student']);

        $this->assertSame([], (new BadgeService)->checkGameplayBadges($user, 1, 100.0));
    }

    public function test_check_gameplay_all_earned_returns_empty(): void
    {
        $this->seedBadges();
        $this->seedGameplayBadges();
        $module = $this->makeWordModule(1, 10);
        [$user] = $this->makeStudent('All Earned');
        $user->student->update(['points' => 100]);

        $session = GameSession::create([
            'user_id' => $user->id, 'module_id' => $module->id, 'module_type' => 'word',
            'score' => 10, 'accuracy' => 100, 'streak' => 10, 'is_deadline_hit' => false,
        ]);

        $service = new BadgeService;
        $service->checkGameplayBadges($user, $session->id, 100.0);
        $second = $service->checkGameplayBadges($user, $session->id, 100.0);

        $this->assertSame([], $second);
    }

    public function test_check_gameplay_accuracy_uses_passed_accuracy(): void
    {
        $this->seedBadges();
        $this->seedGameplayBadges();
        $module = $this->makeWordModule(1, 10);
        [$user] = $this->makeStudent('Accuracy Param');

        $session = GameSession::create([
            'user_id' => $user->id, 'module_id' => $module->id, 'module_type' => 'word',
            'score' => 9, 'accuracy' => 95, 'streak' => 0, 'is_deadline_hit' => false,
        ]);

        (new BadgeService)->checkGameplayBadges($user, $session->id, 95.0);

        $this->assertTrue($this->hasBadge($user, 'clear-speaker'));
        $this->assertFalse($this->hasBadge($user, 'perfect-round'));
    }

    public function test_check_gameplay_streak_uses_db_best_not_session_streak(): void
    {
        $this->seedBadges();
        $this->seedGameplayBadges();
        $module = $this->makeWordModule(1, 10);
        [$user] = $this->makeStudent('DB Best Streak');

        GameSession::create([
            'user_id' => $user->id, 'module_id' => $module->id, 'module_type' => 'word',
            'score' => 5, 'accuracy' => 50, 'streak' => 5, 'is_deadline_hit' => false,
        ]);
        $session = GameSession::create([
            'user_id' => $user->id, 'module_id' => $module->id, 'module_type' => 'word',
            'score' => 2, 'accuracy' => 20, 'streak' => 2, 'is_deadline_hit' => false,
        ]);

        (new BadgeService)->checkGameplayBadges($user, $session->id, 20.0);

        $this->assertTrue($this->hasBadge($user, 'on-fire'));
        $this->assertTrue($this->hasBadge($user, 'blazing-streak'));
        $this->assertFalse($this->hasBadge($user, 'unstoppable'));
    }

    public function test_check_gameplay_deadline_hit_streak_ignored(): void
    {
        $this->seedBadges();
        $this->seedGameplayBadges();
        $module = $this->makeWordModule(1, 10);
        [$user] = $this->makeStudent('Deadline Streak');

        $session = GameSession::create([
            'user_id' => $user->id, 'module_id' => $module->id, 'module_type' => 'word',
            'score' => 10, 'accuracy' => 100, 'streak' => 10, 'is_deadline_hit' => true,
        ]);

        (new BadgeService)->checkGameplayBadges($user, $session->id, 100.0);

        $this->assertFalse($this->hasBadge($user, 'on-fire'));
        $this->assertFalse($this->hasBadge($user, 'unstoppable'));
    }

    public function test_check_gameplay_pivot_metadata(): void
    {
        $this->seedBadges();
        $this->seedGameplayBadges();
        $module = $this->makeWordModule(1, 10);
        [$user] = $this->makeStudent('Pivot Meta');
        $user->student->update(['points' => 35]);

        $session = GameSession::create([
            'user_id' => $user->id, 'module_id' => $module->id, 'module_type' => 'word',
            'score' => 10, 'accuracy' => 100, 'streak' => 10, 'is_deadline_hit' => false,
        ]);

        (new BadgeService)->checkGameplayBadges($user, $session->id, 100.0);

        $pivot = StudentBadges::where('user_id', $user->id)
            ->whereHas('badge', fn ($q) => $q->where('slug', 'word-master'))
            ->first();

        $this->assertNotNull($pivot);
        $this->assertSame('earned', $pivot->status);
        $this->assertEquals(35, (float) $pivot->progress);
        $this->assertSame($session->id, $pivot->unlocked_session_id);
    }

    public function test_get_badge_progress_fields_and_current_values(): void
    {
        $this->seedBadges();
        $this->seedGameplayBadges();
        $module = $this->makeWordModule(1, 10);
        [$user] = $this->makeStudent('Progress Fields');
        $user->student->update(['points' => 10]);

        $session = GameSession::create([
            'user_id' => $user->id, 'module_id' => $module->id, 'module_type' => 'word',
            'score' => 4, 'accuracy' => 90, 'streak' => 4, 'is_deadline_hit' => false,
        ]);

        $progress = (new BadgeService)->getBadgeProgress($user, $session);

        $this->assertNotEmpty($progress);
        foreach ($progress as $entry) {
            $this->assertArrayHasKey('name', $entry);
            $this->assertArrayHasKey('description', $entry);
            $this->assertArrayHasKey('slug', $entry);
            $this->assertArrayHasKey('icon', $entry);
            $this->assertArrayHasKey('metric', $entry);
            $this->assertArrayHasKey('threshold', $entry);
            $this->assertArrayHasKey('current_value', $entry);
            $this->assertArrayHasKey('is_earned', $entry);
        }

        $firstSteps = collect($progress)->firstWhere('slug', 'first-steps');
        $this->assertEquals(10, $firstSteps['current_value']);

        $accuracyEntry = collect($progress)->firstWhere('metric', 'accuracy');
        $this->assertEquals(90.0, $accuracyEntry['current_value']);

        $streakEntry = collect($progress)->firstWhere('metric', 'streak');
        $this->assertEquals(4, $streakEntry['current_value']);
    }

    public function test_get_badge_progress_is_earned_flag(): void
    {
        $this->seedBadges();
        $module = $this->makeWordModule(1, 10);
        [$user] = $this->makeStudent('Earned Flag');
        $user->student->update(['points' => 10]);

        (new BadgeService)->checkAllEligibleBadges($user);

        $session = GameSession::create([
            'user_id' => $user->id, 'module_id' => $module->id, 'module_type' => 'word',
            'score' => 1, 'accuracy' => 10, 'streak' => 1, 'is_deadline_hit' => false,
        ]);

        $progress = (new BadgeService)->getBadgeProgress($user, $session);

        $this->assertTrue(collect($progress)->firstWhere('slug', 'first-steps')['is_earned']);
        $this->assertFalse(collect($progress)->firstWhere('slug', 'word-master')['is_earned']);
    }

    public function test_get_badge_progress_accuracy_rounded_and_no_student_points_zero(): void
    {
        $this->seedBadges();
        $this->seedGameplayBadges();
        $module = $this->makeWordModule(1, 10);
        [$user] = $this->makeStudent('Acc From Session');

        $session = GameSession::create([
            'user_id' => $user->id, 'module_id' => $module->id, 'module_type' => 'word',
            'score' => 9, 'accuracy' => 87.345, 'streak' => 3, 'is_deadline_hit' => false,
        ]);

        $progress = (new BadgeService)->getBadgeProgress($user, $session);
        $accuracyEntry = collect($progress)->firstWhere('metric', 'accuracy');
        $this->assertEquals(87.35, $accuracyEntry['current_value']);

        $noProfile = User::factory()->create(['name' => 'No Profile Progress', 'role' => 'student']);
        $progress2 = (new BadgeService)->getBadgeProgress($noProfile, $session);
        $this->assertSame(0, collect($progress2)->firstWhere('metric', 'total_points')['current_value']);
    }

    public function test_calculate_completion_word_and_paragraph_percent(): void
    {
        [$user] = $this->makeStudent('Completion Percent');

        $module1 = $this->makeWordModule(1, 5);
        $module2 = $this->makeWordModule(2, 5);
        StudentWordProgress::create([
            'user_id' => $user->id, 'word_module_id' => $module1->id, 'words_smashed' => 5, 'status' => 'completed',
        ]);

        $service = new BadgeService;
        $this->assertEquals(50.0, $service->calculateModuleCompletion($user, 'word'));

        StudentWordProgress::create([
            'user_id' => $user->id, 'word_module_id' => $module2->id, 'words_smashed' => 5, 'status' => 'completed',
        ]);
        $this->assertEquals(100.0, $service->calculateModuleCompletion($user, 'word'));

        $paragraph = ParagraphModule::create(['level' => 1, 'title' => 'P1', 'content' => 'a b c d e']);
        foreach (['a', 'b', 'c', 'd', 'e'] as $i => $w) {
            ParagraphWord::create(['paragraph_module_id' => $paragraph->id, 'word' => $w, 'position' => $i + 1]);
        }
        StudentParagraphProgress::create([
            'user_id' => $user->id, 'paragraph_module_id' => $paragraph->id, 'words_smashed' => 5, 'status' => 'completed',
        ]);
        $this->assertEquals(100.0, $service->calculateModuleCompletion($user, 'paragraph'));
    }

    public function test_calculate_completion_rounding(): void
    {
        [$user] = $this->makeStudent('Rounding');
        $module = $this->makeWordModule(1, 15);
        StudentWordProgress::create([
            'user_id' => $user->id, 'word_module_id' => $module->id, 'words_smashed' => 7, 'status' => 'in_progress',
        ]);

        $this->assertEquals(46.67, (new BadgeService)->calculateModuleCompletion($user, 'word'));
    }

    // ponytail: pins CAVEATS F1 — zero non-tutorial modules evaluates to 100%.
    public function test_calculate_completion_empty_curriculum_returns_100(): void
    {
        [$user] = $this->makeStudent('Empty Curriculum');

        $this->assertEquals(100.0, (new BadgeService)->calculateModuleCompletion($user, 'word'));
        $this->assertEquals(100.0, (new BadgeService)->calculateModuleCompletion($user, 'paragraph'));
    }
}
