/**
 * Notification Service
 *
 * REST API service for notification operations:
 * fetching missed notifications, marking as read, and clearing.
 *
 * @module notificationService
 * @created 2026-04-09
 * @task US_046 TASK_001
 */

import apiClient from './api';
import type { Notification } from '../types/notification.types';

interface PaginatedResponse {
  notifications: Notification[];
  total: number;
  page: number;
  hasMore: boolean;
}

export async function fetchNotifications(page = 1, limit = 20): Promise<PaginatedResponse> {
  const response = await apiClient.get<PaginatedResponse>('/notifications', {
    params: { page, limit },
  });
  return response.data;
}

export async function fetchMissedNotifications(since: string): Promise<Notification[]> {
  const response = await apiClient.get<{ notifications: Notification[] }>(
    '/notifications/missed',
    { params: { since } },
  );
  return response.data.notifications;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await apiClient.put(`/notifications/${encodeURIComponent(id)}/read`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiClient.put('/notifications/read-all');
}

export async function acknowledgeNotification(id: string): Promise<void> {
  await apiClient.put(`/notifications/${encodeURIComponent(id)}/acknowledge`);
}

export async function clearReadNotifications(): Promise<void> {
  await apiClient.delete('/notifications/read');
}
