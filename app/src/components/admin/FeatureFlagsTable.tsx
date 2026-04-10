/**
 * FeatureFlagsTable Component
 *
 * Admin table showing all feature flags with toggle switches,
 * targeting info, edit/analytics actions, and real-time updates.
 *
 * @module components/admin/FeatureFlagsTable
 * @task US_049 task_003 - Admin Feature Flags UI
 */

import React, { useState, useCallback } from 'react';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import { useFlagWebSocket } from '../../hooks/useFlagWebSocket';
import { ConfirmFlagChangeModal } from './ConfirmFlagChangeModal';
import { EditFlagModal } from './EditFlagModal';
import { FlagAnalyticsPanel } from './FlagAnalyticsPanel';
import type { FlagDefinitionWithConfig, FlagTargeting } from '../../services/featureFlagApi';

const TARGET_LABELS: Record<string, string> = {
  all: 'All Users',
  beta_testers: 'Beta Testers',
  department: 'Department',
  role: 'Role',
  percentage: 'Percentage',
  user: 'User',
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const FeatureFlagsTable: React.FC = () => {
  const { flags, loading, error, refreshFlags, updateFlag, loadAnalytics } = useFeatureFlags();
  const { toasts, dismissToast } = useFlagWebSocket(refreshFlags);

  // Confirm toggle
  const [confirmFlag, setConfirmFlag] = useState<FlagDefinitionWithConfig | null>(null);
  // Edit modal
  const [editFlag, setEditFlag] = useState<FlagDefinitionWithConfig | null>(null);
  // Analytics panel
  const [analyticsFlag, setAnalyticsFlag] = useState<string | null>(null);

  const handleToggleClick = useCallback((flag: FlagDefinitionWithConfig) => {
    setConfirmFlag(flag);
  }, []);

  const handleConfirmToggle = useCallback(async () => {
    if (!confirmFlag) return;
    const current = confirmFlag.config?.enabled ?? false;
    await updateFlag(confirmFlag.name, { enabled: !current });
    setConfirmFlag(null);
  }, [confirmFlag, updateFlag]);

  const handleEditSave = useCallback(
    async (flagName: string, config: { enabled: boolean; value: boolean | string | number; targeting: FlagTargeting }) => {
      await updateFlag(flagName, config);
    },
    [updateFlag],
  );

  if (loading) {
    return (
      <div className="ff-table-wrapper" aria-label="Feature flags loading">
        <div className="ff-skeleton">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="ff-skeleton__row" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ff-table-wrapper" aria-label="Feature flags error">
        <p className="ff-error">{error}</p>
        <button className="btn btn--primary" onClick={refreshFlags}>Retry</button>
      </div>
    );
  }

  return (
    <div className="ff-table-wrapper">
      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div className="ff-toast-stack" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className="ff-toast">
              <span className="ff-toast__icon">ℹ</span>
              <span className="ff-toast__message">{t.message}</span>
              <button
                className="ff-toast__dismiss"
                onClick={() => dismissToast(t.id)}
                aria-label="Dismiss notification"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {flags.length === 0 ? (
        <p className="ff-empty">No feature flags configured</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="ff-desktop-view">
            <table className="sd-dept-table ad-table ff-table" aria-label="Feature flags">
              <thead>
                <tr>
                  <th>Flag Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Target</th>
                  <th>Value</th>
                  <th>Last Modified</th>
                  <th>Modified By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {flags.map((f) => {
                  const isEnabled = f.config?.enabled ?? false;
                  const targeting = f.config?.targeting?.type ?? 'all';
                  return (
                    <tr key={f.name}>
                      <td className="ff-table__name">{f.name}</td>
                      <td>{f.definition.description}</td>
                      <td>
                        <label className="ff-toggle ff-toggle--sm" htmlFor={`toggle-${f.name}`}>
                          <input
                            id={`toggle-${f.name}`}
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => handleToggleClick(f)}
                            className="ff-toggle__input"
                            aria-label={`Toggle ${f.name}: currently ${isEnabled ? 'enabled' : 'disabled'}`}
                          />
                          <span className="ff-toggle__slider" />
                        </label>
                      </td>
                      <td>
                        <span className="ff-badge ff-badge--neutral">{TARGET_LABELS[targeting] ?? targeting}</span>
                      </td>
                      <td className="ff-table__value">{String(f.config?.value ?? f.definition.default)}</td>
                      <td>{formatDate(f.config?.updatedAt)}</td>
                      <td>{f.config?.updatedBy ?? '—'}</td>
                      <td className="ff-table__actions">
                        <button className="btn btn--text btn--sm" onClick={() => setEditFlag(f)} aria-label={`Edit ${f.name}`}>
                          Edit
                        </button>
                        <button className="btn btn--text btn--sm" onClick={() => setAnalyticsFlag(f.name)} aria-label={`Analytics for ${f.name}`}>
                          Analytics
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card layout */}
          <div className="ff-mobile-view">
            {flags.map((f) => {
              const isEnabled = f.config?.enabled ?? false;
              const targeting = f.config?.targeting?.type ?? 'all';
              return (
                <div key={f.name} className="ff-card" role="article" aria-label={`Flag ${f.name}`}>
                  <div className="ff-card__header">
                    <span className="ff-card__name">{f.name}</span>
                    <label className="ff-toggle ff-toggle--sm" htmlFor={`mtoggle-${f.name}`}>
                      <input
                        id={`mtoggle-${f.name}`}
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => handleToggleClick(f)}
                        className="ff-toggle__input"
                        aria-label={`Toggle ${f.name}`}
                      />
                      <span className="ff-toggle__slider" />
                    </label>
                  </div>
                  <p className="ff-card__desc">{f.definition.description}</p>
                  <div className="ff-card__meta">
                    <span>Target: {TARGET_LABELS[targeting] ?? targeting}</span>
                    <span>Value: {String(f.config?.value ?? f.definition.default)}</span>
                  </div>
                  <div className="ff-card__meta">
                    <span>Modified: {formatDate(f.config?.updatedAt)}</span>
                    <span>By: {f.config?.updatedBy ?? '—'}</span>
                  </div>
                  <div className="ff-card__actions">
                    <button className="btn btn--text btn--sm" onClick={() => setEditFlag(f)}>Edit</button>
                    <button className="btn btn--text btn--sm" onClick={() => setAnalyticsFlag(f.name)}>Analytics</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modals */}
      <ConfirmFlagChangeModal
        isOpen={confirmFlag !== null}
        flagName={confirmFlag?.name ?? ''}
        currentEnabled={confirmFlag?.config?.enabled ?? false}
        onConfirm={handleConfirmToggle}
        onClose={() => setConfirmFlag(null)}
      />

      <EditFlagModal
        isOpen={editFlag !== null}
        flag={editFlag}
        onSave={handleEditSave}
        onClose={() => setEditFlag(null)}
      />

      <FlagAnalyticsPanel
        isOpen={analyticsFlag !== null}
        flagName={analyticsFlag ?? ''}
        onClose={() => setAnalyticsFlag(null)}
        loadAnalytics={loadAnalytics}
      />
    </div>
  );
};
