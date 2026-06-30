<?php

namespace Database\Seeders;

use App\Models\PracticeItem;
use App\Models\PracticeSet;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Admin Teacher',
            'username' => 'admin',
            'email' => 'teacher@wordomatic.edu',
            'password' => bcrypt('password'),
            'role' => 'teacher',
        ]);

        $this->call([
            CurriculumSeeder::class,
            StudentSeeder::class,
            BadgesSeeder::class,
        ]);

        $practiceReadSet = PracticeSet::create([
            'name' => 'Tutorial Practice - Read',
            'slug' => 'tutorial-practice-read',
            'type' => 'word',
            'total_items' => 5,
        ]);

        foreach (['cat', 'dog', 'sun', 'hat', 'run'] as $position => $word) {
            PracticeItem::create([
                'practice_set_id' => $practiceReadSet->id,
                'content' => $word,
                'position' => $position + 1,
            ]);
        }

        $practiceSpeakSet = PracticeSet::create([
            'name' => 'Tutorial Practice - Speak',
            'slug' => 'tutorial-practice-speak',
            'type' => 'sentence',
            'content' => 'I like to play with my cat.',
            'total_items' => 7,
        ]);

        foreach (['I', 'like', 'to', 'play', 'with', 'my', 'cat.'] as $position => $word) {
            PracticeItem::create([
                'practice_set_id' => $practiceSpeakSet->id,
                'content' => $word,
                'position' => $position + 1,
            ]);
        }
    }
}
