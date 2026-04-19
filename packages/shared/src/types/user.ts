import type { Membership } from './organization.js';

export type UserRole = 'ADMIN' | 'ORG_ADMIN' | 'USER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  memberships?: Membership[];
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  organizationId?: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  memberships?: Membership[];
  activeMembershipId?: string | null;
}
