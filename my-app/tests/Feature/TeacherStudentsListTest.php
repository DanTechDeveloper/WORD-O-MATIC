<?php

namespace Tests\Feature;

use App\Models\StudentProfile;
use App\Models\User;
use App\Models\Word;
use App\Models\WordModule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherStudentsListTest extends TestCase
{
    use RefreshDatabase;

    private User $teacher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->teacher = User::factory()->create(['role' => 'teacher']);
    }

    private function makeStudent(string $name, array $profile): StudentProfile
    {
        $user = User::factory()->create([
            'name' => $name,
            'role' => 'student',
        ]);

        return StudentProfile::factory()->for($user)->create($profile);
    }

    public function test_students_list_filters_by_name_search(): void
    {
        $this->makeStudent('Alpha One', ['section' => 'Sector 7-G']);
        $this->makeStudent('Beta Two', ['section' => 'Sector Alpha']);
        $this->makeStudent('Gamma Three', ['section' => 'Sector Alpha']);

        $this->actingAs($this->teacher)
            ->get('/teacher/students?search=beta')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->component('Teacher/Students')
                ->where('data.total', 1)
                ->where('data.data.0.fullName', 'Beta Two'));
    }

    public function test_students_list_filters_by_student_id_search(): void
    {
        User::factory()->create(['role' => 'student', 'name' => 'Held One', 'student_id' => 'S-1001'])->student()->create(['section' => 'Sector 7-G']);
        User::factory()->create(['role' => 'student', 'name' => 'Held Two', 'student_id' => 'S-2002'])->student()->create(['section' => 'Sector 7-G']);

        $this->actingAs($this->teacher)
            ->get('/teacher/students?search=2002')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->where('data.total', 1)
                ->where('data.data.0.studentID', 'S-2002'));
    }

    public function test_students_list_filters_by_section(): void
    {
        $this->makeStudent('Sector Seven A', ['section' => 'Sector 7-G']);
        $this->makeStudent('Sector Seven B', ['section' => 'Sector 7-G']);
        $this->makeStudent('Sector Alpha', ['section' => 'Sector Alpha']);

        $this->actingAs($this->teacher)
            ->get('/teacher/students?section=Sector+7-G')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->where('data.total', 2)
                ->where('data.data.0.section', 'Sector 7-G')
                ->where('data.data.1.section', 'Sector 7-G'));
    }

    public function test_students_list_filters_missing_parent_email(): void
    {
        $this->makeStudent('Has Email', ['parent_email' => 'parent@example.com']);
        $this->makeStudent('Null Email', ['parent_email' => null]);
        $this->makeStudent('Empty Email', ['parent_email' => '']);

        $this->actingAs($this->teacher)
            ->get('/teacher/students?status=no_email')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->where('data.total', 2));
    }

    public function test_students_list_filters_by_at_risk_status(): void
    {
        $this->makeStudent('Risk One', ['status' => 'atRisk']);
        $this->makeStudent('Risk Two', ['status' => 'atRisk']);
        $this->makeStudent('On Track', ['status' => 'onTrack']);

        $this->actingAs($this->teacher)
            ->get('/teacher/students?status=atRisk')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->where('data.total', 2)
                ->where('data.data.0.fullName', 'Risk One')
                ->where('data.data.1.fullName', 'Risk Two'));
    }

    public function test_students_list_ranks_highest_risk_average_first(): void
    {
        $this->makeStudent('Low Risk', ['wordBlastAcc' => 10, 'storyQuestAcc' => 10]);
        $this->makeStudent('High Risk', ['wordBlastAcc' => 90, 'storyQuestAcc' => 90]);

        $this->actingAs($this->teacher)
            ->get('/teacher/students?sort=risk')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->where('data.data.0.fullName', 'High Risk')
                ->where('data.data.1.fullName', 'Low Risk'));
    }

    public function test_students_list_exposes_final_average_and_sorts_by_it_desc(): void
    {
        $this->makeStudent('Avg 40', ['wordBlastAcc' => 20, 'storyQuestAcc' => 60]);
        $this->makeStudent('Avg 90', ['wordBlastAcc' => 90, 'storyQuestAcc' => 90]);
        $this->makeStudent('Half Started', ['wordBlastAcc' => 0, 'storyQuestAcc' => 100]);

        $this->actingAs($this->teacher)
            ->get('/teacher/students?sort=finalAverage')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->where('data.data.0.fullName', 'Avg 90')
                ->where('data.data.0.finalAverage', 90)
                ->where('data.data.1.fullName', 'Half Started')
                ->where('data.data.1.finalAverage', null)
                ->where('data.data.2.fullName', 'Avg 40')
                ->where('data.data.2.finalAverage', 40));
    }

    public function test_students_list_sorts_by_read_level_asc(): void
    {
        $this->makeStudent('Level Three', ['read_level' => 3]);
        $this->makeStudent('Level One', ['read_level' => 1]);

        $this->actingAs($this->teacher)
            ->get('/teacher/students?sort=level')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->where('data.data.0.fullName', 'Level One')
                ->where('data.data.0.readLevel', 1)
                ->where('data.data.1.readLevel', 3));
    }

    public function test_students_list_paginates_eight_per_page(): void
    {
        foreach (range(1, 9) as $i) {
            $this->makeStudent(sprintf('Student %02d', $i), ['section' => 'Sector 7-G']);
        }

        $this->actingAs($this->teacher)
            ->get('/teacher/students')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->where('data.per_page', 8)
                ->where('data.total', 9)
                ->where('data.last_page', 2)
                ->has('data.data', 8)
                ->where('data.data.0.fullName', 'Student 01'));
    }

    public function test_students_list_exposes_current_word_accuracy_of_current_read_level(): void
    {
        $module1 = WordModule::create(['level' => 1, 'title' => 'Level One']);
        foreach (range(1, 10) as $i) {
            Word::create(['word_module_id' => $module1->id, 'word' => "w{$i}", 'position' => $i]);
        }
        $module2 = WordModule::create(['level' => 2, 'title' => 'Level Two']);
        foreach (range(1, 10) as $i) {
            Word::create(['word_module_id' => $module2->id, 'word' => "x{$i}", 'position' => $i]);
        }

        $student = User::factory()->create(['role' => 'student', 'name' => 'Accurate Ana']);
        StudentProfile::factory()->for($student)->create(['read_level' => 1]);

        // Two plays on the current level average to 75.5; a level-2 play must not count.
        $student->student->wordProgress()->create(['word_module_id' => $module1->id, 'words_smashed' => 7, 'accuracy' => 75, 'status' => 'in_progress']);
        $student->student->wordProgress()->create(['word_module_id' => $module1->id, 'words_smashed' => 8, 'accuracy' => 76, 'status' => 'in_progress']);
        $student->student->wordProgress()->create(['word_module_id' => $module2->id, 'words_smashed' => 9, 'accuracy' => 10, 'status' => 'completed']);

        $this->actingAs($this->teacher)
            ->get('/teacher/students')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->where('data.total', 1)
                ->where('data.data.0.fullName', 'Accurate Ana')
                ->where('data.data.0.currentWordBlastAcc', 75.5));
    }

    public function test_students_list_echoes_all_filters(): void
    {
        $this->actingAs($this->teacher)
            ->get('/teacher/students?sort=risk&direction=desc&section=Sector+7-G&search=ana&status=atRisk')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->where('filters.sort', 'risk')
                ->where('filters.direction', 'desc')
                ->where('filters.section', 'Sector 7-G')
                ->where('filters.search', 'ana')
                ->where('filters.status', 'atRisk'));
    }

    public function test_students_list_excludes_teachers_even_with_a_profile(): void
    {
        $this->makeStudent('Real One', ['section' => 'Sector 7-G']);
        $this->makeStudent('Real Two', ['section' => 'Sector 7-G']);

        $anomalyTeacher = User::factory()->create(['role' => 'teacher', 'name' => 'Ghost Teacher']);
        StudentProfile::factory()->for($anomalyTeacher)->create(['section' => 'Sector 7-G']);

        $this->actingAs($this->teacher)
            ->get('/teacher/students')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->where('data.total', 2));
    }
}
