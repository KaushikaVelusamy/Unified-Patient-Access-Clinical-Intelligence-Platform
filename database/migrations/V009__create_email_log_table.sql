-- ============================================================================
-- Migration: V009 - Create Email Log Table
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Creates email_log table for tracking appointment confirmation emails
--              sent via nodemailer with attachment info, retry attempts, and delivery status
-- Version: 1.0.0
-- Date: 2026-03-20
-- Dependencies: V008__create_pdf_metadata_table.sql
-- Task: US_018 TASK_003 - Backend Email Service with PDF Attachment
-- ============================================================================

BEGIN;

-- Set search path to app schema
SET search_path TO app, public;

-- ============================================================================
-- Create email_log table
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_log (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key to appointments table
    appointment_id UUID NOT NULL,
    
    -- Email details
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    
    -- Delivery information
    sent_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
    
    -- Retry logic
    retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
    error_message TEXT,
    
    -- Attachment tracking
    has_attachment BOOLEAN NOT NULL DEFAULT false,
    
    -- Audit timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Add foreign key constraint
-- ============================================================================

ALTER TABLE email_log
ADD CONSTRAINT fk_email_log_appointment_id
FOREIGN KEY (appointment_id)
REFERENCES appointments (id)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- ============================================================================
-- Create indexes for performance
-- ============================================================================

-- Index for querying emails by appointment
CREATE INDEX idx_email_log_appointment_id ON email_log(appointment_id);

-- Index for querying by status (finding failed emails)
CREATE INDEX idx_email_log_status ON email_log(status);

-- Index for finding emails by recipient
CREATE INDEX idx_email_log_recipient_email ON email_log(recipient_email);

-- Index for finding recent emails
CREATE INDEX idx_email_log_sent_at ON email_log(sent_at DESC NULLS LAST);

-- Composite index for retry monitoring (failed emails with retry count)
CREATE INDEX idx_email_log_status_retry ON email_log(status, retry_count);

-- ============================================================================
-- Add table comments
-- ============================================================================

COMMENT ON TABLE email_log IS 'Audit log for appointment confirmation emails sent via nodemailer with delivery status, retry attempts, and PDF attachment tracking';

COMMENT ON COLUMN email_log.id IS 'Unique identifier for the email log entry';
COMMENT ON COLUMN email_log.appointment_id IS 'Foreign key reference to the appointments table';
COMMENT ON COLUMN email_log.recipient_email IS 'Email address where the confirmation was sent';
COMMENT ON COLUMN email_log.subject IS 'Email subject line';
COMMENT ON COLUMN email_log.sent_at IS 'Timestamp when email was successfully sent (NULL if failed)';
COMMENT ON COLUMN email_log.status IS 'Delivery status: sent (successful), failed (exhausted retries), pending (waiting to send)';
COMMENT ON COLUMN email_log.retry_count IS 'Number of retry attempts made for this email';
COMMENT ON COLUMN email_log.error_message IS 'Error message if email sending failed (NULL if successful)';
COMMENT ON COLUMN email_log.has_attachment IS 'Whether PDF attachment was included in the email';
COMMENT ON COLUMN email_log.created_at IS 'Record creation timestamp (when email sending was initiated)';
COMMENT ON COLUMN email_log.updated_at IS 'Record last update timestamp';

-- ============================================================================
-- Create trigger for updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_email_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_email_log_updated_at
BEFORE UPDATE ON email_log
FOR EACH ROW
EXECUTE FUNCTION update_email_log_updated_at();

COMMIT;

-- ============================================================================
-- Rollback script (for reference, execute separately if needed)
-- ============================================================================
-- BEGIN;
-- DROP TRIGGER IF EXISTS trg_email_log_updated_at ON email_log;
-- DROP FUNCTION IF EXISTS update_email_log_updated_at();
-- DROP TABLE IF EXISTS email_log;
-- COMMIT;
