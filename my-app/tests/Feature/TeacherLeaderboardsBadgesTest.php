<?php

namespace Tests\Feature;

use App\Models\Badges;
use App\Models\ParagraphModule;
use App\Models\StudentBadges;
use App\Models\StudentProfile;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherLeaderboardsBadgesTest extends TestCase
{
    use RefreshDatabase;

    private User $teacher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->teacher = User::factory()->create(['role' => 'teacher']);
    }

    private function makeStudent(string $name, array $profile = []): User
    {
        $user = User::factory()->create(['name' => $name, 'role' => 'student']);
        StudentProfile::factory()->for($user)->create(array_merge([
            // Avoid the auto profile-pioneer award: no custom avatar.
            'avatar' => null,
            'points' => 0,
            'wordBlastAcc' => 0,
            'storyQuestAcc' => 0,
        ], $profile));

        return $user;
    }

    private function seedBadges(): void
    {
        foreach ([
            ['name' => 'Profile Pioneer', 'slug' => 'profile-pioneer', 'description' => 'd', 'requirement' => 'r', 'metric' => 'action', 'operator' => '=', 'threshold_score' => null, 'icon' => 'person'],
            ['name' => 'Tutorial Complete', 'slug' => 'tutorial-complete', 'description' => 'd', 'requirement' => 'r', 'metric' => 'action', 'operator' => '=', 'threshold_score' => null, 'icon' => 'rocket_launch'],
            ['name' => 'First Steps', 'slug' => 'first-steps', 'description' => 'd', 'requirement' => 'r', 'metric' => 'total_points', 'operator' => '>=', 'threshold_score' => 5, 'icon' => 'eco'],
            ['name' => 'Word Master', 'slug' => 'word-master', 'description' => 'd', 'requirement' => 'r', 'metric' => 'total_points', 'operator' => '>=', 'threshold_score' => 30, 'icon' => 'emoji_events'],
        ] as $badge) {
            Badges::create($badge);
        }
    }

    private function earn(User $user, string $slug, string $earnedAt): void
    {
        StudentBadges::create([
            'user_id' => $user->id,
            'badge_id' => Badges::where('slug', $slug)->value('id'),
            'earned_at' => $earnedAt,
            'status' => 'earned',
        ]);
    }

    public function test_leaderboards_rank_each_metric_descending(): void
    {
        $this->makeStudent('Alice', ['points' => 50, 'wordBlastAcc' => 70, 'storyQuestAcc' => 30]);
        $this->makeStudent('Bob', ['points' => 30, 'wordBlastAcc' => 90, 'storyQuestAcc' => 60]);
        $this->makeStudent('Cara', ['points' => 40, 'wordBlastAcc' => 80, 'storyQuestAcc' => 95]);

        $this->actingAs($this->teacher)
            ->get(route('teacher.leaderboards'))
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->component('Teacher/Leaderboards')
                ->where('leaderboard.points.0.name', 'Alice')
                ->where('leaderboard.points.1.name', 'Cara')
                ->where('leaderboard.points.2.name', 'Bob')
                ->where('leaderboard.wordBlast.0.name', 'Bob')
                ->where('leaderboard.storyQuest.0.name', 'Cara'));
    }

    public function test_leaderboards_flags_closed_deadline(): void
    {
        $this->makeStudent('Solo');

        $this->actingAs($this->teacher)
            ->get(route('teacher.leaderboards'))
            ->assertInertia(fn ($page) => $page->where('isDeadlineClosed', false));

        Setting::setValue('report_deadline', now()->subMinute()->format('Y-m-d H:i:s'));

        $this->actingAs($this->teacher)
            ->get(route('teacher.leaderboards'))
            ->assertInertia(fn ($page) => $page->where('isDeadlineClosed', true));
    }

    public function test_badges_page_top_earners_ordered_by_badge_count_with_latest_date(): void
    {
        $this->seedBadges();
        $ava = $this->makeStudent('Ava');
        $bob = $this->makeStudent('Bob');

        $this->earn($ava, 'first-steps', '2026-01-01 00:00:00');
        $this->earn($ava, 'word-master', '2026-02-01 00:00:00');
        $this->earn($bob, 'first-steps', '2026-01-15 00:00:00');

        $this->actingAs($this->teacher)
            ->get(route('teacher.badges'))
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->component('Teacher/Badges')
                ->where('topEarners.0.name', 'Ava')
                ->where('topEarners.0.badge_count', 2)
                ->where('topEarners.0.last_earned_at', '2026-02-01 00:00:00')
                ->where('topEarners.1.name', 'Bob')
                ->where('topEarners.1.badge_count', 1));
    }

    public function test_badges_page_totals_are_accurate(): void
    {
        $this->seedBadges();
        $ava = $this->makeStudent('Ava');
        $bob = $this->makeStudent('Bob');

        $this->earn($ava, 'first-steps', '2026-01-01 00:00:00');
        $this->earn($ava, 'word-master', '2026-02-01 00:00:00');
        $this->earn($bob, 'first-steps', '2026-01-15 00:00:00');

        $this->actingAs($this->teacher)
            ->get(route('teacher.badges'))
            ->assertInertia(fn ($page) => $page
                ->where('totalStudents', 2)
                ->where('totalBadges', 4)
                ->where('totalEarned', 3));
    }

    public function test_badges_page_most_earned_badge_requires_at_least_two_earners(): void
    {
        $this->seedBadges();
        $ava = $this->makeStudent('Ava');
        $bob = $this->makeStudent('Bob');

        // Only one student holds first-steps -> no badge qualifies as "most earned".
        $this->earn($ava, 'first-steps', '2026-01-01 00:00:00');
        $this->earn($ava, 'word-master', '2026-02-01 00:00:00');

        $this->actingAs($this->teacher)
            ->get(route('teacher.badges'))
            ->assertInertia(fn ($page) => $page->where('mostEarnedBadge', null));

        // Second earner pushes first-steps to the top.
        $this->earn($bob, 'first-steps', '2026-01-15 00:00:00');

        $this->actingAs($this->teacher)
            ->get(route('teacher.badges'))
            ->assertInertia(fn ($page) => $page
                ->where('mostEarnedBadge.slug', 'first-steps'));
    }

    public function test_paragraph_modules_page_lists_modules(): void
    {
        ParagraphModule::create(['level' => 1, 'title' => 'The Farm', 'content' => 'The cat sleeps.']);
        ParagraphModule::create(['level' => 2, 'title' => 'The Sea', 'content' => 'The fish swims.']);

        $this->actingAs($this->teacher)
            ->get(route('teacher.paragraphModules'))
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->component('Teacher/Paragraph')
                ->has('modules', 2)
                ->where('modules.0.title', 'The Farm'));
    }
}
