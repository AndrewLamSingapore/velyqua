import { describe, expect, it, vi } from 'vitest';
import { createPrimeSessionAdapter } from './prime-session-adapter';

const origin = 'https://velyqua.example';
const value = { session_id: 'session:1', person_id: 'person:lam', device_id: 'device:1',
  application_id: 'velyqua', scopes: ['velyqua.aquarium.read'], expires_at: 1900000000, refreshable: true };
const response = (body: unknown = value) => new Response(JSON.stringify(body), {
  headers: { 'X-PRIME-Trust-Protocol': 'prime.trust.http.v1' },
});

describe('PRIME session transport', () => {
  it('does not issue requests on creation and maps only the public session fields', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response());
    const adapter = createPrimeSessionAdapter(origin, fetcher);
    expect(fetcher).not.toHaveBeenCalled();
    expect(await adapter.currentSession()).toEqual({ sessionId: 'session:1', personId: 'person:lam',
      deviceId: 'device:1', applicationId: 'velyqua', permissions: ['aquarium.read'],
      expiresAt: new Date(value.expires_at * 1000).toISOString(), refreshable: true });
    expect(fetcher).toHaveBeenCalledWith(`${origin}/trust/v1/velyqua/session`, expect.objectContaining({
      method: 'POST', credentials: 'include', mode: 'same-origin', redirect: 'error', cache: 'no-store',
    }));
  });
  it.each([401, 403])('returns no session on authority denial %s without refreshing', async (status) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status }));
    expect(await createPrimeSessionAdapter(origin, fetcher).currentSession()).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it.each([
    { ...value, application_id: 'jarvis' }, { ...value, scopes: ['velyqua.telemetry.publish'] },
    { ...value, scopes: ['jarvis.aquarium.read'] }, { ...value, expires_at: 'never' },
    { ...value, expires_at: 1e30 }, { ...value, device_id: '' },
  ])('rejects invalid or excessive authority in the response', async (invalid) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(response(invalid));
    await expect(createPrimeSessionAdapter(origin, fetcher).currentSession()).rejects.toThrow();
  });
  it('rejects an unrelated server response', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(value)));
    await expect(createPrimeSessionAdapter(origin, fetcher).currentSession()).rejects.toThrow('protocol');
  });
  it('refreshes only the existing identity and rejects changed identity', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(response()).mockResolvedValueOnce(response({}))
      .mockResolvedValueOnce(response({ ...value, person_id: 'person:other' }));
    const adapter = createPrimeSessionAdapter(origin, fetcher);
    const previous = await adapter.currentSession();
    await expect(adapter.refreshSession(previous!)).rejects.toThrow('identity changed');
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it('rejects insecure or path-bearing origins', () => {
    expect(() => createPrimeSessionAdapter('http://velyqua.example')).toThrow();
    expect(() => createPrimeSessionAdapter(`${origin}/other`)).toThrow();
  });
});
