<?php

namespace Tests\Feature;

use App\Models\ParagraphModule;
use App\Models\ParagraphWord;
use App\Models\StudentParagraphMastery;
use App\Models\StudentProfile;
use App\Models\StudentWordMastery;
use App\Models\User;
use App\Models\Word;
use App\Models\WordModule;
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

        // Branch B: dashboard reads stored status (SOT), so factory must store the
        // classify-derived status that matches the given accuracies (started = acc>0).
        if (! array_key_exists('status', $profile)) {
            $wAcc = (float) ($profile['wordBlastAcc'] ?? 0);
            $sAcc = (float) ($profile['storyQuestAcc'] ?? 0);
            $profile['status'] = \App\Services\ProgressService::classify(
                $wAcc, $sAcc, $wAcc > 0, $sAcc > 0
            );
        }

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
            ->where('students.0.finalAverage', 88)
            ->where('students.1.status', 'support')
            ->where('students.1.finalAverage', 68)
            ->where('students.2.status', 'atRisk')
            ->where('students.2.finalAverage', 45)
            ->where('students.3.status', 'in_progress')
            ->where('students.3.finalAverage', null)
            ->where('students.4.status', 'notStarted')
            ->where('students.4.finalAverage', null)
        );
    }

    public function test_dashboard_final_average_accessor_is_null_until_both_skills_started(): void
    {
        $this->actingAs($this->teacher);

        $this->makeStudent('Both', ['wordBlastAcc' => 80, 'storyQuestAcc' => 90]);
        $this->makeStudent('Zero WB', ['wordBlastAcc' => 0, 'storyQuestAcc' => 90]);
        $this->makeStudent('Zero SQ', ['wordBlastAcc' => 80, 'storyQuestAcc' => 0]);
        $this->makeStudent('Both Zero', ['wordBlastAcc' => 0, 'storyQuestAcc' => 0]);

        // Seeking the persisted model directly locks the accessor's acc==0 guard.
        $zeroWb = StudentProfile::whereHas('user', fn ($q) => $q->where('name', 'Zero WB'))->first();
        $this->assertNull($zeroWb->finalAverage);
        $zeroSq = StudentProfile::whereHas('user', fn ($q) => $q->where('name', 'Zero SQ'))->first();
        $this->assertNull($zeroSq->finalAverage);
        $both = StudentProfile::whereHas('user', fn ($q) => $q->where('name', 'Both'))->first();
        $this->assertSame(85, $both->finalAverage);
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
                'support' => 1,
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

    public function test_dashboard_avg_final_accuracy_excludes_unstarted_students(): void
    {
        $this->actingAs($this->teacher);

        // Now derived from class means via ProgressService::finalAverage(avgRead, avgSpeak)
        // avgRead=(70+80+100+0)/4=62.5 avgSpeak=(80+90+0+0)/4=42.5 final=53
        $this->makeStudent('Done A', ['wordBlastAcc' => 70, 'storyQuestAcc' => 80]);
        $this->makeStudent('Done B', ['wordBlastAcc' => 80, 'storyQuestAcc' => 90]);
        $this->makeStudent('Half', ['wordBlastAcc' => 100, 'storyQuestAcc' => 0]);
        $this->makeStudent('None', ['wordBlastAcc' => 0, 'storyQuestAcc' => 0]);

        $response = $this->get(route('teacher.dashboard'));

        $response->assertInertia(fn ($page) => $page
            ->where('avgFinalAccuracy', 53)
        );
    }

    public function test_dashboard_avg_final_accuracy_is_null_when_no_started_skill(): void
    {
        $this->actingAs($this->teacher);

        $this->makeStudent('Half', ['wordBlastAcc' => 100, 'storyQuestAcc' => 0]);
        $this->makeStudent('None', ['wordBlastAcc' => 0, 'storyQuestAcc' => 0]);

        $response = $this->get(route('teacher.dashboard'));

        $response->assertInertia(fn ($page) => $page
            ->where('avgFinalAccuracy', null)
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
                if ($alpha['final_average'] !== 85 || $bySection['Sector Bravo']['final_average'] !== 65) {
                    return false;
                }
                if ($bySection['Sector Delta']['final_average'] !== null || $bySection['Sector Epsilon']['final_average'] !== null) {
                    return false;
                }

                return $bySection['Sector Bravo']['status'] === 'Needs Support'
                    && $bySection['Sector Gamma']['status'] === 'At Risk'
                    && $bySection['Sector Delta']['status'] === 'In Progress'
                    && $bySection['Sector Epsilon']['status'] === 'Not Started';
            })
        );
    }

    // ── Hardest module / word cards (class-wide scope) ──

    private function wordModule(int $level, string $title, bool $tutorial = false): WordModule
    {
        return WordModule::create([
            'level' => $level,
            'title' => $title,
            'is_tutorial' => $tutorial,
        ]);
    }

    private function word(WordModule $module, string $text, int $position = 1): Word
    {
        return Word::create([
            'word_module_id' => $module->id,
            'word' => $text,
            'position' => $position,
        ]);
    }

    private function recordFails(int $userId, Word $word, int $attempts, string $status = 'training'): void
    {
        StudentWordMastery::create([
            'user_id' => $userId,
            'word_id' => $word->id,
            'status' => $status,
            'failed_attempts' => $attempts,
        ]);
    }

    public function test_dashboard_hardest_word_module_ranks_by_total_attempts(): void
    {
        $this->actingAs($this->teacher);

        $alice = $this->makeStudent('Alice', ['wordBlastAcc' => 70, 'storyQuestAcc' => 60]);
        $bob = $this->makeStudent('Bob', ['wordBlastAcc' => 70, 'storyQuestAcc' => 60]);

        $easy = $this->wordModule(1, 'Easy');
        $hard = $this->wordModule(2, 'Hard');

        // One student's worst must not out-vote a module the whole class
        // struggles with — the card is a class total, not a max.
        $this->recordFails($alice->user_id, $this->word($easy, 'easyword'), 1);
        $this->recordFails($alice->user_id, $this->word($hard, 'hardword'), 4);
        $this->recordFails($bob->user_id, $this->word($hard, 'hardword'), 6);

        $this->get(route('teacher.dashboard'))
            ->assertInertia(fn ($page) => $page
                ->where('hardestWordModule', fn ($m) => $m !== null
                    // Level 2 (sum 10) beat Level 1 (sum 5) — asserting the
                    // WINNER is what proves the ranking, since the count itself
                    // is never returned (Top Struggle already prints per-word
                    // counts, so the card is only WHICH module).
                    && $m['level'] === 'Level 2: Hard'
                    && $m['level_num'] === 2)
            );
    }

    public function test_dashboard_hardest_modules_ignore_the_tutorial(): void
    {
        // The silent failure: the tutorial module's words collect failed_attempts
        // like any other, so without is_tutorial = 0 this card reads "Level 0"
        // forever — a plausible-looking wrong answer, not an obvious one.
        $this->actingAs($this->teacher);

        $alice = $this->makeStudent('Alice', ['wordBlastAcc' => 70, 'storyQuestAcc' => 60]);

        $tutorial = $this->wordModule(0, 'Onboarding', tutorial: true);
        $real = $this->wordModule(3, 'Real Module');

        $this->recordFails($alice->user_id, $this->word($tutorial, 'apple'), 99);
        $this->recordFails($alice->user_id, $this->word($real, 'elephant'), 2);

        $this->get(route('teacher.dashboard'))
            ->assertInertia(fn ($page) => $page
                ->where('hardestWordModule', fn ($m) => $m !== null && $m['level'] === 'Level 3: Real Module')
                ->where('hardestWord', fn ($w) => $w !== null
                    && $w['word'] === 'elephant'
                    && $w['level'] === 'Level 3: Real Module')
            );
    }

    public function test_dashboard_hardest_word_module_is_null_when_all_attempts_are_zero(): void
    {
        // The zero guard, reached through SQL: a class that aced everything must
        // render N/A, never a "hardest module" at zero failures.
        $this->actingAs($this->teacher);

        $alice = $this->makeStudent('Alice', ['wordBlastAcc' => 90, 'storyQuestAcc' => 90]);
        $module = $this->wordModule(1, 'Spot On');
        $this->recordFails($alice->user_id, $this->word($module, 'perfect'), 0, 'mastered');

        $this->get(route('teacher.dashboard'))
            ->assertInertia(fn ($page) => $page
                ->where('hardestWordModule', null)
                ->where('hardestWord', null)
            );
    }

    public function test_dashboard_hardest_cards_are_null_for_an_empty_class(): void
    {
        $this->actingAs($this->teacher);
        $this->makeStudent('Alice', ['wordBlastAcc' => 0, 'storyQuestAcc' => 0]);

        $this->get(route('teacher.dashboard'))
            ->assertInertia(fn ($page) => $page
                ->where('hardestWordModule', null)
                ->where('hardestParagraphModule', null)
                ->where('hardestWord', null)
            );
    }

    public function test_dashboard_hardest_word_module_ignores_mastered_history(): void
    {
        // The class-wide half of the training-only rule (the per-student half
        // lives in ReportTest). A mastered row's counter is frozen at "attempts
        // needed to master" — a DIFFERENT metric from "still stuck". If these
        // counted, a conquered level would outrank the one the class is
        // actually failing, and the card would point remediation at the wrong
        // module. Level 1 also has to beat Level 2 on TRAINING rows alone.
        $this->actingAs($this->teacher);

        $alice = $this->makeStudent('Alice', ['wordBlastAcc' => 70, 'storyQuestAcc' => 60]);

        $conquered = $this->wordModule(1, 'Conquered');
        $current = $this->wordModule(2, 'Current');

        // Conquering Level 1 was genuinely hard — 99 attempts, now frozen.
        $this->recordFails($alice->user_id, $this->word($conquered, 'alpha'), 99, 'mastered');
        $this->recordFails($alice->user_id, $this->word($current, 'beta'), 5);

        $this->get(route('teacher.dashboard'))
            ->assertInertia(fn ($page) => $page
                ->where('hardestWordModule', fn ($m) => $m !== null
                    && $m['level'] === 'Level 2: Current')
                ->where('hardestWord', fn ($w) => $w !== null && $w['word'] === 'beta')
            );
    }

    public function test_dashboard_hardest_cards_are_null_when_everything_is_mastered(): void
    {
        $this->actingAs($this->teacher);

        $alice = $this->makeStudent('Alice', ['wordBlastAcc' => 95, 'storyQuestAcc' => 95]);
        $module = $this->wordModule(1, 'All Mastered');
        $this->recordFails($alice->user_id, $this->word($module, 'flawless'), 6, 'mastered');

        // No training rows anywhere → null → N/A, not "Level 1 (6)".
        $this->get(route('teacher.dashboard'))
            ->assertInertia(fn ($page) => $page
                ->where('hardestWordModule', null)
                ->where('hardestWord', null)
            );
    }

    public function test_dashboard_hardest_paragraph_module_ranks_by_total_attempts(): void
    {
        $this->actingAs($this->teacher);

        $alice = $this->makeStudent('Alice', ['wordBlastAcc' => 60, 'storyQuestAcc' => 60]);

        $easy = ParagraphModule::create(['level' => 1, 'title' => 'Sq Easy', 'content' => 'A cat sat.', 'is_tutorial' => false]);
        $hard = ParagraphModule::create(['level' => 4, 'title' => 'Sq Hard', 'content' => 'Two dogs ran.', 'is_tutorial' => false]);

        StudentParagraphMastery::create([
            'user_id' => $alice->user_id,
            'paragraph_word_id' => ParagraphWord::create([
                'paragraph_module_id' => $hard->id, 'word' => 'dogs', 'position' => 1,
            ])->id,
            'status' => 'training',
            'failed_attempts' => 8,
        ]);
        StudentParagraphMastery::create([
            'user_id' => $alice->user_id,
            'paragraph_word_id' => ParagraphWord::create([
                'paragraph_module_id' => $easy->id, 'word' => 'cat', 'position' => 1,
            ])->id,
            'status' => 'training',
            'failed_attempts' => 1,
        ]);

        $this->get(route('teacher.dashboard'))
            ->assertInertia(fn ($page) => $page
                ->where('hardestParagraphModule', fn ($m) => $m !== null
                    && $m['level'] === 'Level 4: Sq Hard')
            );
    }
}
