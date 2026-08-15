<?php

namespace App\Http\Controllers;

use App\Models\Badges;
use App\Models\ParagraphModule;
use App\Models\StudentProfile;
use App\Models\StudentWordMastery;
use App\Models\User;
use App\Models\WordModule;
use App\Services\BadgeService;
use App\Services\ReportService;
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
        return Inertia::render('Teacher/Dashboard',
            $this->dashboardStats()
        );
    }

    public function classes()
    {
        return Inertia::render('Teacher/Classes');
    }

    public function students(Request $request)
    {
        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');
        $section = $request->input('section', '');
        $search = $request->input('search', '');
        $status = $request->input('status', '');

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

        if ($sort === 'risk') {
            $query->orderByRaw('(COALESCE(students.wordBlastAcc,0) + COALESCE(students.storyQuestAcc,0)) / 2 desc');
        } else {
            $query->orderBy($sortCol, $sortDir);
        }

        $students = $query->paginate(8)
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
                    'currentWordBlastAcc' => $currentWordAcc ? round($currentWordAcc, 2) : null,
                    'currentStoryQuestAcc' => $currentStoryAcc ? round($currentStoryAcc, 2) : null,
                    'wordBlastAcc' => $student?->wordBlastAcc,
                    'storyQuestAcc' => $student?->storyQuestAcc,
                    'readLevel' => $readLevel,
                    'speakLevel' => $speakLevel,
                    'status' => $this->computeStatus($student?->status ?? 'notStarted'),
                ];
            });

        $sections = $this->sectionList();

        return Inertia::render('Teacher/Students', [
            'data' => $students,
            'sections' => $sections,
            'existingStudentIds' => User::where('role', 'student')->whereNotNull('student_id')->pluck('student_id'),
            'filters' => [
                'sort' => $sort,
                'direction' => $direction,
                'section' => $section,
                'search' => $search,
                'status' => $status,
            ],
        ]);
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
        $allStudents = StudentProfile::join('users', 'users.id', '=', 'students.user_id')
            ->where('users.role', 'student')
            ->select(['students.*', 'users.name'])
            ->get();

        $avgReadAccuracy = $allStudents->avg('wordBlastAcc') ?? 0;
        $avgSpeakAccuracy = $allStudents->avg('storyQuestAcc') ?? 0;
        $totalClassPoints = $allStudents->sum('points') ?? 0;

        $sections = $allStudents->pluck('section')->unique()->filter();

        $sectionPerformance = $sections->map(function ($section) use ($allStudents) {
            $sectionStudents = $allStudents->where('section', $section);
            $avgRead = $sectionStudents->avg('wordBlastAcc');
            $avgSpeak = $sectionStudents->avg('storyQuestAcc');

            if (! $avgRead && ! $avgSpeak) {
                $status = 'Not Started';
            } elseif (! $avgRead || ! $avgSpeak) {
                $status = 'In Progress';
            } else {
                $overallAvg = (($avgRead ?? 0) + ($avgSpeak ?? 0)) / 2;
                $status = $overallAvg >= 80 ? 'On Track' : ($overallAvg >= 60 ? 'Needs Support' : 'At Risk');
            }

            return [
                'section' => $section,
                'student_count' => $sectionStudents->count(),
                'avg_read' => round($avgRead ?? 0, 2),
                'avg_speak' => round($avgSpeak ?? 0, 2),
                'total_points' => $sectionStudents->sum('points'),
                'status' => $status,
            ];
        })->values();

        $atRisk = 0;
        $needsSupport = 0;
        $onTrack = 0;
        $notStarted = 0;
        $inProgress = 0;

        $students = [];
        foreach ($allStudents as $student) {
            $wordBlast = (float) $student->wordBlastAcc;
            $storyQuest = (float) $student->storyQuestAcc;

            if (! $wordBlast && ! $storyQuest) {
                $status = 'notStarted';
                $notStarted++;
            } elseif (! $wordBlast || ! $storyQuest) {
                $status = 'in_progress';
                $inProgress++;
            } else {
                $overallAvg = ($wordBlast + $storyQuest) / 2;

                if ($overallAvg >= 80) {
                    $status = 'onTrack';
                    $onTrack++;
                } elseif ($overallAvg >= 60) {
                    $status = 'needsSupport';
                    $needsSupport++;
                } else {
                    $status = 'atRisk';
                    $atRisk++;
                }
            }

            $students[] = [
                'id' => $student->user_id,
                'name' => $student->name,
                'section' => $student->section,
                'wordBlastAcc' => $student->wordBlastAcc,
                'storyQuestAcc' => $student->storyQuestAcc,
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
            'points' => $baseQuery('students.points desc'),
            'wordBlast' => $baseQuery('students.wordBlastAcc desc'),
            'storyQuest' => $baseQuery('students.storyQuestAcc desc'),
        ];

        return [
            'topStudents' => $topStudents,
            'totalStudents' => $totalStudents,
            'avgReadAccuracy' => round($avgReadAccuracy, 2),
            'avgSpeakAccuracy' => round($avgSpeakAccuracy, 2),
            'totalClassPoints' => $totalClassPoints,
            'sectionPerformance' => $sectionPerformance,
            'students' => $students,
            'chartCounts' => [
                'notStarted' => $notStarted,
                'in_progress' => $inProgress,
                'atRisk' => $atRisk,
                'needsSupport' => $needsSupport,
                'onTrack' => $onTrack,
            ],
        ];
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
        $user = User::with(['student'])->findOrFail($studentId);

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

        return redirect()->back();
    }

    public function storeBulk(Request $request)
    {
        // Normalize every row before validate so the unique rule sees trimmed
        // IDs (same trap as store(): "2023-000001 " would pass unique then collide).
        $rows = collect($request->input('students', []))
            ->map(fn ($row) => $this->normalizeStudentRow($row))
            ->values()
            ->all();

        $request->merge(['students' => $rows]);

        $validated = $request->validate([
            'students' => 'required|array|min:1|max:50',
            'students.*.fullName' => 'required|string|max:255',
            'students.*.studentID' => ['required', 'string', 'max:50', Rule::unique('users', 'student_id')],
            'students.*.section' => 'required|string|max:255',
            'students.*.pin' => 'required|digits:4',
            'students.*.gender' => 'nullable|in:male,female',
            'students.*.parent_email' => 'nullable|email|max:255',
        ]);

        // Rule::unique can't see sibling rows in the same request, so catch
        // intra-batch duplicates before any row is persisted (all-or-nothing).
        $seen = [];
        foreach ($validated['students'] as $i => $row) {
            $id = strtolower($row['studentID']);
            if (isset($seen[$id])) {
                throw ValidationException::withMessages([
                    "students.$i.studentID" => "\"{$row['studentID']}\" appears twice in this list.",
                ]);
            }
            $seen[$id] = true;
        }

        DB::transaction(function () use ($validated) {
            foreach ($validated['students'] as $row) {
                $this->persistStudent($row);
            }
        });

        return redirect()->back();
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

        $transformedModules = $modules->map(function ($module) {
            return [
                'id' => $module->id,
                'level' => $module->level,
                'title' => $module->title,
                'total_points' => $module->total_points,
                'has_progress' => $module->words->isNotEmpty()
                    && StudentWordMastery::whereIn('word_id', $module->words->pluck('id'))->exists(),
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
            'level' => 'required|integer',
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

        WordModule::saveWithWords($request->all());

        return redirect()->back();
    }

    public function paragraphModules()
    {
        $modules = ParagraphModule::all();

        return Inertia::render('Teacher/Paragraph', [
            'modules' => $modules,
        ]);
    }

    public function updateParagraphModule(Request $request)
    {
        if ($this->reportService->cutoff()) {
            return redirect()->back()->with('error', 'Cannot edit modules after the report deadline.');
        }

        $request->merge(['content' => trim((string) $request->input('content', ''))]);

        $request->validate([
            'level' => 'required|integer',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        ParagraphModule::saveWithContent($request->all());

        return redirect()->back();
    }

    public function leaderboards()
    {
        $students = StudentProfile::join('users', 'users.id', '=', 'students.user_id')
            ->where('users.role', 'student')
            ->select(
                'students.user_id',
                'users.name',
                'users.student_id',
                'students.section',
                'students.points',
                'students.wordBlastAcc',
                'students.storyQuestAcc',
                'students.avatar',
                'students.read_level',
                'students.speak_level',
                'students.status'
            )
            ->get()
            ->map(function ($s) {
                return [
                    'id' => $s->user_id,
                    'name' => $s->name,
                    'studentID' => $s->student_id,
                    'section' => $s->section ?? '',
                    'points' => $s->points ?? 0,
                    'wordBlastAcc' => $s->wordBlastAcc ?? 0,
                    'storyQuestAcc' => $s->storyQuestAcc ?? 0,
                    'avatar' => $s->avatar,
                    'readLevel' => $s->read_level ?? 1,
                    'speakLevel' => $s->speak_level ?? 1,
                    'status' => $s->status ?? 'notStarted',
                ];
            });

        $sections = $students->pluck('section')->unique()->filter()->sort()->values();

        $isDeadlineClosed = (bool) $this->reportService->deadline()?->isPast();

        return Inertia::render('Teacher/Leaderboards', [
            'leaderboard' => [
                'points' => $students->sortByDesc('points')->values(),
                'wordBlast' => $students->sortByDesc('wordBlastAcc')->values(),
                'storyQuest' => $students->sortByDesc('storyQuestAcc')->values(),
            ],
            'sections' => $sections,
            'isDeadlineClosed' => $isDeadlineClosed,
        ]);
    }

    public function badges()
    {
        User::where('role', 'student')->get()
            ->each(fn ($u) => $this->badgeService->checkAllEligibleBadges($u));

        $totalStudents = User::where('role', 'student')->count();

        $badges = Badges::withCount('users')->get()->map(fn ($b) => [
            'id' => $b->id,
            'name' => $b->name,
            'slug' => $b->slug,
            'icon' => $b->icon,
            'description' => $b->description,
            'requirement' => $b->requirement,
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
            })
            ->sortByDesc('badge_count')
            ->values();

        $totalBadges = $badges->count();
        $totalEarned = $badges->sum('earned_count');
        $mostEarnedBadge = $badges->where('earned_count', '>=', 2)->sortByDesc('earned_count')->first();
        $sections = $this->sectionList();

        $isDeadlineClosed = (bool) $this->reportService->deadline()?->isPast();

        return Inertia::render('Teacher/Badges', [
            'badges' => $badges,
            'topEarners' => $students,
            'totalStudents' => $totalStudents,
            'totalBadges' => $totalBadges,
            'totalEarned' => $totalEarned,
            'mostEarnedBadge' => $mostEarnedBadge,
            'sections' => $sections,
            'isDeadlineClosed' => $isDeadlineClosed,
        ]);
    }

    public function updateStudent(Request $request, $id)
    {
        $user = User::findOrFail($id);

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
        User::findOrFail($id)->delete();

        return redirect()->back()->with('success', 'Student deleted successfully.');
    }
}
