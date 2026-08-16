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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentDashboardBadgesTest extends TestCase
{
    use RefreshDatabase;

    private function makeStudent(string $name): User
    {
        $user = User::factory()->create(['name' => $name, 'role' => 'student']);
        StudentProfile::factory()->for($user)->create([
            // Custom avatar so the onboarding middleware lets the student through.
            'avatar' => '/images/avatars/juan/head.png',
        ]);

        return $user;
    }

    private function makeWordModule(int $level, int $words, bool $tutorial = false): WordModule
    {
        $module = WordModule::create([
            'level' => $level,
            'title' => $tutorial ? 'Tutorial' : "Level {$level}",
            'is_tutorial' => $tutorial,
        ]);
        foreach (range(1, $words) as $i) {
            Word::create(['word_module_id' => $module->id, 'word' => "w{$level}-{$i}", 'position' => $i]);
        }

        return $module;
    }

    private function makeParagraphModule(int $level, int $words, bool $tutorial = false): ParagraphModule
    {
        $module = ParagraphModule::create([
            'level' => $level,
            'title' => $tutorial ? 'Tutorial' : "P{$level}",
            'content' => implode(' ', range(1, $words)),
            'is_tutorial' => $tutorial,
        ]);
        foreach (range(1, $words) as $i) {
            ParagraphWord::create(['paragraph_module_id' => $module->id, 'word' => "p{$level}-{$i}", 'position' => $i]);
        }

        return $module;
    }

    public function test_dashboard_excludes_tutorial_words_from_points(): void
    {
        $student = $this->makeStudent('Tutorial Excl');

        $tutWord = $this->makeWordModule(0, 2, true);
        $wordL1 = $this->makeWordModule(1, 8);
        $tutPara = $this->makeParagraphModule(0, 3, true);
        $paraL1 = $this->makeParagraphModule(1, 5);

        StudentWordProgress::create(['user_id' => $student->id, 'word_module_id' => $tutWord->id, 'words_smashed' => 2, 'status' => 'completed']);
        StudentWordProgress::create(['user_id' => $student->id, 'word_module_id' => $wordL1->id, 'words_smashed' => 5, 'status' => 'in_progress']);
        StudentParagraphProgress::create(['user_id' => $student->id, 'paragraph_module_id' => $tutPara->id, 'words_smashed' => 3, 'status' => 'completed']);
        StudentParagraphProgress::create(['user_id' => $student->id, 'paragraph_module_id' => $paraL1->id, 'words_smashed' => 4, 'status' => 'in_progress']);

        $this->actingAs($student)
            ->get(route('student.dashboard'))
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->component('Student/Dashboard')
                ->where('totalReadPoints', 8)
                ->where('earnedReadPoints', 5)
                ->where('totalSpeakPoints', 5)
                ->where('earnedSpeakPoints', 4));
    }

    public function test_dashboard_tutorial_flags(): void
    {
        $student = $this->makeStudent('Flagged');

        $this->actingAs($student)
            ->get(route('student.dashboard'))
            ->assertInertia(fn ($page) => $page
                ->where('wordTutorialDone', false)
                ->where('speakTutorialDone', false)
                ->where('tutorialComplete', false));

        $tutWord = $this->makeWordModule(0, 1, true);
        $tutPara = $this->makeParagraphModule(0, 1, true);
        StudentWordProgress::create(['user_id' => $student->id, 'word_module_id' => $tutWord->id, 'words_smashed' => 1, 'status' => 'completed']);
        StudentParagraphProgress::create(['user_id' => $student->id, 'paragraph_module_id' => $tutPara->id, 'words_smashed' => 1, 'status' => 'completed']);

        $this->actingAs($student)
            ->get(route('student.dashboard'))
            ->assertInertia(fn ($page) => $page
                ->where('wordTutorialDone', true)
                ->where('speakTutorialDone', true));

        $student->student->update(['tutorial_completed_at' => now()]);

        $this->actingAs($student)
            ->get(route('student.dashboard'))
            ->assertInertia(fn ($page) => $page->where('tutorialComplete', true));
    }

    public function test_badges_page_current_values_match_award_sources(): void
    {
        $student = $this->makeStudent('Deadline Excl');
        $student->student->update(['points' => 10, 'wordBlastAcc' => 85, 'storyQuestAcc' => 0]);

        Badges::create(['name' => 'On Fire', 'slug' => 'on-fire', 'description' => 'd', 'requirement' => 'r', 'metric' => 'streak', 'operator' => '>=', 'threshold_score' => 3, 'icon' => 'x']);
        Badges::create(['name' => 'Clear Speaker', 'slug' => 'clear-speaker', 'description' => 'd', 'requirement' => 'r', 'metric' => 'accuracy', 'operator' => '>=', 'threshold_score' => 80, 'icon' => 'x']);
        Badges::create(['name' => 'First Steps', 'slug' => 'first-steps', 'description' => 'd', 'requirement' => 'r', 'metric' => 'total_points', 'operator' => '>=', 'threshold_score' => 5, 'icon' => 'x']);

        $module = $this->makeWordModule(1, 10);
        GameSession::create(['user_id' => $student->id, 'module_id' => $module->id, 'module_type' => 'word', 'score' => 5, 'accuracy' => 90, 'streak' => 5, 'is_deadline_hit' => false]);
        GameSession::create(['user_id' => $student->id, 'module_id' => $module->id, 'module_type' => 'word', 'score' => 10, 'accuracy' => 100, 'streak' => 12, 'is_deadline_hit' => true]);

        $this->actingAs($student)
            ->get(route('student.badges'))
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->component('Student/Badges')
                ->where('badges', fn ($badges) => collect($badges)
                    // Streak comes from sessions and the deadline-hit 12 is excluded.
                    ->firstWhere('metric', 'streak')['current_value'] == 5
                    // Accuracy mirrors the profile source used by BadgeService::checkAllEligibleBadges.
                    && collect($badges)->firstWhere('metric', 'accuracy')['current_value'] == 85
                    && collect($badges)->firstWhere('slug', 'first-steps')['current_value'] == 10));
    }

    public function test_badges_page_is_earned_reflects_pivot(): void
    {
        $student = $this->makeStudent('Earned Check');

        $firstSteps = Badges::create(['name' => 'First Steps', 'slug' => 'first-steps', 'description' => 'd', 'requirement' => 'r', 'metric' => 'total_points', 'operator' => '>=', 'threshold_score' => 5, 'icon' => 'x']);
        $wordMaster = Badges::create(['name' => 'Word Master', 'slug' => 'word-master', 'description' => 'd', 'requirement' => 'r', 'metric' => 'total_points', 'operator' => '>=', 'threshold_score' => 30, 'icon' => 'x']);

        $student->student->update(['points' => 10]);
        StudentBadges::create(['user_id' => $student->id, 'badge_id' => $firstSteps->id, 'earned_at' => now(), 'status' => 'earned']);

        $this->actingAs($student)
            ->get(route('student.badges'))
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->where('badges', fn ($badges) => collect($badges)
                    ->firstWhere('slug', 'first-steps')['is_earned'] === true
                    && collect($badges)->firstWhere('slug', 'word-master')['is_earned'] === false));
    }

    public function test_student_leaderboards_ordered_by_points_desc_with_total(): void
    {
        $a = $this->makeStudent('Low Points');
        $b = $this->makeStudent('Mid Points');
        $c = $this->makeStudent('High Points');
        $a->student->update(['points' => 10]);
        $b->student->update(['points' => 20]);
        $c->student->update(['points' => 30]);

        $this->actingAs($b)
            ->get(route('student.leaderboards'))
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->component('Student/Leaderboards')
                ->where('totalStudents', 3)
                ->where('leaderboard.0.points', 30)
                ->where('leaderboard.0.user_id', $c->id)
                ->where('leaderboard.1.points', 20)
                ->where('leaderboard.2.points', 10));
    }
}
