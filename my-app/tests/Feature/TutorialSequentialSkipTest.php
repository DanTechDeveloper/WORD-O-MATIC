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

class TutorialSequentialSkipTest extends TestCase
{
    use RefreshDatabase;

    private function makeStudent(string $name = 'Tute Student'): User
    {
        $u = User::factory()->create(['name' => $name, 'role' => 'student']);
        StudentProfile::factory()->for($u)->create([
            'avatar' => '/images/avatars/juan/head.png',
            'tutorial_completed_at' => null,
            'tutorial_skipped_at' => null,
        ]);
        return $u;
    }

    private function seedTutorialModules(): array
    {
        $tutWord = WordModule::create(['level' => 0, 'title' => 'Tutorial WB', 'is_tutorial' => true]);
        foreach (['apple', 'banana', 'puppy'] as $i => $w) {
            Word::create(['word_module_id' => $tutWord->id, 'word' => $w, 'position' => $i + 1]);
        }
        $tutPara = ParagraphModule::create(['level' => 0, 'title' => 'Tutorial SQ', 'content' => 'A puppy naps.', 'is_tutorial' => true]);
        foreach (['A', 'puppy', 'naps.'] as $i => $w) {
            ParagraphWord::create(['paragraph_module_id' => $tutPara->id, 'word' => $w, 'position' => $i + 1]);
        }
        // Real level 1 for skip-unlock checks
        $realWord = WordModule::create(['level' => 1, 'title' => 'Level 1']);
        foreach (['cat', 'dog'] as $i => $w) {
            Word::create(['word_module_id' => $realWord->id, 'word' => $w, 'position' => $i + 1]);
        }
        return [$tutWord, $tutPara, $realWord];
    }

    private function seedBadges(): void
    {
        Badges::create(['name' => 'Tutorial Complete', 'slug' => 'tutorial-complete', 'description' => 'd', 'metric' => 'action', 'threshold_score' => null, 'icon' => 'x']);
        Badges::create(['name' => 'Profile Pioneer', 'slug' => 'profile-pioneer', 'description' => 'd', 'metric' => 'action', 'threshold_score' => null, 'icon' => 'x']);
        Badges::create(['name' => 'First Steps', 'slug' => 'first-steps', 'description' => 'd', 'metric' => 'total_points', 'threshold_score' => 5, 'icon' => 'x']);
    }

    public function test_skip_sets_skipped_at_and_not_completed(): void
    {
        $s = $this->makeStudent();
        $this->seedTutorialModules();
        $this->seedBadges();

        $this->actingAs($s)->post(route('student.tutorial.skip'))->assertRedirect(route('student.dashboard'));

        $s->refresh();
        $this->assertNotNull($s->student->tutorial_skipped_at);
        $this->assertNull($s->student->tutorial_completed_at);
        $this->assertDatabaseMissing('student_badges', ['user_id' => $s->id]);
    }

    public function test_skip_is_idempotent(): void
    {
        $s = $this->makeStudent();
        $this->seedTutorialModules();
        $this->actingAs($s)->post(route('student.tutorial.skip'));
        $first = $s->refresh()->student->tutorial_skipped_at;
        $this->actingAs($s)->post(route('student.tutorial.skip'))->assertRedirect(route('student.dashboard'));
        $this->assertEquals($first->toDateTimeString(), $s->refresh()->student->tutorial_skipped_at->toDateTimeString());
    }

    public function test_skip_blocked_when_already_completed(): void
    {
        $s = $this->makeStudent();
        $s->student->update(['tutorial_completed_at' => now()]);
        $this->actingAs($s)->post(route('student.tutorial.skip'))->assertRedirect(route('student.dashboard'));
        $this->assertNull($s->refresh()->student->tutorial_skipped_at);
    }

    public function test_dashboard_after_skip_shows_skipped_flag(): void
    {
        $s = $this->makeStudent();
        $this->seedTutorialModules();
        $this->actingAs($s)->post(route('student.tutorial.skip'));
        $this->actingAs($s)->get(route('student.dashboard'))
            ->assertInertia(fn ($p) => $p->where('tutorialSkipped', true)->where('tutorialComplete', false));
    }

    public function test_levels_unlocked_after_skip(): void
    {
        $s = $this->makeStudent();
        [$tutWord, $tutPara, $realWord] = $this->seedTutorialModules();
        $this->actingAs($s)->post(route('student.tutorial.skip'));
        // After skip, real level should be accessible (not redirected)
        $this->actingAs($s)->get(route('student.gameplayReadMode', ['level' => 1]))
            ->assertSuccessful();
    }

    public function test_levels_locked_during_onboarding_without_skip(): void
    {
        $s = $this->makeStudent();
        $this->seedTutorialModules();
        $this->actingAs($s)->get(route('student.gameplayReadMode', ['level' => 1]))
            ->assertRedirect(route('student.readModeLevels'));
    }

    public function test_word_tutorial_finish_redirects_to_tutorial_page_sequential(): void
    {
        $s = $this->makeStudent();
        [$tutWord] = $this->seedTutorialModules();
        // fresh onboarding (not skipped) → Dashboard (TutorialPage is for skipped replay)
        $this->actingAs($s)->post(route('student.saveWordProgress'), [
            'module_id' => $tutWord->id, 'words_smashed' => 3, 'words_processed' => 3,
        ])->assertRedirect(route('student.dashboard'));

        $this->assertTrue(StudentWordProgress::where('user_id', $s->id)->where('word_module_id', $tutWord->id)->where('status', 'completed')->exists());
        $this->assertNull($s->refresh()->student->tutorial_completed_at);
    }

    public function test_word_tutorial_results_bounces_to_tutorial_mid_sequence(): void
    {
        $s = $this->makeStudent();
        [$tutWord] = $this->seedTutorialModules();
        $this->actingAs($s)->post(route('student.saveWordProgress'), [
            'module_id' => $tutWord->id, 'words_smashed' => 3, 'words_processed' => 3,
        ]);
        $session = GameSession::where('user_id', $s->id)->latest('id')->first();
        // fresh onboarding bounces to Dashboard (TutorialPage is for skipped)
        $this->actingAs($s)->get(route('student.results', $session->id))
            ->assertRedirect(route('student.dashboard'));
    }

    public function test_story_quest_finish_completes_tutorial_and_awards_badge(): void
    {
        $s = $this->makeStudent();
        [$tutWord, $tutPara] = $this->seedTutorialModules();
        $this->seedBadges();
        // Word done
        $this->actingAs($s)->post(route('student.saveWordProgress'), [
            'module_id' => $tutWord->id, 'words_smashed' => 3, 'words_processed' => 3,
        ]);
        // Speak done -> should complete
        $this->actingAs($s)->post(route('student.saveParagraphProgress'), [
            'module_id' => $tutPara->id, 'words_smashed' => 3, 'words_processed' => 3,
        ])->assertRedirect(route('student.results', GameSession::latest('id')->first()->id));

        $s->refresh();
        $this->assertNotNull($s->student->tutorial_completed_at);
        $this->assertDatabaseHas('student_badges', ['user_id' => $s->id]);
        $badge = Badges::where('slug', 'tutorial-complete')->first();
        $this->assertTrue($s->badges()->where('badges.id', $badge->id)->exists());
    }

    public function test_skipped_user_replaying_both_tutorials_earns_badge_and_clears_skip(): void
    {
        $s = $this->makeStudent();
        [$tutWord, $tutPara] = $this->seedTutorialModules();
        $this->seedBadges();
        $this->actingAs($s)->post(route('student.tutorial.skip'));
        $this->assertNotNull($s->refresh()->student->tutorial_skipped_at);

        $this->actingAs($s)->post(route('student.saveWordProgress'), [
            'module_id' => $tutWord->id, 'words_smashed' => 3, 'words_processed' => 3,
        ])->assertRedirect(route('student.tutorial'));

        $this->actingAs($s)->post(route('student.saveParagraphProgress'), [
            'module_id' => $tutPara->id, 'words_smashed' => 3, 'words_processed' => 3,
        ]);

        $s->refresh();
        $this->assertNotNull($s->student->tutorial_completed_at);
        $this->assertNull($s->student->tutorial_skipped_at);
        $badge = Badges::where('slug', 'tutorial-complete')->first();
        $this->assertTrue($s->badges()->where('badges.id', $badge->id)->exists());
    }

    public function test_skipped_user_word_only_does_not_complete(): void
    {
        $s = $this->makeStudent();
        [$tutWord] = $this->seedTutorialModules();
        $this->seedBadges();
        $this->actingAs($s)->post(route('student.tutorial.skip'));
        $this->actingAs($s)->post(route('student.saveWordProgress'), [
            'module_id' => $tutWord->id, 'words_smashed' => 3, 'words_processed' => 3,
        ]);
        $this->assertNull($s->refresh()->student->tutorial_completed_at);
        $this->assertNotNull($s->refresh()->student->tutorial_skipped_at);
    }

    public function test_badges_page_shows_all_after_skip_not_just_onboarding(): void
    {
        $s = $this->makeStudent();
        $this->seedBadges();
        Badges::create(['name' => 'Extra', 'slug' => 'extra', 'description' => 'd', 'metric' => 'total_points', 'threshold_score' => 10, 'icon' => 'x']);
        // Onboarding without skip: only 2
        $this->actingAs($s)->get(route('student.badges'))
            ->assertInertia(fn ($p) => $p->where('badges', fn ($b) => count($b) === 2));
        // After skip: all 4
        $this->actingAs($s)->post(route('student.tutorial.skip'));
        $this->actingAs($s)->get(route('student.badges'))
            ->assertInertia(fn ($p) => $p->where('badges', fn ($b) => count($b) === 4));
    }

    public function test_tutorial_page_shows_sequential_lock(): void
    {
        $s = $this->makeStudent();
        [$tutWord, $tutPara] = $this->seedTutorialModules();
        $this->actingAs($s)->get(route('student.tutorial'))
            ->assertInertia(fn ($p) => $p->where('wordTutorialDone', false)->where('speakTutorialDone', false));
        $this->actingAs($s)->post(route('student.saveWordProgress'), [
            'module_id' => $tutWord->id, 'words_smashed' => 3, 'words_processed' => 3,
        ]);
        $this->actingAs($s)->get(route('student.tutorial'))
            ->assertInertia(fn ($p) => $p->where('wordTutorialDone', true)->where('speakTutorialDone', false));
    }

    public function test_skip_does_not_award_points_or_accuracy(): void
    {
        $s = $this->makeStudent();
        [$tutWord] = $this->seedTutorialModules();
        $this->actingAs($s)->post(route('student.saveWordProgress'), [
            'module_id' => $tutWord->id, 'words_smashed' => 3, 'words_processed' => 3,
        ]);
        $s->refresh();
        $this->assertEquals(0, $s->student->points);
        $this->assertEquals(0, (int) $s->student->wordBlastAcc);
    }

    // ─── IDOR edges: "imposible" but must still 403/redirect ───────────────

    public function test_idor_student_cannot_view_another_students_tutorial_results(): void
    {
        $victim = $this->makeStudent('Victim');
        $attacker = $this->makeStudent('Attacker');
        [$tutWord] = $this->seedTutorialModules();

        $this->actingAs($victim)->post(route('student.saveWordProgress'), [
            'module_id' => $tutWord->id, 'words_smashed' => 3, 'words_processed' => 3,
        ]);
        $victimSession = GameSession::where('user_id', $victim->id)->latest('id')->first();

        $this->actingAs($attacker)->get(route('student.results', $victimSession->id))
            ->assertRedirect(route('student.dashboard'))
            ->assertSessionHas('error', 'Access denied.');

        // Attacker's own progress untouched
        $this->assertFalse(StudentWordProgress::where('user_id', $attacker->id)->exists());
    }

    public function test_idor_save_word_progress_ignores_spoofed_user_id(): void
    {
        $victim = $this->makeStudent('Victim2');
        $attacker = $this->makeStudent('Attacker2');
        [$tutWord] = $this->seedTutorialModules();

        // Attacker tries to send victim's user_id as field
        $this->actingAs($attacker)->post(route('student.saveWordProgress'), [
            'module_id' => $tutWord->id, 'words_smashed' => 3, 'words_processed' => 3,
            'user_id' => $victim->id, // spoof attempt — controller must ignore
        ])->assertRedirect();

        $this->assertTrue(StudentWordProgress::where('user_id', $attacker->id)->where('word_module_id', $tutWord->id)->exists());
        $this->assertFalse(StudentWordProgress::where('user_id', $victim->id)->exists());
    }

    public function test_idor_skip_cannot_be_forged_for_other_user(): void
    {
        $victim = $this->makeStudent('Victim3');
        $attacker = $this->makeStudent('Attacker3');
        $this->seedTutorialModules();

        // Attacker skips — victim must remain not-skipped
        $this->actingAs($attacker)->post(route('student.tutorial.skip'));
        $this->assertNotNull($attacker->refresh()->student->tutorial_skipped_at);
        $this->assertNull($victim->refresh()->student->tutorial_skipped_at);

        // No mass-assignment via user_id param
        $this->actingAs($attacker)->post(route('student.tutorial.skip'), ['user_id' => $victim->id]);
        $this->assertNull($victim->refresh()->student->tutorial_skipped_at);
    }

    public function test_idor_tutorial_page_never_leaks_other_students_state(): void
    {
        $victim = $this->makeStudent('Victim4');
        $attacker = $this->makeStudent('Attacker4');
        [$tutWord] = $this->seedTutorialModules();
        // Victim completes Word tutorial
        $this->actingAs($victim)->post(route('student.saveWordProgress'), [
            'module_id' => $tutWord->id, 'words_smashed' => 3, 'words_processed' => 3,
        ]);
        // Attacker checks own tutorial page — must still show not done
        $this->actingAs($attacker)->get(route('student.tutorial'))
            ->assertInertia(fn ($p) => $p->where('wordTutorialDone', false)->where('speakTutorialDone', false));
    }

    public function test_idor_stale_tutorial_results_id_bounces_to_own_latest_not_victim(): void
    {
        $victim = $this->makeStudent('Victim5');
        $attacker = $this->makeStudent('Attacker5');
        [$tutWord, $tutPara] = $this->seedTutorialModules();
        $this->seedBadges();
        // Both complete their own tutorials
        foreach ([$victim, $attacker] as $u) {
            $this->actingAs($u)->post(route('student.saveWordProgress'), ['module_id' => $tutWord->id, 'words_smashed' => 3, 'words_processed' => 3]);
            $this->actingAs($u)->post(route('student.saveParagraphProgress'), ['module_id' => $tutPara->id, 'words_smashed' => 3, 'words_processed' => 3]);
        }
        $victimLatest = GameSession::where('user_id', $victim->id)->latest('id')->first();
        // Attacker tries to fetch victim's latest via stale-id redirect logic
        $this->actingAs($attacker)->get(route('student.results', $victimLatest->id))
            ->assertRedirect(route('student.dashboard'))
            ->assertSessionHas('error', 'Access denied.');
    }
}
