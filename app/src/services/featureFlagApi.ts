/**
 * Feature Flag API Client
 *
 * API functions for the admin feature-flag management endpoints.
 * Uses the shared `api` Axios instance which handles JWT auth.
 *
 * @module services/featureFlagApi
 * @task US_049 task_003 - Admin Feature Flags UI
 */

import api from './api';

export interface FlagTargeting {
  type: 'all' | 'beta_testers' | 'department' | 'role' | 'percentage' | 'user';
  value?: string | number;
}

export interface FlagConfig {
  name: string;
  value: boolean | string | number;
  type: 'boolean' | 'string' | 'number';
  enabled: boolean;
  targeting: FlagTargeting;
  updatedAt: string;
  updatedBy?: string;
  description?: string;
  category?: string;
}

export interface FlagDefinitionWithConfig {
  name: string;
  definition: {
    type: 'boolean' | 'string' | 'number';
    default: boolean | string | number;
    description: string;
    category: string;
  };
  config: FlagConfig | null;
}

export interface FlagAnalytics {
  flagName: string;
  dailyUsage: Array<{ date: string; count: number }>;
  abTestResults?: Array<{
    variant: string;
    totalUsers: number;
    completionRate: number;
    avgTime: number;
  }>;
  errorCount: number;
  errorPeriodDays: number;
}

export async function getFlags(): Promise<FlagDefinitionWithConfig[]> {
  const res = await api.get('/admin/feature-flags');
  return res.data?.data ?? res.data ?? [];
}

export async function updateFlag(
  flagName: string,
  config: Partial<FlagConfig>,
): Promise<void> {
  await api.put(`/admin/feature-flags/${encodeURIComponent(flagName)}`, config);
}

export async function getFlagAnalytics(flagName: string): Promise<FlagAnalytics> {
  const res = await api.get(`/admin/feature-flags/${encodeURIComponent(flagName)}/analytics`);
  return res.data?.data ?? res.data ?? { flagName, dailyUsage: [], errorCount: 0, errorPeriodDays: 7 };
}

export async function invalidateFlagCache(flagName?: string): Promise<void> {
  if (flagName) {
    await api.post(`/admin/feature-flags/${encodeURIComponent(flagName)}/invalidate-cache`);
  } else {
    await api.post('/admin/feature-flags/invalidate-cache');
  }
}
