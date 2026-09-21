<?php

namespace App\Http\Controllers;

use App\Models\Badges;
use App\Models\GameSession;
use App\Models\ParagraphModule;
use App\Models\ParagraphWord;
use App\Models\StudentParagraphMastery;
use App\Models\StudentParagraphProgress;
use App\Models\StudentProfile;
use App\Models\StudentWordMastery;
use App\Models\StudentWordProgress;
use App\Models\User;
use App\Models\Word;
use App\Models\WordModule;
use App\Services\BadgeService;
use App\Services\LevelService;
use App\Services\ProgressService;
use App\Services\ReportService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class StudentController extends Controller
{
    public function __construct(
        protected BadgeService $badgeService,
        protected LevelService $levelService,
        protected ProgressService $progressService,
        protected ReportService $reportService,
    ) {}

    public function splashScreen()
    {
        return Inertia::render('Student/SplashScreen');
    }

    public function avatarSelection()
    {
        return Inertia::render('Student/AvatarSelection');
    }

    public function dashboard()
    {
        $user = auth()->user();
        [
            'tutWord' => $tutWord,
            'tutPara' => $tutPara,
            'wordTutorialDone' => $wordTutorialDone,
            'speakTutorialDone' => $speakTutorialDone,
        ] = $this->tutorialState($user);

        $totalReadPoints = (int) Word::query()
            ->when($tutWord, fn ($q) => $q->where('word_module_id', '!=', $tutWord->id))
            ->count();
        $totalSpeakPoints = (int) ParagraphWord::query()
            ->when($tutPara, fn ($q) => $q->where('paragraph_module_id', '!=', $tutPara->id))
            ->count();

        $earnedReadPoints = StudentWordProgress::where('user_id', $user->id)
            ->when($tutWord, fn ($q) => $q->where('word_module_id', '!=', $tutWord->id))
            ->sum('words_smashed');
        $earnedSpeakPoints = StudentParagraphProgress::where('user_id', $user->id)
            ->when($tutPara, fn ($q) => $q->where('paragraph_module_id', '!=', $tutPara->id))
            ->sum('words_smashed');

        return Inertia::render('Student/Dashboard', [
            'totalReadPoints' => $totalReadPoints,
            'totalSpeakPoints' => $totalSpeakPoints,
            'earnedReadPoints' => $earnedReadPoints,
            'earnedSpeakPoints' => $earnedSpeakPoints,
            'wordTutorialDone' => $wordTutorialDone,
            'speakTutorialDone' => $speakTutorialDone,
            'tutorialComplete' => (bool) ($user->student?->tutorial_completed_at),
            'tutorialSkipped' => (bool) ($user->student?->tutorial_skipped_at),
        ]);
    }

    public function skipTutorial()
    {
        $user = auth()->user();
        $student = $user->student;
        if (! $student) {
            return redirect()->route('student.dashboard');
        }
        if ($student->tutorial_completed_at || $student->tutorial_skipped_at) {
            return redirect()->route('student.dashboard');
        }
        $student->update(['tutorial_skipped_at' => now()]);

        return redirect()->route('student.dashboard')->with('success', 'Tutorial skipped. Play anytime — replay both tutorials via Tutorial to earn the badge.');
    }

    public function tutorialPage()
    {
        $user = auth()->user();
        [
            'wordTutorialDone' => $wordTutorialDone,
            'speakTutorialDone' => $speakTutorialDone,
        ] = $this->tutorialState($user);

        return Inertia::render('Student/TutorialPage', [
            'wordTutorialDone' => $wordTutorialDone,
            'speakTutorialDone' => $speakTutorialDone,
            'tutorialComplete' => (bool) ($user->student?->tutorial_completed_at),
            'tutorialSkipped' => (bool) ($user->student?->tutorial_skipped_at),
        ]);
    }

    public function updateAvatar(Request $request)
    {
        $request->validate([
            'avatar_url' => ['required', 'string'],
        ]);

        $user = auth()->user();

        if ($user && $user->student) {
            $user->student->update([
                'avatar' => $request->avatar_url,
            ]);

            $badgeData = $this->badgeService->awardOnboardingBadge($user, 'profile-pioneer');

            if ($badgeData) {
                return redirect()->route('student.dashboard')->with('new_badges', [$badgeData]);
            }

            return redirect()->route('student.dashboard')->with('success', 'Avatar updated successfully!');
        }

        return redirect()->back()->with('error', 'Student profile not found.');
    }

    public function leaderboards()
    {
        $leaderboard = StudentProfile::with('user:id,name,student_id')
            ->whereHas('user', fn ($q) => $q->where('role', 'student'))
            ->orderBy('points', 'desc')
            ->get(['user_id', 'points', 'avatar']);

        return Inertia::render('Student/Leaderboards', [
            'leaderboard' => $leaderboard,
            'totalStudents' => $leaderboard->count(),
        ]);
    }

    public function badges()
    {
        $user = auth()->user();
        $student = $user->student;

        // ponytail: idempotent catch-up so 7/5 can't stay locked until next module
        $this->badgeService->checkAllEligibleBadges($user);

        $badges = Badges::withExists(['users as is_earned' => function ($query) use ($user) {
            $query->where('student_badges.user_id', $user->id);
        }])->get()->map(function ($badge) use ($user, $student) {
            $badge->threshold = $badge->threshold_score;

            if ($badge->threshold_score !== null) {
                $tutIds = array_filter([
                    WordModule::tutorialId(),
                    ParagraphModule::tutorialId(),
                ]);
                $sessionQuery = GameSession::where('user_id', $user->id)
                    ->where('is_deadline_hit', false)
                    ->when($tutIds, fn ($q) => $q->whereNotIn('module_id', $tutIds));

                $badge->current_value = match ($badge->metric) {
                    'total_points' => $student ? $student->points : 0,
                    'streak' => (clone $sessionQuery)->where('module_type', 'word')->max('streak') ?? 0,
                    'accuracy' => $student ? max((float) $student->wordBlastAcc, (float) $student->storyQuestAcc) : 0,
                    'paragraph_completion' => $this->badgeService->calculateModuleCompletion($user, 'paragraph'),
                    'word_completion' => $this->badgeService->calculateModuleCompletion($user, 'word'),
                    default => 0,
                };
            } else {
                $badge->current_value = null;
            }

            return $badge;
        });

        // ponytail: skip unlocks full gameplay — show all badges while
        // skipped (only tutorial-complete stays locked until replay). True
        // onboarding (no skip) still shows onboarding-only.
        if (! $student?->tutorial_completed_at && ! $student?->tutorial_skipped_at) {
            $badges = $badges->whereIn('slug', ['tutorial-complete', 'profile-pioneer'])->values();
        }

        return Inertia::render('Student/Badges', [
            'badges' => $badges,
            'tutorialSkipped' => (bool) ($student?->tutorial_skipped_at),
            'wordTutorialDone' => $this->tutorialState($user)['wordTutorialDone'],
            'speakTutorialDone' => $this->tutorialState($user)['speakTutorialDone'],
        ]);
    }

    public function readModeLevels()
    {
        return $this->levelsPage(auth()->user(), 'word');
    }

    private function levelsPage(User $user, string $mode)
    {
        [
            'tutWord' => $tutWord,
            'tutPara' => $tutPara,
            'wordTutorialDone' => $wordTutorialDone,
            'speakTutorialDone' => $speakTutorialDone,
        ] = $this->tutorialState($user);

        $tutModule = $mode === 'word' ? $tutWord : $tutPara;
        $progressModel = $mode === 'word' ? StudentWordProgress::class : StudentParagraphProgress::class;
        $progressColumn = $mode === 'word' ? 'word_module_id' : 'paragraph_module_id';

        // Skipped users bypass onboarding lock — both modes show real levels
        $isOnboarding = ! $user->student?->tutorial_completed_at && ! $user->student?->tutorial_skipped_at;
        if ($isOnboarding) {
            $progress = $progressModel::where('user_id', $user->id)
                ->where($progressColumn, $tutModule->id)->first();
            $modules = collect([[
                'id' => $tutModule->id,
                'level' => $tutModule->level,
                'title' => $tutModule->title,
                'total_points' => $tutModule->words()->count(),
                'status' => $progress && $progress->status === 'completed' ? 'completed' : 'current',
                'words_smashed' => $progress ? $progress->words_smashed : 0,
                'is_tutorial' => true,
            ]]);
        } else {
            $modules = $mode === 'word'
                ? $this->levelService->getWordModuleStatuses($user->id)
                : $this->levelService->getSpeakModuleStatuses($user->id);
        }

        return Inertia::render('Student/LevelsPage', [
            'modules' => $modules,
            'mode' => $mode === 'word' ? 'read' : 'speak',
            'tutorialComplete' => (bool) $user->student?->tutorial_completed_at,
            'tutorialSkipped' => (bool) $user->student?->tutorial_skipped_at,
            'wordTutorialDone' => $wordTutorialDone,
            'speakTutorialDone' => $speakTutorialDone,
        ]);
    }

    public function gameplayReadMode($level)
    {
        return $this->gameplayPage($level, 'word');
    }

    private function gameplayPage($level, string $type)
    {
        $user = auth()->user();
        $isWord = $type === 'word';
        $moduleClass = $isWord ? WordModule::class : ParagraphModule::class;
        $levelsRoute = $isWord ? 'student.readModeLevels' : 'student.speakModeLevels';
        $page = $isWord ? 'Student/GameplayReadMode' : 'Student/GameplaySpeakMode';

        // Routes are level-based (the domain key — see saveWithWords), so the
        // tutorial is naturally /gameplayReadMode/0.
        $module = $moduleClass::with('words')
            ->select($isWord
                ? ['id', 'level', 'title', 'is_tutorial']
                : ['id', 'level', 'title', 'content', 'is_tutorial'])
            ->where('level', $level)
            ->firstOrFail();
        $id = $module->id;

        // ponytail: past deadline = practice — Level Page stays open until GameResults, all writes readonly (finishRound isPractice)
        // KEEP mid-game readonly (cutoff hit while playing still readonly), but don't block entry.
        // if (! $module->is_tutorial && $this->reportService->cutoff()) redirect removed.

        $isOnboarding = ! $user->student?->tutorial_completed_at && ! $user->student?->tutorial_skipped_at;
        if ($isOnboarding && ! $module->is_tutorial) {
            return redirect()->route($levelsRoute);
        }

        if (! $this->levelService->isModuleAccessible($user->id, $id, $type)) {
            return redirect()->route($levelsRoute);
        }

        $data = [
            'module' => $module,
            'tutorialComplete' => (bool) $user->student?->tutorial_completed_at,
            'tutorialSkipped' => (bool) $user->student?->tutorial_skipped_at,
            'wordTutorialDone' => $this->tutorialState($user)['wordTutorialDone'],
            // ponytail: Story Quest gates its own mechanics tour on this — Word
            // Blast completion must NOT skip it (different mechanics).
            'speakTutorialDone' => $this->tutorialState($user)['speakTutorialDone'],
        ];

        return Inertia::render($page, $data);
    }

    public function saveWordProgress(Request $request)
    {
        return $this->saveProgress($request, 'word');
    }

    public function updateWordMastery(Request $request)
    {
        return $this->updateMastery($request, 'word');
    }

    public function updateParagraphMastery(Request $request)
    {
        return $this->updateMastery($request, 'paragraph');
    }

    private function updateMastery(Request $request, string $type)
    {
        $idColumn = $type === 'word' ? 'word_id' : 'paragraph_word_id';
        $model = $type === 'word' ? StudentWordMastery::class : StudentParagraphMastery::class;

        $request->validate([
            $idColumn => ['required', 'exists:'.($type === 'word' ? 'words' : 'paragraph_words').',id'],
            'status' => 'required|in:mastered,training',
        ]);

        // Post-deadline rounds must not write mastery rows or counters (BF7/BF10).
        if ($this->reportService->cutoff()) {
            return response()->noContent();
        }

        // Sticky: once mastered, both status and failed_attempts are frozen forever.
        $existing = $model::where('user_id', auth()->id())
            ->where($idColumn, $request->$idColumn)
            ->first();
        if ($existing && $existing->status === 'mastered') {
            return response()->noContent();
        }

        if ($request->status === 'training') {
            $affected = $model::where('user_id', auth()->id())
                ->where($idColumn, $request->$idColumn)
                ->where('status', '!=', 'mastered')
                ->increment('failed_attempts');

            if ($affected === 0) {
                // Row is either missing (first training attempt) or already mastered.
                if (! $model::where('user_id', auth()->id())->where($idColumn, $request->$idColumn)->exists()) {
                    $model::create([
                        'user_id' => auth()->id(),
                        $idColumn => $request->$idColumn,
                        'status' => 'training',
                        'failed_attempts' => 1,
                    ]);
                }
            }

            return response()->noContent();
        }

        // First mastery: the counter freezes as-is = attempts needed to master.
        $model::updateOrCreate(
            ['user_id' => auth()->id(), $idColumn => $request->$idColumn],
            ['status' => 'mastered']
        );

        return response()->noContent();
    }

    public function speakModeLevels()
    {
        return $this->levelsPage(auth()->user(), 'paragraph');
    }

    public function gameplaySpeakMode($level)
    {
        return $this->gameplayPage($level, 'speak');
    }

    public function saveParagraphProgress(Request $request)
    {
        return $this->saveProgress($request, 'paragraph');
    }

    private function saveProgress(Request $request, string $type)
    {
        $request->validate([
            'module_id' => ['required', 'exists:'.($type === 'word' ? 'word_modules' : 'paragraph_modules').',id'],
            'words_smashed' => 'required|integer|min:0',
            'words_processed' => 'required|integer|min:0',
            'streak' => 'nullable|integer|min:0',
            'client_token' => ['nullable', 'string', 'max:64'],
            // ponytail: sentence_scores is presentation detail (SQ only) —
            // score stays the authoritative aggregate. Sum must match smashed.
            'sentence_scores' => $type === 'paragraph'
                ? ['nullable', 'array', function ($attribute, $value, $fail) use ($request) {
                    if (! is_array($value)) {
                        return;
                    }
                    foreach ($value as $v) {
                        if (! is_numeric($v) || (int) $v < 0 || (float) $v != (int) $v) {
                            $fail('Each sentence score must be a non-negative integer.');

                            return;
                        }
                    }
                    if (array_sum(array_map('intval', $value)) !== (int) $request->words_smashed) {
                        $fail('Sentence scores must add up to words smashed.');
                    }
                }]
                : ['prohibited'],
            'sentence_scores.*' => $type === 'paragraph' ? ['integer', 'min:0'] : [],
        ]);

        $moduleClass = $type === 'word' ? WordModule::class : ParagraphModule::class;

        return $this->finishRound(auth()->user(), $moduleClass::findOrFail($request->module_id), $request, $type);
    }

    private function finishRound(User $user, WordModule|ParagraphModule $module, Request $request, string $type): \Illuminate\Http\RedirectResponse|\Inertia\Response
    {
        // Tutorial execution is `!completed` only — skipped users replaying via
        // TutorialPage still run the guided tutorial (sequential), not scored play.
        $isTutorial = $module->is_tutorial && ! $user->student?->tutorial_completed_at;

        // ponytail: idempotency for F5 replay — same client_token within 60s reuses session, no duplicate row
        if ($request->filled('client_token')) {
            $cacheKey = "pending_token:{$user->id}:{$request->input('client_token')}";
            if ($cachedId = Cache::get($cacheKey)) {
                if ($existing = GameSession::find($cachedId)) {
                    return redirect()->route('student.results', ['id' => $existing->id]);
                }
            }
        }

        if ($isTutorial) {
            $totalPossible = $module->words()->count();
            $wordsSmashed = min($request->words_smashed, $totalPossible);
            $accuracy = $totalPossible > 0 ? (int) round(min(($wordsSmashed / $totalPossible) * 100, 100)) : 0;
            $session = GameSession::logSession($user->id, $module->id, $type, $wordsSmashed, $accuracy, 0, false);
            if ($request->filled('client_token')) {
                Cache::put("pending_token:{$user->id}:{$request->input('client_token')}", $session->id, 120);
            }
            if ($type === 'word') {
                $this->progressService->updateWordProgress($user->student, $module, 0, $request->words_processed, 0, isTutorial: true, totalWords: $totalPossible);
            } else {
                $this->progressService->updateParagraphProgress($user->student, $module, 0, $request->words_processed, 0, isTutorial: true, totalWords: $totalPossible);
            }
            $badgesData = $this->checkTutorialCompletion($user);

            if ($badgesData) {
                // Full sequential completion — Dashboard AvatarSpeechBubble is the end, not GameResults
                if ($user->student->tutorial_skipped_at) {
                    $user->student->update(['tutorial_skipped_at' => null]);
                }
                return redirect()->route('student.dashboard')->with('new_badges', [$badgesData]);
            }

            // ponytail: Word Blast mid-sequence goes to Dashboard for fresh onboarding
            // (Dashboard highlight shows Story Quest next); skipped users replaying
            // stay on TutorialPage so Story Quest unlock is visible.
            if (! $user->student->refresh()->tutorial_completed_at) {
                // skipped replay → TutorialPage, fresh onboarding → Dashboard
                if ($user->student->tutorial_skipped_at) {
                    return redirect()->route('student.tutorial');
                }
                return redirect()->route('student.dashboard');
            }

            // Fallback (should not hit — completion returns above); keep for safety
            return redirect()->route('student.dashboard');
        }

        $totalPossible = $module->words()->count();

        if ($request->words_processed > $totalPossible) {
            throw ValidationException::withMessages([
                'words_processed' => 'Words processed cannot exceed the module word count.',
            ]);
        }

        $wordsSmashed = min($request->words_smashed, $totalPossible);
        // ponytail: Story Quest has no streak mechanic — server forces 0
        // (never trust the client), so SQ sessions can't feed streak badges.
        $streak = $type === 'paragraph' ? 0 : min($request->streak ?? 0, $wordsSmashed + 1);
        $accuracy = $totalPossible > 0
            ? (int) round(min(($wordsSmashed / $totalPossible) * 100, 100))
            : 0;

        // ponytail: past deadline = practice — keep mid-game readonly (cutoff hit while playing) and extend to all past,
        // all aspects readonly (GameSession / ProgressService / BadgeService / mastery / students).
        $isPractice = (bool) $this->reportService->cutoff();
        
        if ($isPractice) {
            // zero writes: transient GameResults (no GameSession, no Progress, no Badge), bestScore stays persisted
            $rawScores = $type === 'paragraph' ? $request->sentence_scores : null;
            $sentenceScores = $rawScores ? array_map('intval', (array) $rawScores) : null;

            $transientSession = [
                'id' => 0,
                'score' => $wordsSmashed,
                'accuracy' => $accuracy,
                'streak' => $streak,
                'module_type' => $type,
                'sentence_scores' => $sentenceScores,
            ];

            $nextModule = $type === 'word'
                ? WordModule::where('level', $module->level + 1)->where('is_tutorial', false)->first()
                : ParagraphModule::where('level', $module->level + 1)->where('is_tutorial', false)->first();
            $maxLevel = $type === 'word'
                ? WordModule::where('is_tutorial', false)->max('level')
                : ParagraphModule::where('is_tutorial', false)->max('level');
            $isMaxLevel = $maxLevel !== null && $module->level >= $maxLevel;
            $bestScore = GameSession::where('user_id', $user->id)
                ->where('module_id', $module->id)
                ->where('module_type', $type)
                ->where('is_deadline_hit', false)
                ->max('score') ?? 0;

            return \Inertia\Inertia::render('Student/GameResults', [
                'session' => $transientSession,
                'moduleTitle' => $module->title,
                'totalItems' => $totalPossible,
                'badgeProgress' => [],
                'moduleLevel' => $module->level,
                'nextModuleLevel' => $nextModule?->level,
                'isMaxLevel' => $isMaxLevel,
                'deadlineHit' => false,
                'isPractice' => true,
                'bestScore' => (int) $bestScore,
                'isTutorial' => false,
                'sentenceScores' => $sentenceScores,
            ]);
        }

        $rawScores = $type === 'paragraph' ? $request->sentence_scores : null;
        $sentenceScores = $rawScores ? array_map('intval', (array) $rawScores) : null;
        $session = GameSession::logSession($user->id, $module->id, $type, $wordsSmashed, $accuracy, $streak, false, $sentenceScores);
        if ($request->filled('client_token')) {
            Cache::put("pending_token:{$user->id}:{$request->input('client_token')}", $session->id, 120);
        }

        if ($type === 'word') {
            $this->progressService->updateWordProgress($user->student, $module, $wordsSmashed, $request->words_processed, $accuracy, totalWords: $totalPossible);
        } else {
            $this->progressService->updateParagraphProgress($user->student, $module, $wordsSmashed, $request->words_processed, $accuracy, totalWords: $totalPossible);
        }

        $redirect = redirect()->route('student.results', ['id' => $session->id]);

        $badgesData = [];
        foreach ($this->badgeService->checkGameplayBadges($user, $session->id, $accuracy) as $badge) {
            $badgesData[] = [
                'name' => $badge->name,
                'description' => $badge->description,
                'slug' => $badge->slug,
                'icon' => $badge->icon,
            ];
        }

        if ($tutorialBadge = $this->checkTutorialCompletion($user)) {
            $badgesData[] = $tutorialBadge;
        }

        return ! empty($badgesData) ? $redirect->with('new_badges', $badgesData) : $redirect;
    }

    public function results($id)
    {
        $session = GameSession::findOrFail($id);

        if ($session->user_id !== auth()->id()) {
            return redirect()->route('student.dashboard')
                ->with('error', 'Access denied.');
        }

        // ponytail: mid-sequence tutorial Word finish has no results screen —
        // fresh onboarding bounces to Dashboard (Story Quest via Dashboard highlight),
        // skipped replay bounces to TutorialPage so unlock is visible.
        $bounceModule = $session->module_type === 'word'
            ? WordModule::find($session->module_id)
            : ParagraphModule::find($session->module_id);
        if ($bounceModule?->is_tutorial && ! auth()->user()?->student?->tutorial_completed_at) {
            if (auth()->user()?->student?->tutorial_skipped_at) {
                return redirect()->route('student.tutorial');
            }
            return redirect()->route('student.dashboard');
        }

        $latestId = GameSession::where('user_id', auth()->id())->max('id');
        if ((int) $id !== (int) $latestId) {
            return redirect()->route('student.results', ['id' => $latestId]);
        }

        if ($session->module_type === 'word') {
            $module = WordModule::withCount('words')->find($session->module_id);
            $maxLevel = WordModule::where('is_tutorial', false)->max('level');
        } else {
            $module = ParagraphModule::withCount('words')->find($session->module_id);
            $maxLevel = ParagraphModule::where('is_tutorial', false)->max('level');
        }

        // A deleted module must not 500 the results page (CAVEATS.md L2).
        if (! $module) {
            return redirect()->route('student.dashboard')
                ->with('error', 'That session is no longer available.');
        }

        if ($session->module_type === 'word') {
            $nextModule = WordModule::where('level', $module->level + 1)
                ->where('is_tutorial', false)
                ->first();
        } else {
            $nextModule = ParagraphModule::where('level', $module->level + 1)
                ->where('is_tutorial', false)
                ->first();
        }
        $totalItems = $module->words_count;

        $user = auth()->user();
        $badgeProgress = $user ? $this->badgeService->getBadgeProgress($user, $session) : [];

        $isMaxLevel = $maxLevel !== null && $module->level >= $maxLevel;

        // ponytail: best score is MAX(score) for this module/user, deadline-hit excluded — no new table, indexed query
        $bestScore = GameSession::where('user_id', auth()->id())
            ->where('module_id', $module->id)
            ->where('module_type', $session->module_type)
            ->where('is_deadline_hit', false)
            ->max('score') ?? 0;

        return Inertia::render('Student/GameResults', [
            'session' => $session,
            'moduleTitle' => $module->title,
            'totalItems' => $totalItems,
            'badgeProgress' => $badgeProgress,
            'moduleLevel' => $module->level,
            'nextModuleLevel' => $nextModule?->level,
            'isMaxLevel' => $isMaxLevel,
            'deadlineHit' => (bool) $session->is_deadline_hit,
            'bestScore' => (int) $bestScore,
            'isTutorial' => (bool) $module->is_tutorial,
            // ponytail: SQ-only presentation detail (rendered, never recalculated).
            'sentenceScores' => $session->sentence_scores ?? null,
        ]);
    }

    private function checkTutorialCompletion(User $user): ?array
    {
        [
            'wordTutorialDone' => $wordTutorialDone,
            'speakTutorialDone' => $speakTutorialDone,
        ] = $this->tutorialState($user);

        if ($wordTutorialDone && $speakTutorialDone) {
            if (! $user->student->tutorial_completed_at) {
                $updates = ['tutorial_completed_at' => now()];
                if ($user->student->tutorial_skipped_at) {
                    $updates['tutorial_skipped_at'] = null;
                }
                $user->student->update($updates);
            } elseif ($user->student->tutorial_skipped_at) {
                $user->student->update(['tutorial_skipped_at' => null]);
            }

            return $this->badgeService->awardOnboardingBadge($user, 'tutorial-complete');
        }

        return null;
    }

    private function tutorialState(User $user): array
    {
        $tutWord = WordModule::tutorial();
        $tutPara = ParagraphModule::tutorial();

        return [
            'tutWord' => $tutWord,
            'tutPara' => $tutPara,
            'wordTutorialDone' => $tutWord && StudentWordProgress::where('user_id', $user->id)
                ->where('word_module_id', $tutWord->id)->where('status', 'completed')->exists(),
            'speakTutorialDone' => $tutPara && StudentParagraphProgress::where('user_id', $user->id)
                ->where('paragraph_module_id', $tutPara->id)->where('status', 'completed')->exists(),
        ];
    }

    public function deepgramToken(Request $request)
    {
        $key = config('services.deepgram.key');
        if (! $key) {
            abort(500, 'Deepgram not configured');
        }

        $region = config('services.deepgram.region', 'global');
        $host = match ($region) {
            'eu' => 'api.eu.deepgram.com',
            'au' => 'api.au.deepgram.com',
            default => 'api.deepgram.com',
        };

        // ponytail: grant token is server-wide (same key/region), not user-specific.
        // Cache it so we don't proxy a Deepgram API call per student session.
        // TTL buffer: Deepgram grants 3600s; cache 3500s to avoid serving a stale token.
        $cacheKey = "deepgram_token:{$region}";
        if ($cached = Cache::get($cacheKey)) {
            return response()->json($cached)->withHeaders(['Cache-Control' => 'no-store']);
        }

        try {
            $resp = Http::withHeaders([
                'Authorization' => 'Token '.$key,
                'Accept' => 'application/json',
            ])->post("https://{$host}/v1/auth/grant", [
                'ttl_seconds' => 3600,
            ]);
        } catch (ConnectionException $e) {
            \Log::error('Deepgram grant connection failed', ['error' => $e->getMessage()]);

            return response()->json([
                'error' => 'deepgram_grant_connection_failed',
                'detail' => $e->getMessage(),
            ], 502);
        }

        if (! $resp->successful()) {
            \Log::error('Deepgram grant failed', [
                'status' => $resp->status(),
                'body' => $resp->body(),
            ]);

            return response()->json([
                'error' => 'deepgram_grant_failed',
                'status' => $resp->status(),
                'detail' => $resp->body(),
            ], 502);
        }

        $json = [
            'token' => $resp->json('access_token'),
            'expires_in' => $resp->json('expires_in'),
            'baseUrl' => "https://{$host}",
        ];

        Cache::put($cacheKey, $json, 3500);

        return response()->json($json)->withHeaders(['Cache-Control' => 'no-store']);
    }
}
