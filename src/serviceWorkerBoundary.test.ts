import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

function harness(offline = false) {
  const handlers: Record<string, (event: any) => void> = {};
  const writes: string[] = [], deleted: string[] = [];
  let fallbackReads = 0;
  const cache = { addAll: async () => {}, put: async (r: Request) => { writes.push(r.url); } };
  vm.runInNewContext(readFileSync('public/sw.js', 'utf8'), {
    self: { location: { origin: 'https://velyqua.test' }, addEventListener: (k: string, fn: any) => handlers[k] = fn },
    URL, Response,
    caches: { open: async () => cache, keys: async () => ['velyqua-shell-v1', 'unrelated-cache'],
      delete: async (key: string) => { deleted.push(key); },
      match: async (key: string) => { if (key === '/') { fallbackReads++; return new Response('shell'); } } },
    fetch: async () => { if (offline) throw new Error('offline'); return new Response('asset'); }
  });
  async function request(url: string, mode = 'cors', authorization = false) {
    let result: Promise<Response> | undefined;
    const pending: Promise<unknown>[] = [];
    handlers.fetch!({ request: { url, mode, method: 'GET', headers: new Headers(authorization ? { authorization: 'synthetic-test' } : {}) },
      respondWith: (value: Promise<Response>) => result = value, waitUntil: (value: Promise<unknown>) => pending.push(value) });
    const response = result ? await result : undefined;
    await Promise.all(pending);
    return response;
  }
  return { request, writes, deleted, handlers, fallbackReads: () => fallbackReads };
}
describe('service worker privacy and fallback behavior', () => {
  it('never intercepts cross-origin, authenticated, API or query-bearing requests', async () => {
    const h = harness();
    for (const url of ['https://project.supabase.co/rest/v1/tank_documents', 'https://velyqua.test/api/private', 'https://velyqua.test/assets/a.js?private=1'])
      expect(await h.request(url)).toBeUndefined();
    expect(await h.request('https://velyqua.test/assets/a.js', 'cors', true)).toBeUndefined();
    expect(h.writes).toEqual([]);
  });
  it('caches public static assets and does not cache arbitrary data routes', async () => {
    const h = harness();await h.request('https://velyqua.test/assets/app.js');
    expect(h.writes).toEqual(['https://velyqua.test/assets/app.js']);
    expect(await h.request('https://velyqua.test/private-records')).toBeUndefined();
  });
  it('returns shell fallback only for navigations, never for failed scripts', async () => {
    const h = harness(true);
    expect((await h.request('https://velyqua.test/assets/missing.js'))?.type).toBe('error');
    expect(h.fallbackReads()).toBe(0);
    expect(await (await h.request('https://velyqua.test/', 'navigate'))?.text()).toBe('shell');
  });
  it('cleans old VELYQUA caches without deleting caches owned by another app', async () => {
    const h = harness();let pending: Promise<unknown> | undefined;
    h.handlers.activate!({ waitUntil: (value: Promise<unknown>) => pending = value });await pending;
    expect(h.deleted).toEqual(['velyqua-shell-v1']);
  });
});
