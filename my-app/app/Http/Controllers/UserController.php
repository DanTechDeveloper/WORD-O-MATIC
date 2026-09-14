<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\BadgeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\Response;

class UserController extends Controller
{
    public function __construct(
        protected BadgeService $badgeService,
    ) {}

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }

    public function index(): InertiaResponse
    {
        return Inertia::render('Auth/Homepage');
    }

    public function teacherLogin(Request $request): Response
    {
        // ponytail: X-Robots-Tag header is belt to <meta robots> suspenders — both cover crawler variants
        $inertia = Inertia::render('Auth/TeacherLogin');
        $response = $inertia->toResponse($request);
        $response->headers->set('X-Robots-Tag', 'noindex, nofollow, noarchive');

        return $response;
    }

    public function teacherLoginPost(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('username', $request->username)
            ->where('role', 'teacher')
            ->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return back()->withErrors([
                'username' => 'Invalid teacher credentials',
            ]);
        }

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('teacher.dashboard');
    }

    public function login(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'pin' => 'required|string',
        ]);

        $user = User::where('name', $request->name)
            ->where('role', 'student')
            ->first();

        if (! $user || ! Hash::check($request->pin, $user->pin)) {
            return back()->withErrors([
                'name' => 'Invalid student credentials.',
            ]);
        }

        Auth::login($user);
        $request->session()->regenerate();

        $avatar = $user->student?->avatar;
        $hasAvatar = $avatar && ! in_array($avatar, ['/images/boy.svg', '/images/girl.svg']);

        $awarded = $hasAvatar ? $this->badgeService->checkAllEligibleBadges($user) : [];

        if (! empty($awarded)) {
            return $hasAvatar
                ? redirect()->route('student.dashboard')->with('new_badges', $awarded)
                : redirect()->route('student.splashScreen')->with('new_badges', $awarded);
        }

        return $hasAvatar
            ? redirect()->route('student.dashboard')
            : redirect()->route('student.splashScreen');
    }
}
