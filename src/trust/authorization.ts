import { Invitation, TrustSession, VelyquaPermission } from './types';
import { invitationCanBeAccepted } from './invitation';

export function authorizeSession(session: TrustSession | null, permission: VelyquaPermission, now = new Date()): boolean {
  if (!session || session.applicationId !== 'velyqua') return false;
  const expires = Date.parse(session.expiresAt);
  const current = now.getTime();
  if (!Number.isFinite(expires) || !Number.isFinite(current) || expires <= current) return false;
  return session.permissions.includes(permission);
}

export function authorizeInvitationAcceptance(invitation: Invitation, requestedApplication: string, now = new Date()): boolean {
  return requestedApplication === 'velyqua'
    && invitation.applicationId === 'velyqua'
    && invitationCanBeAccepted(invitation, now);
}

export type EnrollmentBinding = { personId: string; deviceId: string; applicationId: 'velyqua'; enrolledAt: string };

export function validEnrollmentBinding(value: unknown): value is EnrollmentBinding {
  if (!value || typeof value !== 'object') return false;
  const binding = value as Partial<EnrollmentBinding>;
  return binding.applicationId === 'velyqua'
    && typeof binding.personId === 'string' && binding.personId.length > 0
    && typeof binding.deviceId === 'string' && binding.deviceId.length > 0
    && typeof binding.enrolledAt === 'string' && Number.isFinite(Date.parse(binding.enrolledAt));
}
