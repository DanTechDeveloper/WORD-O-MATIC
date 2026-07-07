<?php

namespace App\Http\Controllers;

use App\Models\Badges;
use App\Models\GameSession;
use App\Models\ParagraphModule;
use App\Models\PracticeSet;
use App\Models\StudentParagraphMastery;
use App\Models\StudentParagraphProgress;
use App\Models\StudentProfile;
use App\Models\StudentWordMastery;
use App\Models\StudentWordProgress;
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

        $totalReadPoints = WordModule::withCount('words')->get()->sum('words_count');
        $totalSpeakPoints = ParagraphModule::withCount('words')->get()->sum('words_count');

        $earnedReadPoints = StudentWordProgress::where('user_id', $user->id)->sum('words_smashed');
        $earnedSpeakPoints = StudentParagraphProgress::where('user_id', $user->id)->sum('words_smashed');

        return Inertia::render('Student/Dashboard', [
            'totalReadPoints' => $totalReadPoints,
            'totalSpeakPoints' => $totalSpeakPoints,
            'earnedReadPoints' => $earnedReadPoints,
            'earnedSpeakPoints' => $earnedSpeakPoints,
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
        return Inertia::render('Student/LevelsPage', [
            'modules' => $this->levelService->getWordModuleStatuses(auth()->id()),
            'mode' => 'read',
        ]);
    }

    public function gameplayReadMode($id)
    {
        // Fetch module with words and calculate student progress
        $module = WordModule::with(['words' => fn ($q) => $q->reorder()->inRandomOrder()])
            ->select(['id', 'level', 'title'])
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

        $totalPoints = $module->words()->count();
        $accuracy = $totalPoints > 0
            ? round(min(($request->words_smashed / $totalPoints) * 100, 100), 2)
            : 0;
        $session = GameSession::logSession(
            $user->id, $module->id, 'word', $request->words_smashed, $accuracy, $request->streak ?? 0,
        );
        $this->progressService->updateWordProgress($user->student, $module, $request->words_smashed, $accuracy);

        $redirect = redirect()->route('student.results', ['id' => $session->id]);
        $newBadges = $this->badgeService->checkGameplayBadges($user, $session->id, $accuracy);

        if (! empty($newBadges)) {
            $badgesData = [];
            foreach ($newBadges as $badge) {
                $badgesData[] = [
                    'name' => $badge->name,
                    'description' => $badge->description,
                    'slug' => $badge->slug,
                    'icon' => $badge->icon,
                ];
            }
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
        return Inertia::render('Student/LevelsPage', [
            'modules' => $this->levelService->getSpeakModuleStatuses(auth()->id()),
            'mode' => 'speak',
        ]);
    }

    public function gameplaySpeakMode($id)
    {
        $module = ParagraphModule::with('words')
            ->select(['id', 'level', 'title', 'content'])
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

        $totalPoints = $module->words()->count();
        $accuracy = $totalPoints > 0
            ? round(min(($request->words_smashed / $totalPoints) * 100, 100), 2)
            : 0;
        $session = GameSession::logSession(
            $user->id, $module->id, 'paragraph', $request->words_smashed, $accuracy, $request->streak ?? 0,
        );
        $this->progressService->updateParagraphProgress($user->student, $module, $request->words_smashed, $accuracy);

        $redirect = redirect()->route('student.results', ['id' => $session->id]);
        $newBadges = $this->badgeService->checkGameplayBadges($user, $session->id, $accuracy);

        if (! empty($newBadges)) {
            $badgesData = [];
            foreach ($newBadges as $badge) {
                $badgesData[] = [
                    'name' => $badge->name,
                    'description' => $badge->description,
                    'slug' => $badge->slug,
                    'icon' => $badge->icon,
                ];
            }
            $redirect->with('new_badges', $badgesData);
        }

        return $redirect;
    }

    public function practice($mode)
    {
        $practiceSet = PracticeSet::with('items')
            ->where('slug', "tutorial-practice-{$mode}")
            ->firstOrFail();

        $module = [
            'words' => $practiceSet->items->map(fn ($item) => ['word' => $item->content])->toArray(),
            'content' => $practiceSet->content,
        ];

        return Inertia::render('Student/PracticePage', [
            'module' => $module,
            'mode' => $mode,
        ]);
    }

    public function results($id)
    {
        $session = GameSession::findOrFail($id);

        if ($session->module_type === 'word') {
            $module = WordModule::withCount('words')->find($session->module_id);
            $totalItems = $module->total_points;
        } else {
            $module = ParagraphModule::withCount('words')->find($session->module_id);
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
