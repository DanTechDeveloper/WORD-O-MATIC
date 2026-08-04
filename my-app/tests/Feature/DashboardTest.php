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
}
