import { describe, expect, it } from 'vitest';
import { authorizeInvitationAcceptance, authorizeSession, validEnrollmentBinding } from './authorization';
import { Invitation, TrustSession } from './types';

const session: TrustSession = { sessionId: 'session-1', personId: 'person-1', deviceId: 'device-1', applicationId: 'velyqua', permissions: ['aquarium.read'], expiresAt: '2026-09-16T00:00:00Z', refreshable: true };
const invite: Invitation = { invitationId: 'invite-1', applicationId: 'velyqua', inviterPersonId: 'owner-1', recipientLabel: 'Family', permissions: ['aquarium.read'], state: 'ACTIVE', expiresAt: '2026-09-16T00:00:00Z' };

describe('application-scoped trust boundary', () => {
  it('denies missing, expired and insufficient sessions', () => {
    const now = new Date('2026-09-15T00:00:00Z');
    expect(authorizeSession(null, 'aquarium.read', now)).toBe(false);
    expect(authorizeSession(session, 'people.manage', now)).toBe(false);
    expect(authorizeSession(session, 'aquarium.read', new Date('2026-09-17T00:00:00Z'))).toBe(false);
  });
  it('prevents cross-application invitation use', () => {
    expect(authorizeInvitationAcceptance(invite, 'jarvis', new Date('2026-09-15T00:00:00Z'))).toBe(false);
    expect(authorizeInvitationAcceptance(invite, 'velyqua', new Date('2026-09-15T00:00:00Z'))).toBe(true);
  });
  it('retains only non-secret enrollment identity across restart', () => {
    const binding = { personId: 'person-1', deviceId: 'device-1', applicationId: 'velyqua', enrolledAt: '2026-09-15T00:00:00Z' };
    const serialized = JSON.stringify(binding);
    expect(validEnrollmentBinding(JSON.parse(serialized))).toBe(true);
    expect(serialized).not.toMatch(/token|credential|secret|session/i);
  });
});


it('fails closed on invalid session expiry and invalid clock', () => {
  const now = new Date('2026-09-15T00:00:00Z');
  expect(authorizeSession({ ...session, expiresAt: 'invalid' }, 'aquarium.read', now)).toBe(false);
  expect(authorizeSession(session, 'aquarium.read', new Date('invalid'))).toBe(false);
  expect(authorizeInvitationAcceptance({ ...invite, expiresAt: 'invalid' }, 'velyqua', now)).toBe(false);
});
