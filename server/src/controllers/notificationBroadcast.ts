/**
 * Notification Broadcast Controller
 *
 * Provides `broadcastNotification` for other backend services to push
 * real-time notification events to specific users via Socket.io rooms.
 *
 * @module notificationBroadcast
 * @task US_046 TASK_002
 */

import { getNotificationIO } from '../services/notificationSocketService';
import { getActiveUsersInRoom } from '../utils/socketRoomManager';
import logger from '../utils/logger';

export interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'info' | 'warning' | 'critical';
  timestamp: string;
  actionUrl?: string;
}

/**
 * Broadcast a notification to all connected sockets of a specific user.
 *
 * @param userId - Target user ID
 * @param data   - Notification payload
 * @returns true if at least one socket was in the room, false otherwise
 */
export function broadcastNotification(
  userId: number,
  data: NotificationPayload,
): boolean {
  const io = getNotificationIO();

  if (!io) {
    logger.warn('broadcastNotification called before Socket.io initialised', {
      userId,
      notificationId: data.id,
    });
    return false;
  }

  const room = `user:${userId}`;
  const activeCount = getActiveUsersInRoom(io, userId);

  if (activeCount === 0) {
    logger.debug('No active sockets for user; notification will be fetched via REST', {
      userId,
      notificationId: data.id,
    });
    return false;
  }

  io.to(room).emit('notification', data);

  logger.info('Notification broadcast', {
    userId,
    notificationId: data.id,
    type: data.type,
    priority: data.priority,
    recipientSockets: activeCount,
  });

  return true;
}

/**
 * Broadcast a notification to multiple users at once.
 *
 * @param userIds - Array of target user IDs
 * @param data    - Notification payload
 * @returns number of users that had at least one active socket
 */
export function broadcastNotificationToMany(
  userIds: number[],
  data: NotificationPayload,
): number {
  let delivered = 0;
  for (const userId of userIds) {
    if (broadcastNotification(userId, data)) {
      delivered++;
    }
  }
  return delivered;
}
