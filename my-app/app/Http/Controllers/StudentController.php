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
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

        $badges = Badges::withExists(['users as is_earned' => function ($query) use ($user) {
            $query->where('student_badges.user_id', $user->id);
        }])->get()->map(function ($badge) use ($user, $student) {
            $badge->threshold = $badge->threshold_score;

            if ($badge->threshold_score !== null) {
                $sessionQuery = GameSession::where('user_id', $user->id)
                    ->where('is_deadline_hit', false);

                $badge->current_value = match ($badge->metric) {
                    'total_points' => $student ? $student->points : 0,
                    'streak' => $sessionQuery->max('streak') ?? 0,
                    // Same source as BadgeService::checkAllEligibleBadges so the page
                    // shows the value the awarding logic actually checks (was session max).
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

        return Inertia::render('Student/Badges', [
            'badges' => $badges,
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

        if (! $user->student?->tutorial_completed_at) {
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

        if (! $module->is_tutorial && $this->reportService->cutoff()) {
            return redirect()->route($levelsRoute);
        }

        // Onboarding lock: until the tutorial is completed, real level URLs
        // silently bounce back to the level picker — no error banner.
        if (! $user->student?->tutorial_completed_at && ! $module->is_tutorial) {
            return redirect()->route($levelsRoute);
        }

        if (! $this->levelService->isModuleAccessible($user->id, $id, $type)) {
            return redirect()->route($levelsRoute);
        }

        $data = [
            'module' => $module,
            'tutorialComplete' => (bool) $user->student?->tutorial_completed_at,
        ];

        if (! $isWord) {
            $progress = StudentParagraphProgress::where('user_id', $user->id)
                ->where('paragraph_module_id', $id)
                ->first();
            $data['userProgress'] = $progress ? $progress->words_smashed : 0;
        }

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
            // Unsuccessful attempt: wrong transcript OR timeout. Count up, never reset.
            $row = $model::firstOrNew(['user_id' => auth()->id(), $idColumn => $request->$idColumn]);
            $row->status = 'training';
            $row->failed_attempts = $row->failed_attempts + 1;
            $row->save();

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
        ]);

        $moduleClass = $type === 'word' ? WordModule::class : ParagraphModule::class;

        return $this->finishRound(auth()->user(), $moduleClass::findOrFail($request->module_id), $request, $type);
    }

    private function finishRound(User $user, WordModule|ParagraphModule $module, Request $request, string $type): RedirectResponse
    {
        $isTutorial = $module->is_tutorial && ! $user->student?->tutorial_completed_at;

        if ($isTutorial) {
            if ($type === 'word') {
                $this->progressService->updateWordProgress($user->student, $module, 0, $request->words_processed, 0, isTutorial: true);
            } else {
                $this->progressService->updateParagraphProgress($user->student, $module, 0, $request->words_processed, 0, isTutorial: true);
            }

            $redirect = redirect()->route('student.dashboard');
            $badgesData = $this->checkTutorialCompletion($user);

            return $badgesData ? $redirect->with('new_badges', [$badgesData]) : $redirect;
        }

        $totalPossible = $module->words()->count();

        if ($request->words_processed > $totalPossible) {
            throw ValidationException::withMessages([
                'words_processed' => 'Words processed cannot exceed the module word count.',
            ]);
        }

        $wordsSmashed = min($request->words_smashed, $totalPossible);
        $streak = min($request->streak ?? 0, $wordsSmashed + 1);
        $accuracy = $totalPossible > 0
            ? round(min(($wordsSmashed / $totalPossible) * 100, 100), 2)
            : 0;

        $isDeadlineHit = (bool) $this->reportService->cutoff();

        $session = GameSession::logSession($user->id, $module->id, $type, $wordsSmashed, $accuracy, $streak, $isDeadlineHit);

        if ($isDeadlineHit) {
            return redirect()->route('student.results', ['id' => $session->id]);
        }

        if ($type === 'word') {
            $this->progressService->updateWordProgress($user->student, $module, $wordsSmashed, $request->words_processed, $accuracy);
        } else {
            $this->progressService->updateParagraphProgress($user->student, $module, $wordsSmashed, $request->words_processed, $accuracy);
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

        return Inertia::render('Student/GameResults', [
            'session' => $session,
            'moduleTitle' => $module->title,
            'totalItems' => $totalItems,
            'badgeProgress' => $badgeProgress,
            'moduleLevel' => $module->level,
            'nextModuleLevel' => $nextModule?->level,
            'isMaxLevel' => $isMaxLevel,
            'deadlineHit' => (bool) $session->is_deadline_hit,
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
                $user->student->update(['tutorial_completed_at' => now()]);
            }

            return $this->badgeService->awardOnboardingBadge($user, 'tutorial-complete');
        }

        return null;
    }

    private function tutorialState(User $user): array
    {
        $tutWord = WordModule::where('is_tutorial', true)->first();
        $tutPara = ParagraphModule::where('is_tutorial', true)->first();

        return [
            'tutWord' => $tutWord,
            'tutPara' => $tutPara,
            'wordTutorialDone' => $tutWord && StudentWordProgress::where('user_id', $user->id)
                ->where('word_module_id', $tutWord->id)->where('status', 'completed')->exists(),
            'speakTutorialDone' => $tutPara && StudentParagraphProgress::where('user_id', $user->id)
                ->where('paragraph_module_id', $tutPara->id)->where('status', 'completed')->exists(),
        ];
    }
}
