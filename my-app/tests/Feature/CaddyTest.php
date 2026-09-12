<?php

namespace Tests\Feature;

use Tests\TestCase;

class CaddyTest extends TestCase
{
    public function test_caddyfile_has_immutable_headers(): void
    {
        $caddy = file_get_contents(base_path('Caddyfile'));
        $this->assertStringContainsString('@assets path /build/*', $caddy);
        $this->assertStringContainsString('header @assets Cache-Control "public, max-age=31536000, immutable"', $caddy);
        $this->assertStringContainsString('@sfx path "/Sound Effects/*"', $caddy);
        $this->assertStringContainsString('header @sfx Cache-Control "public, max-age=31536000, immutable"', $caddy);
    }
}
