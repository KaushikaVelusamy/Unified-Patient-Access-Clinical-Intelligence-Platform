-- ============================================================================
-- Migration: V041 - Add Notification Query Optimization Indexes
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Adds composite indexes on the existing notifications table
--              for missed-notification fetching, unread counts, type filtering,
--              and the notification_preferences category columns.
-- Version: 1.0.0
-- Date: 2026-04-09
-- Dependencies: V004__create_notification_tables.sql,
--               V018__create_notification_preferences_table.sql
-- Task: US_046 TASK_004 - Database Notifications Schema
-- ============================================================================

BEGIN;

SET search_path TO app, public;

-- ============================================================================
-- Index: Missed-notification query  (user_id, created_at DESC)
-- Supports: SELECT * FROM notifications WHERE user_id = $1 AND created_at > $2
--           ORDER BY created_at DESC
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
    ON notifications (user_id, created_at DESC);

-- ============================================================================
-- Index: Unread-count query  (user_id, is_read)
-- The existing partial index idx_notifications_user_unread only covers
-- is_read = FALSE rows. This full composite index supports both read
-- and unread filtering.
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_status
    ON notifications (user_id, is_read);

-- ============================================================================
-- Index: Type-based filtering  (user_id, type)
-- Supports: WHERE user_id = $1 AND type = $2
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_type
    ON notifications (user_id, type);

-- ============================================================================
-- Index: Priority-based filtering  (user_id, priority)
-- Supports: WHERE user_id = $1 AND priority = $2
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_priority
    ON notifications (user_id, priority);

-- ============================================================================
-- Index: Retention policy — targets read + old rows efficiently
-- Supports: WHERE is_read = TRUE AND created_at < threshold
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_read_created
    ON notifications (created_at)
    WHERE is_read = TRUE;

-- ============================================================================
-- Add per-category preference columns to notification_preferences
-- These map the boolean categories (appointment, medication, system, waitlist)
-- requested by US_046 task_003 REST API.
-- ============================================================================

ALTER TABLE app.notification_preferences
    ADD COLUMN IF NOT EXISTS category_appointment BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS category_medication  BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS category_system      BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS category_waitlist    BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN app.notification_preferences.category_appointment IS 'Enable/disable appointment-related notifications';
COMMENT ON COLUMN app.notification_preferences.category_medication  IS 'Enable/disable medication-related notifications';
COMMENT ON COLUMN app.notification_preferences.category_system      IS 'Enable/disable system alert notifications';
COMMENT ON COLUMN app.notification_preferences.category_waitlist    IS 'Enable/disable waitlist notifications';

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration V041 completed successfully';
    RAISE NOTICE 'Indexes created: idx_notifications_user_created, idx_notifications_user_read_status, idx_notifications_user_type, idx_notifications_user_priority, idx_notifications_read_created';
    RAISE NOTICE 'Columns added: category_appointment, category_medication, category_system, category_waitlist on notification_preferences';
END $$;

COMMIT;
