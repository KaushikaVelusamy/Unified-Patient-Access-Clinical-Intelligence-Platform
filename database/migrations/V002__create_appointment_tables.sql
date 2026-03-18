-- ============================================================================
-- Migration: V002 - Create Appointment Tables
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Creates tables for appointment scheduling, time slots, and waitlist management
-- Version: 1.0.0
-- Date: 2026-03-18
-- Dependencies: V001__create_core_tables.sql
-- ============================================================================

BEGIN;

-- Set search path to app schema
SET search_path TO app, public;

-- ============================================================================
-- Table: appointments
-- Description: Core appointment bookings and scheduling
-- ============================================================================

CREATE TABLE IF NOT EXISTS appointments (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    department_id BIGINT NOT NULL,
    appointment_date TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (duration_minutes > 0 AND duration_minutes <= 480),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'rescheduled')),
    appointment_type VARCHAR(50) NOT NULL CHECK (appointment_type IN ('consultation', 'follow_up', 'emergency', 'routine_checkup', 'diagnostic', 'treatment')),
    reason_for_visit TEXT,
    cancellation_reason TEXT,
    notes TEXT,
    cancelled_at TIMESTAMPTZ,
    cancelled_by BIGINT,
    checked_in_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_appointment_date_future CHECK (appointment_date >= created_at),
    CONSTRAINT chk_status_cancelled_fields CHECK (
        (status = 'cancelled' AND cancellation_reason IS NOT NULL AND cancelled_at IS NOT NULL AND cancelled_by IS NOT NULL) OR
        (status != 'cancelled')
    )
);

-- Add table comment
COMMENT ON TABLE appointments IS 'Core appointment bookings and scheduling';
COMMENT ON COLUMN appointments.patient_id IS 'References patient_profiles.id';
COMMENT ON COLUMN appointments.doctor_id IS 'References users.id (doctor role)';
COMMENT ON COLUMN appointments.duration_minutes IS 'Appointment duration in minutes (max 8 hours)';
COMMENT ON COLUMN appointments.status IS 'Appointment status: pending, confirmed, cancelled, completed, no_show, rescheduled';
COMMENT ON COLUMN appointments.cancelled_by IS 'User ID who cancelled the appointment';

-- ============================================================================
-- Table: time_slots
-- Description: Available doctor time slots for appointment scheduling
-- ============================================================================

CREATE TABLE IF NOT EXISTS time_slots (
    id BIGSERIAL PRIMARY KEY,
    doctor_id BIGINT NOT NULL,
    department_id BIGINT NOT NULL,
    slot_date DATE NOT NULL,
    slot_start TIME NOT NULL,
    slot_end TIME NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    max_appointments INTEGER NOT NULL DEFAULT 1 CHECK (max_appointments > 0),
    booked_count INTEGER NOT NULL DEFAULT 0 CHECK (booked_count >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_time_slot_valid CHECK (slot_end > slot_start),
    CONSTRAINT chk_booked_within_max CHECK (booked_count <= max_appointments),
    CONSTRAINT uq_doctor_slot UNIQUE (doctor_id, slot_date, slot_start)
);

-- Add table comment
COMMENT ON TABLE time_slots IS 'Available doctor time slots for appointment scheduling';
COMMENT ON COLUMN time_slots.doctor_id IS 'References users.id (doctor role)';
COMMENT ON COLUMN time_slots.is_available IS 'Whether slot is available for booking';
COMMENT ON COLUMN time_slots.max_appointments IS 'Maximum number of appointments per slot (for group sessions)';
COMMENT ON COLUMN time_slots.booked_count IS 'Current number of booked appointments in this slot';

-- ============================================================================
-- Table: waitlist
-- Description: Waitlist for patients waiting for appointment availability
-- ============================================================================

CREATE TABLE IF NOT EXISTS waitlist (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    department_id BIGINT NOT NULL,
    doctor_id BIGINT,
    requested_date DATE NOT NULL,
    preferred_time_start TIME,
    preferred_time_end TIME,
    priority INTEGER NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'contacted', 'scheduled', 'cancelled', 'expired')),
    reason TEXT,
    notes TEXT,
    contacted_at TIMESTAMPTZ,
    scheduled_appointment_id BIGINT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_preferred_time CHECK (
        (preferred_time_start IS NULL AND preferred_time_end IS NULL) OR
        (preferred_time_start IS NOT NULL AND preferred_time_end IS NOT NULL AND preferred_time_end > preferred_time_start)
    )
);

-- Add table comment
COMMENT ON TABLE waitlist IS 'Waitlist for patients waiting for appointment availability';
COMMENT ON COLUMN waitlist.patient_id IS 'References patient_profiles.id';
COMMENT ON COLUMN waitlist.doctor_id IS 'Specific doctor requested (optional)';
COMMENT ON COLUMN waitlist.priority IS 'Waitlist priority: 1 (highest) to 10 (lowest)';
COMMENT ON COLUMN waitlist.status IS 'Waitlist status: waiting, contacted, scheduled, cancelled, expired';
COMMENT ON COLUMN waitlist.scheduled_appointment_id IS 'Appointment ID if successfully scheduled from waitlist';

-- ============================================================================
-- Create updated_at triggers
-- ============================================================================

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_slots_updated_at
    BEFORE UPDATE ON time_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waitlist_updated_at
    BEFORE UPDATE ON waitlist
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration V002 completed successfully';
    RAISE NOTICE 'Tables created: appointments, time_slots, waitlist';
    RAISE NOTICE 'Constraints added: date validation, status checks, booking counts';
    RAISE NOTICE 'Triggers created: updated_at auto-update triggers';
END $$;

COMMIT;
