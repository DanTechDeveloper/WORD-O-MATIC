<?php

namespace Database\Seeders;

use App\Models\Badges;
use Illuminate\Database\Seeder;

class BadgesSeeder extends Seeder
{
    public function run(): void
    {
        // ponytail: thresholds are >= ; action badges have null threshold (checked via BadgeService::$actionBadges, not meetsThreshold)
        $badges = [
            ['name' => 'First Steps', 'slug' => 'first-steps', 'description' => 'Great start! You have accumulated your first 5 total points.', 'metric' => 'total_points', 'threshold_score' => 5, 'icon' => 'eco'],
            ['name' => 'Word Master', 'slug' => 'word-master', 'description' => 'Recognized for mastering words across modules by earning 50 total points.', 'metric' => 'total_points', 'threshold_score' => 50, 'icon' => 'emoji_events'],
            ['name' => 'Story Quest Finisher', 'slug' => 'story-finisher', 'description' => 'Awarded for completing all paragraph modules.', 'metric' => 'paragraph_completion', 'threshold_score' => 100, 'icon' => 'auto_stories'],
            ['name' => 'Word Blast Finisher', 'slug' => 'word-blast-finisher', 'description' => 'Awarded for completing all word modules. Every word smashed!', 'metric' => 'word_completion', 'threshold_score' => 100, 'icon' => 'sports_esports'],
            ['name' => 'On Fire', 'slug' => 'on-fire', 'description' => 'Nice! Got 3 correct in a row.', 'metric' => 'streak', 'threshold_score' => 3, 'icon' => 'local_fire_department'],
            ['name' => 'Blazing Streak', 'slug' => 'blazing-streak', 'description' => 'On a roll! Got 5 correct in a row.', 'metric' => 'streak', 'threshold_score' => 5, 'icon' => 'whatshot'],
            ['name' => 'Unstoppable', 'slug' => 'unstoppable', 'description' => 'Incredible! Got 7 correct in a row.', 'metric' => 'streak', 'threshold_score' => 7, 'icon' => 'bolt'],
            ['name' => 'Clear Speaker', 'slug' => 'clear-speaker', 'description' => 'Earned by achieving 80% accuracy in a single game.', 'metric' => 'accuracy', 'threshold_score' => 80, 'icon' => 'mic'],
            ['name' => 'Perfect Round', 'slug' => 'perfect-round', 'description' => 'Flawless! Got 100% accuracy in a single game.', 'metric' => 'accuracy', 'threshold_score' => 100, 'icon' => 'workspace_premium'],
            ['name' => 'Tutorial Complete', 'slug' => 'tutorial-complete', 'description' => 'Welcome aboard! Awarded for successfully completing the introductory guide.', 'metric' => 'action', 'threshold_score' => null, 'icon' => 'rocket_launch'],
            ['name' => 'Profile Pioneer', 'slug' => 'profile-pioneer', 'description' => 'Looking sharp! Awarded for successfully personalizing your profile with an avatar.', 'metric' => 'action', 'threshold_score' => null, 'icon' => 'person'],
        ];

        Badges::upsert($badges, ['slug'], ['name', 'description', 'metric', 'threshold_score', 'icon']);
        // ponytail: operator defaults to >= in BadgeService::meetsThreshold, requirement omitted (derivable, not rendered in Badges.jsx)
    }
}
