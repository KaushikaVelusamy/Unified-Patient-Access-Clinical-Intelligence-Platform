/**
 * NotificationPanel Component
 *
 * Slide-in panel from the right (400px desktop, full-screen mobile).
 * Displays notification history grouped by date (Today, Yesterday,
 * This Week, Older) with infinite scroll pagination and focus trap.
 *
 * @module NotificationPanel
 * @created 2026-04-09
 * @task US_046 TASK_001
 */

import React, { useEffect, useRef, useCallback } from 'react';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import type { Notification } from '../../types/notification.types';
import { NotificationItem } from './NotificationItem';
import styles from './notifications.module.css';

dayjs.extend(isToday);
dayjs.extend(isYesterday);

interface NotificationPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearRead: () => void;
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
}

type DateGroup = { label: string; items: Notification[] };

function groupByDate(notifications: Notification[]): DateGroup[] {
  const groups: Record<string, Notification[]> = {};
  const order: string[] = [];

  const now = dayjs();
  const startOfWeek = now.startOf('week');

  for (const n of notifications) {
    const d = dayjs(n.timestamp);
    let label: string;

    if (d.isToday()) {
      label = 'Today';
    } else if (d.isYesterday()) {
      label = 'Yesterday';
    } else if (d.isAfter(startOfWeek)) {
      label = 'This Week';
    } else {
      label = 'Older';
    }

    if (!groups[label]) {
      groups[label] = [];
      order.push(label);
    }
    groups[label].push(n);
  }

  return order.map((label) => ({ label, items: groups[label] }));
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearRead,
  onLoadMore,
  hasMore,
  loading,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus trap: cycle Tab within panel, ESC closes
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = panel!.querySelectorAll<HTMLElement>(focusableSelector);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    panel.addEventListener('keydown', handleKeyDown);

    // Focus first focusable element on open
    const firstBtn = panel.querySelector<HTMLElement>(focusableSelector);
    firstBtn?.focus();

    return () => panel.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Infinite scroll with IntersectionObserver
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node || !hasMore || loading) return;

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      });
      observerRef.current.observe(node);
    },
    [hasMore, loading, onLoadMore],
  );

  const dateGroups = groupByDate(notifications);

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className={styles.panelOverlay}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Notification history"
      >
        {/* Header */}
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Notifications</h2>
          <div className={styles.panelActions}>
            <button
              className={styles.panelActionBtn}
              onClick={onMarkAllAsRead}
              type="button"
            >
              Mark All Read
            </button>
            <button
              className={styles.panelActionBtn}
              onClick={onClearRead}
              type="button"
            >
              Clear Read
            </button>
            <button
              className={styles.panelCloseBtn}
              onClick={onClose}
              aria-label="Close notification panel"
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 2L14 14M14 2L2 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* List */}
        <div className={styles.panelList} role="list">
          {notifications.length === 0 && !loading && (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon} aria-hidden="true">
                🔔
              </span>
              <div className={styles.emptyTitle}>No notifications</div>
              <div className={styles.emptyMessage}>
                You&apos;re all caught up!
              </div>
            </div>
          )}

          {dateGroups.map((group) => (
            <div key={group.label} role="group" aria-label={group.label}>
              <div className={styles.dateGroup}>{group.label}</div>
              {group.items.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkAsRead={onMarkAsRead}
                />
              ))}
            </div>
          ))}

          {loading && (
            <div className={styles.loadingSpinner} aria-label="Loading notifications">
              Loading...
            </div>
          )}

          {/* Sentinel for infinite scroll */}
          {hasMore && !loading && (
            <div
              ref={sentinelCallback}
              className={styles.sentinel}
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </>
  );
};
