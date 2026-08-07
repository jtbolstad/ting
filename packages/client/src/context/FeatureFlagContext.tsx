import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { FeatureFlagKey, FeatureFlagMap } from '@ting/shared';
import { FEATURE_FLAG_KEYS } from '@ting/shared';
import { apiClient } from '../api/client';
import { useOrganization } from './OrganizationContext';

const defaultMap: FeatureFlagMap = Object.fromEntries(
  FEATURE_FLAG_KEYS.map((k) => [k, false]),
) as FeatureFlagMap;

interface FeatureFlagContextValue {
  flags: FeatureFlagMap;
  isLoading: boolean;
  refresh: () => Promise<void>;
  setFlag: (key: FeatureFlagKey, enabled: boolean) => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | undefined>(undefined);

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const { activeOrganizationId } = useOrganization();
  const [flags, setFlags] = useState<FeatureFlagMap>(defaultMap);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!activeOrganizationId) {
      setFlags(defaultMap);
      return;
    }
    setIsLoading(true);
    try {
      const map = await apiClient.getFeatureFlags();
      setFlags(map);
    } catch {
      // Non-fatal — keep defaults
    } finally {
      setIsLoading(false);
    }
  }, [activeOrganizationId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setFlag = useCallback(
    async (key: FeatureFlagKey, enabled: boolean) => {
      const updated = await apiClient.setFeatureFlag(key, enabled);
      setFlags(updated);
    },
    [],
  );

  return (
    <FeatureFlagContext.Provider value={{ flags, isLoading, refresh, setFlag }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags(): FeatureFlagContextValue {
  const ctx = useContext(FeatureFlagContext);
  if (!ctx) throw new Error('useFeatureFlags must be used inside FeatureFlagProvider');
  return ctx;
}

export function useFeatureFlag(key: FeatureFlagKey): boolean {
  const { flags } = useFeatureFlags();
  return flags[key] ?? false;
}
