import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Caddy immutable headers', () => {
    it('Caddyfile caches /build/* and /Sound Effects/* as immutable', () => {
        const caddy = fs.readFileSync(path.join(process.cwd(), 'Caddyfile'), 'utf8');
        expect(caddy).toContain('@assets path /build/*');
        expect(caddy).toContain('header @assets Cache-Control "public, max-age=31536000, immutable"');
        expect(caddy).toContain('@sfx path "/Sound Effects/*"');
        expect(caddy).toContain('header @sfx Cache-Control "public, max-age=31536000, immutable"');
    });
});
