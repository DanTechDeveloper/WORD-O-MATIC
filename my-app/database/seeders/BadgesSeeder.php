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
            // =======================================================
            // 1. POINTS-BASED MILESTONES (metric: total_points)
            // =======================================================
            [
                'name' => 'First Steps',
                'slug' => 'first-steps',
                'description' => 'Great start! You have accumulated your first 5 total points.',
                'requirement' => 'Reach 5 total points.',
                'metric' => 'total_points',
                'operator' => '>=',
                'threshold_score' => 5,
                'icon' => '🌱'
            ],
            [
                'name' => 'Word Master',
                'slug' => 'word-master',
                'description' => 'Recognized for mastering words across modules by earning 30 total points.',
                'requirement' => 'Reach 30 total points.',
                'metric' => 'total_points',
                'operator' => '>=',
                'threshold_score' => 30,
                'icon' => '🏆'
            ],
            [
                'name' => 'Story Finisher',
                'slug' => 'story-finisher',
                'description' => 'Awarded for completing multiple paragraph modules and hitting 100 total points.',
                'requirement' => 'Reach 100 total points.',
                'metric' => 'total_points',
                'operator' => '>=',
                'threshold_score' => 100,
                'icon' => '📚'
            ],

            // =======================================================
            // 2. STREAK-BASED MILESTONES (metric: streak)
            // =======================================================
            [
                'name' => 'On Fire',
                'slug' => 'on-fire',
                'description' => 'Unstoppable! Got 3 correct in a row.',
                'requirement' => 'Get a 3-game streak.',
                'metric' => 'streak',
                'operator' => '>=',
                'threshold_score' => 3,
                'icon' => '🔥'
            ],

            // =======================================================
            // 3. ACCURACY-BASED MILESTONES (metric: accuracy)
            // =======================================================
            [
                'name' => 'Clear Speaker',
                'slug' => 'clear-speaker',
                'description' => 'Earned by achieving 80% accuracy in a single game.',
                'requirement' => 'Get 80% accuracy or higher.',
                'metric' => 'accuracy',
                'operator' => '>=',
                'threshold_score' => 80,
                'icon' => '🎤'
            ],

            // =======================================================
            // 4. ACTION-BASED BADGES (metric: action / threshold_score: 0)
            // =======================================================
            [
                'name' => 'Tutorial Complete',
                'slug' => 'tutorial-complete',
                'description' => 'Welcome aboard! Awarded for successfully completing the introductory guide.',
                'requirement' => 'Finish the student tutorial guide.',
                'metric' => 'action',
                'operator' => '=',
                'threshold_score' => null,
                'icon' => '🚀'
            ],
            [
                'name' => 'Profile Pioneer',
                'slug' => 'profile-pioneer',
                'description' => 'Looking sharp! Awarded for successfully personalizing your profile with an avatar.',
                'requirement' => 'Upload your first profile avatar.',
                'metric' => 'action',
                'operator' => '=',
                'threshold_score' => null,
                'icon' => '👤'
            ],
        ];

        foreach ($badges as $badge) {
            Badges::updateOrCreate(
                ['slug' => $badge['slug']],
                $badge
            );
        }
    }
}