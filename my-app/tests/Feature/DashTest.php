<?php
namespace Tests\Feature;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
class DashTest extends TestCase {
    use RefreshDatabase;
    public function test_dash() {
        $u = User::factory()->create(['name'=>'Z','role'=>'student']);
        StudentProfile::factory()->for($u)->create(['avatar'=>'/images/avatars/juan/head.png']);
        $this->actingAs($u)->get(route('student.dashboard'))->assertSuccessful();
    }
}
