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
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentController extends Controller
{
    public function __construct(
        protected BadgeService $badgeService,
        protected LevelService $levelService,
        protected ProgressService $progressService,
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
        extract($this->tutorialState($user));

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
                // Best streak/accuracy counts only sessions that weren't deadline-hit,
                // so a post-deadline round can't inflate badge progress — sticky even
                // if the deadline is later cleared.
                $sessionQuery = GameSession::where('user_id', $user->id)
                    ->where('is_deadline_hit', false);

                $badge->current_value = match ($badge->metric) {
                    'total_points' => $student ? $student->points : 0,
                    'streak' => $sessionQuery->max('streak') ?? 0,
                    'accuracy' => $sessionQuery->max('accuracy') ?? 0,
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
        $user = auth()->user();
        extract($this->tutorialState($user));

        if (! $user->student?->tutorial_completed_at && ! $wordTutorialDone) {
            $progress = StudentWordProgress::where('user_id', $user->id)
                ->where('word_module_id', $tutWord->id)->first();
            $modules = collect([[
                'id' => $tutWord->id,
                'level' => $tutWord->level,
                'title' => $tutWord->title,
                'total_points' => $tutWord->words()->count(),
                'status' => $progress && $progress->status === 'completed' ? 'completed' : 'current',
                'words_smashed' => $progress ? $progress->words_smashed : 0,
                'is_tutorial' => true,
            ]]);
        } else {
            $modules = $this->levelService->getWordModuleStatuses($user->id);
        }

        return Inertia::render('Student/LevelsPage', [
            'modules' => $modules,
            'mode' => 'read',
            'tutorialComplete' => (bool) $user->student?->tutorial_completed_at,
            'wordTutorialDone' => $wordTutorialDone,
            'speakTutorialDone' => $speakTutorialDone,
        ]);
    }

    public function gameplayReadMode($id)
    {
        $module = WordModule::with('words')
            ->select(['id', 'level', 'title', 'is_tutorial'])
            ->findOrFail($id);

        $user = auth()->user();

        $deadline = \App\Models\Setting::getValue('report_deadline');
        if (! $module->is_tutorial && $deadline && \Carbon\Carbon::parse($deadline)->isPast()) {
            return redirect()->route('student.readModeLevels');
        }

        if (! $this->levelService->isModuleAccessible($user->id, $id, 'word')) {
            return redirect()->route('student.readModeLevels')
                ->with('error', 'This module is locked. Please complete the previous level first.');
        }

        $tutorialComplete = (bool) $user->student?->tutorial_completed_at;

        return Inertia::render('Student/GameplayReadMode', [
            'module' => $module,
            'tutorialComplete' => $tutorialComplete,
        ]);
    }

    public function saveWordProgress(Request $request)
    {
        $request->validate([
            'module_id' => 'required|exists:word_modules,id',
            'words_smashed' => 'required|integer|min:0',
            'words_processed' => 'required|integer|min:0',
            'streak' => 'nullable|integer|min:0',
        ]);

        return $this->finishRound(auth()->user(), WordModule::findOrFail($request->module_id), $request, 'word');
    }

    public function updateWordMastery(Request $request)
    {
        $request->validate([
            'word_id' => 'required|exists:words,id',
            'status' => 'required|in:mastered,training',
        ]);

        // Post-deadline rounds must not write mastery rows (BF7/BF10).
        $deadline = \App\Models\Setting::getValue('report_deadline');
        if ($deadline && \Carbon\Carbon::parse($deadline)->isPast()) {
            return response()->noContent();
        }

        // Mastery is sticky: a mastered word can never regress to training on replay,
        // matching the best-score-only invariant (see docs/CAVEATS.md BF2/BF4).
        $existing = StudentWordMastery::where('user_id', auth()->id())
            ->where('word_id', $request->word_id)
            ->first();
        if ($existing && $existing->status === 'mastered' && $request->status === 'training') {
            return response()->noContent();
        }

        StudentWordMastery::updateOrCreate(
            ['user_id' => auth()->id(), 'word_id' => $request->word_id],
            ['status' => $request->status]
        );

        return response()->noContent();
    }

    public function updateParagraphMastery(Request $request)
    {
        $request->validate([
            'paragraph_word_id' => 'required|exists:paragraph_words,id',
            'status' => 'required|in:mastered,training',
        ]);

        // Post-deadline rounds must not write mastery rows (BF7/BF10).
        $deadline = \App\Models\Setting::getValue('report_deadline');
        if ($deadline && \Carbon\Carbon::parse($deadline)->isPast()) {
            return response()->noContent();
        }

        // Same sticky-mastery guard: mastered paragraph words cannot regress.
        $existing = StudentParagraphMastery::where('user_id', auth()->id())
            ->where('paragraph_word_id', $request->paragraph_word_id)
            ->first();
        if ($existing && $existing->status === 'mastered' && $request->status === 'training') {
            return response()->noContent();
        }

        StudentParagraphMastery::updateOrCreate(
            ['user_id' => auth()->id(), 'paragraph_word_id' => $request->paragraph_word_id],
            ['status' => $request->status]
        );

        return response()->noContent();
    }

    public function speakModeLevels()
    {
        $user = auth()->user();
        extract($this->tutorialState($user));

        if (! $user->student?->tutorial_completed_at && $wordTutorialDone && ! $speakTutorialDone) {
            $progress = StudentParagraphProgress::where('user_id', $user->id)
                ->where('paragraph_module_id', $tutPara->id)->first();
            $modules = collect([[
                'id' => $tutPara->id,
                'level' => $tutPara->level,
                'title' => $tutPara->title,
                'total_points' => $tutPara->words()->count(),
                'status' => $progress && $progress->status === 'completed' ? 'completed' : 'current',
                'words_smashed' => $progress ? $progress->words_smashed : 0,
                'is_tutorial' => true,
            ]]);
        } else {
            $modules = $this->levelService->getSpeakModuleStatuses($user->id);
        }

        return Inertia::render('Student/LevelsPage', [
            'modules' => $modules,
            'mode' => 'speak',
            'tutorialComplete' => (bool) $user->student?->tutorial_completed_at,
            'wordTutorialDone' => $wordTutorialDone,
            'speakTutorialDone' => $speakTutorialDone,
        ]);
    }

    public function gameplaySpeakMode($id)
    {
        $module = ParagraphModule::with('words')
            ->select(['id', 'level', 'title', 'content', 'is_tutorial'])
            ->findOrFail($id);

        $user = auth()->user();

        $deadline = \App\Models\Setting::getValue('report_deadline');
        if (! $module->is_tutorial && $deadline && \Carbon\Carbon::parse($deadline)->isPast()) {
            return redirect()->route('student.speakModeLevels');
        }

        if (! $this->levelService->isModuleAccessible($user->id, $id, 'paragraph')) {
            return redirect()->route('student.speakModeLevels')
                ->with('error', 'This module is locked. Please complete the previous level first.');
        }

        $progress = StudentParagraphProgress::where('user_id', $user->id)
            ->where('paragraph_module_id', $id)
            ->first();
        $tutorialComplete = (bool) $user->student?->tutorial_completed_at;

        return Inertia::render('Student/GameplaySpeakMode', [
            'module' => $module,
            'userProgress' => $progress ? $progress->words_smashed : 0,
            'tutorialComplete' => $tutorialComplete,
        ]);
    }

    public function saveParagraphProgress(Request $request)
    {
        $request->validate([
            'module_id' => 'required|exists:paragraph_modules,id',
            'words_smashed' => 'required|integer|min:0',
            'words_processed' => 'required|integer|min:0',
            'streak' => 'nullable|integer|min:0',
        ]);

        return $this->finishRound(auth()->user(), ParagraphModule::findOrFail($request->module_id), $request, 'paragraph');
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
        $wordsSmashed = min($request->words_smashed, $totalPossible);
        $streak = min($request->streak ?? 0, $wordsSmashed + 1);
        $accuracy = $totalPossible > 0
            ? round(min(($wordsSmashed / $totalPossible) * 100, 100), 2)
            : 0;

        $deadline = \App\Models\Setting::getValue('report_deadline');
        $isDeadlineHit = $deadline && \Carbon\Carbon::parse($deadline)->isPast();

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
            $nextModule = WordModule::where('level', $module->level + 1)
                ->where('is_tutorial', false)
                ->first();
            $maxLevel = WordModule::where('is_tutorial', false)->max('level');
        } else {
            $module = ParagraphModule::withCount('words')->find($session->module_id);
            $nextModule = ParagraphModule::where('level', $module->level + 1)
                ->where('is_tutorial', false)
                ->first();
            $maxLevel = ParagraphModule::where('is_tutorial', false)->max('level');
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
            'nextModuleId' => $nextModule?->id,
            'isMaxLevel' => $isMaxLevel,
            'deadlineHit' => (bool) ($deadline = \App\Models\Setting::getValue('report_deadline')) && \Carbon\Carbon::parse($deadline)->isPast(),
        ]);
    }

    private function checkTutorialCompletion(User $user): ?array
    {
        extract($this->tutorialState($user));

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
