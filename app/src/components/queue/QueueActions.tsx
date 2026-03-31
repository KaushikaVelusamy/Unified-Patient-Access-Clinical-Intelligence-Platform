/**
 * Queue Actions Component
 *
 * Contextual action buttons for queue status transitions.
 * Shows the primary action based on current status, with a
 * secondary "No Show" option available via dropdown.
 *
 * @module QueueActions
 * @created 2026-03-31
 * @task US_020 TASK_002
 */

import React, { useState } from 'react';
import type { QueueStatus } from '../../types/queue.types';
import './QueueActions.css';

/** Action button configuration per status */
const PRIMARY_ACTIONS: Record<string, { label: string; targetStatus: QueueStatus; variant: string }> = {
  scheduled: { label: 'Mark Arrived', targetStatus: 'arrived', variant: 'queue-action--primary' },
  arrived: { label: 'Start Consultation', targetStatus: 'in_progress', variant: 'queue-action--start' },
  in_progress: { label: 'Mark Completed', targetStatus: 'completed', variant: 'queue-action--complete' },
};

interface QueueActionsProps {
  /** Current appointment status */
  status: QueueStatus;
  /** Appointment ID */
  appointmentId: string;
  /** Current optimistic locking version */
  version: number;
  /** Patient name for aria labels */
  patientName: string;
  /** Whether an update is in progress for this row */
  isUpdating: boolean;
  /** Callback to execute status update */
  onStatusUpdate: (appointmentId: string, newStatus: QueueStatus, version: number) => void;
}

/**
 * Queue action buttons with contextual primary action and no-show dropdown
 */
export const QueueActions: React.FC<QueueActionsProps> = ({
  status,
  appointmentId,
  version,
  patientName,
  isUpdating,
  onStatusUpdate,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const primaryAction = PRIMARY_ACTIONS[status];

  // Terminal statuses have no actions
  if (status === 'completed' || status === 'no_show') {
    return <span className="queue-actions__terminal">—</span>;
  }

  const handlePrimary = () => {
    if (primaryAction && !isUpdating) {
      onStatusUpdate(appointmentId, primaryAction.targetStatus, version);
    }
  };

  const handleNoShow = () => {
    if (!isUpdating) {
      onStatusUpdate(appointmentId, 'no_show', version);
      setShowDropdown(false);
    }
  };

  return (
    <div className="queue-actions" role="group" aria-label={`Actions for ${patientName}`}>
      {primaryAction && (
        <button
          className={`queue-action-btn ${primaryAction.variant}`}
          onClick={handlePrimary}
          disabled={isUpdating}
          aria-label={`${primaryAction.label} for ${patientName}`}
        >
          {isUpdating ? 'Updating...' : primaryAction.label}
        </button>
      )}

      <div className="queue-actions__more">
        <button
          className="queue-action-btn queue-action--more"
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={isUpdating}
          aria-label={`More actions for ${patientName}`}
          aria-expanded={showDropdown}
          aria-haspopup="true"
        >
          ⋮
        </button>
        {showDropdown && (
          <div className="queue-actions__dropdown" role="menu">
            <button
              className="queue-actions__dropdown-item queue-actions__dropdown-item--danger"
              onClick={handleNoShow}
              role="menuitem"
            >
              Mark No Show
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
