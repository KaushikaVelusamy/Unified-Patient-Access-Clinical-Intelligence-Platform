-- ============================================================================
-- Migration: V008 - Create PDF Metadata Table
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Creates pdf_metadata table for tracking appointment confirmation PDFs
--              stored in the filesystem with secure download URLs and automated cleanup
-- Version: 1.0.0
-- Date: 2026-03-20
-- Dependencies: V007__add_constraints.sql
-- Task: US_018 TASK_002 - Backend PDF Storage Service
-- ============================================================================

BEGIN;

-- Set search path to app schema
SET search_path TO app, public;

-- ============================================================================
-- Create pdf_metadata table
-- ============================================================================

CREATE TABLE IF NOT EXISTS pdf_metadata (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key to appointments table
    appointment_id UUID NOT NULL,
    
    -- File storage information
    file_path VARCHAR(500) NOT NULL UNIQUE,
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
    
    -- Lifecycle timestamps
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Audit information
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_expires_after_generated CHECK (expires_at > generated_at)
);

-- ============================================================================
-- Add foreign key constraint
-- ============================================================================

ALTER TABLE pdf_metadata
ADD CONSTRAINT fk_pdf_metadata_appointment_id
FOREIGN KEY (appointment_id)
REFERENCES appointments (id)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE pdf_metadata
ADD CONSTRAINT fk_pdf_metadata_created_by
FOREIGN KEY (created_by)
REFERENCES users (id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- ============================================================================
-- Create indexes for performance
-- ============================================================================

-- Index for querying PDFs by appointment
CREATE INDEX idx_pdf_metadata_appointment_id ON pdf_metadata(appointment_id);

-- Index for cleanup job (finding expired PDFs)
CREATE INDEX idx_pdf_metadata_expires_at ON pdf_metadata(expires_at);

-- Index for finding recently generated PDFs
CREATE INDEX idx_pdf_metadata_generated_at ON pdf_metadata(generated_at DESC);

-- Composite index for common query pattern (appointment + expiry check)
CREATE INDEX idx_pdf_metadata_appointment_expires ON pdf_metadata(appointment_id, expires_at);

-- ============================================================================
-- Add table comments
-- ============================================================================

COMMENT ON TABLE pdf_metadata IS 'Metadata tracking for appointment confirmation PDF files stored in filesystem with secure download URLs and automated cleanup after 30 days';

COMMENT ON COLUMN pdf_metadata.id IS 'Unique identifier for the PDF metadata record';
COMMENT ON COLUMN pdf_metadata.appointment_id IS 'Foreign key reference to the appointments table';
COMMENT ON COLUMN pdf_metadata.file_path IS 'Relative path to the PDF file in the storage filesystem (e.g., 2026-03/confirmation_abc123_1711098765432.pdf)';
COMMENT ON COLUMN pdf_metadata.file_size_bytes IS 'Size of the PDF file in bytes for storage monitoring';
COMMENT ON COLUMN pdf_metadata.generated_at IS 'Timestamp when the PDF was generated and saved to storage';
COMMENT ON COLUMN pdf_metadata.expires_at IS 'Timestamp when the PDF should be deleted from storage (generated_at + 30 days)';
COMMENT ON COLUMN pdf_metadata.created_by IS 'User ID who triggered PDF generation (nullable for system-generated PDFs)';
COMMENT ON COLUMN pdf_metadata.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN pdf_metadata.updated_at IS 'Record last update timestamp';

-- ============================================================================
-- Create trigger for updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_pdf_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pdf_metadata_updated_at
BEFORE UPDATE ON pdf_metadata
FOR EACH ROW
EXECUTE FUNCTION update_pdf_metadata_updated_at();

COMMIT;

-- ============================================================================
-- Rollback script (for reference, execute separately if needed)
-- ============================================================================
-- BEGIN;
-- DROP TRIGGER IF EXISTS trg_pdf_metadata_updated_at ON pdf_metadata;
-- DROP FUNCTION IF EXISTS update_pdf_metadata_updated_at();
-- DROP TABLE IF EXISTS pdf_metadata;
-- COMMIT;
