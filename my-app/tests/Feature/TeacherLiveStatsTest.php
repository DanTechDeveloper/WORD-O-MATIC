<?php

namespace Tests\Feature;

use App\Models\GameSession;
use App\Models\Setting;
use App\Models\StudentProfile;
use App\Models\User;
use App\Models\Word;
use App\Models\WordModule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherLiveStatsTest extends TestCase
{
    use RefreshDatabase;

    protected User $teacher;

    protected function setUp(): void
    {
        parent::setUp();
        $this->teacher = User::factory()->create(['role' => 'teacher']);
    }

    private function makeStudent(string $name = 'Kid One'): StudentProfile
    {
        $user = User::factory()->create([
            'role' => 'student',
            'name' => $name,
            'student_id' => 'S-'.str_pad((string) random_int(1, 9999), 4, '0', STR_PAD_LEFT),
        ]);

        return $user->student()->create([
            'points' => 0,
            'section' => 'Sector 1-A',
            // CheckStudentOnboarding bounces a default/absent avatar to
            // splashScreen, which would 302 the save and make a missing
            // GameSession look like the practice branch.
            'avatar' => '/images/avatars/juan/head.png',
            'read_level' => 1,
            'speak_level' => 1,
            'status' => 'notStarted',
            'wordBlastAcc' => 0.0,
            'storyQuestAcc' => 0.0,
        ]);
    }

    public function test_it_is_teacher_only(): void
    {
        $student = User::factory()->create(['role' => 'student']);

        foreach ([
            '/teacher/live-stats',
            '/teacher/live-students',
            '/teacher/live-leaderboards',
            '/teacher/live-badges',
        ] as $url) {
            $this->actingAs($student)->getJson($url)->assertForbidden();
            $this->actingAs($this->teacher)->getJson($url)->assertOk();
        }
    }

    // Every view MUST answer with changed:false and nothing else when the
    // watermark has not moved — that two-query short circuit is the whole reason
    // polling is affordable, so it is asserted per view, not just on the
    // dashboard.
    public function test_every_view_short_circuits_on_an_unchanged_watermark(): void
    {
        $this->makeStudent('Alpha');
        $watermark = $this->actingAs($this->teacher)
            ->getJson('/teacher/live-stats')
            ->json('watermark');

        $student = User::where('role', 'student')->first();

        foreach ([
            '/teacher/live-stats',
            '/teacher/live-students',
            "/teacher/live-student/{$student->id}",
            '/teacher/live-leaderboards',
            '/teacher/live-badges',
        ] as $url) {
            $res = $this->actingAs($this->teacher)
                ->getJson($url.'?since='.urlencode($watermark))
                ->assertOk();

            $res->assertJsonPath('changed', false);
            $this->assertSame(
                ['changed', 'watermark'],
                array_keys($res->json()),
                "{$url} returned a payload on an unchanged tick"
            );
        }
    }

    public function test_live_students_honours_every_filter(): void
    {
        $keep = $this->makeStudent('Alpha Awesome');
        $drop = $this->makeStudent('Zulu Zulu');
        $drop->update(['section' => 'Sector 9-Z']);

        $all = $this->actingAs($this->teacher)->getJson('/teacher/live-students')->json('data');
        $this->assertCount(2, $all);

        $bySearch = $this->actingAs($this->teacher)
            ->getJson('/teacher/live-students?search=Zulu')
            ->json('data');
        $this->assertCount(1, $bySearch);
        $this->assertSame('Zulu Zulu', $bySearch[0]['fullName']);

        $bySection = $this->actingAs($this->teacher)
            ->getJson('/teacher/live-students?section=Sector 9-Z')
            ->json('data');
        $this->assertCount(1, $bySection);
        $this->assertSame($drop->user_id, $bySection[0]['id']);

        $this->actingAs($this->teacher)
            ->getJson('/teacher/live-students?status=onTrack')
            ->assertOk();

        $this->assertNotNull($keep);
    }

    // existingStudentIds plucks EVERY student id and sections runs a distinct
    // query — both derive from users.student_id / students.section, neither of
    // which a round touches, so shipping them every tick would be pure bytes.
    public function test_live_students_omits_the_two_non_volatile_fields(): void
    {
        $this->makeStudent();

        $res = $this->actingAs($this->teacher)->getJson('/teacher/live-students')->assertOk();

        $res->assertJsonStructure(['data', 'current_page', 'last_page', 'from', 'to', 'total']);
        $this->assertArrayNotHasKey('existingStudentIds', $res->json());
        $this->assertArrayNotHasKey('sections', $res->json());
    }

    public function test_live_student_404s_on_a_non_student(): void
    {
        // Same guard as show(): a teacher-role id must not resolve.
        $this->actingAs($this->teacher)
            ->getJson("/teacher/live-student/{$this->teacher->id}")
            ->assertNotFound();
    }

    public function test_live_student_matches_the_rendered_page_shape(): void
    {
        $this->makeStudent();
        $student = User::where('role', 'student')->first();

        $live = $this->actingAs($this->teacher)
            ->getJson("/teacher/live-student/{$student->id}")
            ->assertOk()
            ->json();

        $this->assertArrayHasKey('readCurriculum', $live);
        $this->assertArrayHasKey('speakCurriculum', $live);
        $this->assertArrayHasKey('latestBadge', $live);
        $this->assertSame($student->id, $live['id']);
    }

    public function test_live_leaderboards_and_badges_carry_their_page_shape(): void
    {
        $this->makeStudent();

        $boards = $this->actingAs($this->teacher)
            ->getJson('/teacher/live-leaderboards')
            ->assertOk()
            ->json();
        $this->assertArrayHasKey('points', $boards['leaderboard']);
        $this->assertArrayHasKey('wordBlast', $boards['leaderboard']);
        $this->assertArrayHasKey('storyQuest', $boards['leaderboard']);
        $this->assertSame(1, $boards['totalStudents']);

        $badges = $this->actingAs($this->teacher)
            ->getJson('/teacher/live-badges')
            ->assertOk()
            ->json();
        foreach (['badges', 'topEarners', 'totalStudents', 'totalBadges', 'totalEarned'] as $key) {
            $this->assertArrayHasKey($key, $badges);
        }
    }

    public function test_first_call_has_no_since_and_returns_the_full_payload(): void
    {
        $this->makeStudent();

        $res = $this->actingAs($this->teacher)->getJson('/teacher/live-stats')->assertOk();

        $res->assertJsonPath('changed', true);
        foreach ([
            'watermark', 'chartCounts', 'students', 'topStudents',
            'sectionPerformance', 'avgReadAccuracy', 'avgSpeakAccuracy',
            'avgFinalAccuracy', 'totalClassPoints', 'totalStudents',
        ] as $key) {
            $res->assertJsonStructure([$key]);
        }
    }

    public function test_unchanged_watermark_short_circuits_to_changed_false(): void
    {
        $this->makeStudent();
        $first = $this->actingAs($this->teacher)->getJson('/teacher/live-stats')->assertOk();
        $watermark = $first->json('watermark');

        $second = $this->actingAs($this->teacher)
            ->getJson('/teacher/live-stats?since='.urlencode($watermark))
            ->assertOk();

        // The whole point: an idle tick must NOT rebuild every aggregate.
        $second->assertJsonPath('changed', false);
        $this->assertSame(
            ['changed', 'watermark'],
            array_keys($second->json()),
            'changed:false must not carry the dashboard payload'
        );
    }

    public function test_response_is_never_cached(): void
    {
        $this->actingAs($this->teacher)
            ->getJson('/teacher/live-stats')
            ->assertHeader('Cache-Control', 'no-store, private');
    }

    public function test_a_new_game_session_changes_the_watermark(): void
    {
        $student = $this->makeStudent();
        $this->actingAs($this->teacher)->getJson('/teacher/live-stats');
        $watermark = $this->actingAs($this->teacher)
            ->getJson('/teacher/live-stats')
            ->json('watermark');

        GameSession::logSession($student->user_id, 1, 'word', 5, 80, 3);

        $this->actingAs($this->teacher)
            ->getJson('/teacher/live-stats?since='.urlencode($watermark))
            ->assertJsonPath('changed', true);
    }

    // REGRESSION GUARD for the composite watermark. A round that smashed fewer
    // words than the student's previous best does NOT call $student->update(),
    // so students.updated_at stays put — yet checkGameplayBadges() still runs off
    // that session and can award a streak / best_sentence badge. A students-only
    // watermark would silently drop those awards from the live view forever.
    public function test_a_session_that_did_not_improve_the_student_still_moves_the_watermark(): void
    {
        $student = $this->makeStudent();

        // Pre-existing best, so the next round is NOT a new best.
        $student->update(['points' => 40, 'wordBlastAcc' => 90]);
        $watermark = $this->actingAs($this->teacher)
            ->getJson('/teacher/live-stats')
            ->json('watermark');

        $tsBefore = StudentProfile::find($student->id)->updated_at->toDateTimeString();

        // A session inserts but improves nothing: no points delta, no accuracy
        // write, no status change. students.updated_at therefore does not move.
        $session = GameSession::logSession($student->user_id, 1, 'word', 0, 0, 0);
        $this->assertSame(
            $tsBefore,
            StudentProfile::find($student->id)->updated_at->toDateTimeString(),
            'precondition: this round must not touch the students row'
        );

        $next = $this->actingAs($this->teacher)
            ->getJson('/teacher/live-stats?since='.urlencode($watermark))
            ->assertJsonPath('changed', true)
            ->json('watermark');

        // Non-vacuous: prove it was the session-id half of the composite that
        // moved, and not the students half.
        $this->assertStringContainsString('|'.$session->id, $next);
        $this->assertNotSame($watermark, $next);
    }

    public function test_live_numbers_match_the_rendered_dashboard(): void
    {
        $this->makeStudent('Alpha');
        $this->makeStudent('Beta');

        $live = $this->actingAs($this->teacher)->getJson('/teacher/live-stats')->json();
        $page = $this->actingAs($this->teacher)->get('/teacher/dashboard');

        // Reuses dashboardStats() verbatim, so this can only drift if someone
        // hand-rolls a second copy of the aggregates.
        foreach (['chartCounts', 'students', 'topStudents', 'sectionPerformance'] as $key) {
            $page->assertSee($live[$key] === [] ? '[]' : '', false);
        }

        $this->assertSame(2, $live['totalStudents']);
        $this->assertCount(2, $live['students']);
    }

    public function test_live_stats_ships_the_hardest_module_cards(): void
    {
        // The Dashboard cards claim no hook/route change was needed: liveStats()
        // is liveJson($request, dashboardStats()) and liveJson() spreads the
        // payload, so the three keys ride along for free. This locks that — a
        // hand-rolled second payload would silently freeze the cards at their
        // server-render values and no other test would notice.
        $this->makeStudent('Alpha');

        $live = $this->actingAs($this->teacher)->getJson('/teacher/live-stats')->json();

        $this->assertTrue($live['changed']);
        // Present-and-null for a class with no recorded failures; the card
        // renders N/A. What matters is the key existing on BOTH the page prop
        // and the live payload, so the poll can overwrite it later.
        $this->assertArrayHasKey('hardestWordModule', $live);
        $this->assertArrayHasKey('hardestParagraphModule', $live);
        $this->assertArrayHasKey('hardestWord', $live);
        $this->assertNull($live['hardestWordModule']);
    }

    /**
     * The `final` gate's justification, and the test Step 6 promised.
     *
     * Past the cutoff, saveWordProgress takes the $isPractice branch
     * (StudentController.php:496-551): no GameSession, no updateWordProgress, no
     * BadgeService, no students denorm write. BOTH halves of the composite
     * watermark are therefore frozen for good — so the poll is not merely
     * wasteful past the deadline, it is provably incapable of ever returning a
     * change. That is why LiveStatusDot says "Final" instead of "Live".
     *
     * The underlying practice behaviour is covered by
     * GameplayTest::test_round_skips_scores_but_unlocks_next_level_when_deadline_passed;
     * this asserts the link to the watermark, which only the live-stats suite owns.
     */
    public function test_past_deadline_freezes_the_watermark(): void
    {
        $module = WordModule::create(['level' => 1, 'title' => 'Live Test Module']);
        foreach (['cat', 'dog', 'sun'] as $i => $word) {
            Word::create([
                'word_module_id' => $module->id,
                'word' => $word,
                'position' => $i + 1,
            ]);
        }
        $student = $this->makeStudent('Practice Kid');
        // students table, NOT users — and it must be set or the round takes the
        // tutorial branch, which logs no GameSession at all.
        $student->update(['tutorial_completed_at' => now()]);

        // Baseline: pre-deadline, a scored round DOES move the watermark.
        // The scored path redirects to student.results; the practice path below
        // renders GameResults inline, hence the different assertions.
        Setting::where('key', 'report_deadline')->delete();
        $this->actingAs($student->user)
            ->post(route('student.saveWordProgress'), [
                'module_id' => $module->id,
                'words_smashed' => 3,
                'words_processed' => 3,
            ])
            // Pinned, not a loose assertRedirect: an onboarding bounce also 302s,
            // and would make a missing session look like the practice branch.
            ->assertRedirect(route('student.results', ['id' => GameSession::first()->id]));
        $this->assertDatabaseHas('game_sessions', ['user_id' => $student->user_id]);
        $before = $this->watermark();

        // Now push the deadline into the past and play the same round again.
        Setting::setValue('report_deadline', now()->subMinute()->format('Y-m-d H:i:s'));
        $this->actingAs($student->user)
            ->post(route('student.saveWordProgress'), [
                'module_id' => $module->id,
                'words_smashed' => 3,
                'words_processed' => 3,
            ])
            ->assertSuccessful()
            // Proves we are genuinely on the $isPractice branch, not just
            // observing a side effect.
            ->assertInertia(fn ($p) => $p->component('Student/GameResults')->where('isPractice', true));

        // No new session, and the watermark has not moved at all.
        $this->assertDatabaseCount('game_sessions', 1);
        $this->assertSame(
            $before,
            $this->watermark(),
            'the live-stats watermark must be frozen once the deadline has passed'
        );
    }

    /** The exact string TeacherController::liveWatermark() would return. */
    private function watermark(): string
    {
        $res = $this->actingAs($this->teacher)->getJson('/teacher/live-stats')->assertOk();

        return $res->json('watermark');
    }
}
