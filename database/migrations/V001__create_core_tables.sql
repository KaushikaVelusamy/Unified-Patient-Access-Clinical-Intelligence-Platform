-- ============================================================================
-- Migration: V001 - Create Core Tables
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Creates core tables for users, departments, patient profiles, and audit logs
-- Version: 1.0.0
-- Date: 2026-03-18
-- Dependencies: 01_init_database.sql (database and extensions must exist)
-- ============================================================================

BEGIN;

-- Set search path to app schema
SET search_path TO app, public;

-- ============================================================================
-- Table: users
-- Description: Core user table for authentication and authorization
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'staff', 'admin')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add table comment
COMMENT ON TABLE users IS 'Core user authentication and profile table';
COMMENT ON COLUMN users.role IS 'User role: patient, doctor, staff, or admin';
COMMENT ON COLUMN users.is_active IS 'Whether user account is active (soft delete flag)';
COMMENT ON COLUMN users.is_verified IS 'Whether user has verified their email address';

-- ============================================================================
-- Table: departments
-- Description: Hospital departments and specializations
-- ============================================================================

CREATE TABLE IF NOT EXISTS departments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    location VARCHAR(255),
    phone_number VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add table comment
COMMENT ON TABLE departments IS 'Hospital departments and medical specializations';
COMMENT ON COLUMN departments.code IS 'Unique department code (e.g., CARDIO, ORTHO, PEDIA)';
COMMENT ON COLUMN departments.is_active IS 'Whether department is currently accepting appointments';

-- ============================================================================
-- Table: patient_profiles
-- Description: Extended patient information and medical records
-- ============================================================================

CREATE TABLE IF NOT EXISTS patient_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    medical_record_number VARCHAR(50) NOT NULL UNIQUE,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    blood_type VARCHAR(5) CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    insurance_provider VARCHAR(200),
    insurance_policy_number VARCHAR(100),
    primary_physician_id BIGINT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add table comment
COMMENT ON TABLE patient_profiles IS 'Extended patient information and medical records';
COMMENT ON COLUMN patient_profiles.medical_record_number IS 'Unique medical record number (MRN)';
COMMENT ON COLUMN patient_profiles.primary_physician_id IS 'References users table (doctor role)';

-- ============================================================================
-- Table: audit_logs
-- Description: Comprehensive audit trail for all database operations
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id BIGINT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add table comment
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all database operations';
COMMENT ON COLUMN audit_logs.action IS 'Database action: INSERT, UPDATE, DELETE, SELECT (sensitive data)';
COMMENT ON COLUMN audit_logs.old_values IS 'Previous record values (for UPDATE/DELETE)';
COMMENT ON COLUMN audit_logs.new_values IS 'New record values (for INSERT/UPDATE)';

-- ============================================================================
-- Create updated_at trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function to automatically update updated_at timestamp';

-- ============================================================================
-- Attach triggers to tables
-- ============================================================================

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_profiles_updated_at
    BEFORE UPDATE ON patient_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration V001 completed successfully';
    RAISE NOTICE 'Tables created: users, departments, patient_profiles, audit_logs';
    RAISE NOTICE 'Triggers created: updated_at auto-update triggers';
END $$;

COMMIT;
