<?php

namespace Tests\Feature;

use App\Models\GameSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GameSessionTest extends TestCase
{
    use RefreshDatabase;

    private User $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->student = User::factory()->create(['role' => 'student']);
    }

    public function test_log_session_stores_all_fields(): void
    {
        $session = GameSession::logSession(
            $this->student->id,
            moduleId: 5,
            moduleType: 'word',
            score: 8,
            accuracy: 80,
            streak: 3,
            isDeadlineHit: true,
        );

        $this->assertDatabaseHas('game_sessions', [
            'id' => $session->id,
            'user_id' => $this->student->id,
            'module_id' => 5,
            'module_type' => 'word',
            'score' => 8,
            'accuracy' => 80,
            'streak' => 3,
            'is_deadline_hit' => true,
        ]);
    }

    public function test_log_session_defaults_null_streak_to_zero(): void
    {
        $session = GameSession::logSession(
            $this->student->id,
            moduleId: 1,
            moduleType: 'paragraph',
            score: 5,
            accuracy: 50,
            streak: null,
        );

        $this->assertSame(0, $session->streak);
    }

    public function test_log_session_defaults_is_deadline_hit_to_false(): void
    {
        $session = GameSession::logSession(
            $this->student->id,
            moduleId: 1,
            moduleType: 'word',
            score: 5,
            accuracy: 50,
            streak: 2,
        );

        $this->assertFalse($session->is_deadline_hit);
    }

    public function test_mass_assignment_drops_unfillable_fields(): void
    {
        $session = GameSession::logSession(
            $this->student->id,
            moduleId: 1,
            moduleType: 'word',
            score: 5,
            accuracy: 50,
            streak: 2,
        );

        $session->update(['module_id' => 99, 'created_at' => '2000-01-01 00:00:00']);

        $this->assertSame(99, $session->fresh()->module_id);
        $this->assertNotSame('2000-01-01 00:00:00', $session->fresh()->created_at->format('Y-m-d H:i:s'));
    }

    public function test_user_relation_resolves_the_logged_in_student(): void
    {
        $session = GameSession::logSession(
            $this->student->id,
            moduleId: 1,
            moduleType: 'word',
            score: 5,
            accuracy: 50,
            streak: 2,
        );

        $this->assertTrue($session->user->is($this->student));
    }
}
