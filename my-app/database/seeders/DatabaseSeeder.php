<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::create([
            'name' => 'Admin Teacher',
            'username' => 'admin',
            'password' => bcrypt('password'),
            'role' => 'teacher',
        ]);

        $this->call([
            BadgesSeeder::class,
        ]);
    }
}
