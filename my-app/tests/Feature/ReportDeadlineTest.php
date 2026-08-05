<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\StudentProfile;
use App\Models\StudentWordMastery;
use App\Models\User;
use App\Models\Word;
use App\Models\WordModule;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ReportDeadlineTest extends TestCase
{
    use RefreshDatabase;

    protected $teacher;

    protected $student;

    protected $word;

    protected $word2;

    protected $module;

    protected function setUp(): void
    {
        parent::setUp();

        $this->teacher = User::factory()->create(['role' => 'teacher']);
        $this->student = User::factory()->create(['role' => 'student']);

        StudentProfile::factory()->for($this->student)->create([
            'wordBlastAcc' => 85,
            'storyQuestAcc' => 90,
            'status' => 'onTrack',
            'parent_email' => 'parent@test.com',
        ]);

        $this->module = WordModule::create(['level' => 1, 'title' => 'Level 1', 'is_tutorial' => false]);
        $this->word = Word::create([
            'word_module_id' => $this->module->id,
            'word' => 'cat',
            'position' => 1,
        ]);
        $this->word2 = Word::create([
            'word_module_id' => $this->module->id,
            'word' => 'dog',
            'position' => 2,
        ]);

        Setting::where('key', 'report_deadline')->delete();
    }

    public function test_reports_shows_all_words_when_no_deadline_set()
    {
        StudentWordMastery::create([
            'user_id' => $this->student->id,
            'word_id' => $this->word->id,
            'status' => 'training',
            'created_at' => Carbon::now(),
        ]);

        $response = $this->actingAs($this->teacher)
            ->get(route('teacher.reports'));

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Teacher/Reports')
                ->where('deadline', null)
            );
    }

    public function test_reports_shows_current_words_when_deadline_is_in_future()
    {
        $deadline = Carbon::now()->addHour();
        Setting::setValue('report_deadline', $deadline->format('Y-m-d H:i:s'));

        StudentWordMastery::create([
            'user_id' => $this->student->id,
            'word_id' => $this->word->id,
            'status' => 'training',
            'created_at' => Carbon::now()->addMinutes(30),
        ]);

        $response = $this->actingAs($this->teacher)
            ->get(route('teacher.reports'));

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Teacher/Reports')
            );
    }

    public function test_post_deadline_mastery_excluded_from_training()
    {
        $cutoffTs = '2026-08-05 13:00:00';

        // Create mastery AFTER deadline
        DB::statement(
            'INSERT INTO student_word_mastery (user_id, word_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
            [$this->student->id, $this->word2->id, 'training', '2026-08-05 13:01:00', '2026-08-05 13:01:00']
        );

        $words = WordModule::trainingWordsForUsers(
            [$this->student->id],
            $cutoffTs
        );

        $this->assertEmpty($words[$this->student->id]);
    }

    public function test_pre_deadline_mastery_included()
    {
        $cutoffTs = '2026-08-05 13:00:00';

        // Create mastery BEFORE deadline
        DB::statement(
            'INSERT INTO student_word_mastery (user_id, word_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
            [$this->student->id, $this->word->id, 'mastered', '2026-08-05 12:30:00', '2026-08-05 12:30:00']
        );

        $curriculum = WordModule::curriculumForUser($this->student->id, $cutoffTs);

        $this->assertCount(1, $curriculum[0]['mastered']);
        $this->assertEquals('cat', $curriculum[0]['mastered'][0]);
    }

    public function test_pre_deadline_training_included()
    {
        $cutoffTs = '2026-08-05 13:00:00';

        // Create training record BEFORE deadline
        DB::statement(
            'INSERT INTO student_word_mastery (user_id, word_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
            [$this->student->id, $this->word->id, 'training', '2026-08-05 12:50:00', '2026-08-05 12:50:00']
        );

        $words = WordModule::trainingWordsForUsers(
            [$this->student->id],
            $cutoffTs
        );

        $this->assertArrayHasKey('Level 1: Level 1', $words[$this->student->id]);
    }

    public function test_send_emails_allowed_when_deadline_passed()
    {
        Setting::setValue('report_deadline', Carbon::now()->subMinute()->format('Y-m-d H:i:s'));

        $response = $this->actingAs($this->teacher)
            ->post(route('teacher.reports.sendEmails'), [
                'student_ids' => [$this->student->id],
            ]);

        $response->assertRedirect()
            ->assertSessionHas('sent', 1);
    }

    public function test_export_allowed_when_deadline_passed()
    {
        Setting::setValue('report_deadline', Carbon::now()->subMinute()->format('Y-m-d H:i:s'));

        $response = $this->actingAs($this->teacher)
            ->get(route('teacher.reports.export'));

        $response->assertStatus(200);
    }

    public function test_teacher_can_set_precise_time_based_deadline()
    {
        $deadline = Carbon::now()->addMinutes(45)->format('Y-m-d H:i:s');

        $response = $this->actingAs($this->teacher)
            ->post(route('teacher.reports.deadline'), ['deadline' => $deadline]);

        $response->assertRedirect()
            ->assertSessionHas('deadline_set');

        $this->assertEquals($deadline, Setting::getValue('report_deadline'));
    }
}
