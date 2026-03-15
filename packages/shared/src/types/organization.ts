export type MembershipRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';

export type MembershipStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemberGroup {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  members?: Membership[];
}

export interface Membership {
  id: string;
  organizationId: string;
  organization?: Organization;
  userId: string;
  role: MembershipRole;
  status: MembershipStatus;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  groups?: MemberGroup[];
}

export interface GroupMembership {
  id: string;
  membershipId: string;
  groupId: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  organizationId: string;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface OrgScopedAuthPayload {
  memberships: Membership[];
  defaultMembershipId: string | null;
  activeMembershipId?: string | null;
}
