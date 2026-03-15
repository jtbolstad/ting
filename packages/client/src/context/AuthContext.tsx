import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User, Membership } from '@ting/shared';
import { apiClient } from '../api/client';
import { useOrganization } from './OrganizationContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, organizationId: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  memberships: Membership[];
  activeMembership: Membership | null;
  setActiveMembership: (membershipId: string) => void;
  activeOrganizationId: string | null;
  isOrgAdmin: boolean;
  isOrgManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACTIVE_MEMBERSHIP_STORAGE_KEY = 'activeMembershipId';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeMembershipId, setActiveMembershipId] = useState<string | null>(
    localStorage.getItem(ACTIVE_MEMBERSHIP_STORAGE_KEY)
  );
  const { activeOrganizationId, setActiveOrganizationId } = useOrganization();

  const persistToken = useCallback((newToken: string | null) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
    }
    setToken(newToken);
  }, []);

  const applyMembershipState = useCallback(
    (membershipList: Membership[] = [], preferredMembershipId?: string | null) => {
      setMemberships(membershipList);

      if (membershipList.length === 0) {
        setActiveMembershipId(null);
        localStorage.removeItem(ACTIVE_MEMBERSHIP_STORAGE_KEY);
        return;
      }

      const resolvedMembership =
        membershipList.find((membership) => membership.id === preferredMembershipId) ??
        membershipList.find((membership) => membership.isDefault) ??
        membershipList[0];

      setActiveMembershipId(resolvedMembership?.id ?? null);

      if (resolvedMembership) {
        localStorage.setItem(ACTIVE_MEMBERSHIP_STORAGE_KEY, resolvedMembership.id);
        setActiveOrganizationId(resolvedMembership.organizationId);
      }
    },
    [setActiveOrganizationId]
  );

  const applyAuthPayload = useCallback(
    (payload: { user: User; token?: string | null; memberships?: Membership[]; activeMembershipId?: string | null }) => {
      setUser(payload.user);
      if (payload.token) {
        persistToken(payload.token);
      }
      if (payload.memberships) {
        applyMembershipState(payload.memberships, payload.activeMembershipId);
      }
    },
    [applyMembershipState, persistToken]
  );

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    apiClient
      .getCurrentUser()
      .then((data) => {
        applyAuthPayload({
          user: data.user,
          memberships: data.memberships ?? [],
          activeMembershipId: data.activeMembershipId,
        });
      })
      .catch(() => {
        persistToken(null);
        setUser(null);
        setMemberships([]);
        setActiveMembershipId(null);
      })
      .finally(() => setIsLoading(false));
  }, [token, applyAuthPayload, persistToken]);

  const login = async (email: string, password: string) => {
    const response = await apiClient.login(email, password);
    applyAuthPayload(response);
  };

  const register = async (email: string, password: string, name: string, organizationId: string) => {
    const response = await apiClient.register(email, password, name, organizationId);
    applyAuthPayload(response);
  };

  const logout = () => {
    setUser(null);
    persistToken(null);
    setMemberships([]);
    setActiveMembershipId(null);
    localStorage.removeItem(ACTIVE_MEMBERSHIP_STORAGE_KEY);
  };

  const setActiveMembership = (membershipId: string) => {
    const membership = memberships.find((m) => m.id === membershipId) ?? null;
    setActiveMembershipId(membership ? membership.id : null);

    if (membership) {
      localStorage.setItem(ACTIVE_MEMBERSHIP_STORAGE_KEY, membership.id);
      setActiveOrganizationId(membership.organizationId);
    } else {
      localStorage.removeItem(ACTIVE_MEMBERSHIP_STORAGE_KEY);
    }
  };

  useEffect(() => {
    if (!activeOrganizationId || memberships.length === 0) {
      return;
    }

    const membership = memberships.find((m) => m.organizationId === activeOrganizationId);
    if (membership && membership.id !== activeMembershipId) {
      setActiveMembership(membership.id);
    }
  }, [activeOrganizationId, memberships]);

  const activeMembership = memberships.find((membership) => membership.id === activeMembershipId) ?? null;
  const isOrgAdmin = !!activeMembership && ['ADMIN', 'OWNER'].includes(activeMembership.role);
  const isOrgManager = !!activeMembership && ['MANAGER', 'ADMIN', 'OWNER'].includes(activeMembership.role);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN' || isOrgAdmin,
        memberships,
        activeMembership,
        setActiveMembership,
        activeOrganizationId,
        isOrgAdmin,
        isOrgManager,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
