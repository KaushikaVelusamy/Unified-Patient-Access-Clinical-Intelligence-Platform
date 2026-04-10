/**
 * NotificationBellIcon Component
 *
 * Bell icon for the header navigation bar with red badge
 * showing unread notification count. Clicking toggles the
 * NotificationPanel. Hover shows tooltip.
 *
 * @module NotificationBellIcon
 * @created 2026-04-09
 * @task US_046 TASK_001
 */

import React, { useState } from 'react';
import styles from './notifications.module.css';

interface NotificationBellIconProps {
  unreadCount: number;
  isPanelOpen: boolean;
  onTogglePanel: () => void;
}

export const NotificationBellIcon: React.FC<NotificationBellIconProps> = ({
  unreadCount,
  isPanelOpen,
  onTogglePanel,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const badgeLabel =
    unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : '';

  const tooltipText =
    unreadCount > 0
      ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
      : 'No new notifications';

  return (
    <button
      className={`${styles.bellButton} ${isPanelOpen ? styles.active : ''}`}
      onClick={onTogglePanel}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      aria-label={tooltipText}
      aria-haspopup="dialog"
      aria-expanded={isPanelOpen}
      type="button"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M10 2C7.239 2 5 4.239 5 7V11L3 14H17L15 11V7C15 4.239 12.761 2 10 2Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M8 16C8 17.105 8.895 18 10 18C11.105 18 12 17.105 12 16"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>

      {unreadCount > 0 && (
        <span className={styles.badge} aria-hidden="true">
          {badgeLabel}
        </span>
      )}

      {showTooltip && !isPanelOpen && (
        <span className={styles.tooltip} role="tooltip">
          {tooltipText}
        </span>
      )}
    </button>
  );
};
