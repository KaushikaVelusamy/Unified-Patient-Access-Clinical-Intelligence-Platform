/**
 * Notification Routes
 *
 * REST API endpoints for notification management:
 *   GET    /api/notifications/missed         - Fetch missed notifications since timestamp
 *   GET    /api/notifications/unread-count    - Get unread badge count
 *   GET    /api/notifications/preferences     - Get notification preferences
 *   PUT    /api/notifications/preferences     - Update notification preferences
 *   GET    /api/notifications/read-all        - (reserved)
 *   PUT    /api/notifications/read-all        - Mark all as read
 *   GET    /api/notifications/:id             - Get single notification
 *   PUT    /api/notifications/:id/read        - Mark single notification as read
 *   GET    /api/notifications                 - Paginated history
 *
 * All routes require JWT authentication.
 *
 * @module notification.routes
 * @task US_046 TASK_003
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import notificationController from '../controllers/notification.controller';
import {
  missedQuerySchema,
  historyQuerySchema,
  preferencesBodySchema,
} from '../validators/notification.validator';
import { validate, validateQuery } from '../validators/appointments.validator';

const router = Router();

// --- All routes behind authentication ---
router.use(authenticate);

/**
 * @route   GET /api/notifications/missed?since=ISO&limit=50
 * @desc    Fetch notifications created after the given timestamp
 * @access  Private
 */
router.get(
  '/missed',
  validateQuery(missedQuerySchema),
  notificationController.getMissed,
);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Return unread notification count (Redis-cached)
 * @access  Private
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * @route   GET /api/notifications/preferences
 * @desc    Return per-category notification preferences
 * @access  Private
 */
router.get('/preferences', notificationController.getPreferences);

/**
 * @route   PUT /api/notifications/preferences
 * @desc    Update per-category notification preferences
 * @access  Private
 */
router.put(
  '/preferences',
  validate(preferencesBodySchema),
  notificationController.updatePreferences,
);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all unread notifications as read
 * @access  Private
 */
router.put('/read-all', notificationController.markAllAsRead);

/**
 * @route   GET /api/notifications/:id
 * @desc    Fetch a single notification
 * @access  Private
 */
router.get('/:id', notificationController.getById);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a single notification as read
 * @access  Private
 */
router.put('/:id/read', notificationController.markAsRead);

/**
 * @route   GET /api/notifications
 * @desc    Paginated notification history with optional filters
 * @access  Private
 */
router.get(
  '/',
  validateQuery(historyQuerySchema),
  notificationController.getHistory,
);

export default router;
