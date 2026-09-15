export type InvitationState = 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED';
export type VelyquaPermission = 'aquarium.read' | 'telemetry.read' | 'care.write' | 'people.manage';

export type TrustedPerson = {
  personId: string;
  displayName: string;
  relationship?: string;
};

export type TrustedDevice = {
  deviceId: string;
  personId: string;
  applicationId: 'velyqua';
  displayName: string;
  permissions: VelyquaPermission[];
  enrolledAt: string;
  lastSeenAt?: string;
  revokedAt?: string;
};

export type Invitation = {
  invitationId: string;
  applicationId: 'velyqua';
  inviterPersonId: string;
  recipientLabel: string;
  permissions: VelyquaPermission[];
  state: InvitationState;
  expiresAt: string;
  secureUrl?: string;
};

export type TrustSession = {
  sessionId: string;
  personId: string;
  deviceId: string;
  applicationId: 'velyqua';
  permissions: VelyquaPermission[];
  expiresAt: string;
  refreshable: boolean;
};

export interface PrimeTrustAdapter {
  currentSession(): Promise<TrustSession | null>;
  refreshSession(session: TrustSession): Promise<TrustSession>;
  listPeople(): Promise<TrustedPerson[]>;
  listDevices(): Promise<TrustedDevice[]>;
  listInvitations(): Promise<Invitation[]>;
  requestInvitation(input: Pick<Invitation, 'recipientLabel' | 'permissions'>): Promise<Invitation>;
  acceptInvitation(opaqueToken: string, deviceName: string): Promise<TrustedDevice>;
  revokeInvitation(invitationId: string): Promise<void>;
  revokeDevice(deviceId: string): Promise<void>;
}

export const applicationIdentity = {
  applicationId: 'velyqua',
  displayName: 'VELYQUA',
  authorityOwner: 'ABEX PRIME',
  protocol: 'prime-trusted-client-v1'
} as const;
