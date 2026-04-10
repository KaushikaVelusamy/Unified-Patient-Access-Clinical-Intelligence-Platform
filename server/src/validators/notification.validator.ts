/**
 * Notification Validators
 *
 * Joi validation schemas for notification REST API endpoints.
 * Validates query parameters and request bodies.
 *
 * @module notification.validator
 * @task US_046 TASK_003
 */

import Joi from 'joi';

const NOTIFICATION_TYPES = [
  'appointment_reminder',
  'appointment_confirmation',
  'appointment_cancellation',
  'appointment_rescheduled',
  'waitlist_available',
  'test_result_available',
  'prescription_ready',
  'payment_due',
  'system_alert',
  'general_message',
];

const NOTIFICATION_PRIORITIES = ['low', 'normal', 'high', 'urgent'];

/**
 * Validate GET /notifications/missed?since={timestamp}
 */
export const missedQuerySchema = Joi.object({
  since: Joi.string()
    .isoDate()
    .required()
    .messages({
      'string.isoDate': 'since must be a valid ISO 8601 timestamp',
      'any.required': 'since query parameter is required',
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(50)
    .messages({
      'number.min': 'limit must be at least 1',
      'number.max': 'limit cannot exceed 100',
    }),
});

/**
 * Validate GET /notifications (paginated history)
 */
export const historyQuerySchema = Joi.object({
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.min': 'limit must be at least 1',
      'number.max': 'limit cannot exceed 100',
    }),
  offset: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      'number.min': 'offset must be 0 or greater',
    }),
  type: Joi.string()
    .valid(...NOTIFICATION_TYPES)
    .optional()
    .messages({
      'any.only': `type must be one of: ${NOTIFICATION_TYPES.join(', ')}`,
    }),
  priority: Joi.string()
    .valid(...NOTIFICATION_PRIORITIES)
    .optional()
    .messages({
      'any.only': `priority must be one of: ${NOTIFICATION_PRIORITIES.join(', ')}`,
    }),
  is_read: Joi.boolean()
    .optional(),
});

/**
 * Validate PUT /notifications/preferences
 */
export const preferencesBodySchema = Joi.object({
  appointment: Joi.boolean().optional(),
  medication: Joi.boolean().optional(),
  system: Joi.boolean().optional(),
  waitlist: Joi.boolean().optional(),
}).min(1).messages({
  'object.min': 'At least one preference must be provided',
});

/**
 * Validate params containing a notification ID
 */
export const notificationIdSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Notification ID must be a number',
      'number.positive': 'Notification ID must be positive',
      'any.required': 'Notification ID is required',
    }),
});
