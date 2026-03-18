-- ============================================================================
-- Migration: V004 - Create Notification Tables
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Creates notification system for alerts, reminders, and system messages
-- Version: 1.0.0
-- Date: 2026-03-18
-- Dependencies: V001__create_core_tables.sql
-- ============================================================================

BEGIN;

-- Set search path to app schema
SET search_path TO app, public;

-- ============================================================================
-- Table: notifications
-- Description: User notifications, alerts, and reminders
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'appointment_reminder', 'appointment_confirmation', 'appointment_cancellation',
        'appointment_rescheduled', 'waitlist_available', 'test_result_available',
        'prescription_ready', 'payment_due', 'system_alert', 'general_message'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    delivery_method VARCHAR(50)[] NOT NULL DEFAULT ARRAY['in_app'],
    email_sent BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent_at TIMESTAMPTZ,
    sms_sent BOOLEAN NOT NULL DEFAULT FALSE,
    sms_sent_at TIMESTAMPTZ,
    push_sent BOOLEAN NOT NULL DEFAULT FALSE,
    push_sent_at TIMESTAMPTZ,
    action_url VARCHAR(500),
    action_label VARCHAR(100),
    related_appointment_id BIGINT,
    related_document_id BIGINT,
    expires_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_read_timestamp CHECK (
        (is_read = TRUE AND read_at IS NOT NULL) OR
        (is_read = FALSE AND read_at IS NULL)
    )
);

-- Add table comment
COMMENT ON TABLE notifications IS 'User notifications, alerts, and reminders with multi-channel delivery';
COMMENT ON COLUMN notifications.user_id IS 'References users.id';
COMMENT ON COLUMN notifications.type IS 'Notification type: appointment_reminder, test_result_available, etc.';
COMMENT ON COLUMN notifications.priority IS 'Priority level: low, normal, high, urgent';
COMMENT ON COLUMN notifications.delivery_method IS 'Array of delivery methods: in_app, email, sms, push';
COMMENT ON COLUMN notifications.action_url IS 'URL for notification action button (e.g., view appointment)';
COMMENT ON COLUMN notifications.metadata IS 'Additional structured data for notification';

-- ============================================================================
-- Create index on user_id and is_read for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications (user_id, is_read) 
WHERE is_read = FALSE;

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration V004 completed successfully';
    RAISE NOTICE 'Tables created: notifications';
    RAISE NOTICE 'Indexes created: idx_notifications_user_unread for fetching unread notifications';
END $$;

COMMIT;
