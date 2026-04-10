/**
 * NotificationPopup Component
 *
 * Toast-style popup for real-time notifications.
 * Auto-dismisses after 10s (info), 15s (warning), or requires
 * manual acknowledgement (critical). Renders ARIA live regions
 * for screen reader accessibility.
 *
 * @module NotificationPopup
 * @created 2026-04-09
 * @task US_046 TASK_001
 */

import React, { useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { Notification } from '../../types/notification.types';
import styles from './notifications.module.css';

dayjs.extend(relativeTime);

const AUTO_DISMISS_MS: Record<string, number> = {
  info: 10_000,
  warning: 15_000,
};

interface NotificationPopupProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  onAcknowledge: (id: string) => void;
}

const priorityIconMap: Record<string, string> = {
  critical: '!',
  warning: '⚠',
  info: 'ℹ',
};

export const NotificationPopup: React.FC<NotificationPopupProps> = ({
  notification,
  onDismiss,
  onAcknowledge,
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { id, title, message, priority, timestamp } = notification;

  const duration = AUTO_DISMISS_MS[priority];

  useEffect(() => {
    if (!duration) return;
    timerRef.current = setTimeout(() => onDismiss(id), duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [id, duration, onDismiss]);

  const ariaRole = priority === 'critical' ? 'alert' : 'status';
  const ariaLive = priority === 'critical' ? 'assertive' : 'polite';

  return (
    <div
      className={`${styles.popup} ${styles[`priority-${priority}`]}`}
      role={ariaRole}
      aria-live={ariaLive}
    >
      <span
        className={`${styles.popupIcon} ${styles[`icon-${priority}`]}`}
        aria-hidden="true"
      >
        {priorityIconMap[priority] ?? 'ℹ'}
      </span>

      <div className={styles.popupBody}>
        <div className={styles.popupTitle}>{title}</div>
        <div className={styles.popupMessage}>{message}</div>
        <div className={styles.popupTimestamp}>{dayjs(timestamp).fromNow()}</div>

        {priority === 'critical' && (
          <button
            className={styles.acknowledgeBtn}
            onClick={() => onAcknowledge(id)}
            type="button"
          >
            Acknowledge
          </button>
        )}
      </div>

      {priority !== 'critical' && (
        <button
          className={styles.popupDismiss}
          onClick={() => onDismiss(id)}
          aria-label="Dismiss notification"
          type="button"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M1 1L13 13M13 1L1 13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}

      {duration && (
        <div
          className={`${styles.progressBar} ${priority === 'warning' ? styles['priority-warning'] : ''}`}
          style={{ animationDuration: `${duration}ms` }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

/**
 * NotificationPopupStack
 *
 * Container for up to MAX_VISIBLE_POPUPS popups,
 * rendered in a fixed container.
 */
interface PopupStackProps {
  popups: Notification[];
  onDismiss: (id: string) => void;
  onAcknowledge: (id: string) => void;
}

export const NotificationPopupStack: React.FC<PopupStackProps> = ({
  popups,
  onDismiss,
  onAcknowledge,
}) => {
  if (popups.length === 0) return null;

  return (
    <div className={styles.popupContainer} aria-label="Notifications">
      {popups.map((n) => (
        <NotificationPopup
          key={n.id}
          notification={n}
          onDismiss={onDismiss}
          onAcknowledge={onAcknowledge}
        />
      ))}
    </div>
  );
};
