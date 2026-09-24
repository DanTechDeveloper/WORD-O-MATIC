<?php

namespace Tests\Feature;

use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DeepgramTokenTest extends TestCase
{
    use RefreshDatabase;

    private User $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->student = User::factory()->create(['role' => 'student']);
        StudentProfile::factory()->for($this->student)->create([
            'avatar' => '/images/avatars/juan/head.png',
        ]);
        Cache::flush();
    }

    private function fakeGrant(string $host): void
    {
        Http::fake([
            "{$host}/v1/auth/grant" => Http::response(['access_token' => 'tok-123', 'expires_in' => 3600], 200),
        ]);
    }

    public function test_returns_token_when_key_set(): void
    {
        config(['services.deepgram.key' => 'test-key', 'services.deepgram.region' => 'global']);
        $this->fakeGrant('https://api.deepgram.com');

        $response = $this->actingAs($this->student)
            ->get(route('student.deepgramToken'))
            ->assertSuccessful()
            ->assertJsonPath('token', 'tok-123')
            ->assertJsonPath('expires_in', 3600)
            ->assertJsonPath('baseUrl', 'https://api.deepgram.com');

        // Laravel appends `private` for authenticated responses — only no-store matters.
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
    }

    public function test_missing_key_returns_500(): void
    {
        config(['services.deepgram.key' => null]);

        $this->actingAs($this->student)
            ->get(route('student.deepgramToken'))
            ->assertStatus(500);
    }

    public function test_grant_failure_returns_502(): void
    {
        config(['services.deepgram.key' => 'bad-key', 'services.deepgram.region' => 'global']);
        Http::fake(['https://api.deepgram.com/v1/auth/grant' => Http::response('unauthorized', 401)]);

        $this->actingAs($this->student)
            ->get(route('student.deepgramToken'))
            ->assertStatus(502)
            ->assertJsonPath('error', 'deepgram_grant_failed');
    }

    public function test_connection_failure_returns_502(): void
    {
        config(['services.deepgram.key' => 'k', 'services.deepgram.region' => 'global']);
        Http::fake(fn () => throw new ConnectionException('dns down'));

        $this->actingAs($this->student)
            ->get(route('student.deepgramToken'))
            ->assertStatus(502)
            ->assertJsonPath('error', 'deepgram_grant_connection_failed');
    }

    public function test_region_selects_host(): void
    {
        foreach ([
            'eu' => 'https://api.eu.deepgram.com',
            'au' => 'https://api.au.deepgram.com',
            'global' => 'https://api.deepgram.com',
        ] as $region => $host) {
            Cache::flush();
            config(['services.deepgram.key' => 'k', 'services.deepgram.region' => $region]);
            $this->fakeGrant($host);

            $this->actingAs($this->student)
                ->get(route('student.deepgramToken'))
                ->assertSuccessful()
                ->assertJsonPath('baseUrl', $host);
        }
    }

    public function test_second_call_serves_cache_without_new_http_request(): void
    {
        config(['services.deepgram.key' => 'k', 'services.deepgram.region' => 'global']);
        $this->fakeGrant('https://api.deepgram.com');

        $this->actingAs($this->student)->get(route('student.deepgramToken'))->assertSuccessful();
        $this->actingAs($this->student)->get(route('student.deepgramToken'))->assertSuccessful();

        Http::assertSentCount(1);
    }
}
