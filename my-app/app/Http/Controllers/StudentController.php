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

        $tutWord = WordModule::where('is_tutorial', true)->first();
        $tutPara = ParagraphModule::where('is_tutorial', true)->first();

        $totalReadPoints = (int) Word::count();
        $totalSpeakPoints = (int) ParagraphWord::count();

        $earnedReadPoints = StudentWordProgress::where('user_id', $user->id)
            ->when($tutWord, fn ($q) => $q->where('word_module_id', '!=', $tutWord->id))
            ->sum('words_smashed');
        $earnedSpeakPoints = StudentParagraphProgress::where('user_id', $user->id)
            ->when($tutPara, fn ($q) => $q->where('paragraph_module_id', '!=', $tutPara->id))
            ->sum('words_smashed');

        $wordDone = $tutWord && StudentWordProgress::where('user_id', $user->id)
            ->where('word_module_id', $tutWord->id)->where('status', 'completed')->exists();
        $paraDone = $tutPara && StudentParagraphProgress::where('user_id', $user->id)
            ->where('paragraph_module_id', $tutPara->id)->where('status', 'completed')->exists();

        return Inertia::render('Student/Dashboard', [
            'totalReadPoints' => $totalReadPoints,
            'totalSpeakPoints' => $totalSpeakPoints,
            'earnedReadPoints' => $earnedReadPoints,
            'earnedSpeakPoints' => $earnedSpeakPoints,
            'wordTutorialDone' => $wordDone,
            'speakTutorialDone' => $paraDone,
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
                $badge->current_value = match ($badge->metric) {
                    'total_points' => $student ? $student->points : 0,
                    'streak' => GameSession::where('user_id', $user->id)->max('streak') ?? 0,
                    'accuracy' => GameSession::where('user_id', $user->id)->max('accuracy') ?? 0,
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

        $tutWord = WordModule::where('is_tutorial', true)->first();
        $tutPara = ParagraphModule::where('is_tutorial', true)->first();

        $wordTutorialDone = $tutWord && StudentWordProgress::where('user_id', $user->id)
            ->where('word_module_id', $tutWord->id)->where('status', 'completed')->exists();
        $speakTutorialDone = $tutPara && StudentParagraphProgress::where('user_id', $user->id)
            ->where('paragraph_module_id', $tutPara->id)->where('status', 'completed')->exists();

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

        $user = auth()->user();
        $module = WordModule::findOrFail($request->module_id);

        if ($module->is_tutorial && ! $user->student?->tutorial_completed_at) {
            $this->progressService->updateWordProgress($user->student, $module, 0, $request->words_processed, 0, isTutorial: true);
            $badgesData = $this->checkTutorialCompletion($user);
            $redirect = redirect()->route('student.dashboard');
            if ($badgesData) {
                $redirect->with('new_badges', [$badgesData]);
            }

            return $redirect;
        }

        $totalPossible = $module->words()->count();
        $wordsSmashed = min($request->words_smashed, $totalPossible);
        $streak = min($request->streak ?? 0, $wordsSmashed + 1);
        $accuracy = $totalPossible > 0
            ? round(min(($wordsSmashed / $totalPossible) * 100, 100), 2)
            : 0;
        $session = GameSession::logSession(
            $user->id, $module->id, 'word', $wordsSmashed, $accuracy, $streak,
        );
        $this->progressService->updateWordProgress($user->student, $module, $wordsSmashed, $request->words_processed, $accuracy);

        $redirect = redirect()->route('student.results', ['id' => $session->id]);
        $newBadges = $this->badgeService->checkGameplayBadges($user, $session->id, $accuracy);

        $badgesData = [];
        foreach ($newBadges as $badge) {
            $badgesData[] = [
                'name' => $badge->name,
                'description' => $badge->description,
                'slug' => $badge->slug,
                'icon' => $badge->icon,
            ];
        }

        $tutorialBadge = $this->checkTutorialCompletion($user);
        if ($tutorialBadge) {
            $badgesData[] = $tutorialBadge;
        }

        if (! empty($badgesData)) {
            $redirect->with('new_badges', $badgesData);
        }

        return $redirect;
    }

    public function updateWordMastery(Request $request)
    {
        $request->validate([
            'word_id' => 'required|exists:words,id',
            'status' => 'required|in:mastered,training',
        ]);

        StudentWordMastery::updateOrCreate(
            ['user_id' => auth()->id(), 'word_id' => $request->word_id],
            ['status' => $request->status]
        );

        return back();
    }

    public function updateParagraphMastery(Request $request)
    {
        $request->validate([
            'paragraph_word_id' => 'required|exists:paragraph_words,id',
            'status' => 'required|in:mastered,training',
        ]);

        StudentParagraphMastery::updateOrCreate(
            ['user_id' => auth()->id(), 'paragraph_word_id' => $request->paragraph_word_id],
            ['status' => $request->status]
        );

        return back();
    }

    public function speakModeLevels()
    {
        $user = auth()->user();

        $tutWord = WordModule::where('is_tutorial', true)->first();
        $tutPara = ParagraphModule::where('is_tutorial', true)->first();

        $wordTutorialDone = $tutWord && StudentWordProgress::where('user_id', $user->id)
            ->where('word_module_id', $tutWord->id)->where('status', 'completed')->exists();
        $speakTutorialDone = $tutPara && StudentParagraphProgress::where('user_id', $user->id)
            ->where('paragraph_module_id', $tutPara->id)->where('status', 'completed')->exists();

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

        $user = auth()->user();
        $module = ParagraphModule::findOrFail($request->module_id);

        if ($module->is_tutorial && ! $user->student?->tutorial_completed_at) {
            $this->progressService->updateParagraphProgress($user->student, $module, 0, $request->words_processed, 0, isTutorial: true);
            $badgesData = $this->checkTutorialCompletion($user);
            $redirect = redirect()->route('student.dashboard');
            if ($badgesData) {
                $redirect->with('new_badges', [$badgesData]);
            }

            return $redirect;
        }

        $totalPoints = $module->words()->count();
        $wordsSmashed = min($request->words_smashed, $totalPoints);
        $streak = min($request->streak ?? 0, $wordsSmashed + 1);
        $accuracy = $totalPoints > 0
            ? round(min(($wordsSmashed / $totalPoints) * 100, 100), 2)
            : 0;
        $session = GameSession::logSession(
            $user->id, $module->id, 'paragraph', $wordsSmashed, $accuracy, $streak,
        );
        $this->progressService->updateParagraphProgress($user->student, $module, $wordsSmashed, $request->words_processed, $accuracy);

        $redirect = redirect()->route('student.results', ['id' => $session->id]);
        $newBadges = $this->badgeService->checkGameplayBadges($user, $session->id, $accuracy);

        $badgesData = [];
        foreach ($newBadges as $badge) {
            $badgesData[] = [
                'name' => $badge->name,
                'description' => $badge->description,
                'slug' => $badge->slug,
                'icon' => $badge->icon,
            ];
        }

        $tutorialBadge = $this->checkTutorialCompletion($user);
        if ($tutorialBadge) {
            $badgesData[] = $tutorialBadge;
        }

        if (! empty($badgesData)) {
            $redirect->with('new_badges', $badgesData);
        }

        return $redirect;
    }

    public function results($id)
    {
        $session = GameSession::findOrFail($id);

        if ($session->module_type === 'word') {
            $module = WordModule::withCount('words')->find($session->module_id);
        } else {
            $module = ParagraphModule::withCount('words')->find($session->module_id);
        }
        $totalItems = $module->words_count;

        $user = auth()->user();
        $badgeProgress = $user ? $this->badgeService->getBadgeProgress($user, $session) : [];

        return Inertia::render('Student/GameResults', [
            'session' => $session,
            'moduleTitle' => $module->title,
            'totalItems' => $totalItems,
            'badgeProgress' => $badgeProgress,
        ]);
    }

    private function checkTutorialCompletion(User $user): ?array
    {
        $tutWord = WordModule::where('is_tutorial', true)->first();
        $tutPara = ParagraphModule::where('is_tutorial', true)->first();

        $wordDone = $tutWord && StudentWordProgress::where('user_id', $user->id)
            ->where('word_module_id', $tutWord->id)->where('status', 'completed')->exists();

        $paraDone = $tutPara && StudentParagraphProgress::where('user_id', $user->id)
            ->where('paragraph_module_id', $tutPara->id)->where('status', 'completed')->exists();

        if ($wordDone && $paraDone) {
            if (! $user->student->tutorial_completed_at) {
                $user->student->update(['tutorial_completed_at' => now()]);
            }

            return $this->badgeService->awardOnboardingBadge($user, 'tutorial-complete');
        }

        return null;
    }
}
