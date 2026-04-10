/**
 * NotificationItem Component
 *
 * Single notification row in the notification panel list.
 * Shows icon, title, message preview (truncated), timestamp,
 * and unread indicator. Clicking navigates to the action URL
 * and marks the notification as read.
 *
 * @module NotificationItem
 * @created 2026-04-09
 * @task US_046 TASK_001
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { Notification } from '../../types/notification.types';
import styles from './notifications.module.css';

dayjs.extend(relativeTime);

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
}) => {
  const navigate = useNavigate();
  const { id, title, message, icon, timestamp, read, actionUrl } = notification;

  const handleClick = () => {
    if (!read) {
      onMarkAsRead(id);
    }
    if (actionUrl) {
      navigate(actionUrl);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={`${styles.item} ${!read ? styles.unread : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${read ? '' : 'Unread: '}${title}. ${message}`}
    >
      {!read && <span className={styles.unreadDot} aria-hidden="true" />}

      <span className={styles.itemIcon} aria-hidden="true">
        {icon}
      </span>

      <div className={styles.itemBody}>
        <div className={styles.itemTitle}>{title}</div>
        <div className={styles.itemMessage}>{message}</div>
        <div className={styles.itemTimestamp}>{dayjs(timestamp).fromNow()}</div>
      </div>
    </div>
  );
};
