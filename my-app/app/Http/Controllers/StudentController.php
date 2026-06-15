<?php

namespace App\Http\Controllers;

use App\Models\Badges;
use App\Models\ParagraphModule;
use App\Models\Student;
use App\Models\StudentParagraphProgress;
use App\Models\StudentWordMastery;
use App\Models\StudentWordProgress;
use App\Models\WordModule;
use Illuminate\Http\JsonResponse;
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
                'last_active_level', 'read_progress', 'speak_progress',
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
        return Inertia::render('Student/Leaderboards');
    }

    public function badges()
    {
        $user = auth()->user();

        $allBadges = Badges::all();

        $userBadgeIds = $user->badges()
            ->pluck('badge_id')
            ->flip();

        $badges = $allBadges->map(function ($badge) use ($userBadgeIds) {
            return [
                'id' => $badge->id,
                'name' => $badge->name,
                'slug' => $badge->slug,
                'description' => $badge->description,
                'requirement' => $badge->requirement,
                'is_earned' => isset($userBadgeIds[$badge->id]),
            ];
        });

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
        ]);

        $userId = auth()->id();
        $module = WordModule::findOrFail($request->module_id);

        // Calculate accuracy based on total points (items) in the module
        $accuracy = ($module->total_points > 0)
            ? ($request->words_smashed / $module->total_points) * 100
            : 0;

        // Update or create progress. status is 'completed' if any words were smashed.
        $progress = StudentWordProgress::updateOrCreate(
            ['user_id' => $userId, 'word_module_id' => $request->module_id],
            [
                'words_smashed' => max($request->words_smashed, 0),
                'accuracy' => round($accuracy, 2),
                'status' => 'completed',
            ]
        );

        // Update Student Profile level tracking
        $student = auth()->user()->student;
        if ($student && $module->level >= $student->read_level) {
            $student->update([
                'read_level' => $module->level + 1,
                'read_progress' => StudentWordProgress::where('user_id', $userId)->where('status', 'completed')->count(),
                'total_points' => StudentWordProgress::where('user_id', $userId)->sum('words_smashed'),
            ]);
        }

        return redirect()->back();
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
        ]);

        $userId = auth()->id();
        $module = ParagraphModule::findOrFail($request->module_id);

        $accuracy = ($module->total_score > 0)
            ? ($request->words_smashed / $module->total_score) * 100
            : 0;

        $progress = StudentParagraphProgress::updateOrCreate(
            ['user_id' => $userId, 'paragraph_module_id' => $request->module_id],
            [
                'words_smashed' => max($request->words_smashed, 0),
                'accuracy' => round($accuracy, 2),
                'status' => 'completed',
            ]
        );

        $student = auth()->user()->student;
        if ($student && $module->level >= $student->speak_level) {
            $student->update([
                'speak_level' => $module->level + 1,
                'speak_progress' => StudentParagraphProgress::where('user_id', $userId)->where('status', 'completed')->count(),
                'total_points' => StudentWordProgress::where('user_id', $userId)->sum('words_smashed') +
                                 StudentParagraphProgress::where('user_id', $userId)->sum('words_smashed'),
            ]);
        }

        return redirect()->back();
    }
}
