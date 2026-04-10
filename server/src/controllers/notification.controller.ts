/**
 * Notification Controller
 *
 * HTTP request handlers for the notification REST API.
 * Delegates to notificationService and notificationBroadcast.
 *
 * @module notification.controller
 * @task US_046 TASK_003
 */

import { Response } from 'express';
import notificationService from '../services/notificationService';
import { broadcastNotification } from './notificationBroadcast';
import logger from '../utils/logger';
import type { AuthRequest } from '../types/auth.types';

class NotificationController {
  /**
   * GET /api/notifications/missed?since={ISO timestamp}
   */
  async getMissed(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const since = req.query.since as string;
      const limit = Number(req.query.limit ?? 50);

      const notifications = await notificationService.getMissedNotifications(userId, since, limit);

      res.status(200).json({
        success: true,
        count: notifications.length,
        notifications,
      });
    } catch (error: unknown) {
      logger.error('getMissed failed', { error });
      res.status(500).json({ success: false, message: 'Failed to fetch missed notifications' });
    }
  }

  /**
   * GET /api/notifications  (paginated history)
   */
  async getHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const limit = Number(req.query.limit ?? 20);
      const offset = Number(req.query.offset ?? 0);

      const filters: Record<string, unknown> = {};
      if (req.query.type) filters.type = req.query.type;
      if (req.query.priority) filters.priority = req.query.priority;
      if (req.query.is_read !== undefined) filters.isRead = String(req.query.is_read) === 'true';

      const result = await notificationService.getNotificationHistory(userId, limit, offset, filters);

      res.setHeader('X-Total-Count', String(result.total));
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: unknown) {
      logger.error('getHistory failed', { error });
      res.status(500).json({ success: false, message: 'Failed to fetch notification history' });
    }
  }

  /**
   * GET /api/notifications/:id
   */
  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const id = Number(req.params.id);

      const notification = await notificationService.getNotificationById(id, userId);

      if (!notification) {
        res.status(404).json({ success: false, message: 'Notification not found' });
        return;
      }

      res.status(200).json({ success: true, notification });
    } catch (error: unknown) {
      logger.error('getById failed', { error });
      res.status(500).json({ success: false, message: 'Failed to fetch notification' });
    }
  }

  /**
   * PUT /api/notifications/:id/read
   */
  async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const id = Number(req.params.id);

      const notification = await notificationService.markAsRead(id, userId);

      if (!notification) {
        res.status(404).json({ success: false, message: 'Notification not found' });
        return;
      }

      const unreadCount = await notificationService.getUnreadCount(userId);

      // Real-time badge update via WebSocket
      broadcastNotification(userId, {
        id: String(notification.id),
        type: 'unread_count_update',
        title: '',
        message: '',
        priority: 'info',
        timestamp: new Date().toISOString(),
        actionUrl: undefined,
      });

      res.status(200).json({ success: true, notification, unreadCount });
    } catch (error: unknown) {
      logger.error('markAsRead failed', { error });
      res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
    }
  }

  /**
   * PUT /api/notifications/read-all
   */
  async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const updatedCount = await notificationService.markAllAsRead(userId);
      const unreadCount = await notificationService.getUnreadCount(userId);

      // Real-time badge update via WebSocket
      broadcastNotification(userId, {
        id: '0',
        type: 'unread_count_update',
        title: '',
        message: '',
        priority: 'info',
        timestamp: new Date().toISOString(),
        actionUrl: undefined,
      });

      res.status(200).json({ success: true, updatedCount, unreadCount });
    } catch (error: unknown) {
      logger.error('markAllAsRead failed', { error });
      res.status(500).json({ success: false, message: 'Failed to mark all notifications as read' });
    }
  }

  /**
   * GET /api/notifications/unread-count
   */
  async getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const count = await notificationService.getUnreadCount(userId);
      res.status(200).json({ success: true, unreadCount: count });
    } catch (error: unknown) {
      logger.error('getUnreadCount failed', { error });
      res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
    }
  }

  /**
   * GET /api/notifications/preferences
   */
  async getPreferences(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const preferences = await notificationService.getPreferences(userId);
      res.status(200).json({ success: true, preferences });
    } catch (error: unknown) {
      logger.error('getPreferences failed', { error });
      res.status(500).json({ success: false, message: 'Failed to fetch notification preferences' });
    }
  }

  /**
   * PUT /api/notifications/preferences
   */
  async updatePreferences(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const preferences = await notificationService.updatePreferences(userId, req.body);
      res.status(200).json({ success: true, preferences });
    } catch (error: unknown) {
      logger.error('updatePreferences failed', { error });
      res.status(500).json({ success: false, message: 'Failed to update notification preferences' });
    }
  }
}

export default new NotificationController();
