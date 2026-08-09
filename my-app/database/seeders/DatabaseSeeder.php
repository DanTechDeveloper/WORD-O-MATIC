<?php

namespace Database\Seeders;

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
            // CurriculumSeeder::class,
            BadgesSeeder::class,
            // StudentSeeder::class,
        ]);
    }
}
