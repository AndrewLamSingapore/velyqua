import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { isPwaRegistrationAllowed } from './pwa';

describe('PWA offline boundary', () => {
  afterEach(() => {
    delete (globalThis as { window?: Window }).window;
    delete (globalThis as { navigator?: Navigator }).navigator;
  });

  it('allows registration in secure and local contexts only', () => {
    (globalThis as { window: Window }).window = {
      location: { protocol: 'https:', hostname: 'example.com' }
    } as unknown as Window;
    (globalThis as { navigator: Navigator }).navigator = {
      serviceWorker: {}
    } as Navigator;

    expect(isPwaRegistrationAllowed()).toBe(true);

    (globalThis as { window: Window }).window = {
      location: { protocol: 'http:', hostname: 'example.com' }
    } as unknown as Window;
    expect(isPwaRegistrationAllowed()).toBe(false);

    (globalThis as { window: Window }).window = {
      location: { protocol: 'http:', hostname: 'localhost' }
    } as unknown as Window;
    expect(isPwaRegistrationAllowed()).toBe(true);
  });

  it('ships an installable standalone manifest', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/manifest.webmanifest'), 'utf8'));
    expect(manifest.display).toBe('standalone');
    expect(manifest.name).toContain('VELYQUA');
    expect(manifest.icons[0].purpose).toContain('maskable');
  });

  it('never caches API responses as offline truth', () => {
    const worker = fs.readFileSync(path.join(process.cwd(), 'public/sw.js'), 'utf8');
    expect(worker).toContain("startsWith('/api/')");
    expect(worker).toContain("caches.match('/');");
  });
});
