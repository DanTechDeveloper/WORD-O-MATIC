<?php

namespace Tests\Feature;

use App\Models\StudentWordProgress;
use App\Models\User;
use App\Models\WordModule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Scale guard for the students() eager loads.
 *
 * NO BUG WAS FOUND HERE. `User::with([...])` sitting before `paginate(8)` looks
 * like it should load relations for every student the filters matched — it does
 * not. Eloquent eager-loads AFTER the main query returns
 * (Eloquent/Builder.php:890-891), so paginate() caps the model set to 8 and the
 * relation query binds 8 ids. A test asserting that was written, passed against
 * a reverted "fix", and proved itself vacuous.
 *
 * So this file is here for the gap that IS real: no other test reaches class
 * scale. TeacherStudentsListTest creates 10 students and a fresh DB has no
 * progress rows, so nothing ever verifies that the page-sized eager load stays
 * page-sized, that the per-level accuracy average in through() is right when
 * there ARE progress rows, or that pagination does not leak a student across
 * pages. 20 students with two progress rows each is the smallest fixture that
 * makes any of that observable — and it is the shape production has, where the
 * liveStudents poll runs it 6x/min.
 */
class StudentsEagerLoadScopeTest extends TestCase
{
    use RefreshDatabase;

    private User $teacher;

    private WordModule $levelOne;
    private WordModule $levelTwo;

    private const CLASS_SIZE = 20;
    private const PAGE_SIZE = 8;

    protected function setUp(): void
    {
        parent::setUp();

        $this->teacher = User::factory()->create(['role' => 'teacher']);
        $this->levelOne = WordModule::create(['level' => 1, 'title' => 'Level One']);
        $this->levelTwo = WordModule::create(['level' => 2, 'title' => 'Level Two']);

        for ($i = 1; $i <= self::CLASS_SIZE; $i++) {
            $user = User::factory()->create([
                'role' => 'student',
                'name' => sprintf('Student %02d', $i),
                'student_id' => sprintf('S-%04d', $i),
            ]);
            $user->student()->create([
                'points' => $i,
                'section' => 'Sector 1-A',
                'avatar' => '/images/avatars/juan/head.png',
                'read_level' => 1,
                'speak_level' => 1,
                'status' => 'in_progress',
                'wordBlastAcc' => 70,
                'storyQuestAcc' => 60,
            ]);

            // Two progress rows each, at two different levels, so the
            // per-level accuracy filter in through() has something to average.
            StudentWordProgress::create([
                'user_id' => $user->id,
                'word_module_id' => $this->levelOne->id,
                'status' => 'completed',
                'words_smashed' => 10,
                'accuracy' => 80,
            ]);
            StudentWordProgress::create([
                'user_id' => $user->id,
                'word_module_id' => $this->levelTwo->id,
                'status' => 'in_progress',
                'words_smashed' => 4,
                'accuracy' => 40,
            ]);
        }
    }

    /**
     * An eager load for N models issues `where user_id in (?×N)`, so the binding
     * count IS the number of students whose rows were fetched. It must equal the
     * page size, never the class size. This is what would catch a future N+1, a
     * load() placed before the limit, or a through() that lost its relations.
     */
    public function test_progress_relations_load_only_for_the_visible_page(): void
    {
        $boundIds = [];
        DB::listen(function ($query) use (&$boundIds) {
            if (str_contains($query->sql, 'student_word_progress')
                && str_contains(strtolower($query->sql), 'in (')) {
                $boundIds[] = count($query->bindings);
            }
        });

        $this->actingAs($this->teacher)->get('/teacher/students')->assertOk();

        $this->assertNotEmpty($boundIds, 'the word progress eager load never ran');
        $this->assertSame(
            [self::PAGE_SIZE],
            $boundIds,
            'student_word_progress must be loaded for the 8 visible students, not all '.self::CLASS_SIZE
        );
    }

    /** The same guarantee on the poll path, which runs this query 6x/min. */
    public function test_the_poll_path_scopes_the_same_way(): void
    {
        $boundIds = [];
        DB::listen(function ($query) use (&$boundIds) {
            if (str_contains($query->sql, 'student_word_progress')
                && str_contains(strtolower($query->sql), 'in (')) {
                $boundIds[] = count($query->bindings);
            }
        });

        $this->actingAs($this->teacher)->getJson('/teacher/live-students')->assertOk();

        $this->assertNotEmpty($boundIds);
        $this->assertSame([self::PAGE_SIZE], $boundIds);
    }

    /**
     * The relations are actually there and through() actually reads them: with
     * real progress rows, the per-level accuracy average must be computed, not
     * silently null. This is the assertion that a scale-blind test cannot make.
     */
    public function test_output_is_unchanged_after_the_reorder(): void
    {
        $res = $this->actingAs($this->teacher)->getJson('/teacher/live-students')->assertOk();
        $rows = $res->json('data');

        $this->assertCount(self::PAGE_SIZE, $rows);

        foreach ($rows as $row) {
            // read_level is 1, so only level-1 progress (accuracy 80) is averaged.
            $this->assertSame(80, $row['currentWordBlastAcc'], 'level-1 accuracy average');
            // speak_level 1 with no paragraph modules -> null, not zero.
            $this->assertNull($row['currentStoryQuestAcc']);
            $this->assertNotEmpty($row['fullName']);
            $this->assertSame('in_progress', $row['status']['type']);
        }
    }

    public function test_pagination_still_slices_the_class(): void
    {
        $first = $this->actingAs($this->teacher)->getJson('/teacher/live-students?page=1')->json();
        $last = $this->actingAs($this->teacher)
            ->getJson('/teacher/live-students?page=3')
            ->json();

        $this->assertSame(1, $first['current_page']);
        $this->assertCount(self::PAGE_SIZE, $first['data']);
        $this->assertSame(self::CLASS_SIZE, $first['total']);
        $this->assertSame(3, $first['last_page']);
        $this->assertCount(4, $last['data']);

        // No student appears on two pages.
        $ids = array_merge(
            array_column($first['data'], 'id'),
            array_column($last['data'], 'id')
        );
        $this->assertSame($ids, array_unique($ids));
    }
}
