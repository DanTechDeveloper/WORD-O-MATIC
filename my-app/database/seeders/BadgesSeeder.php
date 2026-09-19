<?php

namespace Database\Seeders;

use App\Models\Badges;
use Illuminate\Database\Seeder;

class BadgesSeeder extends Seeder
{
    public function run(): void
    {
        // ponytail: thresholds are >= ; action badges have null threshold (checked via BadgeService::$actionBadges, not meetsThreshold)
        // ponytail: mode is word | paragraph | shared — Badges.jsx sections group by it, never by slug convention.
        Badges::whereIn('slug', ['story-finisher', 'word-blast-finisher'])->delete();
        $badges = [
            ['name' => 'First Steps', 'slug' => 'first-steps', 'description' => 'Great start! You have accumulated your first 5 total points.', 'metric' => 'total_points', 'mode' => 'shared', 'threshold_score' => 5, 'icon' => 'eco'],
            ['name' => 'Word Master', 'slug' => 'word-master', 'description' => 'Recognized for mastering words across modules by earning 50 total points.', 'metric' => 'total_points', 'mode' => 'shared', 'threshold_score' => 50, 'icon' => 'emoji_events'],
            ['name' => 'Halfway Hero', 'slug' => 'halfway-hero', 'description' => 'Halfway there! Completed 5 Word Blast levels.', 'metric' => 'word_completion', 'mode' => 'word', 'threshold_score' => 50, 'icon' => 'flag'],
            ['name' => 'Story Explorer', 'slug' => 'story-explorer', 'description' => 'Exploring stories! Completed 5 Story Quest levels.', 'metric' => 'paragraph_completion', 'mode' => 'paragraph', 'threshold_score' => 50, 'icon' => 'explore'],
            ['name' => 'Story Master', 'slug' => 'story-master', 'description' => 'Finished every Story Quest level. A true story master!', 'metric' => 'paragraph_completion', 'mode' => 'paragraph', 'threshold_score' => 100, 'icon' => 'auto_stories'],
            ['name' => 'Sentence Star', 'slug' => 'sentence-star', 'description' => 'Brilliant! Got 5 correct in a single sentence.', 'metric' => 'best_sentence', 'mode' => 'paragraph', 'threshold_score' => 5, 'icon' => 'star'],
            ['name' => 'On Fire', 'slug' => 'on-fire', 'description' => 'Nice! Got 3 correct in a row.', 'metric' => 'streak', 'mode' => 'word', 'threshold_score' => 3, 'icon' => 'local_fire_department'],
            ['name' => 'Blazing Streak', 'slug' => 'blazing-streak', 'description' => 'On a roll! Got 5 correct in a row.', 'metric' => 'streak', 'mode' => 'word', 'threshold_score' => 5, 'icon' => 'whatshot'],
            ['name' => 'Unstoppable', 'slug' => 'unstoppable', 'description' => 'Incredible! Got 7 correct in a row.', 'metric' => 'streak', 'mode' => 'word', 'threshold_score' => 7, 'icon' => 'bolt'],
            ['name' => 'Clear Speaker', 'slug' => 'clear-speaker', 'description' => 'Earned by achieving 80% accuracy in a single game.', 'metric' => 'accuracy', 'mode' => 'shared', 'threshold_score' => 80, 'icon' => 'mic'],
            ['name' => 'Perfect Round', 'slug' => 'perfect-round', 'description' => 'Flawless! Got 100% accuracy in a single game.', 'metric' => 'accuracy', 'mode' => 'shared', 'threshold_score' => 100, 'icon' => 'workspace_premium'],
            ['name' => 'Tutorial Complete', 'slug' => 'tutorial-complete', 'description' => 'Welcome aboard! Awarded for successfully completing the introductory guide.', 'metric' => 'action', 'mode' => 'shared', 'threshold_score' => null, 'icon' => 'rocket_launch'],
            ['name' => 'Profile Pioneer', 'slug' => 'profile-pioneer', 'description' => 'Looking sharp! Awarded for successfully personalizing your profile with an avatar.', 'metric' => 'action', 'mode' => 'shared', 'threshold_score' => null, 'icon' => 'person'],
        ];

        Badges::upsert($badges, ['slug'], ['name', 'description', 'metric', 'mode', 'threshold_score', 'icon']);
        // ponytail: operator defaults to >= in BadgeService::meetsThreshold, requirement omitted (derivable, not rendered in Badges.jsx)
    }
}
