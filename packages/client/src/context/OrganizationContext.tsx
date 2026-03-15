import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Organization } from '@ting/shared';
import { apiClient } from '../api/client';

interface OrganizationContextValue {
  organizations: Organization[];
  activeOrganizationId: string | null;
  setActiveOrganizationId: (organizationId: string | null) => void;
  isLoading: boolean;
  refresh: () => Promise<void>;
  activeOrganization?: Organization;
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

const ACTIVE_ORG_STORAGE_KEY = 'activeOrganizationId';

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrganizationId, setActiveOrganizationIdState] = useState<string | null>(
    localStorage.getItem(ACTIVE_ORG_STORAGE_KEY)
  );
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getPublicOrganizations();
      setOrganizations(data);
      if (!activeOrganizationId && data.length > 0) {
        setActiveOrganizationIdState(data[0].id);
        localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, data[0].id);
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeOrganizationId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    apiClient.setActiveOrganizationId(activeOrganizationId);
    if (activeOrganizationId) {
      localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, activeOrganizationId);
    } else {
      localStorage.removeItem(ACTIVE_ORG_STORAGE_KEY);
    }
  }, [activeOrganizationId]);

  const activeOrganization = useMemo(
    () => organizations.find((org) => org.id === activeOrganizationId),
    [organizations, activeOrganizationId]
  );

  const setActiveOrganizationId = useCallback((organizationId: string | null) => {
    setActiveOrganizationIdState(organizationId);
  }, []);

  const value = useMemo<OrganizationContextValue>(
    () => ({
      organizations,
      activeOrganizationId,
      setActiveOrganizationId,
      isLoading,
      refresh,
      activeOrganization,
    }),
    [organizations, activeOrganizationId, setActiveOrganizationId, isLoading, refresh, activeOrganization]
  );

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
