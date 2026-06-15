<?php

namespace Database\Seeders;

use App\Models\Badges;
use Illuminate\Database\Seeder;

class BadgesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $badges = [
            [
                'name' => 'Word Master',
                'slug' => 'word-master',
                'description' => 'Recognized for mastering all words within a specific module.',
                'requirement' => 'Complete a word module with 100% mastery.',
            ],
            [
                'name' => 'Story Finisher',
                'slug' => 'story-finisher',
                'description' => 'Awarded for completing a full story or paragraph module.',
                'requirement' => 'Reach the end of any paragraph module.',
            ],
            [
                'name' => 'Clear Speaker',
                'slug' => 'clear-speaker',
                'description' => 'Earned by maintaining high accuracy in speaking exercises.',
                'requirement' => 'Maintain over 90% accuracy in speaking tasks.',
            ],
            [
                'name' => 'Profile Pioneer',
                'slug' => 'profile-pioneer',
                'description' => 'Awarded for successfully personalizing your profile with an avatar.',
                'requirement' => 'Set a custom avatar in your profile settings.',
            ],
        ];

        foreach ($badges as $badge) {
            Badges::create($badge);
        }
    }
}
