<?php

namespace Tests\Feature;

use App\Models\GameSession;
use App\Models\StudentProfile;
use App\Models\User;
use App\Models\Word;
use App\Models\WordModule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentResultsTest extends TestCase
{
    use RefreshDatabase;

    private function makeStudent(string $name): User
    {
        $user = User::factory()->create(['name' => $name, 'role' => 'student']);
        StudentProfile::factory()->for($user)->create([
            'avatar' => '/images/avatars/juan/head.png',
        ]);

        return $user;
    }

    private function makeWordModule(int $level, int $words = 10): WordModule
    {
        $module = WordModule::create(['level' => $level, 'title' => "Level {$level}"]);
        foreach (range(1, $words) as $i) {
            Word::create(['word_module_id' => $module->id, 'word' => "w{$i}", 'position' => $i]);
        }

        return $module;
    }

    private function play(User $student, WordModule $module, int $score = 10): GameSession
    {
        return GameSession::create([
            'user_id' => $student->id,
            'module_id' => $module->id,
            'module_type' => 'word',
            'score' => $score,
            'accuracy' => 100,
            'streak' => $score,
        ]);
    }

    public function test_results_reports_next_module_for_mid_level_play(): void
    {
        $student = $this->makeStudent('Mid Level');
        $module1 = $this->makeWordModule(1, 10);
        $module2 = $this->makeWordModule(2, 12);
        $this->makeWordModule(3, 10);

        $session = $this->play($student, $module1);

        $this->actingAs($student)
            ->get(route('student.results', $session->id))
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->component('Student/GameResults')
                ->where('moduleLevel', 1)
                ->where('nextModuleLevel', 2)
                ->where('isMaxLevel', false)
                ->where('totalItems', 10));
    }

    public function test_results_flags_max_level_with_no_next_module(): void
    {
        $student = $this->makeStudent('Top Level');
        $this->makeWordModule(1, 10);
        $this->makeWordModule(2, 10);
        $module3 = $this->makeWordModule(3, 10);

        $session = $this->play($student, $module3);

        $this->actingAs($student)
            ->get(route('student.results', $session->id))
            ->assertSuccessful()
            ->assertInertia(fn ($page) => $page
                ->where('moduleLevel', 3)
                ->where('nextModuleLevel', null)
                ->where('isMaxLevel', true));
    }

    // Spec: results must never 500 on a session whose module was deleted
    // (CAVEATS.md L2). Expected: graceful redirect to the dashboard.
    public function test_results_redirects_when_session_module_was_deleted(): void
    {
        $student = $this->makeStudent('Orphaned Session');
        $module = $this->makeWordModule(1, 10);

        $session = $this->play($student, $module);

        $module->delete();

        $this->actingAs($student)
            ->get(route('student.results', $session->id))
            ->assertRedirect(route('student.dashboard'));
    }
}
