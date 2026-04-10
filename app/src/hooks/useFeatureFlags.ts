/**
 * useFeatureFlags Hook
 *
 * React hook for admin feature-flag CRUD with loading/error states.
 *
 * @module hooks/useFeatureFlags
 * @task US_049 task_003 - Admin Feature Flags UI
 */

import { useState, useEffect, useCallback } from 'react';
import type { FlagDefinitionWithConfig, FlagConfig, FlagAnalytics } from '../services/featureFlagApi';
import * as flagApi from '../services/featureFlagApi';

interface UseFeatureFlagsReturn {
  flags: FlagDefinitionWithConfig[];
  loading: boolean;
  error: string | null;
  refreshFlags: () => Promise<void>;
  updateFlag: (flagName: string, config: Partial<FlagConfig>) => Promise<void>;
  loadAnalytics: (flagName: string) => Promise<FlagAnalytics>;
  invalidateCache: (flagName?: string) => Promise<void>;
}

export function useFeatureFlags(): UseFeatureFlagsReturn {
  const [flags, setFlags] = useState<FlagDefinitionWithConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshFlags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await flagApi.getFlags();
      setFlags(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFlags();
  }, [refreshFlags]);

  const updateFlag = useCallback(
    async (flagName: string, config: Partial<FlagConfig>) => {
      await flagApi.updateFlag(flagName, config);
      await refreshFlags();
    },
    [refreshFlags],
  );

  const loadAnalytics = useCallback(async (flagName: string) => {
    return flagApi.getFlagAnalytics(flagName);
  }, []);

  const invalidateCache = useCallback(
    async (flagName?: string) => {
      await flagApi.invalidateFlagCache(flagName);
      await refreshFlags();
    },
    [refreshFlags],
  );

  return { flags, loading, error, refreshFlags, updateFlag, loadAnalytics, invalidateCache };
}
