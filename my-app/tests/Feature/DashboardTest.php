<?php

namespace Tests\Feature;

use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    private User $teacher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->teacher = User::factory()->create([
            'role' => 'teacher',
        ]);
    }

    private function makeStudent(string $name, array $profile): StudentProfile
    {
        $user = User::factory()->create([
            'name' => $name,
            'role' => 'student',
        ]);

        return StudentProfile::factory()->for($user)->create($profile);
    }

    public function test_dashboard_passes_students_with_computed_status(): void
    {
        $this->actingAs($this->teacher);

        $this->makeStudent('On Track Sam', ['wordBlastAcc' => 85, 'storyQuestAcc' => 90, 'section' => 'Sector 7-G']);
        $this->makeStudent('Needs Support Ned', ['wordBlastAcc' => 70, 'storyQuestAcc' => 65]);
        $this->makeStudent('At Risk Ana', ['wordBlastAcc' => 40, 'storyQuestAcc' => 50]);
        $this->makeStudent('In Progress Ian', ['wordBlastAcc' => 80, 'storyQuestAcc' => 0]);
        $this->makeStudent('Not Started Ned', ['wordBlastAcc' => 0, 'storyQuestAcc' => 0]);

        $response = $this->get(route('teacher.dashboard'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Teacher/Dashboard')
            ->has('students', 5)
            ->where('students.0.name', 'On Track Sam')
            ->where('students.0.status', 'onTrack')
            ->where('students.0.wordBlastAcc', 85)
            ->where('students.0.storyQuestAcc', 90)
            ->where('students.1.status', 'needsSupport')
            ->where('students.2.status', 'atRisk')
            ->where('students.3.status', 'in_progress')
            ->where('students.4.status', 'notStarted')
        );
    }

    public function test_dashboard_chart_counts_match_student_statuses(): void
    {
        $this->actingAs($this->teacher);

        $this->makeStudent('ns', ['wordBlastAcc' => 0, 'storyQuestAcc' => 0]);
        $this->makeStudent('ns2', ['wordBlastAcc' => 0, 'storyQuestAcc' => 0]);
        $this->makeStudent('ip', ['wordBlastAcc' => 80, 'storyQuestAcc' => 0]);
        $this->makeStudent('ar', ['wordBlastAcc' => 30, 'storyQuestAcc' => 40]);
        $this->makeStudent('sup', ['wordBlastAcc' => 70, 'storyQuestAcc' => 60]);
        $this->makeStudent('ot', ['wordBlastAcc' => 90, 'storyQuestAcc' => 85]);
        $this->makeStudent('ot2', ['wordBlastAcc' => 95, 'storyQuestAcc' => 90]);

        $response = $this->get(route('teacher.dashboard'));

        $response->assertInertia(fn ($page) => $page
            ->where('chartCounts', [
                'notStarted' => 2,
                'in_progress' => 1,
                'atRisk' => 1,
                'needsSupport' => 1,
                'onTrack' => 2,
            ])
        );
    }

    public function test_dashboard_passes_three_top_student_rankings(): void
    {
        $this->actingAs($this->teacher);

        $this->makeStudent('Leader Lex', [
            'wordBlastAcc' => 95,
            'storyQuestAcc' => 90,
            'points' => 500,
            'section' => 'Sector Alpha',
        ]);

        $response = $this->get(route('teacher.dashboard'));

        $response->assertInertia(fn ($page) => $page
            ->has('topStudents.points')
            ->has('topStudents.wordBlast')
            ->has('topStudents.storyQuest')
        );
    }

    public function test_dashboard_top_students_are_capped_at_ten_and_ranked_per_metric(): void
    {
        $this->actingAs($this->teacher);

        // 12 students, each dominant in one metric so per-metric ranking is deterministic:
        // Student 01 has the most points, Student 12 the highest accuracies.
        foreach (range(1, 12) as $i) {
            $this->makeStudent(sprintf('Student %02d', $i), [
                'wordBlastAcc' => $i * 10,
                'storyQuestAcc' => $i * 10 + 5,
                'points' => 130 - $i * 10,
                'section' => 'Sector 7-G',
            ]);
        }

        $response = $this->get(route('teacher.dashboard'));

        $response->assertInertia(fn ($page) => $page
            // Cap at 10: descending points are 120..30 (Student 01..10); Students 11 and 12 are cut.
            ->has('topStudents.points', 10)
            ->where('topStudents.points.0.name', 'Student 01')
            ->where('topStudents.points.9.name', 'Student 10')
            ->has('topStudents.wordBlast', 10)
            ->where('topStudents.wordBlast.0.name', 'Student 12')
            ->where('topStudents.wordBlast.9.name', 'Student 03')
            ->has('topStudents.storyQuest', 10)
            ->where('topStudents.storyQuest.0.name', 'Student 12')
            ->where('topStudents.storyQuest.9.name', 'Student 03')
        );
    }

    public function test_dashboard_overall_averages_and_totals_are_correct(): void
    {
        $this->actingAs($this->teacher);

        $this->makeStudent('A', ['wordBlastAcc' => 80, 'storyQuestAcc' => 70, 'points' => 10]);
        $this->makeStudent('B', ['wordBlastAcc' => 90, 'storyQuestAcc' => 80, 'points' => 20]);
        $this->makeStudent('C', ['wordBlastAcc' => 100, 'storyQuestAcc' => 90, 'points' => 30]);

        $response = $this->get(route('teacher.dashboard'));

        $response->assertInertia(fn ($page) => $page
            ->where('totalStudents', 3)
            ->where('avgReadAccuracy', 90)
            ->where('avgSpeakAccuracy', 80)
            ->where('totalClassPoints', 60)
        );
    }

    public function test_dashboard_section_performance_thresholds(): void
    {
        $this->actingAs($this->teacher);

        // Sector Alpha: both accuracies set, overall avg 85 -> On Track.
        $this->makeStudent('Alpha 1', ['wordBlastAcc' => 90, 'storyQuestAcc' => 80, 'points' => 5, 'section' => 'Sector Alpha']);
        $this->makeStudent('Alpha 2', ['wordBlastAcc' => 90, 'storyQuestAcc' => 80, 'points' => 5, 'section' => 'Sector Alpha']);
        // Sector Bravo: overall avg 65 -> Needs Support.
        $this->makeStudent('Bravo 1', ['wordBlastAcc' => 70, 'storyQuestAcc' => 60, 'points' => 7, 'section' => 'Sector Bravo']);
        // Sector Gamma: overall avg 45 -> At Risk.
        $this->makeStudent('Gamma 1', ['wordBlastAcc' => 40, 'storyQuestAcc' => 50, 'points' => 3, 'section' => 'Sector Gamma']);
        // Sector Delta: only one accuracy -> In Progress.
        $this->makeStudent('Delta 1', ['wordBlastAcc' => 70, 'storyQuestAcc' => 0, 'points' => 9, 'section' => 'Sector Delta']);
        // Sector Epsilon: all zeros -> Not Started.
        $this->makeStudent('Epsilon 1', ['wordBlastAcc' => 0, 'storyQuestAcc' => 0, 'points' => 0, 'section' => 'Sector Epsilon']);

        $response = $this->get(route('teacher.dashboard'));

        $response->assertInertia(fn ($page) => $page
            ->where('sectionPerformance', function ($sections) {
                $bySection = collect($sections)->keyBy('section');

                $alpha = $bySection['Sector Alpha'];
                if ($alpha['status'] !== 'On Track' || $alpha['student_count'] !== 2 || $alpha['avg_read'] !== 90 || $alpha['avg_speak'] !== 80 || $alpha['total_points'] !== 10) {
                    return false;
                }

                return $bySection['Sector Bravo']['status'] === 'Needs Support'
                    && $bySection['Sector Gamma']['status'] === 'At Risk'
                    && $bySection['Sector Delta']['status'] === 'In Progress'
                    && $bySection['Sector Epsilon']['status'] === 'Not Started';
            })
        );
    }
}
