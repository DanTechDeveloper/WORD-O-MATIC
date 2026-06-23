<?php

namespace App\Http\Controllers;

use App\Models\Badges;
use App\Models\GameSession;
use App\Models\ParagraphModule;
use App\Models\PracticeWordSet;
use App\Models\StudentParagraphProgress;
use App\Models\StudentProfile;
use App\Models\StudentWordMastery;
use App\Models\StudentWordProgress;
use App\Models\WordModule;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Update the authenticated student's avatar.
 *
 * @param  Request  $request
 * @return JsonResponse
 */
class StudentController extends Controller
{
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

        if (!$student) {
            return redirect()->back()->with('error', 'Student profile not found.');
        }

        if (!$student->tutorial_completed_at) {
            $student->update([
                'tutorial_completed_at' => now(),
            ]);

            $badge = Badges::where('slug', 'tutorial-complete')->first();
            if ($badge) {
                $changes = $user->badges()->syncWithoutDetaching([
                    $badge->id => ['earned_at' => now()],
                ]);

                if (!empty($changes['attached'])) {
                    return redirect()->route('student.dashboard')->with('new_badge', [
                        'name' => $badge->name,
                        'description' => $badge->description,
                        'slug' => $badge->slug,
                        'icon' => $badge->icon,
                    ]);
                }
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

            // Award "Profile Pioneer" badge
            $badge = Badges::where('slug', 'profile-pioneer')->first();
            if ($badge) {
                $changes = $user->badges()->syncWithoutDetaching([
                    $badge->id => ['earned_at' => now()],
                ]);

                if (! empty($changes['attached'])) {
                    return redirect()->route('student.greetings')->with('new_badge', [
                        'name' => $badge->name,
                        'description' => $badge->description,
                        'slug' => $badge->slug,
                        'icon' => $badge->icon,
                    ]);
                }
            }

            return redirect()->route('student.greetings')->with('success', 'Avatar updated successfully!');
        }

        return redirect()->back()->with('error', 'Student profile not found.');
    }

    public function leaderboards()
    {
        $user = auth()->user();

        $leaderboard = StudentProfile::with('user:id,name,student_id')
            ->whereHas('user', fn($q) => $q->where('role', 'student'))
            ->orderBy('points', 'desc')
            ->get(['user_id', 'points', 'avatar']);

        $currentUserRank = $leaderboard->search(fn($s) => $s->user_id === $user->id);

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
        $userId = auth()->id();

        $modules = WordModule::withCount('words')
            ->select(['id', 'level', 'title', 'total_points'])
            ->orderBy('level', 'asc')
            ->get();

        $progressRecords = StudentWordProgress::where('user_id', $userId)
            ->get()
            ->keyBy('word_module_id');

        $foundCurrent = false;
        $transformedModules = $modules->map(function ($module) use ($progressRecords, &$foundCurrent) {
            $progress = $progressRecords->get($module->id);

            if ($progress && $progress->status === 'completed') {
                $status = 'completed';
            } elseif ($progress && $progress->status === 'in_progress') {
                $status = 'in_progress';
                $foundCurrent = true;
            } elseif (! $foundCurrent) {
                $status = 'current';
                $foundCurrent = true;
            } else {
                $status = 'locked';
            }

            return [
                'id' => $module->id,
                'level' => $module->level,
                'title' => $module->title,
                'total_points' => $module->total_points,
                'status' => $status,
                'words_smashed' => $progress ? $progress->words_smashed : 0,
                'score' => $progress ? $progress->words_smashed : 0,
            ];
        });

        return Inertia::render('Student/ReadModeLevels', [
            'modules' => $transformedModules,
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

        $userId = auth()->id();
        $module = WordModule::findOrFail($request->module_id);
        $rawAccuracy = ($module->total_points > 0) ? ($request->words_smashed / $module->total_points) * 100 : 0;
        $accuracy = round(min($rawAccuracy, 100), 2);
        $session = GameSession::logSession($userId, $module->id, 'word', $request->words_smashed, $accuracy, $request->streak ?? 0);

        $student = auth()->user()->student;

        $newBadges = [];

        if ($student) {
            $student->updateWordProgress($module, $request->words_smashed, $accuracy);
            $newBadges = $student->checkAndAwardBadges($session->id, $accuracy);
        }

        $redirect = redirect()->route('student.results', ['id' => $session->id]);

        if (!empty($newBadges)) {
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

    public function speakModeLevels()
    {
        $userId = auth()->id();

        $modules = ParagraphModule::select(['id', 'level', 'title', 'total_score'])
            ->orderBy('level', 'asc')
            ->get();

        $progressRecords = StudentParagraphProgress::where('user_id', $userId)
            ->get()
            ->keyBy('paragraph_module_id');

        $foundCurrent = false;
        $transformedModules = $modules->map(function ($module) use ($progressRecords, &$foundCurrent) {
            $progress = $progressRecords->get($module->id);

            // Logic: Unang module na walang 'completed' status ang magiging 'current'.
            // Lahat ng bago mag-'current' ay 'completed', lahat ng kasunod ay 'locked'.
            if ($progress && $progress->status === 'completed') {
                $status = 'completed';
            } elseif ($progress && $progress->status === 'in_progress') {
                $status = 'in_progress';
                $foundCurrent = true;
            } elseif (! $foundCurrent) {
                $status = 'current';
                $foundCurrent = true;
            } else {
                $status = 'locked';
            }

            return [
                'id' => $module->id,
                'level' => $module->level,
                'title' => $module->title,
                'total_points' => $module->total_score,
                'status' => $status,
                'words_smashed' => $progress ? $progress->words_smashed : 0,
                'score' => $progress ? $progress->words_smashed : 0,
            ];
        });

        return Inertia::render('Student/SpeakModeLevels', [
            'modules' => $transformedModules,
        ]);
    }

    public function gameplaySpeakMode($id)
    {
        $module = ParagraphModule::select(['id', 'level', 'title', 'content', 'total_score'])->findOrFail($id);

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

        $userId = auth()->id();
        $module = ParagraphModule::findOrFail($request->module_id);

        $accuracy = ($module->total_score > 0)
            ? ($request->words_smashed / $module->total_score) * 100
            : 0;
        $session = GameSession::logSession($userId, $module->id, 'paragraph', $request->words_smashed, $accuracy, $request->streak ?? 0);

        $student = auth()->user()->student;

        $newBadges = [];

        if ($student) {
            $student->updateParagraphProgress($module, $request->words_smashed, $accuracy);
            $newBadges = $student->checkAndAwardBadges($session->id, $accuracy);
        }

        $redirect = redirect()->route('student.results', ['id' => $session->id]);

        if (!empty($newBadges)) {
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

        // Compute badge progress for the current session
        $badgeProgress = [];
        $user = auth()->user();

        if ($user) {
            $student = $user->student;
            $earnedBadgeIds = $user->badges()->pluck('badges.id')->toArray();

            $badges = Badges::whereIn('metric', ['total_points', 'streak', 'accuracy'])->get();

            foreach ($badges as $badge) {
                $currentValue = match ($badge->metric) {
                    'total_points' => $student ? $student->points : 0,
                    'streak' => (int) $session->streak,
                    'accuracy' => round((float) $session->accuracy, 2),
                    default => 0,
                };

                $badgeProgress[] = [
                    'name' => $badge->name,
                    'description' => $badge->description,
                    'slug' => $badge->slug,
                    'icon' => $badge->icon,
                    'metric' => $badge->metric,
                    'threshold' => $badge->threshold_score,
                    'current_value' => $currentValue,
                    'is_earned' => in_array($badge->id, $earnedBadgeIds),
                ];
            }
        }

        return Inertia::render('Student/GameResults', [
            'session' => $session,
            'moduleTitle' => $module->title,
            'totalItems' => $totalItems,
            'badgeProgress' => $badgeProgress,
        ]);
    }
}
