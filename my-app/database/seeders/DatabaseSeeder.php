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

        $students = [
            ['name' => 'Dan', 'student_id' => 'STU-001', 'pin' => '1234', 'section' => 'Sector 7-G', 'wordBlastAcc' => 92, 'storyQuestAcc' => 88, 'status' => 'onTrack'],
            ['name' => 'Bianca Cruz', 'student_id' => 'STU-002', 'pin' => '1234', 'section' => 'Sector 7-G', 'wordBlastAcc' => 45, 'storyQuestAcc' => 52, 'status' => 'atRisk'],
            ['name' => 'Carlos Diaz', 'student_id' => 'STU-003', 'pin' => '1234', 'section' => 'Sector 7-G', 'wordBlastAcc' => 68, 'storyQuestAcc' => 72, 'status' => 'support'],
            ['name' => 'Diana Lim', 'student_id' => 'STU-004', 'pin' => '1234', 'section' => 'Sector 7-G', 'wordBlastAcc' => 0.0, 'storyQuestAcc' => 0.0, 'status' => 'notStarted'],
            ['name' => 'Ethan Tan', 'student_id' => 'STU-005', 'pin' => '1234', 'section' => 'Sector 7-G', 'wordBlastAcc' => 85, 'storyQuestAcc' => 90, 'status' => 'onTrack'],
            ['name' => 'Fiona Santos', 'student_id' => 'STU-006', 'pin' => '1234', 'section' => 'Sector 7-G', 'wordBlastAcc' => 30, 'storyQuestAcc' => 25, 'status' => 'atRisk'],
            ['name' => 'Gian Garcia', 'student_id' => 'STU-007', 'pin' => '1234', 'section' => 'Sector 7-G', 'wordBlastAcc' => 60, 'storyQuestAcc' => 65, 'status' => 'support'],
            ['name' => 'Hannah Ramos', 'student_id' => 'STU-008', 'pin' => '1234', 'section' => 'Sector Alpha', 'wordBlastAcc' => 95, 'storyQuestAcc' => 93, 'status' => 'onTrack'],
            ['name' => 'Ivan Mercado', 'student_id' => 'STU-009', 'pin' => '1234', 'section' => 'Sector Alpha', 'wordBlastAcc' => 40, 'storyQuestAcc' => 38, 'status' => 'atRisk'],
            ['name' => 'Julia Torres', 'student_id' => 'STU-010', 'pin' => '1234', 'section' => 'Sector Alpha', 'wordBlastAcc' => 0.0, 'storyQuestAcc' => 0.0, 'status' => 'notStarted'],
            ['name' => 'Kyle Villanueva', 'student_id' => 'STU-011', 'pin' => '1234', 'section' => 'Sector Alpha', 'wordBlastAcc' => 78, 'storyQuestAcc' => 80, 'status' => 'onTrack'],
            ['name' => 'Lea Sison', 'student_id' => 'STU-012', 'pin' => '1234', 'section' => 'Sector Alpha', 'wordBlastAcc' => 50, 'storyQuestAcc' => 55, 'status' => 'support'],
            ['name' => 'Marco Lopez', 'student_id' => 'STU-013', 'pin' => '1234', 'section' => 'Sector Bravo', 'wordBlastAcc' => 88, 'storyQuestAcc' => 84, 'status' => 'onTrack'],
            ['name' => 'Nina Fernandez', 'student_id' => 'STU-014', 'pin' => '1234', 'section' => 'Sector Bravo', 'wordBlastAcc' => 35, 'storyQuestAcc' => 42, 'status' => 'atRisk'],
            ['name' => 'Oscar Dela Cruz', 'student_id' => 'STU-015', 'pin' => '1234', 'section' => 'Sector Bravo', 'wordBlastAcc' => 72, 'storyQuestAcc' => 68, 'status' => 'support'],
            ['name' => 'Paula Gomez', 'student_id' => 'STU-016', 'pin' => '1234', 'section' => 'Sector Bravo', 'wordBlastAcc' => 0.0, 'storyQuestAcc' => 0.0, 'status' => 'notStarted'],
            ['name' => 'Quinn Rivera', 'student_id' => 'STU-017', 'pin' => '1234', 'section' => 'Sector Bravo', 'wordBlastAcc' => 82, 'storyQuestAcc' => 79, 'status' => 'onTrack'],
            ['name' => 'Rafa Castillo', 'student_id' => 'STU-018', 'pin' => '1234', 'section' => 'Sector Bravo', 'wordBlastAcc' => 20, 'storyQuestAcc' => 15, 'status' => 'atRisk'],
            ['name' => 'Sofia Alvarez', 'student_id' => 'STU-019', 'pin' => '1234', 'section' => 'Sector 7-G', 'wordBlastAcc' => 70, 'storyQuestAcc' => 74, 'status' => 'support'],
            ['name' => 'Tomas Guerrero', 'student_id' => 'STU-020', 'pin' => '1234', 'section' => 'Sector 7-G', 'wordBlastAcc' => 91, 'storyQuestAcc' => 95, 'status' => 'onTrack'],
            ['name' => 'Uma Patel', 'student_id' => 'STU-021', 'pin' => '1234', 'section' => 'Sector Alpha', 'wordBlastAcc' => 55, 'storyQuestAcc' => 60, 'status' => 'support'],
            ['name' => 'Victor Ong', 'student_id' => 'STU-022', 'pin' => '1234', 'section' => 'Sector Alpha', 'wordBlastAcc' => 0.0, 'storyQuestAcc' => 0.0, 'status' => 'notStarted'],
            ['name' => 'Wendy Chua', 'student_id' => 'STU-023', 'pin' => '1234', 'section' => 'Sector Bravo', 'wordBlastAcc' => 65, 'storyQuestAcc' => 70, 'status' => 'support'],
            ['name' => 'Xander Bautista', 'student_id' => 'STU-024', 'pin' => '1234', 'section' => 'Sector Bravo', 'wordBlastAcc' => 40, 'storyQuestAcc' => 35, 'status' => 'atRisk'],
        ];

        foreach ($students as $data) {
            $user = User::create([
                'name' => $data['name'],
                'student_id' => $data['student_id'],
                'pin' => $data['pin'],
                'role' => 'student',
            ]);

            $user->student()->create([
                'points' => 0,
                'avatar' => null,
                'read_progress' => 0,
                'speak_progress' => 0,
                'status' => $data['status'],
                'wordBlastAcc' => $data['wordBlastAcc'] ?? 0,
                'storyQuestAcc' => $data['storyQuestAcc'] ?? 0,
                'section' => $data['section'],
            ]);
        }

        $this->call([
            BadgesSeeder::class,
        ]);
    }
}
