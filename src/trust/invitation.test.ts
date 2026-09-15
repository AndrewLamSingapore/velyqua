import { describe, expect, it } from 'vitest';
import { invitationCanBeAccepted, invitationMessage, invitationState } from './invitation';
import { Invitation } from './types';

const base: Invitation = { invitationId: 'i1', applicationId: 'velyqua', inviterPersonId: 'owner', recipientLabel: 'Family', permissions: ['aquarium.read'], state: 'ACTIVE', expiresAt: '2026-09-16T00:00:00Z' };

describe('invitation lifecycle', () => {
  it('does not silently regenerate expired invitations', () => {
    const now = new Date('2026-09-17T00:00:00Z');
    expect(invitationState(base, now)).toBe('EXPIRED');
    expect(invitationCanBeAccepted(base, now)).toBe(false);
    expect(invitationMessage(base, now)).toContain('expired');
  });
  it.each(['USED', 'REVOKED'] as const)('keeps terminal state %s', (state) => {
    expect(invitationState({ ...base, state }, new Date('2026-09-15T00:00:00Z'))).toBe(state);
  });
});


it('fails closed on invalid invitation expiry and invalid clock', () => {
  const now = new Date('2026-09-15T00:00:00Z');
  expect(invitationCanBeAccepted({ ...base, expiresAt: 'invalid' }, now)).toBe(false);
  expect(invitationCanBeAccepted(base, new Date('invalid'))).toBe(false);
});
