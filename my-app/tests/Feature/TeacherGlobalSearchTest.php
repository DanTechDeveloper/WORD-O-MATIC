<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherGlobalSearchTest extends TestCase
{
    use RefreshDatabase;

    private User $teacher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->teacher = User::factory()->create(['role' => 'teacher']);
    }

    private function makeStudent(string $name, string $studentId, string $section = 'Sector 7-G'): User
    {
        $user = User::factory()->create([
            'role' => 'student',
            'name' => $name,
            'student_id' => $studentId,
        ]);
        $user->student()->create(['section' => $section, 'avatar' => '/images/avatars/ana/head.png']);

        return $user;
    }

    public function test_search_finds_student_by_name_with_section(): void
    {
        $this->makeStudent('Alpha One', 'STU-9001');
        $this->makeStudent('Beta Two', 'STU-9002');

        $this->actingAs($this->teacher)
            ->get('/teacher/dashboard?searchBar=alpha')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->where('teacher.filters.searchBar', 'alpha')
                ->has('teacher.searchResults', 1)
                ->where('teacher.searchResults.0.name', 'Alpha One')
                ->where('teacher.searchResults.0.student_id', 'STU-9001')
                ->where('teacher.searchResults.0.section', 'Sector 7-G')
                ->where('teacher.searchResults.0.avatar', '/images/avatars/ana/head.png'));
    }

    public function test_search_finds_student_by_student_id(): void
    {
        $this->makeStudent('Held One', 'S-1001');
        $this->makeStudent('Held Two', 'S-2002');

        $this->actingAs($this->teacher)
            ->get('/teacher/dashboard?searchBar=2002')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->has('teacher.searchResults', 1)
                ->where('teacher.searchResults.0.student_id', 'S-2002'));
    }

    public function test_search_excludes_teachers(): void
    {
        $this->makeStudent('Alpha Student', 'STU-9101');
        User::factory()->create(['role' => 'teacher', 'name' => 'Alpha Teacher']);

        $this->actingAs($this->teacher)
            ->get('/teacher/dashboard?searchBar=alpha')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->has('teacher.searchResults', 1)
                ->where('teacher.searchResults.0.name', 'Alpha Student'));
    }

    public function test_search_trims_whitespace_and_rejects_short_query(): void
    {
        $this->makeStudent('Alpha One', 'STU-9201');

        $this->actingAs($this->teacher)
            ->get('/teacher/dashboard?searchBar='.urlencode('  alpha  '))
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->where('teacher.filters.searchBar', 'alpha')
                ->has('teacher.searchResults', 1));

        $this->actingAs($this->teacher)
            ->get('/teacher/dashboard?searchBar=a')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->has('teacher.searchResults', 0));

        $this->actingAs($this->teacher)
            ->get('/teacher/dashboard')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->has('teacher.searchResults', 0));
    }

    public function test_search_caps_at_ten_and_orders_by_name(): void
    {
        for ($i = 0; $i < 12; $i++) {
            $this->makeStudent(sprintf('Search Kid %02d', $i), sprintf('STU-93%02d', $i));
        }

        $this->actingAs($this->teacher)
            ->get('/teacher/dashboard?searchBar=search%20kid')
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->has('teacher.searchResults', 10)
                ->where('teacher.searchResults.0.name', 'Search Kid 00')
                ->where('teacher.searchResults.9.name', 'Search Kid 09'));
    }
}
