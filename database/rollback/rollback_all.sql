-- ============================================================================
-- Rollback Script - Drop All Tables
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Drops all tables in correct order (reverse of foreign key dependencies)
-- WARNING: THIS WILL DELETE ALL DATA! Use only in development/testing!
-- Version: 1.0.0
-- Date: 2026-03-18
-- ============================================================================

BEGIN;

-- Set search path to app schema
SET search_path TO app, public;

-- ============================================================================
-- Drop tables in reverse dependency order
-- ============================================================================

-- Drop dependent tables first
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS allergies CASCADE;
DROP TABLE IF EXISTS medications CASCADE;
DROP TABLE IF NOT EXISTS clinical_documents CASCADE;
DROP TABLE IF EXISTS waitlist CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS time_slots CASCADE;

-- Drop core tables
DROP TABLE IF EXISTS patient_profiles CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- Drop triggers and functions
-- ============================================================================

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Rollback completed successfully';
    RAISE NOTICE 'All tables, triggers, and functions dropped';
    RAISE NOTICE 'Database schema reverted to pre-migration state';
END $$;

COMMIT;
