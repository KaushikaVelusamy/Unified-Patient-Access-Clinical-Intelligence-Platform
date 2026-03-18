-- ============================================================================
-- Migration: V005 - Create B-tree Indexes
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Creates B-tree indexes on foreign keys, timestamps, and frequently queried columns
-- Version: 1.0.0
-- Date: 2026-03-18
-- Dependencies: V001, V002, V003, V004 (all table migrations)
-- ============================================================================

BEGIN;

-- Set search path to app schema
SET search_path TO app, public;

-- ============================================================================
-- Indexes on users table
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users (last_login_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at DESC);

-- ============================================================================
-- Indexes on departments table
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_departments_code ON departments (code);
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments (is_active) WHERE is_active = TRUE;

-- ============================================================================
-- Indexes on patient_profiles table
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_patient_profiles_user_id ON patient_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_mrn ON patient_profiles (medical_record_number);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_primary_physician ON patient_profiles (primary_physician_id);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_dob ON patient_profiles (date_of_birth);

-- ============================================================================
-- Indexes on appointments  table
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments (patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments (doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_department_id ON appointments (department_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments (appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments (status);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments (doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_status ON appointments (patient_id, status);
CREATE INDEX IF NOT EXISTS idx_appointments_upcoming ON appointments (appointment_date, status) 
    WHERE status IN ('pending', 'confirmed') AND appointment_date >= CURRENT_DATE;

-- ============================================================================
-- Indexes on time_slots table
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_time_slots_doctor_id ON time_slots (doctor_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_department_id ON time_slots (department_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_date ON time_slots (slot_date);
CREATE INDEX IF NOT EXISTS idx_time_slots_available ON time_slots (doctor_id, slot_date, is_available) 
    WHERE is_available = TRUE;

-- ============================================================================
-- Indexes on waitlist table
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_waitlist_patient_id ON waitlist (patient_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_department_id ON waitlist (department_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_doctor_id ON waitlist (doctor_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist (status);
CREATE INDEX IF NOT EXISTS idx_waitlist_priority ON waitlist (priority, created_at) 
    WHERE status = 'waiting';
CREATE INDEX IF NOT EXISTS idx_waitlist_requested_date ON waitlist (requested_date);

-- ============================================================================
-- Indexes on clinical_documents table
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_clinical_documents_patient_id ON clinical_documents (patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_appointment_id ON clinical_documents (appointment_id);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_created_by ON clinical_documents (created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_type ON clinical_documents (document_type);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_date ON clinical_documents (document_date DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_patient_type ON clinical_documents (patient_id, document_type);
CREATE INDEX IF NOT EXISTS idx_clinical_documents_confidential ON clinical_documents (is_confidential) 
    WHERE is_confidential = TRUE;

-- GIN index for tags array
CREATE INDEX IF NOT EXISTS idx_clinical_documents_tags ON clinical_documents USING gin (tags);

-- GIN index for metadata JSONB
CREATE INDEX IF NOT EXISTS idx_clinical_documents_metadata ON clinical_documents USING gin (metadata);

-- ============================================================================
-- Indexes on medications table
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_medications_patient_id ON medications (patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_prescribed_by ON medications (prescribed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_medications_clinical_document_id ON medications (clinical_document_id);
CREATE INDEX IF NOT EXISTS idx_medications_active ON medications (patient_id, is_active) 
    WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_medications_start_date ON medications (start_date);
CREATE INDEX IF NOT EXISTS idx_medications_end_date ON medications (end_date);

-- ============================================================================
-- Indexes on allergies table
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_allergies_patient_id ON allergies (patient_id);
CREATE INDEX IF NOT EXISTS idx_allergies_recorded_by ON allergies (recorded_by_user_id);
CREATE INDEX IF NOT EXISTS idx_allergies_type ON allergies (allergen_type);
CREATE INDEX IF NOT EXISTS idx_allergies_severity ON allergies (severity);
CREATE INDEX IF NOT EXISTS idx_allergies_verified ON allergies (patient_id, verified) 
    WHERE verified = TRUE;

-- ============================================================================
-- Indexes on audit_logs table
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs (table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);

-- GIN index for JSONB columns in audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_old_values ON audit_logs USING gin (old_values);
CREATE INDEX IF NOT EXISTS idx_audit_logs_new_values ON audit_logs USING gin (new_values);

-- ============================================================================
-- Indexes on notifications table (additional to those created in V004)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications (type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications (priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications (expires_at) 
    WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_appointment ON notifications (related_appointment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_document ON notifications (related_document_id);

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'app';
    
    RAISE NOTICE 'Migration V005 completed successfully';
    RAISE NOTICE 'Total indexes in app schema: %', index_count;
    RAISE NOTICE 'B-tree indexes created for foreign keys, timestamps, and frequently queried columns';
    RAISE NOTICE 'GIN indexes created for JSONB and array columns';
    RAISE NOTICE 'Partial indexes created for active/unread records';
END $$;

COMMIT;
