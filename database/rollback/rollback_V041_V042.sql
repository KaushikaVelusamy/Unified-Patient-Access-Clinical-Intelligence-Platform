-- ============================================================================
-- Rollback: V041 + V042 - Notification Indexes, Functions, Triggers
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Reverses all changes from:
--   V041__add_notification_indexes_and_category_prefs.sql
--   V042__add_notification_functions_and_triggers.sql
-- Task: US_046 TASK_004
-- ============================================================================

BEGIN;

SET search_path TO app, public;

-- ============================================================================
-- 1. Drop trigger (V042)
-- ============================================================================

DROP TRIGGER IF EXISTS trg_notification_set_read_at ON app.notifications;

-- ============================================================================
-- 2. Drop functions (V042)
-- ============================================================================

DROP FUNCTION IF EXISTS app.fn_archive_old_notifications();
DROP FUNCTION IF EXISTS app.set_notification_read_at();

-- ============================================================================
-- 3. Drop category preference columns (V041)
-- ============================================================================

ALTER TABLE app.notification_preferences
    DROP COLUMN IF EXISTS category_appointment,
    DROP COLUMN IF EXISTS category_medication,
    DROP COLUMN IF EXISTS category_system,
    DROP COLUMN IF EXISTS category_waitlist;

-- ============================================================================
-- 4. Drop indexes (V041)
-- ============================================================================

DROP INDEX IF EXISTS idx_notifications_read_created;
DROP INDEX IF EXISTS idx_notifications_user_priority;
DROP INDEX IF EXISTS idx_notifications_user_type;
DROP INDEX IF EXISTS idx_notifications_user_read_status;
DROP INDEX IF EXISTS idx_notifications_user_created;

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Rollback of V041 + V042 completed successfully';
    RAISE NOTICE 'Dropped: trigger trg_notification_set_read_at';
    RAISE NOTICE 'Dropped: functions fn_archive_old_notifications, set_notification_read_at';
    RAISE NOTICE 'Dropped: columns category_appointment, category_medication, category_system, category_waitlist';
    RAISE NOTICE 'Dropped: indexes idx_notifications_user_created, idx_notifications_user_read_status, idx_notifications_user_type, idx_notifications_user_priority, idx_notifications_read_created';
END $$;

COMMIT;
