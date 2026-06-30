<?php

namespace Tests\Feature;

use App\Models\StudentProfile;
use App\Models\User;
use App\Services\DashboardService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardServiceTest extends TestCase
{
    use RefreshDatabase;

    private DashboardService $dashboardService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->dashboardService = app(DashboardService::class);
    }

    public function test_returns_zero_when_no_students(): void
    {
        $stats = $this->dashboardService->stats();

        $this->assertEquals(0, $stats['totalStudents']);
        $this->assertEquals(0, $stats['totalClassPoints']);
        $this->assertEmpty($stats['topStudents']);
        $this->assertEmpty($stats['sectionPerformance']);
    }

    public function test_calculates_averages_correctly(): void
    {
        $student1 = User::factory()->create(['role' => 'student']);
        StudentProfile::factory()->for($student1)->create([
            'wordBlastAcc' => 80, 'storyQuestAcc' => 90, 'points' => 100,
        ]);

        $student2 = User::factory()->create(['role' => 'student']);
        StudentProfile::factory()->for($student2)->create([
            'wordBlastAcc' => 60, 'storyQuestAcc' => 70, 'points' => 50,
        ]);

        $stats = $this->dashboardService->stats();

        $this->assertEquals(70, $stats['avgReadAccuracy']);
        $this->assertEquals(80, $stats['avgSpeakAccuracy']);
        $this->assertEquals(150, $stats['totalClassPoints']);
        $this->assertEquals(2, $stats['totalStudents']);
    }

    public function test_groups_section_performance(): void
    {
        $student1 = User::factory()->create(['role' => 'student']);
        StudentProfile::factory()->for($student1)->create([
            'section' => 'Sector A', 'wordBlastAcc' => 90, 'storyQuestAcc' => 90, 'points' => 50,
        ]);

        $student2 = User::factory()->create(['role' => 'student']);
        StudentProfile::factory()->for($student2)->create([
            'section' => 'Sector A', 'wordBlastAcc' => 70, 'storyQuestAcc' => 70, 'points' => 30,
        ]);

        $student3 = User::factory()->create(['role' => 'student']);
        StudentProfile::factory()->for($student3)->create([
            'section' => 'Sector B', 'wordBlastAcc' => 50, 'storyQuestAcc' => 0, 'points' => 10,
        ]);

        $stats = $this->dashboardService->stats();

        $this->assertCount(2, $stats['sectionPerformance']);

        $sectorA = $stats['sectionPerformance']->firstWhere('section', 'Sector A');
        $this->assertEquals(80, $sectorA['avg_read']);
        $this->assertEquals(80, $sectorA['avg_speak']);
        $this->assertEquals(80, $sectorA['total_points']);
        $this->assertEquals(2, $sectorA['student_count']);
        $this->assertEquals('On Track', $sectorA['status']);

        $sectorB = $stats['sectionPerformance']->firstWhere('section', 'Sector B');
        $this->assertEquals('In Progress', $sectorB['status']);
    }

    public function test_classifies_student_statuses_correctly(): void
    {
        // notStarted
        $ns = User::factory()->create(['role' => 'student']);
        StudentProfile::factory()->for($ns)->create(['wordBlastAcc' => 0, 'storyQuestAcc' => 0]);

        // in_progress
        $ip = User::factory()->create(['role' => 'student']);
        StudentProfile::factory()->for($ip)->create(['wordBlastAcc' => 70, 'storyQuestAcc' => 0]);

        // atRisk
        $ar = User::factory()->create(['role' => 'student']);
        StudentProfile::factory()->for($ar)->create(['wordBlastAcc' => 40, 'storyQuestAcc' => 30]);

        // needsSupport
        $ns2 = User::factory()->create(['role' => 'student']);
        StudentProfile::factory()->for($ns2)->create(['wordBlastAcc' => 65, 'storyQuestAcc' => 60]);

        // onTrack
        $ot = User::factory()->create(['role' => 'student']);
        StudentProfile::factory()->for($ot)->create(['wordBlastAcc' => 85, 'storyQuestAcc' => 90]);

        $stats = $this->dashboardService->stats();

        $this->assertEquals(1, $stats['chartCounts']['notStarted']);
        $this->assertEquals(1, $stats['chartCounts']['in_progress']);
        $this->assertEquals(1, $stats['chartCounts']['atRisk']);
        $this->assertEquals(1, $stats['chartCounts']['needsSupport']);
        $this->assertEquals(1, $stats['chartCounts']['onTrack']);
    }

    public function test_top_students_sorted_by_points_descending(): void
    {
        $low = User::factory()->create(['role' => 'student']);
        StudentProfile::factory()->for($low)->create(['points' => 10]);

        $high = User::factory()->create(['role' => 'student']);
        StudentProfile::factory()->for($high)->create(['points' => 100]);

        $stats = $this->dashboardService->stats();

        $this->assertEquals(100, $stats['topStudents'][0]->points);
        $this->assertEquals(10, $stats['topStudents'][1]->points);
    }

    public function test_top_students_limited_to_50(): void
    {
        for ($i = 0; $i < 55; $i++) {
            $u = User::factory()->create(['role' => 'student']);
            StudentProfile::factory()->for($u)->create(['points' => $i]);
        }

        $stats = $this->dashboardService->stats();

        $this->assertCount(50, $stats['topStudents']);
    }

    public function test_teacher_can_view_dashboard(): void
    {
        $teacher = User::factory()->create(['role' => 'teacher']);

        $response = $this->actingAs($teacher)->get(route('teacher.dashboard'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Teacher/Dashboard')
            ->has('avgReadAccuracy')
            ->has('avgSpeakAccuracy')
            ->has('sectionPerformance')
            ->has('chartCounts')
        );
    }
}
