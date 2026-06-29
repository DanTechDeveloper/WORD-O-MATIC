<?php

namespace Database\Factories;

use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class StudentProfileFactory extends Factory
{
    protected $model = StudentProfile::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'section' => fake()->randomElement(['Sector 7-G', 'Sector Alpha', 'Sector Bravo']),
            'avatar' => '/images/avatars/juan/head.png',
            'wordBlastAcc' => 0,
            'storyQuestAcc' => 0,
            'status' => 'notStarted',
            'read_level' => 1,
            'speak_level' => 1,
            'points' => 0,
        ];
    }
}
