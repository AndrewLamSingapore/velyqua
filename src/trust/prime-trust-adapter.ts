import { createPrimeSessionAdapter } from './prime-session-adapter';
import type { Invitation, PrimeTrustAdapter, TrustedDevice, TrustedPerson } from './types';

const id = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v);
const text = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 256;
const date = (v: unknown) => typeof v === 'string' && Number.isFinite(Date.parse(v));
const permissions = (v: unknown) => Array.isArray(v) && v.length > 0 && v.every(p => ['aquarium.read','telemetry.read','care.write','people.manage'].includes(p));

export function createPrimeTrustAdapter(origin: string, fetcher: typeof fetch = fetch): PrimeTrustAdapter {
  const sessions = createPrimeSessionAdapter(origin, fetcher);
  async function request(operation: string, target?: string): Promise<unknown> {
    if (target !== undefined && !id(target)) throw new Error('Invalid PRIME target');
    const response = await fetcher(`${origin}/trust/v1/velyqua/client/${operation}`, {
      method:'POST', credentials:'include', mode:'same-origin', redirect:'error', cache:'no-store',
      headers:{'Content-Type':'application/json','X-PRIME-Request-ID':crypto.randomUUID()},
      body:JSON.stringify(target === undefined ? {} : {target}),
    });
    if (!response.ok) throw new Error('PRIME operation unavailable');
    if (response.headers.get('X-PRIME-Trust-Protocol') !== 'prime.trust.http.v1') throw new Error('Invalid PRIME protocol');
    const raw = await response.text();
    if (raw.length > 32000) throw new Error('Invalid PRIME response size');
    return JSON.parse(raw);
  }
  async function list<T>(operation: string, valid: (v: Record<string, unknown>) => boolean): Promise<T[]> {
    const value = await request(operation);
    if (!Array.isArray(value) || value.length > 100 || value.some(v => !v || typeof v !== 'object' || !valid(v))) throw new Error('Invalid PRIME projection');
    return value as T[];
  }
  async function revoke(operation: string, target: string) {
    const value = await request(operation, target);
    if (!value || typeof value !== 'object' || (value as {ok?:unknown}).ok !== true) throw new Error('PRIME revocation unconfirmed');
  }
  return {
    ...sessions,
    listPeople: () => list<TrustedPerson>('people', v => id(v.personId) && text(v.displayName)),
    listDevices: () => list<TrustedDevice>('devices', v => v.applicationId === 'velyqua' && id(v.personId)
      && id(v.deviceId) && text(v.displayName) && permissions(v.permissions) && date(v.enrolledAt)),
    listInvitations: () => list<Invitation>('invitations', v => v.applicationId === 'velyqua' && id(v.invitationId)
      && id(v.inviterPersonId) && text(v.recipientLabel) && permissions(v.permissions)
      && ['ACTIVE','USED','EXPIRED','REVOKED'].includes(String(v.state)) && date(v.expiresAt)),
    // Owner explicitly parked enrollment. No token, invite, QR or device is created
    // by constructing the adapter, loading the app or invoking these locked methods.
    async requestInvitation() { throw new Error('ENROLLMENT_OWNER_LOCKED'); },
    async acceptInvitation() { throw new Error('ENROLLMENT_OWNER_LOCKED'); },
    revokeInvitation: target => revoke('revoke-invitation', target),
    revokeDevice: target => revoke('revoke-device', target),
  };
}
