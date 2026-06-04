<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'name' => 'required|string',
            'pin' => 'required|string|size:4',
        ]);

        // Find the student by name and role
        $user = User::where('name', $credentials['name'])
            ->where('role', 'student')
            ->first();

        // Verify hashed PIN and log the user in
        if ($user && Hash::check($credentials['pin'], $user->pin)) {
            Auth::login($user);
            $request->session()->regenerate();

            return redirect()->intended('/student/greetings');
        }

        throw ValidationException::withMessages([
            'name' => 'The provided credentials do not match our records.',
        ]);
    }
}
