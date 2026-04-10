-- ============================================================================
-- Migration: V042 - Notification Functions and Triggers
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Creates trigger function for auto-setting read_at on mark-as-read,
--              and a retention function that archives (deletes) read notifications
--              older than 90 days while preserving unread ones.
-- Version: 1.0.0
-- Date: 2026-04-09
-- Dependencies: V004__create_notification_tables.sql
-- Task: US_046 TASK_004 - Database Notifications Schema
-- ============================================================================

BEGIN;

SET search_path TO app, public;

-- ============================================================================
-- Function: set_notification_read_at()
-- Description: Automatically sets read_at = NOW() when is_read flips to TRUE,
--              and clears read_at when is_read flips back to FALSE.
--              This keeps the chk_read_timestamp constraint satisfied.
-- ============================================================================

CREATE OR REPLACE FUNCTION app.set_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
        NEW.read_at = NOW();
    ELSIF NEW.is_read = FALSE AND OLD.is_read = TRUE THEN
        NEW.read_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION app.set_notification_read_at()
    IS 'Auto-set read_at timestamp when is_read changes (US_046 TASK_004)';

-- ============================================================================
-- Trigger: trg_notification_set_read_at
-- Fires BEFORE UPDATE so the read_at column is filled before the row is written.
-- ============================================================================

DROP TRIGGER IF EXISTS trg_notification_set_read_at ON app.notifications;

CREATE TRIGGER trg_notification_set_read_at
    BEFORE UPDATE ON app.notifications
    FOR EACH ROW
    WHEN (OLD.is_read IS DISTINCT FROM NEW.is_read)
    EXECUTE FUNCTION app.set_notification_read_at();

-- ============================================================================
-- Function: fn_archive_old_notifications()
-- Description: Deletes read notifications older than 90 days.
--              Unread notifications are preserved indefinitely.
--              Designed to be called by pg_cron or an external scheduler.
-- Returns: Number of rows deleted.
-- ============================================================================

CREATE OR REPLACE FUNCTION app.fn_archive_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM app.notifications
    WHERE is_read = TRUE
      AND created_at < NOW() - INTERVAL '90 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RAISE NOTICE 'Archived (deleted) % read notifications older than 90 days', deleted_count;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION app.fn_archive_old_notifications()
    IS 'Retention policy: remove read notifications older than 90 days (US_046 TASK_004)';

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration V042 completed successfully';
    RAISE NOTICE 'Functions created: app.set_notification_read_at(), app.fn_archive_old_notifications()';
    RAISE NOTICE 'Triggers created: trg_notification_set_read_at on notifications';
END $$;

COMMIT;
