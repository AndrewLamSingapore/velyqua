import type { PrimeTrustAdapter, TrustSession, VelyquaPermission } from './types';

const permissions = new Set<VelyquaPermission>(['aquarium.read', 'telemetry.read', 'care.write', 'people.manage']);
const id = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value);

function session(value: unknown): TrustSession {
  if (!value || typeof value !== 'object') throw new Error('Invalid PRIME session response');
  const v = value as Record<string, unknown>;
  if (v.application_id !== 'velyqua' || !id(v.session_id) || !id(v.person_id) || !id(v.device_id)
    || typeof v.expires_at !== 'number' || !Number.isFinite(v.expires_at)
    || !Number.isFinite(new Date(v.expires_at * 1000).getTime())
    || typeof v.refreshable !== 'boolean' || !Array.isArray(v.scopes) || !v.scopes.length) {
    throw new Error('Invalid PRIME session response');
  }
  const scopes = v.scopes.map((scope: unknown) => {
    if (typeof scope !== 'string' || !scope.startsWith('velyqua.')) throw new Error('Invalid PRIME scope');
    const permission = scope.slice('velyqua.'.length) as VelyquaPermission;
    if (!permissions.has(permission)) throw new Error('Invalid PRIME scope');
    return permission;
  });
  return { sessionId: v.session_id, personId: v.person_id, deviceId: v.device_id,
    applicationId: 'velyqua', permissions: [...new Set(scopes)],
    expiresAt: new Date(v.expires_at * 1000).toISOString(), refreshable: v.refreshable };
}

/** Session portion of the adapter. Requires a reviewed same-origin PRIME transport.
 * No invitations, credentials, administrative routes or automatic refresh on import.
 */
export function createPrimeSessionAdapter(origin: string, fetcher: typeof fetch = fetch):
  Pick<PrimeTrustAdapter, 'currentSession' | 'refreshSession'> {
  const url = new URL(origin);
  if (url.protocol !== 'https:' || url.origin !== origin
    || (typeof window !== 'undefined' && window.location.origin !== origin)) {
    throw new Error('Same-origin HTTPS PRIME transport required');
  }
  async function request(operation: 'session' | 'refresh') {
    const response = await fetcher(`${origin}/trust/v1/velyqua/${operation}`, {
      method: 'POST', credentials: 'include', mode: 'same-origin', redirect: 'error',
      cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: '{}',
    });
    if (response.status === 401 || response.status === 403) return null;
    if (!response.ok) throw new Error('PRIME session transport unavailable');
    if (response.headers.get('X-PRIME-Trust-Protocol') !== 'prime.trust.http.v1') throw new Error('Invalid PRIME protocol');
    const text = await response.text();
    if (text.length > 8192) throw new Error('Invalid PRIME response size');
    return JSON.parse(text) as unknown;
  }
  return {
    async currentSession() { const value = await request('session'); return value === null ? null : session(value); },
    async refreshSession(previous) {
      if (previous.applicationId !== 'velyqua' || !previous.refreshable) throw new Error('PRIME refresh unavailable');
      if (await request('refresh') === null) throw new Error('PRIME refresh denied');
      const value = await request('session');
      if (value === null) throw new Error('PRIME refreshed session unavailable');
      const next = session(value);
      if (next.personId !== previous.personId || next.deviceId !== previous.deviceId) throw new Error('PRIME identity changed');
      return next;
    },
  };
}
