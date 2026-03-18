-- ============================================================================
-- Migration: V003 - Create Clinical Tables
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Creates tables for clinical documents, medications, and allergies
-- Version: 1.0.0
-- Date: 2026-03-18
-- Dependencies: V001__create_core_tables.sql, V002__create_appointment_tables.sql
-- ============================================================================

BEGIN;

-- Set search path to app schema
SET search_path TO app, public;

-- ============================================================================
-- Table: clinical_documents
-- Description: Medical documents, notes, prescriptions, and lab results
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinical_documents (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    appointment_id BIGINT,
    created_by_user_id BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
        'clinical_note', 'prescription', 'lab_result', 'imaging_report', 
        'diagnosis', 'treatment_plan', 'discharge_summary', 'referral', 'other'
    )),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    document_date DATE NOT NULL,
    file_url VARCHAR(500),
    file_size_bytes BIGINT CHECK (file_size_bytes > 0),
    mime_type VARCHAR(100),
    is_confidential BOOLEAN NOT NULL DEFAULT FALSE,
    tags VARCHAR(100)[],
    metadata JSONB,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add table comment
COMMENT ON TABLE clinical_documents IS 'Medical documents, notes, prescriptions, and lab results with AI vector embeddings';
COMMENT ON COLUMN clinical_documents.patient_id IS 'References patient_profiles.id';
COMMENT ON COLUMN clinical_documents.appointment_id IS 'Associated appointment (optional)';
COMMENT ON COLUMN clinical_documents.created_by_user_id IS 'Doctor or staff who created the document';
COMMENT ON COLUMN clinical_documents.embedding IS 'OpenAI ada-002 embedding (1536 dimensions) for semantic search';
COMMENT ON COLUMN clinical_documents.is_confidential IS 'Whether document contains extra sensitive information';
COMMENT ON COLUMN clinical_documents.metadata IS 'Additional structured data (lab values, vital signs, etc.)';

-- ============================================================================
-- Table: medications
-- Description: Patient medication records and prescription history
-- ============================================================================

CREATE TABLE IF NOT EXISTS medications (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    prescribed_by_user_id BIGINT NOT NULL,
    clinical_document_id BIGINT,
    medication_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    route VARCHAR(50) NOT NULL CHECK (route IN ('oral', 'topical', 'injection', 'intravenous', 'inhalation', 'sublingual', 'rectal', 'other')),
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    instructions TEXT,
    side_effects TEXT,
    refills_remaining INTEGER DEFAULT 0 CHECK (refills_remaining >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_medication_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Add table comment
COMMENT ON TABLE medications IS 'Patient medication records and prescription history';
COMMENT ON COLUMN medications.patient_id IS 'References patient_profiles.id';
COMMENT ON COLUMN medications.prescribed_by_user_id IS 'Doctor who prescribed the medication';
COMMENT ON COLUMN medications.clinical_document_id IS 'Associated prescription document (optional)';
COMMENT ON COLUMN medications.is_active IS 'Whether medication is currently active';
COMMENT ON COLUMN medications.route IS 'Administration route: oral, topical, injection, etc.';

-- ============================================================================
-- Table: allergies
-- Description: Patient allergy records and sensitivities
-- ============================================================================

CREATE TABLE IF NOT EXISTS allergies (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    recorded_by_user_id BIGINT NOT NULL,
    allergen VARCHAR(255) NOT NULL,
    allergen_type VARCHAR(50) NOT NULL CHECK (allergen_type IN ('medication', 'food', 'environmental', 'insect', 'latex', 'other')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe', 'life_threatening')),
    reaction TEXT NOT NULL,
    onset_date DATE,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add table comment
COMMENT ON TABLE allergies IS 'Patient allergy records and sensitivities';
COMMENT ON COLUMN allergies.patient_id IS 'References patient_profiles.id';
COMMENT ON COLUMN allergies.recorded_by_user_id IS 'User who recorded the allergy';
COMMENT ON COLUMN allergies.allergen IS 'Name of allergen (medication, food, substance, etc.)';
COMMENT ON COLUMN allergies.severity IS 'Reaction severity: mild, moderate, severe, life_threatening';
COMMENT ON COLUMN allergies.verified IS 'Whether allergy has been clinically verified';

-- ============================================================================
-- Create updated_at triggers
-- ============================================================================

CREATE TRIGGER update_clinical_documents_updated_at
    BEFORE UPDATE ON clinical_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medications_updated_at
    BEFORE UPDATE ON medications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_allergies_updated_at
    BEFORE UPDATE ON allergies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration V003 completed successfully';
    RAISE NOTICE 'Tables created: clinical_documents (with vector column), medications, allergies';
    RAISE NOTICE 'Vector column: clinical_documents.embedding vector(1536) for AI semantic search';
    RAISE NOTICE 'Triggers created: updated_at auto-update triggers';
END $$;

COMMIT;
