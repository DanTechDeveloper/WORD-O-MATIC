<?php

namespace Tests\Feature;

use App\Models\ParagraphModule;
use App\Models\ParagraphWord;
use App\Models\StudentProfile;
use App\Models\User;
use App\Models\Word;
use App\Models\WordModule;
use App\Services\ProgressService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\View;
use Tests\TestCase;

class ReportStatusConsistencyTest extends TestCase
{
    use RefreshDatabase;

    // Reproduces the reported bug: a student who played BOTH modes and scored
    // 0% must be classified in_progress (not notStarted), and every consumer of
    // the stored status (email, Excel export) must reflect that — never go stale.
    private function playedBothZero(): StudentProfile
    {
        $student = User::factory()->create(['role' => 'student']);
        $profile = StudentProfile::factory()->for($student)->create([
            'wordBlastAcc' => 0,
            'storyQuestAcc' => 0,
            'status' => 'notStarted',
        ]);

        $wb = WordModule::create(['level' => 1, 'title' => 'WB']);
        foreach (['cat', 'dog', 'sun'] as $i => $w) {
            Word::create(['word_module_id' => $wb->id, 'word' => $w, 'position' => $i + 1]);
        }

        $sq = ParagraphModule::create(['level' => 1, 'title' => 'SQ', 'content' => 'The cat is big.']);
        foreach (['The', 'cat', 'is'] as $i => $w) {
            ParagraphWord::create(['paragraph_module_id' => $sq->id, 'word' => $w, 'position' => $i + 1]);
        }

        $service = app(ProgressService::class);
        $service->updateWordProgress($profile, $wb, wordsSmashed: 0, wordsProcessed: 3, accuracy: 0);
        $service->updateParagraphProgress($profile, $sq, wordsSmashed: 0, wordsProcessed: 3, accuracy: 0);

        $profile->refresh();

        return $profile;
    }

    public function test_stored_status_is_in_progress_after_both_zero_play(): void
    {
        $profile = $this->playedBothZero();

        // The single writer of students.status (ProgressService::recalculateStatus)
        // now yields in_progress for this case.
        $this->assertSame('in_progress', $profile->status);
    }

    public function test_email_blade_renders_in_progress_not_not_started(): void
    {
        $profile = $this->playedBothZero();
        $student = $profile->user;

        // Mirror ReportController::sendReportEmails() data shape exactly.
        $data = [
            'name' => $student->name,
            'section' => $profile->section ?? '',
            'status' => $profile->status, // stored column, line 123
            'wordBlastAcc' => $profile->wordBlastAcc ?? 0,
            'storyQuestAcc' => $profile->storyQuestAcc ?? 0,
            'read_level' => $profile->read_level ?? 1,
            'speak_level' => $profile->speak_level ?? 1,
            'wordBlastProg' => 0,
            'storyQuestProg' => 0,
            'latestBadge' => null,
            'trainingWords' => [],
            'wordAttempts' => [],
            'paragraphTrainingWords' => [],
            'paragraphWordAttempts' => [],
            'reported_at' => now()->format('F j, Y \a\t g:i A'),
        ];

        $html = View::make('emails.student-report', ['data' => $data])->render();

        // Decisive: the status badge + recommendation reflect in_progress.
        $this->assertStringContainsString('In Progress', $html);
        $this->assertStringContainsString('Progress is underway', $html);
    }

    public function test_export_array_carries_in_progress_status(): void
    {
        $profile = $this->playedBothZero();
        $student = $profile->user;

        // Mirror ReportController::exportReports() formatter (line 200-215).
        $formatted = [
            'name' => $student->name,
            'student_id' => $student->student_id,
            'section' => $profile->section ?? '',
            'status' => $profile->status, // stored column, line 204
            'wordBlastAcc' => $profile->wordBlastAcc ?? 0,
            'storyQuestAcc' => $profile->storyQuestAcc ?? 0,
            'read_level' => $profile->read_level ?? 1,
            'speak_level' => $profile->speak_level ?? 1,
        ];

        // SkillsOverviewSheet / ClassReportSheet read $s['status'] (no recompute),
        // so the export inherits the corrected stored status.
        $this->assertSame('in_progress', $formatted['status']);
    }
}
