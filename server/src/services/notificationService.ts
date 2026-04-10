/**
 * Notification Service
 *
 * Business logic for notification CRUD operations:
 * missed notifications, paginated history, mark-as-read,
 * unread count (with Redis caching), and per-category preferences.
 *
 * @module notificationService
 * @task US_046 TASK_003
 */

import { pool } from '../config/database';
import redisClient from '../utils/redisClient';
import logger from '../utils/logger';
import type {
  Notification,
  NotificationFilters,
  NotificationCategoryPreferences,
  PaginatedNotifications,
} from '../types/notification.types';
import { DEFAULT_CATEGORY_PREFERENCES } from '../types/notification.types';

const UNREAD_COUNT_CACHE_KEY = (userId: number) => `notifications:unread:${userId}`;
const UNREAD_COUNT_TTL = 60; // seconds

/**
 * Map a raw DB row to the Notification interface (camelCase).
 */
function mapRow(row: Record<string, unknown>): Notification {
  return {
    id: row.id as number,
    userId: row.user_id as number,
    type: row.type as Notification['type'],
    title: row.title as string,
    message: row.message as string,
    priority: row.priority as Notification['priority'],
    isRead: row.is_read as boolean,
    readAt: row.read_at ? new Date(row.read_at as string) : null,
    deliveryMethod: row.delivery_method as Notification['deliveryMethod'],
    emailSent: row.email_sent as boolean,
    emailSentAt: row.email_sent_at ? new Date(row.email_sent_at as string) : null,
    smsSent: row.sms_sent as boolean,
    smsSentAt: row.sms_sent_at ? new Date(row.sms_sent_at as string) : null,
    pushSent: row.push_sent as boolean,
    pushSentAt: row.push_sent_at ? new Date(row.push_sent_at as string) : null,
    actionUrl: (row.action_url as string) ?? null,
    actionLabel: (row.action_label as string) ?? null,
    relatedAppointmentId: (row.related_appointment_id as number) ?? null,
    relatedDocumentId: (row.related_document_id as number) ?? null,
    expiresAt: row.expires_at ? new Date(row.expires_at as string) : null,
    metadata: (row.metadata as Record<string, unknown>) ?? null,
    createdAt: new Date(row.created_at as string),
  };
}

class NotificationService {
  /**
   * Fetch notifications created after the given timestamp (for reconnection sync).
   */
  async getMissedNotifications(
    userId: number,
    since: string,
    limit: number = 50,
  ): Promise<Notification[]> {
    const result = await pool.query(
      `SELECT * FROM app.notifications
       WHERE user_id = $1 AND created_at > $2
       ORDER BY created_at DESC
       LIMIT $3`,
      [userId, since, limit],
    );
    return result.rows.map(mapRow);
  }

  /**
   * Paginated notification history with optional filters.
   */
  async getNotificationHistory(
    userId: number,
    limit: number,
    offset: number,
    filters: NotificationFilters = {},
  ): Promise<PaginatedNotifications> {
    const conditions: string[] = ['user_id = $1'];
    const params: unknown[] = [userId];
    let paramIdx = 2;

    if (filters.type) {
      const types = Array.isArray(filters.type) ? filters.type : [filters.type];
      conditions.push(`type = ANY($${paramIdx})`);
      params.push(types);
      paramIdx++;
    }

    if (filters.priority) {
      const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority];
      conditions.push(`priority = ANY($${paramIdx})`);
      params.push(priorities);
      paramIdx++;
    }

    if (filters.isRead !== undefined) {
      conditions.push(`is_read = $${paramIdx}`);
      params.push(filters.isRead);
      paramIdx++;
    }

    const where = conditions.join(' AND ');

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM app.notifications WHERE ${where}`,
      params,
    );
    const total: number = countResult.rows[0].total;

    const dataParams = [...params, limit, offset];
    const dataResult = await pool.query(
      `SELECT * FROM app.notifications
       WHERE ${where}
       ORDER BY created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      dataParams,
    );

    return {
      notifications: dataResult.rows.map(mapRow),
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Fetch a single notification by ID (scoped to the requesting user).
   */
  async getNotificationById(
    id: number,
    userId: number,
  ): Promise<Notification | null> {
    const result = await pool.query(
      `SELECT * FROM app.notifications WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    return result.rows.length > 0 ? mapRow(result.rows[0]) : null;
  }

  /**
   * Mark a single notification as read.
   */
  async markAsRead(
    notificationId: number,
    userId: number,
  ): Promise<Notification | null> {
    const result = await pool.query(
      `UPDATE app.notifications
       SET is_read = TRUE, read_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId],
    );

    if (result.rows.length === 0) return null;

    await this.invalidateUnreadCountCache(userId);
    return mapRow(result.rows[0]);
  }

  /**
   * Mark all unread notifications as read for a user.
   */
  async markAllAsRead(userId: number): Promise<number> {
    const result = await pool.query(
      `UPDATE app.notifications
       SET is_read = TRUE, read_at = NOW()
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId],
    );

    await this.invalidateUnreadCountCache(userId);
    return result.rowCount ?? 0;
  }

  /**
   * Return the number of unread notifications.
   * Uses a Redis cache with 60 s TTL when available.
   */
  async getUnreadCount(userId: number): Promise<number> {
    const cacheKey = UNREAD_COUNT_CACHE_KEY(userId);

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached !== null) return parseInt(cached, 10);
    } catch {
      // Redis unavailable — fall through to DB
    }

    const result = await pool.query(
      `SELECT COUNT(*)::int AS count FROM app.notifications
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId],
    );
    const count: number = result.rows[0].count;

    try {
      await redisClient.set(cacheKey, String(count), { ttl: UNREAD_COUNT_TTL });
    } catch {
      // Non-critical — cache miss on next call
    }

    return count;
  }

  /**
   * Retrieve per-category notification preferences for a user.
   * Falls back to defaults when the row doesn't exist.
   */
  async getPreferences(userId: number): Promise<NotificationCategoryPreferences> {
    try {
      const result = await pool.query(
        `SELECT category_appointment, category_medication,
                category_system, category_waitlist
         FROM app.notification_preferences
         WHERE user_id = $1`,
        [userId],
      );

      if (result.rows.length === 0) return { ...DEFAULT_CATEGORY_PREFERENCES };

      const row = result.rows[0];
      return {
        appointment: row.category_appointment as boolean,
        medication: row.category_medication as boolean,
        system: row.category_system as boolean,
        waitlist: row.category_waitlist as boolean,
      };
    } catch (error) {
      logger.warn('Failed to fetch notification preferences, returning defaults', { userId, error });
      return { ...DEFAULT_CATEGORY_PREFERENCES };
    }
  }

  /**
   * Upsert per-category notification preferences.
   */
  async updatePreferences(
    userId: number,
    prefs: Partial<NotificationCategoryPreferences>,
  ): Promise<NotificationCategoryPreferences> {
    const current = await this.getPreferences(userId);
    const merged: NotificationCategoryPreferences = { ...current, ...prefs };

    try {
      await pool.query(
        `INSERT INTO app.notification_preferences
           (user_id, category_appointment, category_medication, category_system, category_waitlist, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (user_id)
         DO UPDATE SET
           category_appointment = $2,
           category_medication = $3,
           category_system = $4,
           category_waitlist = $5,
           updated_at = NOW()`,
        [userId, merged.appointment, merged.medication, merged.system, merged.waitlist],
      );
    } catch (error) {
      logger.error('Failed to update notification preferences', { userId, error });
      throw error;
    }

    return merged;
  }

  /**
   * Invalidate the cached unread count for a user.
   */
  private async invalidateUnreadCountCache(userId: number): Promise<void> {
    try {
      await redisClient.del(UNREAD_COUNT_CACHE_KEY(userId));
    } catch {
      // Non-critical
    }
  }
}

export default new NotificationService();
