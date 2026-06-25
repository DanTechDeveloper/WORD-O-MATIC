<?php

namespace App\Http\Controllers;

use App\Models\Badges;
use App\Models\GameSession;
use App\Models\ParagraphModule;
use App\Models\PracticeWordSet;
use App\Models\StudentParagraphMastery;
use App\Models\StudentParagraphProgress;
use App\Models\StudentProfile;
use App\Models\StudentWordMastery;
use App\Models\WordModule;
use App\Services\BadgeService;
use App\Services\GameSessionService;
use App\Services\LevelService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentController extends Controller
{
    public function __construct(
        protected BadgeService $badgeService,
        protected GameSessionService $gameSessionService,
        protected LevelService $levelService,
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
        $data = auth()->user()->student()
            ->with('user:id,name,student_id')
            ->select([
                'user_id',
                'read_progress', 'speak_progress',
                'badges', 'read_level', 'speak_level',
            ])
            ->first();

        return Inertia::render('Student/Dashboard', [
            'data' => $data,
        ]);
    }

    public function greetings()
    {
        $user = auth()->user();
        if ($user) {
            $user->load('student');
        }

        return Inertia::render('Student/Greetings');
    }

    public function tutorial()
    {
        return Inertia::render('Student/Tutorial');
    }

    public function completeTutorial(Request $request)
    {
        $user = auth()->user();
        $student = $user->student;

        if (! $student) {
            return redirect()->back()->with('error', 'Student profile not found.');
        }

        if (! $student->tutorial_completed_at) {
            $student->update([
                'tutorial_completed_at' => now(),
            ]);

            $badgeData = $this->badgeService->awardOnboardingBadge($user, 'tutorial-complete');

            if ($badgeData) {
                return redirect()->route('student.dashboard')->with('new_badge', $badgeData);
            }
        }

        return redirect()->route('student.dashboard')->with('success', 'Tutorial completed!');
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
                return redirect()->route('student.greetings')->with('new_badge', $badgeData);
            }

            return redirect()->route('student.greetings')->with('success', 'Avatar updated successfully!');
        }

        return redirect()->back()->with('error', 'Student profile not found.');
    }

    public function leaderboards()
    {
        $user = auth()->user();

        $leaderboard = StudentProfile::with('user:id,name,student_id')
            ->whereHas('user', fn ($q) => $q->where('role', 'student'))
            ->orderBy('points', 'desc')
            ->get(['user_id', 'points', 'avatar']);

        $currentUserRank = $leaderboard->search(fn ($s) => $s->user_id === $user->id);

        $totalStudents = $leaderboard->count();

        $weeklyPoints = GameSession::where('user_id', $user->id)
            ->where('created_at', '>=', now()->startOfWeek())
            ->sum('score');

        return Inertia::render('Student/Leaderboards', [
            'leaderboard' => $leaderboard,
            'currentUserRank' => $currentUserRank !== false ? $currentUserRank + 1 : null,
            'totalStudents' => $totalStudents,
            'weeklyPoints' => $weeklyPoints,
        ]);
    }

    public function badges()
    {
        $user = auth()->user();
        $badges = Badges::withExists(['users as is_earned' => function ($query) use ($user) {
            $query->where('student_badges.user_id', $user->id);
        }])->get();

        return Inertia::render('Student/Badges', [
            'badges' => $badges,
        ]);
    }

    public function readModeLevels()
    {
        return Inertia::render('Student/ReadModeLevels', [
            'modules' => $this->levelService->getWordModuleStatuses(auth()->id()),
        ]);
    }

    public function gameplayReadMode($id)
    {
        // Fetch module with words and calculate student progress
        $module = WordModule::with('words')
            ->select(['id', 'level', 'title', 'total_points'])
            ->findOrFail($id);

        $userId = auth()->id();

        return Inertia::render('Student/GameplayReadMode', [
            'module' => $module,
        ]);
    }

    public function saveWordProgress(Request $request)
    {
        $request->validate([
            'module_id' => 'required|exists:word_modules,id',
            'words_smashed' => 'required|integer|min:0',
            'streak' => 'nullable|integer|min:0',
        ]);

        $user = auth()->user();
        $module = WordModule::findOrFail($request->module_id);

        [$session, $accuracy] = $this->gameSessionService->saveWordResult(
            $user, $module, $request->words_smashed, $request->streak,
        );

        $redirect = redirect()->route('student.results', ['id' => $session->id]);
        $newBadges = $this->badgeService->checkGameplayBadges($user, $session->id, $accuracy);

        if (! empty($newBadges)) {
            $badge = $newBadges[0];
            $redirect->with('new_badge', [
                'name' => $badge->name,
                'description' => $badge->description,
                'slug' => $badge->slug,
                'icon' => $badge->icon,
            ]);
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

        return redirect()->back();
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

        return redirect()->back();
    }

    public function speakModeLevels()
    {
        return Inertia::render('Student/SpeakModeLevels', [
            'modules' => $this->levelService->getSpeakModuleStatuses(auth()->id()),
        ]);
    }

    public function gameplaySpeakMode($id)
    {
        $module = ParagraphModule::with('words')
            ->select(['id', 'level', 'title', 'content', 'total_score'])
            ->findOrFail($id);

        $userId = auth()->id();
        $progress = StudentParagraphProgress::where('user_id', $userId)
            ->where('paragraph_module_id', $id)
            ->first();

        return Inertia::render('Student/GameplaySpeakMode', [
            'module' => $module,
            'userProgress' => $progress ? $progress->words_smashed : 0,
        ]);
    }

    public function saveParagraphProgress(Request $request)
    {
        $request->validate([
            'module_id' => 'required|exists:paragraph_modules,id',
            'words_smashed' => 'required|integer|min:0',
            'streak' => 'nullable|integer|min:0',
        ]);

        $user = auth()->user();
        $module = ParagraphModule::findOrFail($request->module_id);

        [$session, $accuracy] = $this->gameSessionService->saveParagraphResult(
            $user, $module, $request->words_smashed, $request->streak,
        );

        $redirect = redirect()->route('student.results', ['id' => $session->id]);
        $newBadges = $this->badgeService->checkGameplayBadges($user, $session->id, $accuracy);

        if (! empty($newBadges)) {
            $badge = $newBadges[0];
            $redirect->with('new_badge', [
                'name' => $badge->name,
                'description' => $badge->description,
                'slug' => $badge->slug,
                'icon' => $badge->icon,
            ]);
        }

        return $redirect;
    }

    public function practiceRead()
    {
        $practiceSet = PracticeWordSet::with('words')->where('slug', 'tutorial-practice')->firstOrFail();

        return Inertia::render('Student/PracticeRead', [
            'module' => $practiceSet,
        ]);
    }

    public function results($id)
    {
        $session = GameSession::findOrFail($id);

        if ($session->module_type === 'word') {
            $module = WordModule::find($session->module_id);
            $totalItems = $module->total_points;
        } else {
            $module = ParagraphModule::find($session->module_id);
            $totalItems = $module->total_score;
        }

        $user = auth()->user();
        $badgeProgress = $user ? $this->badgeService->getBadgeProgress($user, $session) : [];

        return Inertia::render('Student/GameResults', [
            'session' => $session,
            'moduleTitle' => $module->title,
            'totalItems' => $totalItems,
            'badgeProgress' => $badgeProgress,
        ]);
    }
}
