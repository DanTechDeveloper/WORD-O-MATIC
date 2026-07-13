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
                'icon' => 'eco'
            ],
            [
                'name' => 'Word Master',
                'slug' => 'word-master',
                'description' => 'Recognized for mastering words across modules by earning 30 total points.',
                'requirement' => 'Reach 30 total points.',
                'metric' => 'total_points',
                'operator' => '>=',
                'threshold_score' => 30,
                'icon' => 'emoji_events'
            ],
            [
                'name' => 'Story Finisher',
                'slug' => 'story-finisher',
                'description' => 'Awarded for completing multiple paragraph modules and hitting 100 total points.',
                'requirement' => 'Reach 100 total points.',
                'metric' => 'total_points',
                'operator' => '>=',
                'threshold_score' => 100,
                'icon' => 'auto_stories'
            ],

            // =======================================================
            // 2. STREAK-BASED MILESTONES (metric: streak)
            // =======================================================
            [
                'name' => 'On Fire',
                'slug' => 'on-fire',
                'description' => 'Nice! Got 3 correct in a row.',
                'requirement' => 'Get a 3-game streak.',
                'metric' => 'streak',
                'operator' => '>=',
                'threshold_score' => 3,
                'icon' => 'local_fire_department'
            ],
            [
                'name' => 'Blazing Streak',
                'slug' => 'blazing-streak',
                'description' => 'On a roll! Got 5 correct in a row.',
                'requirement' => 'Get a 5-game streak.',
                'metric' => 'streak',
                'operator' => '>=',
                'threshold_score' => 5,
                'icon' => 'whatshot'
            ],
            [
                'name' => 'Unstoppable',
                'slug' => 'unstoppable',
                'description' => 'Incredible! Got 10 correct in a row.',
                'requirement' => 'Get a 10-game streak.',
                'metric' => 'streak',
                'operator' => '>=',
                'threshold_score' => 10,
                'icon' => 'bolt'
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
                'icon' => 'mic'
            ],
            [
                'name' => 'Perfect Round',
                'slug' => 'perfect-round',
                'description' => 'Flawless! Got 100% accuracy in a single game.',
                'requirement' => 'Get 100% accuracy.',
                'metric' => 'accuracy',
                'operator' => '>=',
                'threshold_score' => 100,
                'icon' => 'workspace_premium'
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
                'icon' => 'rocket_launch'
            ],
            [
                'name' => 'Profile Pioneer',
                'slug' => 'profile-pioneer',
                'description' => 'Looking sharp! Awarded for successfully personalizing your profile with an avatar.',
                'requirement' => 'Upload your first profile avatar.',
                'metric' => 'action',
                'operator' => '=',
                'threshold_score' => null,
                'icon' => 'person'
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