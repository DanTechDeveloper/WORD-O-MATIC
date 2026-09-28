<?php

namespace App\Http\Controllers;

use App\Models\Badges;
use App\Models\GameSession;
use App\Models\ParagraphModule;
use App\Models\StudentParagraphMastery;
use App\Models\StudentParagraphProgress;
use App\Models\StudentProfile;
use App\Models\StudentWordMastery;
use App\Models\StudentWordProgress;
use App\Models\User;
use App\Models\WordModule;
use App\Services\BadgeService;
use App\Services\ProgressService;
use App\Services\ReportService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class TeacherController extends Controller
{
    public function __construct(
        protected BadgeService $badgeService,
        protected ReportService $reportService,
    ) {}

    public function dashboard()
    {
        return Inertia::render('Teacher/Dashboard', $this->dashboardStats());
    }

    // ponytail: the ONE place the poll protocol lives, for all five views:
    // watermark → `since` equality → {"changed":false} short-circuit →
    // {"changed":true, watermark, …payload} → no-store. Every view method below
    // is ~4 lines and reuses its own page method's query code, so a live payload
    // can never drift from what the page rendered. A second hand-written copy of
    // these aggregates is exactly the kind of silent divergence this file
    // already avoids elsewhere.
    private function liveJson(Request $request, array $payload)
    {
        $watermark = $this->liveWatermark();
        $since = $request->query('since');

        // Exact string equality, not a timestamp comparison: the watermark is
        // already a composite, so "identical" proves nothing moved, with no
        // parsing or timezone/precision edge cases.
        if ($since !== null && $since === $watermark) {
            return response()->json(['changed' => false, 'watermark' => $watermark])
                ->withHeaders(['Cache-Control' => 'no-store']);
        }

        return response()->json([
            'changed' => true,
            'watermark' => $watermark,
            ...$payload,
        ])->withHeaders(['Cache-Control' => 'no-store']);
    }

    public function liveStats(Request $request)
    {
        return $this->liveJson($request, $this->dashboardStats());
    }

    // Students list. Reads the SAME sort/direction/section/search/status/page
    // the page request carried — the hook forwards window.location.search, so
    // the live payload is filtered identically by construction. Omits
    // existingStudentIds and sections: both derive from users.student_id /
    // students.section, neither of which a round touches, so shipping them every
    // tick would be pure bytes.
    public function liveStudents(Request $request)
    {
        // toArray(), not ->data: LengthAwarePaginator exposes no ->data
        // property, and this yields exactly the shape Inertia serialized the
        // page prop as, so the client's merge is a straight swap.
        $page = $this->studentsPage($request)->toArray();

        return $this->liveJson($request, [
            'data' => $page['data'],
            'current_page' => $page['current_page'],
            'last_page' => $page['last_page'],
            'from' => $page['from'],
            'to' => $page['to'],
            'total' => $page['total'],
        ]);
    }

    // Per-student. Same prop shape as show(), so the page spread-merges it.
    public function liveStudent(Request $request, $studentId)
    {
        $user = User::with(['student'])->where('role', 'student')->findOrFail($studentId);
        $cutoff = $this->reportService->cutoff();

        return $this->liveJson($request, array_merge($user->toArray(), [
            'readCurriculum' => WordModule::curriculumForUser($studentId, $cutoff),
            'speakCurriculum' => ParagraphModule::curriculumForUser($studentId, $cutoff),
            'latestBadge' => $this->reportService->latestBadge($studentId),
        ]));
    }

    public function liveLeaderboards(Request $request)
    {
        $props = $this->leaderboardPage($request);

        return $this->liveJson($request, [
            'leaderboard' => $props['leaderboard'],
            'totalStudents' => $props['totalStudents'],
            'sections' => $props['sections'],
            'isDeadlineClosed' => $props['isDeadlineClosed'],
        ]);
    }

    public function liveBadges(Request $request)
    {
        $props = $this->badgesPage($request);

        return $this->liveJson($request, [
            'badges' => $props['badges'],
            'topEarners' => $props['topEarners'],
            'totalStudents' => $props['totalStudents'],
            'totalBadges' => $props['totalBadges'],
            'totalEarned' => $props['totalEarned'],
            'mostEarnedBadge' => $props['mostEarnedBadge'],
            'sections' => $props['sections'],
        ]);
    }

    // Composite watermark, and BOTH halves are load-bearing:
    //
    //  - students.updated_at moves on every scored round (ProgressService
    //    update/level/status) AND on every teacher write (add/edit student,
    //    settings). A ~100-row MAX() scan — trivial.
    //  - game_sessions.id is an AUTO_INCREMENT PK, so MAX() is O(1) on InnoDB,
    //    and logSession() inserts on EVERY round. This half is what catches a
    //    round that improved nothing: ProgressService skips $student->update()
    //    when the best score did not change ($isNewBest false, $delta 0), so
    //    students.updated_at stays put — yet checkGameplayBadges() still runs
    //    and can award a streak / best_sentence badge off that session. A
    //    students-only watermark would silently drop those awards forever.
    private function liveWatermark(): string
    {
        $studentTs = StudentProfile::max('updated_at');
        $sessionId = GameSession::max('id');

        return ($studentTs ? Carbon::parse($studentTs)->toIso8601String() : '-')
            .'|'
            .($sessionId ?? 0);
    }

    public function students(Request $request)
    {
        $page = $this->studentsPage($request);

        return Inertia::render('Teacher/Students', [
            'data' => $page,
            'sections' => $this->sectionList(),
            'existingStudentIds' => User::where('role', 'student')->whereNotNull('student_id')->pluck('student_id'),
            'filters' => $this->studentFilters($request),
        ]);
    }

    private function studentFilters(Request $request): array
    {
        return [
            'sort' => $request->input('sort', 'name'),
            'direction' => $request->input('direction', 'asc'),
            'section' => $request->input('section', ''),
            'search' => $request->input('search', ''),
            'status' => $request->input('status', ''),
        ];
    }

    // Shared by students() and liveStudents() so the live payload is the SAME
    // query the page rendered — same filters, same sort, same page, same
    // per-student accuracy math.
    private function studentsPage(Request $request)
    {
        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');
        $section = $request->input('section', '');
        $search = $request->input('search', '');
        $status = $request->input('status', '');

        // ponytail: with() here is already page-scoped, whatever the reader
        // expects. Eloquent eager-loads AFTER the main query returns
        // (Eloquent/Builder.php:890-891), so paginate(8) below caps the model
        // set to 8 and the relation load binds 8 ids — NOT every student the
        // filters matched. The relations are genuinely needed: through() averages
        // wordProgress/paragraphProgress per student. Do not "fix" this by moving
        // with() after paginate() — it is the same two queries, and the reorder
        // only makes through()'s eager transform ordering load-bearing.
        // Locked at real scale by tests/Feature/StudentsEagerLoadScopeTest.php.
        $query = User::with([
            'student.wordProgress.wordModule',
            'student.paragraphProgress.paragraphModule',
        ])->where('role', 'student');

        if ($section) {
            $query->whereHas('student', fn ($q) => $q->where('section', $section));
        }

        if ($status === 'no_email') {
            $query->whereHas('student', fn ($q) => $q->whereNull('parent_email')->orWhere('parent_email', ''));
        } elseif ($status) {
            $query->whereHas('student', fn ($q) => $q->where('status', $status));
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('student_id', 'like', "%{$search}%");
            });
        }

        $sortMap = [
            'name' => ['users.name', $direction],
            'level' => ['students.read_level', 'asc'],
        ];

        [$sortCol, $sortDir] = $sortMap[$sort] ?? ['users.name', 'asc'];

        $query->join('students', 'users.id', '=', 'students.user_id')
            ->select('users.*');

        if ($sort === 'risk' || $sort === 'finalAverage') {
            $query->orderByRaw('(COALESCE(students.wordBlastAcc,0) + COALESCE(students.storyQuestAcc,0)) / 2 desc');
        } else {
            $query->orderBy($sortCol, $sortDir);
        }

        return $query->paginate(8)
            ->through(function ($user) {
                $student = $user->student;
                $readLevel = $student?->read_level ?? 1;
                $speakLevel = $student?->speak_level ?? 1;

                $currentWordAcc = $student?->wordProgress
                    ->filter(fn ($p) => $p->wordModule?->level === $readLevel)
                    ->avg('accuracy');

                $currentStoryAcc = $student?->paragraphProgress
                    ->filter(fn ($p) => $p->paragraphModule?->level === $speakLevel)
                    ->avg('accuracy');

                return [
                    'id' => $user->id,
                    'fullName' => $user->name,
                    'studentID' => $user->student_id,
                    'avatar' => $student?->avatar,
                    'section' => $student?->section ?? '',
                    'gender' => $student?->gender ?? '',
                    'parent_email' => $student?->parent_email ?? '',
                    'rotation' => 'rotate-['.rand(-3, 3).'deg]',
                    'currentWordBlastAcc' => $currentWordAcc ? (int) round($currentWordAcc) : null,
                    'currentStoryQuestAcc' => $currentStoryAcc ? (int) round($currentStoryAcc) : null,
                    'wordBlastAcc' => $student?->wordBlastAcc,
                    'storyQuestAcc' => $student?->storyQuestAcc,
                    'finalAverage' => $student?->finalAverage,
                    'readLevel' => $readLevel,
                    'speakLevel' => $speakLevel,
                    'status' => $this->computeStatus($student?->status ?? 'notStarted'),
                ];
            });
    }

    private function computeStatus(string $status): array
    {
        $labels = [
            'onTrack' => 'On Track',
            'atRisk' => 'At Risk',
            'support' => 'Needs Support',
            'notStarted' => 'Not Started',
            'in_progress' => 'In Progress',
        ];

        return [
            'type' => $status,
            'label' => $labels[$status] ?? 'Not Started',
        ];
    }

    private function sectionList()
    {
        return StudentProfile::whereHas('user', fn ($q) => $q->where('role', 'student'))
            ->whereNotNull('section')
            ->where('section', '!=', '')
            ->distinct()
            ->pluck('section')
            ->sort()
            ->values();
    }

    private function dashboardStats(): array
    {
        $compute = function () {
            $allStudents = StudentProfile::join('users', 'users.id', '=', 'students.user_id')
                ->where('users.role', 'student')
                ->select(['students.*', 'users.name'])
                ->get();

        $avgReadAccuracy = $allStudents->avg('wordBlastAcc') ?? 0;
        $avgSpeakAccuracy = $allStudents->avg('storyQuestAcc') ?? 0;
        $avgFinalAccuracy = ProgressService::finalAverage(
            (float) ($avgReadAccuracy ?? 0),
            (float) ($avgSpeakAccuracy ?? 0),
            ($avgReadAccuracy ?? 0) != 0,
            ($avgSpeakAccuracy ?? 0) != 0,
        );
        $totalClassPoints = $allStudents->sum('points') ?? 0;

        $sections = $allStudents->pluck('section')->unique()->filter();

        // Same thresholds as per-student status via the shared classifier,
        // translated to display labels for the section cards.
        $statusLabels = [
            'onTrack' => 'On Track',
            'support' => 'Needs Support',
            'atRisk' => 'At Risk',
            'in_progress' => 'In Progress',
            'notStarted' => 'Not Started',
        ];

        $sectionPerformance = $sections->map(function ($section) use ($allStudents, $statusLabels) {
            $sectionStudents = $allStudents->where('section', $section);
            $avgRead = $sectionStudents->avg('wordBlastAcc');
            $avgSpeak = $sectionStudents->avg('storyQuestAcc');

            $status = $statusLabels[ProgressService::classify(
                (float) ($avgRead ?? 0),
                (float) ($avgSpeak ?? 0),
                ($avgRead ?? 0) != 0,
                ($avgSpeak ?? 0) != 0,
            )];

            return [
                'section' => $section,
                'student_count' => $sectionStudents->count(),
                'avg_read' => (int) round($avgRead ?? 0),
                'avg_speak' => (int) round($avgSpeak ?? 0),
                'final_average' => ProgressService::finalAverage(
                    (float) ($avgRead ?? 0),
                    (float) ($avgSpeak ?? 0),
                    ($avgRead ?? 0) != 0,
                    ($avgSpeak ?? 0) != 0,
                ),
                'total_points' => $sectionStudents->sum('points'),
                'status' => $status,
            ];
        })->values();

        $counts = [
            'notStarted' => 0,
            'in_progress' => 0,
            'atRisk' => 0,
            'support' => 0,
            'onTrack' => 0,
        ];

        $students = [];
        foreach ($allStudents as $student) {
            // ponytail: stored status is SOT — written only via ProgressService::classify()
            $status = $student->status ?? 'notStarted';
            $counts[$status]++;

            $students[] = [
                'id' => $student->user_id,
                'name' => $student->name,
                'section' => $student->section,
                'wordBlastAcc' => $student->wordBlastAcc,
                'storyQuestAcc' => $student->storyQuestAcc,
                'finalAverage' => $student->finalAverage,
                'status' => $status,
            ];
        }

        $totalStudents = User::where('role', 'student')->count();

        $baseQuery = fn ($orderBy) => StudentProfile::join('users', 'users.id', '=', 'students.user_id')
            ->where('users.role', 'student')
            ->orderByRaw($orderBy)
            ->limit(10)
            ->select('users.name', 'students.section', 'students.points', 'students.wordBlastAcc', 'students.storyQuestAcc')
            ->get();

        $topStudents = [
            'points' => $baseQuery('students.points desc')->toArray(),
            'wordBlast' => $baseQuery('students.wordBlastAcc desc')->toArray(),
            'storyQuest' => $baseQuery('students.storyQuestAcc desc')->toArray(),
        ];

        return [
            'topStudents' => $topStudents,
            'totalStudents' => $totalStudents,
            'avgReadAccuracy' => (int) round($avgReadAccuracy),
            'avgSpeakAccuracy' => (int) round($avgSpeakAccuracy),
            'avgFinalAccuracy' => $avgFinalAccuracy,
            'totalClassPoints' => $totalClassPoints,
            'sectionPerformance' => $sectionPerformance->toArray(),
            'students' => $students,
            'chartCounts' => $counts,
            // Class-wide scope of the hardest-module metric. liveStats() reuses
            // this method through liveJson()'s ...$payload spread, so the 10s
            // poll ships these three keys for free — no hook or route change.
            // No cutoff is applied here on purpose: this is a live pre-deadline
            // view, and past the deadline the poll is already off
            // (Dashboard.jsx deadlineClosed) because updateMastery() stops
            // writing counters.
            'hardestWordModule' => StudentWordMastery::hardestModule(),
            'hardestParagraphModule' => StudentParagraphMastery::hardestModule(),
            'hardestWord' => StudentWordMastery::hardestWord(),
            ];
        };

        return $compute();
    }

    private function pinIsTaken(string $pin, ?string $name = null, ?int $ignoreId = null): bool
    {
        // Login resolves by name + PIN (->first()), so a PIN collision only
        // matters between students who share a name. Scoping the bcrypt scan
        // to same-name rows keeps this O(same-name count) instead of O(all).
        return User::where('role', 'student')
            ->when($name, fn ($q) => $q->where('name', $name))
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->get()
            ->contains(fn (User $user) => Hash::check($pin, $user->pin));
    }

    public function show($studentId)
    {
        $user = User::with(['student'])->where('role', 'student')->findOrFail($studentId);

        $cutoff = $this->reportService->cutoff();

        return Inertia::render('Teacher/StudentDetails', [
            'data' => array_merge($user->toArray(), [
                'readCurriculum' => WordModule::curriculumForUser($studentId, $cutoff),
                'speakCurriculum' => ParagraphModule::curriculumForUser($studentId, $cutoff),
                'latestBadge' => $this->reportService->latestBadge($studentId),
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $request->merge($this->normalizeStudentRow($request->all()));

        $request->validate([
            'fullName' => 'required|string|max:255',
            'studentID' => ['required', 'string', 'max:50', Rule::unique('users', 'student_id')],
            'section' => 'required|string|max:255',
            'pin' => 'required|digits:4',
            'gender' => 'nullable|in:male,female',
            'parent_email' => 'nullable|email|max:255',
        ]);

        if ($this->pinIsTaken($request->pin, $request->fullName)) {
            throw ValidationException::withMessages(['pin' => 'This PIN is already in use by another student.']);
        }

        $this->persistStudent([
            'fullName' => $request->fullName,
            'studentID' => $request->studentID,
            'section' => $request->section,
            'pin' => $request->pin,
            'gender' => $request->gender,
            'parent_email' => $request->parent_email,
        ]);

        return redirect()->back()->with('success', 'Student added successfully.');
    }

    private function normalizeStudentRow(mixed $row): array
    {
        $parentEmail = trim((string) ($row['parent_email'] ?? ''));

        return [
            'fullName' => trim((string) ($row['fullName'] ?? '')),
            'studentID' => trim((string) ($row['studentID'] ?? '')),
            'section' => trim((string) ($row['section'] ?? '')),
            'pin' => (string) ($row['pin'] ?? ''),
            'gender' => $row['gender'] ?? null,
            'parent_email' => $parentEmail !== '' ? strtolower($parentEmail) : null,
        ];
    }

    private function persistStudent(array $data): User
    {
        $student = User::create([
            'name' => $data['fullName'],
            'student_id' => $data['studentID'],
            'pin' => Hash::make($data['pin']),
            'role' => 'student',
        ]);

        $defaultAvatar = match ($data['gender'] ?? null) {
            'male' => '/images/boy.svg',
            'female' => '/images/girl.svg',
            default => null,
        };

        $student->student()->create([
            'points' => 0,
            'avatar' => $defaultAvatar,
            'read_progress' => 0,
            'speak_progress' => 0,
            'read_level' => 0,
            'speak_level' => 0,
            'status' => 'notStarted',
            'wordBlastAcc' => 0.0,
            'storyQuestAcc' => 0.0,
            'section' => $data['section'],
            'gender' => $data['gender'] ?? null,
            'parent_email' => $data['parent_email'] ?? null,
        ]);

        return $student;
    }

    public function wordModules()
    {
        $modules = WordModule::with('words')->get();

        // ponytail: one batched exists-check — was one query per module.
        $allWordIds = $modules->flatMap(fn ($module) => $module->words->pluck('id'))->unique()->values();
        $progressWordIds = $allWordIds->isEmpty()
            ? collect()
            : StudentWordMastery::whereIn('word_id', $allWordIds)->distinct()->pluck('word_id');

        // ponytail: mastery is written PER WORD mid-round
        // (GameplayReadMode's onWordRecognized/onMispronounce) and progress is
        // written ONCE per finished round (useGameplayCore.persistProgress) —
        // so neither table is a superset of the other and either one alone
        // misses real data. A round where the recognizer matched nothing leaves
        // a progress row and zero mastery rows; a half-read round the student
        // abandoned leaves mastery rows and no progress row. A module with
        // either is locked, so the lock has to key on the union. Two batched
        // queries, not one per module. Cast to int: MySQL hands back strings.
        $moduleIds = $modules->pluck('id')->map(fn ($id) => (int) $id);
        $withProgress = $moduleIds->isEmpty()
            ? collect()
            : StudentWordProgress::whereIn('word_module_id', $moduleIds)->distinct()->pluck('word_module_id')->map(fn ($id) => (int) $id);

        $transformedModules = $modules->map(function ($module) use ($progressWordIds, $withProgress) {
            return [
                'id' => $module->id,
                'level' => $module->level,
                'title' => $module->title,
                'total_points' => $module->total_points,
                'has_progress' => $withProgress->contains((int) $module->id)
                    || ($module->words->isNotEmpty()
                        && $module->words->pluck('id')->intersect($progressWordIds)->isNotEmpty()),
                'words' => $module->words->map(function ($word) {
                    return [
                        'id' => $word->id,
                        'word' => $word->word,
                        'position' => $word->position,
                    ];
                }),
            ];
        });

        return Inertia::render('Teacher/Word', [
            'modules' => $transformedModules,
        ]);
    }

    public function updateWordModule(Request $request)
    {
        if ($this->reportService->cutoff()) {
            return redirect()->back()->with('error', 'Cannot edit modules after the report deadline.');
        }

        $request->validate([
            // min:1 — level 0 is the tutorial module; saveWithWords upserts by
            // level and would wipe its words via words()->delete().
            'level' => 'required|integer|min:1',
            'title' => 'required|string|max:255',
            'words' => 'required|array|size:10',
            'words.*.word' => 'required|string|max:20',
            'totalScore' => 'nullable|numeric',
        ]);

        // Case-insensitive duplicate + empty-slot enforcement. Normalized in PHP
        // because MySQL's ci collation differs from SQLite (tests).
        $normalized = collect($request->words)->map(
            fn ($w) => strtolower(trim($w['word'] ?? ''))
        );

        $emptyIndex = $normalized->search(fn ($word) => $word === '');
        if ($emptyIndex !== false) {
            throw ValidationException::withMessages([
                "words.$emptyIndex.word" => 'Every word must be filled in.',
            ]);
        }

        $duplicateWord = $normalized->countBy()
            ->filter(fn ($count) => $count > 1)
            ->keys()
            ->first();

        if ($duplicateWord !== null) {
            throw ValidationException::withMessages([
                'words.'.$normalized->search($duplicateWord).'.word' => '"'.strtoupper($duplicateWord).'" is duplicated in this module.',
            ]);
        }

        // Tutorial words are included automatically: the tutorial is a
        // WordModule with level = 0, so its words live in the same table.
        $currentModuleId = WordModule::where('level', $request->level)->value('id');
        $taken = DB::table('words')
            ->join('word_modules', 'words.word_module_id', '=', 'word_modules.id')
            ->when($currentModuleId, fn ($q) => $q->where('words.word_module_id', '!=', $currentModuleId))
            ->get()
            ->mapWithKeys(fn ($row) => [strtolower($row->word) => $row->level]);

        $collision = $normalized->search(fn ($word) => isset($taken[$word]));
        if ($collision !== false) {
            $word = $normalized[$collision];
            throw ValidationException::withMessages([
                "words.$collision.word" => '"'.strtoupper($word).'" is already used in Level '.$taken[$word].'.',
            ]);
        }

        // ponytail: the modals hide the Save button entirely once a module is
        // locked, so this gate is the ENFORCEMENT, not a second warning — it
        // also covers a raw PUT or a stale page. `force` is the deliberate
        // escape hatch for a locked module and is NOT exposed by any UI: it
        // exists so a module with student data is never destroyed by accident.
        $existingModule = WordModule::where('level', $request->level)->first();
        if ($existingModule && ! $request->boolean('force')) {
            $existingWords = $existingModule->words()->get(['id', 'word']);
            $unchanged = $existingModule->title === $request->title
                && $existingWords->pluck('word')->map(fn ($w) => strtolower($w))->values()->all()
                    === $normalized->values()->all();

            $hasMastery = $existingWords->isNotEmpty() && DB::table('student_word_mastery')
                ->whereIn('word_id', $existingWords->pluck('id'))
                ->exists();

            if (! $unchanged && $hasMastery) {
                return redirect()->back()->with(
                    'error',
                    'Level '.$request->level.' is locked — students have already played it, so its words can no longer be changed.'
                );
            }
        }

        WordModule::saveWithWords($request->all());

        return redirect()->back()->with('success', 'Word Blast module saved.');
    }

    public function paragraphModules()
    {
        // with('words') is load-bearing twice: the has_progress exists-check below
        // needs the ids, and it also kills the N+1 the `total_score` accessor
        // caused on ParagraphModule::all() (it fell back to words()->count()).
        $modules = ParagraphModule::with('words')->get();

        // Same batched exists-check as wordModules() — one query for the whole
        // page, not one per module. Story Quest needs this at least as much as
        // Word Blast: saveWithContent() derives its word rows from the free-text
        // content, so an edit moves totalPossible and orphans every
        // paragraph_word_id a live round is still holding.
        $allWordIds = $modules->flatMap(fn ($module) => $module->words->pluck('id'))->unique()->values();
        $progressWordIds = $allWordIds->isEmpty()
            ? collect()
            : StudentParagraphMastery::whereIn('paragraph_word_id', $allWordIds)->distinct()->pluck('paragraph_word_id');

        // Same union as wordModules() — see the note there for why mastery alone
        // is not enough. Story Quest needs it at least as much: its word rows
        // are derived from free text, so an edit also moves totalPossible and
        // orphans every paragraph_word_id a live round is still holding.
        $moduleIds = $modules->pluck('id')->map(fn ($id) => (int) $id);
        $withProgress = $moduleIds->isEmpty()
            ? collect()
            : StudentParagraphProgress::whereIn('paragraph_module_id', $moduleIds)->distinct()->pluck('paragraph_module_id')->map(fn ($id) => (int) $id);

        $transformedModules = $modules->map(fn ($module) => array_merge(
            $module->toArray(),
            [
                'has_progress' => $withProgress->contains((int) $module->id)
                    || ($module->words->isNotEmpty()
                        && $module->words->pluck('id')->intersect($progressWordIds)->isNotEmpty()),
            ],
        ));

        return Inertia::render('Teacher/Paragraph', [
            'modules' => $transformedModules,
        ]);
    }

    public function updateParagraphModule(Request $request)
    {
        if ($this->reportService->cutoff()) {
            return redirect()->back()->with('error', 'Cannot edit modules after the report deadline.');
        }

        $request->merge(['content' => trim((string) $request->input('content', ''))]);

        $request->validate([
            // Same guard as updateWordModule: level 0 is the tutorial row.
            'level' => 'required|integer|min:1',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        // Same `force` escape contract as updateWordModule — see the note there.
        // The Save button is hidden outright for a locked module, so this is the
        // enforcement. This one matters more: saveWithContent() DERIVES the word
        // rows from the free-text content, so an edit also moves totalPossible
        // and orphans every paragraph_word_id a live round is still holding.
        $existingModule = ParagraphModule::where('level', $request->level)->first();
        if ($existingModule && ! $request->boolean('force')) {
            $existingWords = $existingModule->words()->get(['id', 'word']);
            $derived = preg_split('/\s+/', trim($request->content), -1, PREG_SPLIT_NO_EMPTY);
            $unchanged = $existingModule->title === $request->title
                && $existingWords->pluck('word')->values()->all() === ($derived === false ? [] : $derived);

            $hasMastery = $existingWords->isNotEmpty() && DB::table('student_paragraph_mastery')
                ->whereIn('paragraph_word_id', $existingWords->pluck('id'))
                ->exists();

            if (! $unchanged && $hasMastery) {
                return redirect()->back()->with(
                    'error',
                    'Level '.$request->level.' is locked — students have already played it, so its content can no longer be changed.'
                );
            }
        }

        ParagraphModule::saveWithContent($request->all());

        return redirect()->back()->with('success', 'Story Quest module saved.');
    }

    public function leaderboards(Request $request)
    {
        $props = $this->leaderboardPage($request);

        return Inertia::render('Teacher/Leaderboards', $props);
    }

    // Shared by leaderboards() and liveLeaderboards(). The cheapest view in the
    // app: ONE students×users join, then pure in-memory maps. finalAverage is
    // computed inline here rather than via the accessor, matching the null-when-
    // either-accuracy-is-zero rule.
    private function leaderboardPage(Request $request): array
    {
        $section = $request->input('section', '');
        $search = $request->input('search', '');

        $allStudents = StudentProfile::join('users', 'users.id', '=', 'students.user_id')
            ->where('users.role', 'student')
            ->select('students.user_id', 'users.name', 'users.student_id', 'students.section', 'students.points', 'students.wordBlastAcc', 'students.storyQuestAcc', 'students.avatar', 'students.read_level', 'students.speak_level', 'students.status')
            ->get()->map(function ($s) {
                $fa = ($s->wordBlastAcc ?? 0) == 0 || ($s->storyQuestAcc ?? 0) == 0 ? null : (int) round(($s->wordBlastAcc + $s->storyQuestAcc) / 2);

                return ['id' => $s->user_id, 'name' => $s->name, 'studentID' => $s->student_id, 'section' => $s->section ?? '', 'points' => $s->points ?? 0, 'wordBlastAcc' => $s->wordBlastAcc ?? 0, 'storyQuestAcc' => $s->storyQuestAcc ?? 0, 'finalAverage' => $fa, 'avatar' => $s->avatar, 'readLevel' => $s->read_level ?? 1, 'speakLevel' => $s->speak_level ?? 1, 'status' => $s->status ?? 'notStarted'];
            });

        $sections = $allStudents->pluck('section')->unique()->filter()->sort()->values()->toArray();
        $students = $allStudents;
        if ($section) {
            $students = $students->where('section', $section);
        } if ($search) {
            $students = $students->filter(fn ($s) => str_contains(strtolower($s['name']), strtolower($search)));
        }
        $isDeadlineClosed = (bool) $this->reportService->deadline()?->isPast();

        return [
            'leaderboard' => ['points' => $students->sortByDesc('points')->values()->toArray(), 'wordBlast' => $students->sortByDesc('wordBlastAcc')->values()->toArray(), 'storyQuest' => $students->sortByDesc('storyQuestAcc')->values()->toArray()],
            'totalStudents' => $allStudents->count(),
            'sections' => $sections,
            'isDeadlineClosed' => $isDeadlineClosed,
            'filters' => ['section' => $section, 'search' => $search],
        ];
    }

    public function badges(Request $request)
    {
        $props = $this->badgesPage($request);

        return Inertia::render('Teacher/Badges', $props);
    }

    // Shared by badges() and liveBadges(). Second-heaviest view: the badge pivot
    // is eager-loaded for EVERY student, so a changed tick returns one row per
    // (student, earned badge).
    private function badgesPage(Request $request): array
    {
        $section = $request->input('section', '');
        $search = $request->input('search', '');

        $totalStudents = User::where('role', 'student')->count();

        $badges = Badges::withCount('users')->get()->map(fn ($b) => [
            'id' => $b->id,
            'name' => $b->name,
            'slug' => $b->slug,
            'icon' => $b->icon,
            'description' => $b->description,
            'earned_count' => $b->users_count,
        ]);

        $students = User::where('role', 'student')
            ->with([
                'student',
                'badges' => fn ($q) => $q
                    ->wherePivot('status', 'earned')
                    ->select('badges.id', 'badges.name', 'badges.icon', 'badges.slug', 'student_badges.earned_at')
                    ->orderByPivot('earned_at', 'desc'),
            ])
            ->orderBy('users.name')
            ->get()
            ->map(function ($u) {
                $earnedBadges = $u->badges;

                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'avatar' => $u->student?->avatar,
                    'section' => $u->student?->section ?? '',
                    'badge_count' => $earnedBadges->count(),
                    'last_earned_at' => $earnedBadges->first()
                        ? $earnedBadges->first()->pivot->earned_at
                        : null,
                ];
            });

        if ($section) {
            $students = $students->where('section', $section);
        }

        if ($search) {
            $students = $students->filter(
                fn ($s) => str_contains(strtolower($s['name']), strtolower($search))
            );
        }

        $students = $students->sortByDesc('badge_count')
            ->values();

        $totalBadges = $badges->count();
        $totalEarned = $badges->sum('earned_count');
        $mostEarnedBadge = $badges->where('earned_count', '>=', 2)->sortByDesc('earned_count')->first();
        $sections = $this->sectionList()->toArray();

        $isDeadlineClosed = (bool) $this->reportService->deadline()?->isPast();

        return [
            'badges' => $badges->toArray(),
            'topEarners' => $students->toArray(),
            'totalStudents' => $totalStudents,
            'totalBadges' => $totalBadges,
            'totalEarned' => $totalEarned,
            'mostEarnedBadge' => $mostEarnedBadge,
            'sections' => $sections,
            'isDeadlineClosed' => $isDeadlineClosed,
            'filters' => ['section' => $section, 'search' => $search],
        ];
    }

    public function updateStudent(Request $request, $id)
    {
        $user = User::where('role', 'student')->findOrFail($id);

        $request->merge($this->normalizeStudentRow($request->all()));

        $request->validate([
            'fullName' => 'required',
            'section' => 'required',
            'gender' => 'nullable|in:male,female',
            'parent_email' => 'nullable|email',
            'pin' => 'nullable|digits:4',
        ]);

        $pin = $request->pin;
        $updateData = [
            'name' => $request->fullName,
        ];

        if ($pin) {
            if ($this->pinIsTaken($pin, $request->fullName, $user->id)) {
                throw ValidationException::withMessages(['pin' => 'This PIN is already in use by another student.']);
            }
            $updateData['pin'] = Hash::make($pin);
        }

        $user->update($updateData);

        $studentData = [
            'section' => $request->section,
            'gender' => $request->gender,
            'parent_email' => $request->parent_email,
        ];

        // Sync the gender-default avatar only while it's still a placeholder.
        // Students who picked a custom hero keep it (gender and avatar are decoupled).
        $defaultAvatar = match ($request->gender) {
            'male' => '/images/boy.svg',
            'female' => '/images/girl.svg',
            default => null,
        };

        $currentAvatar = $user->student()->value('avatar');
        if ($defaultAvatar && (! $currentAvatar || in_array($currentAvatar, ['/images/boy.svg', '/images/girl.svg']))) {
            $studentData['avatar'] = $defaultAvatar;
        }

        $user->student()->update($studentData);

        return redirect()->back()->with('success', 'Student updated successfully.');
    }

    public function destroy($id)
    {
        User::where('role', 'student')->findOrFail($id)->delete();

        return redirect()->back()->with('success', 'Student deleted successfully.');
    }

    public function settings()
    {
        return Inertia::render('Teacher/Settings');
    }

    public function updateSender(Request $request)
    {
        $request->validate([
            'email' => 'required|email|max:255',
            'name' => 'required|string|max:255',
        ]);

        $user = $request->user();
        $user->update([
            'email' => strtolower(trim($request->email)),
            'name' => trim($request->name),
        ]);

        return redirect()->back()->with('success', 'Sender identity updated.');
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if (! Hash::check($request->current_password, $request->user()->password)) {
            throw ValidationException::withMessages(['current_password' => 'Current password is incorrect.']);
        }

        $request->user()->update(['password' => Hash::make($request->password)]);

        return redirect()->back()->with('success', 'Password updated.');
    }
}
