import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('PWA offline boundary', () => {
  it('ships an installable standalone manifest', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/manifest.webmanifest'), 'utf8'));
    expect(manifest.display).toBe('standalone');
    expect(manifest.name).toContain('VELYQUA');
    expect(manifest.icons[0].purpose).toContain('maskable');
  });
  it('never caches API responses as offline truth', () => {
    const worker = fs.readFileSync(path.join(process.cwd(), 'public/sw.js'), 'utf8');
    expect(worker).toContain("startsWith('/api/')");
    expect(worker).toContain("caches.match('/')");
  });
});
