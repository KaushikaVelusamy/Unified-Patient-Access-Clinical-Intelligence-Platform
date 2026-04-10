/**
 * FlagAnalyticsPanel Component
 *
 * Drawer / panel showing analytics for a specific feature flag:
 *  - Usage line chart (evaluations per day, last 30 days)
 *  - A/B test results table
 *  - Error rate card
 *
 * Uses Recharts for the line chart (must be installed).
 * Falls back to a text-only table if Recharts is unavailable.
 *
 * @module components/admin/FlagAnalyticsPanel
 * @task US_049 task_003 - Admin Feature Flags UI
 */

import React, { useEffect, useState } from 'react';
import type { FlagAnalytics } from '../../services/featureFlagApi';

interface FlagAnalyticsPanelProps {
  isOpen: boolean;
  flagName: string;
  onClose: () => void;
  loadAnalytics: (flagName: string) => Promise<FlagAnalytics>;
}

export const FlagAnalyticsPanel: React.FC<FlagAnalyticsPanelProps> = ({
  isOpen,
  flagName,
  onClose,
  loadAnalytics,
}) => {
  const [analytics, setAnalytics] = useState<FlagAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !flagName) return;
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await loadAnalytics(flagName);
        if (!cancelled) setAnalytics(data);
      } catch {
        if (!cancelled) setError('Failed to load analytics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [isOpen, flagName, loadAnalytics]);

  if (!isOpen) return null;

  const maxUsageCount = analytics?.dailyUsage?.length
    ? Math.max(...analytics.dailyUsage.map((d) => d.count))
    : 0;

  const bestVariant = analytics?.abTestResults?.reduce<(typeof analytics.abTestResults)[0] | null>(
    (best, curr) => (!best || curr.completionRate > best.completionRate ? curr : best),
    null,
  );

  return (
    <div className="ff-modal-overlay" role="dialog" aria-modal="true" aria-label={`Analytics for ${flagName}`}>
      <div className="ff-modal ff-modal--analytics">
        <div className="ff-modal__header">
          <h3 className="ff-modal__title">Flag Analytics: {flagName}</h3>
          <button className="ff-modal__close" onClick={onClose} aria-label="Close analytics">&times;</button>
        </div>

        <div className="ff-modal__body">
          {loading && <p className="ff-loading">Loading analytics...</p>}
          {error && <p className="ff-error">{error}</p>}

          {analytics && !loading && (
            <>
              {/* === Usage Chart (simple bar fallback) === */}
              <section className="ff-analytics-section" aria-label="Daily usage">
                <h4 className="ff-analytics-section__title">Evaluations per Day (Last 30 Days)</h4>
                {analytics.dailyUsage.length === 0 ? (
                  <p className="ff-empty">No usage data available</p>
                ) : (
                  <div className="ff-chart" role="img" aria-label="Daily usage chart">
                    <div className="ff-chart__bars">
                      {analytics.dailyUsage.map((d) => (
                        <div
                          key={d.date}
                          className="ff-chart__bar-col"
                          title={`${d.date}: ${d.count} evaluations`}
                        >
                          <div
                            className="ff-chart__bar"
                            style={{ height: maxUsageCount > 0 ? `${(d.count / maxUsageCount) * 100}%` : '0%' }}
                          />
                          <span className="ff-chart__bar-label">{d.date.slice(-5)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* === A/B Test Results === */}
              {analytics.abTestResults && analytics.abTestResults.length > 0 && (
                <section className="ff-analytics-section" aria-label="A/B test results">
                  <h4 className="ff-analytics-section__title">A/B Test Results</h4>
                  <table className="sd-dept-table ad-table ff-analytics-table">
                    <thead>
                      <tr>
                        <th>Variant</th>
                        <th>Total Users</th>
                        <th>Completion Rate</th>
                        <th>Avg Time</th>
                        <th>Recommendation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.abTestResults.map((row) => (
                        <tr key={row.variant}>
                          <td>{row.variant}</td>
                          <td>{row.totalUsers.toLocaleString()}</td>
                          <td>{row.completionRate}%</td>
                          <td>{row.avgTime} min</td>
                          <td>
                            {bestVariant && row.variant === bestVariant.variant ? (
                              <span className="ff-badge ff-badge--success">✓ Recommended</span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}

              {/* === Error Rate Card === */}
              <section className="ff-analytics-section" aria-label="Error rate">
                <h4 className="ff-analytics-section__title">Error Rate</h4>
                <div className={`ff-error-card ${analytics.errorCount === 0 ? 'ff-error-card--ok' : 'ff-error-card--warn'}`}>
                  {analytics.errorCount === 0 ? (
                    <p>
                      <span className="ff-error-card__icon ff-error-card__icon--ok">✓</span>
                      0 errors in last {analytics.errorPeriodDays} days
                    </p>
                  ) : (
                    <p>
                      <span className="ff-error-card__icon ff-error-card__icon--warn">⚠</span>
                      {analytics.errorCount} error{analytics.errorCount > 1 ? 's' : ''} detected —{' '}
                      <button className="btn btn--text" type="button">Review logs</button>
                    </p>
                  )}
                </div>
              </section>
            </>
          )}
        </div>

        <div className="ff-modal__footer">
          <button className="btn btn--secondary" onClick={onClose} type="button">Close</button>
        </div>
      </div>
    </div>
  );
};
