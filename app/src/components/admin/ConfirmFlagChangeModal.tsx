/**
 * ConfirmFlagChangeModal Component
 *
 * Confirmation dialog shown before toggling a feature flag.
 * Displays the impact description so admins understand the effect.
 *
 * @module components/admin/ConfirmFlagChangeModal
 * @task US_049 task_003 - Admin Feature Flags UI
 */

import React from 'react';

interface ConfirmFlagChangeModalProps {
  isOpen: boolean;
  flagName: string;
  currentEnabled: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const IMPACT_DESCRIPTIONS: Record<string, string> = {
  ai_intake_enabled: 'redirect users to manual form',
  ai_extraction_enabled: 'queue documents for manual data entry',
  ai_coding_enabled: 'show "AI unavailable" message for medical coding',
  ai_conflicts_enabled: 'fall back to rule-based conflict checks',
};

export const ConfirmFlagChangeModal: React.FC<ConfirmFlagChangeModalProps> = ({
  isOpen,
  flagName,
  currentEnabled,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const newAction = currentEnabled ? 'Disable' : 'Enable';
  const impact = IMPACT_DESCRIPTIONS[flagName];
  const isDisabling = currentEnabled;

  return (
    <div className="ff-modal-overlay" role="dialog" aria-modal="true" aria-label={`Confirm ${newAction} ${flagName}`}>
      <div className="ff-modal ff-modal--confirm">
        <div className="ff-modal__header">
          <h3 className="ff-modal__title">{newAction} Feature Flag</h3>
          <button className="ff-modal__close" onClick={onClose} aria-label="Close dialog">&times;</button>
        </div>
        <div className="ff-modal__body">
          <p>
            {newAction} <strong>{flagName}</strong> for all users?
          </p>
          {impact && isDisabling && (
            <p className="ff-modal__impact">
              This will <strong>{impact}</strong>.
            </p>
          )}
        </div>
        <div className="ff-modal__footer">
          <button className="btn btn--secondary" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className={`btn ${isDisabling ? 'btn--danger' : 'btn--primary'}`}
            onClick={onConfirm}
            type="button"
          >
            {newAction}
          </button>
        </div>
      </div>
    </div>
  );
};
