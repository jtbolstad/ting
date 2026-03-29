import type { User, Membership } from '@ting/shared';
import { mockOrganization } from './organizations';

export const mockUser: User = {
  id: 'user-lars-id',
  email: 'lars@ting.com',
  name: 'Lars Nilsen',
  role: 'MEMBER',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

export const mockMembership: Membership = {
  id: 'membership-lars-oslo',
  organizationId: mockOrganization.id,
  organization: mockOrganization,
  userId: mockUser.id,
  role: 'MEMBER',
  status: 'ACTIVE',
  isDefault: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};
