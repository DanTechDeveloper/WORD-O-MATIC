<?php

namespace Tests\Feature;

use App\Models\GameSession;
use App\Models\ParagraphModule;
use App\Models\ParagraphWord;
use App\Models\Setting;
use App\Models\StudentProfile;
use App\Models\User;
use App\Models\Word;
use App\Models\WordModule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PendingCommitTest extends TestCase
{
    use RefreshDatabase;

    private User $student;
    private WordModule $wordModule;
    private ParagraphModule $paraModule;

    protected function setUp(): void
    {
        parent::setUp();

        Setting::where('key', 'report_deadline')->delete();

        $this->wordModule = WordModule::create(['level' => 1, 'title' => 'WB Level 1']);
        foreach (['cat','dog','sun','hat','run','big','red','cup','box','pen'] as $i => $w) {
            Word::create(['word_module_id' => $this->wordModule->id, 'word' => $w, 'position' => $i+1]);
        }

        $this->paraModule = ParagraphModule::create(['level' => 1, 'title' => 'SQ Level 1', 'content' => 'The cat is big and fat.']);
        foreach (['The','cat','is','big','and','fat.'] as $i => $w) {
            ParagraphWord::create(['paragraph_module_id' => $this->paraModule->id, 'word' => $w, 'position' => $i+1]);
        }

        $this->student = User::factory()->create(['role' => 'student']);
        StudentProfile::factory()->for($this->student)->create(['wordBlastAcc'=>0,'storyQuestAcc'=>0,'status'=>'notStarted','points'=>0]);
        $this->student->student->update(['tutorial_completed_at' => now()]);
    }

    public function test_word_refresh_replay_does_not_double_points_or_overwrite_best(): void
    {
        // Simulate F5 while finishRound slow: client writes pending then POSTs same payload 3 times rapidly
        $payload = ['module_id' => $this->wordModule->id, 'words_smashed' => 7, 'words_processed' => 10, 'streak' => 3];

        foreach (range(1,3) as $_) {
            $this->actingAs($this->student)->post(route('student.saveWordProgress'), $payload)->assertRedirect();
        }

        $this->student->refresh();
        $this->assertEquals(7, $this->student->student->points, 'pending replay must not double points');
        $this->assertEquals(70, (int) $this->student->student->wordBlastAcc);
        // each POST still logs a session (cosmetic) — best-score-only protects denormalized columns, not row count
        $this->assertEquals(3, GameSession::where('user_id',$this->student->id)->where('module_type','word')->count());

        // Worse replay must not downgrade best
        $this->actingAs($this->student)->post(route('student.saveWordProgress'), [
            'module_id' => $this->wordModule->id, 'words_smashed' => 2, 'words_processed' => 10, 'streak' => 1,
        ])->assertRedirect();

        $this->student->refresh();
        $this->assertEquals(7, $this->student->student->points);
        $this->assertEquals(70, (int) $this->student->student->wordBlastAcc);
    }

    public function test_paragraph_refresh_replay_preserves_sentence_scores(): void
    {
        $payload = ['module_id' => $this->paraModule->id, 'words_smashed' => 5, 'words_processed' => 6, 'sentence_scores' => [3,2]];

        $this->actingAs($this->student)->post(route('student.saveParagraphProgress'), $payload)->assertRedirect();
        $first = GameSession::where('user_id',$this->student->id)->where('module_type','paragraph')->firstOrFail();
        $this->assertSame([3,2], $first->sentence_scores);

        // F5 replay same pending
        $this->actingAs($this->student)->post(route('student.saveParagraphProgress'), $payload)->assertRedirect();

        $this->student->refresh();
        // best-score-only: second identical replay must not inflate points
        $this->assertEquals(5, $this->student->student->points);
        // sentence_scores of first session still intact
        $this->assertSame([3,2], $first->refresh()->sentence_scores);
    }

    public function test_results_safe_without_refresh_shows_persisted_session(): void
    {
        $this->actingAs($this->student)->post(route('student.saveWordProgress'), [
            'module_id' => $this->wordModule->id, 'words_smashed' => 9, 'words_processed' => 10, 'streak' => 4,
        ])->assertRedirect();

        $session = GameSession::where('user_id',$this->student->id)->latest('id')->firstOrFail();

        $this->actingAs($this->student)->get(route('student.results',$session->id))
            ->assertSuccessful()
            ->assertInertia(fn($p)=>$p->where('session.id',$session->id)->where('bestScore',9));
    }

    public function test_tutorial_remains_read_only_even_after_multiple_posts(): void
    {
        $tut = WordModule::create(['level'=>0,'title'=>'Tutorial','is_tutorial'=>true]);
        Word::create(['word_module_id'=>$tut->id,'word'=>'cat','position'=>1]);

        // During onboarding tutorial is read-only for points/accuracy (deferPersist path)
        $freshStudent = User::factory()->create(['role'=>'student']);
        StudentProfile::factory()->for($freshStudent)->create(['wordBlastAcc'=>0,'storyQuestAcc'=>0,'status'=>'notStarted','points'=>0]);

        $this->actingAs($freshStudent)->post(route('student.saveWordProgress'), [
            'module_id'=>$tut->id,'words_smashed'=>1,'words_processed'=>1,
        ])->assertRedirect(route('student.tutorial'));

        $freshStudent->refresh();
        $this->assertEquals(0, $freshStudent->student->points);
        $this->assertSame(0.0, (float)$freshStudent->student->wordBlastAcc);
    }

    public function test_same_client_token_is_idempotent_no_duplicate_session(): void
    {
        $token = 'tok-'.uniqid();
        $payload = ['module_id'=>$this->wordModule->id,'words_smashed'=>6,'words_processed'=>10,'streak'=>2,'client_token'=>$token];

        $this->actingAs($this->student)->post(route('student.saveWordProgress'), $payload)->assertRedirect();
        $firstId = GameSession::where('user_id',$this->student->id)->latest('id')->value('id');

        // Replay with same token (simulates F5 pending replay)
        $this->actingAs($this->student)->post(route('student.saveWordProgress'), $payload)->assertRedirect();
        $secondId = GameSession::where('user_id',$this->student->id)->latest('id')->value('id');

        $this->assertEquals($firstId, $secondId, 'same client_token must reuse session');
        $this->assertEquals(1, GameSession::where('user_id',$this->student->id)->where('module_id',$this->wordModule->id)->count());
        $this->assertEquals(6, $this->student->refresh()->student->points);
    }

    public function test_different_client_token_creates_new_session(): void
    {
        $base = ['module_id'=>$this->wordModule->id,'words_smashed'=>6,'words_processed'=>10,'streak'=>2];

        $this->actingAs($this->student)->post(route('student.saveWordProgress'), $base + ['client_token'=>'tok-a'])->assertRedirect();
        $this->actingAs($this->student)->post(route('student.saveWordProgress'), $base + ['client_token'=>'tok-b'])->assertRedirect();

        $this->assertEquals(2, GameSession::where('user_id',$this->student->id)->where('module_id',$this->wordModule->id)->count());
    }
}
