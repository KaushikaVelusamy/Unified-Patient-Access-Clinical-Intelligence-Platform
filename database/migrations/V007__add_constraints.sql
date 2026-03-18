-- ============================================================================
-- Migration: V007 - Add Foreign Key Constraints
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Establishes foreign key relationships between tables with cascade actions
-- Version: 1.0.0
-- Date: 2026-03-18
-- Dependencies: All previous migrations (V001-V006)
-- ============================================================================

BEGIN;

-- Set search path to app schema
SET search_path TO app, public;

-- ============================================================================
-- Foreign Keys for patient_profiles table
-- ============================================================================

ALTER TABLE patient_profiles
ADD CONSTRAINT fk_patient_profiles_user_id
FOREIGN KEY (user_id)
REFERENCES users (id)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE patient_profiles
ADD CONSTRAINT fk_patient_profiles_primary_physician
FOREIGN KEY (primary_physician_id)
REFERENCES users (id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- ============================================================================
-- Foreign Keys for appointments table
-- ============================================================================

ALTER TABLE appointments
ADD CONSTRAINT fk_appointments_patient_id
FOREIGN KEY (patient_id)
REFERENCES patient_profiles (id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE appointments
ADD CONSTRAINT fk_appointments_doctor_id
FOREIGN KEY (doctor_id)
REFERENCES users (id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE appointments
ADD CONSTRAINT fk_appointments_department_id
FOREIGN KEY (department_id)
REFERENCES departments (id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE appointments
ADD CONSTRAINT fk_appointments_cancelled_by
FOREIGN KEY (cancelled_by)
REFERENCES users (id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- ============================================================================
-- Foreign Keys for time_slots table
-- ============================================================================

ALTER TABLE time_slots
ADD CONSTRAINT fk_time_slots_doctor_id
FOREIGN KEY (doctor_id)
REFERENCES users (id)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE time_slots
ADD CONSTRAINT fk_time_slots_department_id
FOREIGN KEY (department_id)
REFERENCES departments (id)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- ============================================================================
-- Foreign Keys for waitlist table
-- ============================================================================

ALTER TABLE waitlist
ADD CONSTRAINT fk_waitlist_patient_id
FOREIGN KEY (patient_id)
REFERENCES patient_profiles (id)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE waitlist
ADD CONSTRAINT fk_waitlist_department_id
FOREIGN KEY (department_id)
REFERENCES departments (id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE waitlist
ADD CONSTRAINT fk_waitlist_doctor_id
FOREIGN KEY (doctor_id)
REFERENCES users (id)
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE waitlist
ADD CONSTRAINT fk_waitlist_scheduled_appointment
FOREIGN KEY (scheduled_appointment_id)
REFERENCES appointments (id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- ============================================================================
-- Foreign Keys for clinical_documents table
-- ============================================================================

ALTER TABLE clinical_documents
ADD CONSTRAINT fk_clinical_documents_patient_id
FOREIGN KEY (patient_id)
REFERENCES patient_profiles (id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE clinical_documents
ADD CONSTRAINT fk_clinical_documents_appointment_id
FOREIGN KEY (appointment_id)
REFERENCES appointments (id)
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE clinical_documents
ADD CONSTRAINT fk_clinical_documents_created_by
FOREIGN KEY (created_by_user_id)
REFERENCES users (id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- ============================================================================
-- Foreign Keys for medications table
-- ============================================================================

ALTER TABLE medications
ADD CONSTRAINT fk_medications_patient_id
FOREIGN KEY (patient_id)
REFERENCES patient_profiles (id)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE medications
ADD CONSTRAINT fk_medications_prescribed_by
FOREIGN KEY (prescribed_by_user_id)
REFERENCES users (id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE medications
ADD CONSTRAINT fk_medications_clinical_document
FOREIGN KEY (clinical_document_id)
REFERENCES clinical_documents (id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- ============================================================================
-- Foreign Keys for allergies table
-- ============================================================================

ALTER TABLE allergies
ADD CONSTRAINT fk_allergies_patient_id
FOREIGN KEY (patient_id)
REFERENCES patient_profiles (id)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE allergies
ADD CONSTRAINT fk_allergies_recorded_by
FOREIGN KEY (recorded_by_user_id)
REFERENCES users (id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- ============================================================================
-- Foreign Keys for audit_logs table
-- ============================================================================

ALTER TABLE audit_logs
ADD CONSTRAINT fk_audit_logs_user_id
FOREIGN KEY (user_id)
REFERENCES users (id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- ============================================================================
-- Foreign Keys for notifications table
-- ============================================================================

ALTER TABLE notifications
ADD CONSTRAINT fk_notifications_user_id
FOREIGN KEY (user_id)
REFERENCES users (id)
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE notifications
ADD CONSTRAINT fk_notifications_appointment
FOREIGN KEY (related_appointment_id)
REFERENCES appointments (id)
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE notifications
ADD CONSTRAINT fk_notifications_document
FOREIGN KEY (related_document_id)
REFERENCES clinical_documents (id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
DECLARE
    fk_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
    AND constraint_schema = 'app';
    
    RAISE NOTICE 'Migration V007 completed successfully';
    RAISE NOTICE 'Total foreign key constraints created: %', fk_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Cascade Actions Summary:';
    RAISE NOTICE '  - ON DELETE CASCADE: Patient profile deletion cascades to related records';
    RAISE NOTICE '  - ON DELETE RESTRICT: Critical records (appointments, documents) cannot be deleted if referenced';
    RAISE NOTICE '  - ON DELETE SET NULL: Optional references set to NULL when parent deleted';
    RAISE NOTICE '  - ON UPDATE CASCADE: All FKs cascade updates to maintain referential integrity';
END $$;

COMMIT;
