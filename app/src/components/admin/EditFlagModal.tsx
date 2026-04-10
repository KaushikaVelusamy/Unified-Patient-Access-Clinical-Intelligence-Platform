/**
 * EditFlagModal Component
 *
 * Modal form for editing a feature flag's configuration:
 * status toggle, target-audience selector, current value,
 * and percentage-rollout slider.
 *
 * @module components/admin/EditFlagModal
 * @task US_049 task_003 - Admin Feature Flags UI
 */

import React, { useState, useEffect } from 'react';
import type { FlagDefinitionWithConfig, FlagTargeting } from '../../services/featureFlagApi';

interface EditFlagModalProps {
  isOpen: boolean;
  flag: FlagDefinitionWithConfig | null;
  onSave: (flagName: string, config: { enabled: boolean; value: boolean | string | number; targeting: FlagTargeting }) => Promise<void>;
  onClose: () => void;
}

const TARGET_OPTIONS: Array<{ value: FlagTargeting['type']; label: string }> = [
  { value: 'all', label: 'All Users' },
  { value: 'beta_testers', label: 'Beta Testers' },
  { value: 'department', label: 'Specific Department' },
  { value: 'role', label: 'Specific Role' },
  { value: 'percentage', label: 'Percentage Rollout' },
];

const TOTAL_USERS_ESTIMATE = 1000;

export const EditFlagModal: React.FC<EditFlagModalProps> = ({
  isOpen,
  flag,
  onSave,
  onClose,
}) => {
  const [enabled, setEnabled] = useState(false);
  const [value, setValue] = useState<string>('');
  const [targetType, setTargetType] = useState<FlagTargeting['type']>('all');
  const [targetValue, setTargetValue] = useState<string>('');
  const [percentage, setPercentage] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (flag) {
      const config = flag.config;
      setEnabled(config?.enabled ?? false);
      setValue(String(config?.value ?? flag.definition.default));
      setTargetType(config?.targeting?.type ?? 'all');
      setTargetValue(String(config?.targeting?.value ?? ''));
      setPercentage(
        config?.targeting?.type === 'percentage' ? Number(config.targeting.value ?? 0) : 0,
      );
    }
  }, [flag]);

  if (!isOpen || !flag) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const targeting: FlagTargeting = { type: targetType };
      if (targetType === 'percentage') {
        targeting.value = percentage;
      } else if (targetType === 'department' || targetType === 'role') {
        targeting.value = targetValue;
      }

      const resolvedValue: boolean | string | number =
        flag.definition.type === 'boolean' ? enabled : value;

      await onSave(flag.name, { enabled, value: resolvedValue, targeting });
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  };

  const affectedUsers = Math.round((TOTAL_USERS_ESTIMATE * percentage) / 100);

  return (
    <div className="ff-modal-overlay" role="dialog" aria-modal="true" aria-label={`Edit flag ${flag.name}`}>
      <div className="ff-modal ff-modal--edit">
        <div className="ff-modal__header">
          <h3 className="ff-modal__title">Edit Feature Flag</h3>
          <button className="ff-modal__close" onClick={onClose} aria-label="Close dialog">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ff-modal__body">
            {/* Flag Name (read-only) */}
            <div className="ff-form-group">
              <label className="ff-label" htmlFor="edit-flag-name">Flag Name</label>
              <input
                id="edit-flag-name"
                className="ff-input ff-input--readonly"
                value={flag.name}
                readOnly
                tabIndex={-1}
              />
            </div>

            {/* Description */}
            <div className="ff-form-group">
              <label className="ff-label" htmlFor="edit-flag-desc">Description</label>
              <textarea
                id="edit-flag-desc"
                className="ff-input ff-textarea"
                value={flag.definition.description}
                readOnly
                rows={2}
              />
            </div>

            {/* Status Toggle */}
            <div className="ff-form-group">
              <label className="ff-label">Status</label>
              <label className="ff-toggle" htmlFor="edit-flag-status">
                <input
                  id="edit-flag-status"
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="ff-toggle__input"
                  aria-label={`Toggle ${flag.name}`}
                />
                <span className="ff-toggle__slider" />
                <span className="ff-toggle__label">{enabled ? 'Enabled' : 'Disabled'}</span>
              </label>
            </div>

            {/* Current Value (for string/number flags) */}
            {flag.definition.type !== 'boolean' && (
              <div className="ff-form-group">
                <label className="ff-label" htmlFor="edit-flag-value">Current Value</label>
                <input
                  id="edit-flag-value"
                  className="ff-input"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={String(flag.definition.default)}
                />
              </div>
            )}

            {/* Target Audience */}
            <div className="ff-form-group">
              <label className="ff-label" htmlFor="edit-flag-target">Target Audience</label>
              <select
                id="edit-flag-target"
                className="ff-input ff-select"
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as FlagTargeting['type'])}
              >
                {TARGET_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Conditional: Department input */}
            {targetType === 'department' && (
              <div className="ff-form-group">
                <label className="ff-label" htmlFor="edit-flag-dept">Department</label>
                <input
                  id="edit-flag-dept"
                  className="ff-input"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="e.g. Oncology"
                />
              </div>
            )}

            {/* Conditional: Role selector */}
            {targetType === 'role' && (
              <div className="ff-form-group">
                <label className="ff-label" htmlFor="edit-flag-role">Role</label>
                <select
                  id="edit-flag-role"
                  className="ff-input ff-select"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                >
                  <option value="">Select role</option>
                  <option value="patient">Patient</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}

            {/* Conditional: Percentage slider */}
            {targetType === 'percentage' && (
              <div className="ff-form-group">
                <label className="ff-label" htmlFor="edit-flag-pct">
                  Percentage Rollout: {percentage}%
                </label>
                <input
                  id="edit-flag-pct"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={percentage}
                  onChange={(e) => setPercentage(Number(e.target.value))}
                  className="ff-slider"
                  aria-label={`Rollout percentage: ${percentage}%`}
                />
                <p className="ff-slider-preview">
                  Will affect approximately {affectedUsers} users ({percentage}%)
                </p>
              </div>
            )}
          </div>

          <div className="ff-modal__footer">
            <button type="button" className="btn btn--secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
