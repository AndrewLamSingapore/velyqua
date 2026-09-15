import { Invitation, InvitationState } from './types';

export function invitationState(invitation: Invitation, now = new Date()): InvitationState {
  if (invitation.state === 'USED' || invitation.state === 'REVOKED') return invitation.state;
  return Date.parse(invitation.expiresAt) <= now.getTime() ? 'EXPIRED' : 'ACTIVE';
}

export function invitationCanBeAccepted(invitation: Invitation, now = new Date()): boolean {
  return invitationState(invitation, now) === 'ACTIVE';
}

export function invitationMessage(invitation: Invitation, now = new Date()): string {
  const state = invitationState(invitation, now);
  if (state === 'ACTIVE') return `Invitation expires ${new Date(invitation.expiresAt).toLocaleString()}.`;
  if (state === 'USED') return 'This invitation has already been used.';
  if (state === 'REVOKED') return 'The owner revoked this invitation.';
  return 'This invitation has expired. Ask the owner to create another when needed.';
}
