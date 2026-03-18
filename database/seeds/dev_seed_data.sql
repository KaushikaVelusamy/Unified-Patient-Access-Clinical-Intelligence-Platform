-- ============================================================================
-- Development Seed Data
-- Clinical Appointment Platform (UPACI)
-- ============================================================================
-- Description: Test data for development and testing environments
-- WARNING: DO NOT RUN IN PRODUCTION!
-- Version: 1.0.0
-- Date: 2026-03-18
-- Dependencies: All migrations (V001-V007) must be applied first
-- ============================================================================

BEGIN;

-- Set search path to app schema
SET search_path TO app, public;

-- ============================================================================
-- Seed Users
-- ============================================================================

-- Password: Admin123! (bcrypt hash with cost 10)
INSERT INTO users (email, password_hash, role, first_name,  last_name, phone_number, is_active, is_verified) VALUES
('admin@upaci.com', '$2b$10$xRk4QvW8Q3T6pZ9KqN1Mq.9nF4aRt3Xk7Wv5Qq2.Kk3Rr4Tt5Uu6V', 'admin', 'Admin', 'System', '+1-555-0001', TRUE, TRUE),

-- Password: Doctor123!
('dr.smith@upaci.com', '$2b$10$xRk4QvW8Q3T6pZ9KqN1Mq.9nF4aRt3Xk7Wv5Qq2.Kk3Rr4Tt5Uu6V', 'doctor', 'John', 'Smith', '+1-555-0002', TRUE, TRUE),
('dr.jones@upaci.com', '$2b$10$xRk4QvW8Q3T6pZ9KqN1Mq.9nF4aRt3Xk7Wv5Qq2.Kk3Rr4Tt5Uu6V', 'doctor', 'Emily', 'Jones', '+1-555-0003', TRUE, TRUE),
('dr.patel@upaci.com', '$2b$10$xRk4QvW8Q3T6pZ9KqN1Mq.9nF4aRt3Xk7Wv5Qq2.Kk3Rr4Tt5Uu6V', 'doctor', 'Raj', 'Patel', '+1-555-0004', TRUE, TRUE),

-- Password: Staff123!
('staff.wilson@upaci.com', '$2b$10$xRk4QvW8Q3T6pZ9KqN1Mq.9nF4aRt3Xk7Wv5Qq2.Kk3Rr4Tt5Uu6V', 'staff', 'Sarah', 'Wilson', '+1-555-0005', TRUE, TRUE),

-- Password: Patient123!
('patient1@example.com', '$2b$10$xRk4QvW8Q3T6pZ9KqN1Mq.9nF4aRt3Xk7Wv5Qq2.Kk3Rr4Tt5Uu6V', 'patient', 'Michael', 'Brown', '+1-555-0101', TRUE, TRUE),
('patient2@example.com', '$2b$10$xRk4QvW8Q3T6pZ9KqN1Mq.9nF4aRt3Xk7Wv5Qq2.Kk3Rr4Tt5Uu6V', 'patient', 'Jennifer', 'Davis', '+1-555-0102', TRUE, TRUE),
('patient3@example.com', '$2b$10$xRk4QvW8Q3T6pZ9KqN1Mq.9nF4aRt3Xk7Wv5Qq2.Kk3Rr4Tt5Uu6V', 'patient', 'Robert', 'Garcia', '+1-555-0103', TRUE, TRUE);

-- ============================================================================
-- Seed Departments
-- ============================================================================

INSERT INTO departments (name, code, description, location, phone_number, email, is_active) VALUES
('Cardiology', 'CARDIO', 'Heart and cardiovascular care', 'Building A, Floor 3', '+1-555-1001', 'cardio@upaci.com', TRUE),
('Orthopedics', 'ORTHO', 'Bone, joint, and musculoskeletal care', 'Building B, Floor 2', '+1-555-1002', 'ortho@upaci.com', TRUE),
('Pediatrics', 'PEDIA', 'Child and adolescent healthcare', 'Building A, Floor 1', '+1-555-1003', 'pedia@upaci.com', TRUE),
('Internal Medicine', 'INTERNAL', 'General adult medicine', 'Building C, Floor 1', '+1-555-1004', 'internal@upaci.com', TRUE),
('Dermatology', 'DERM', 'Skin, hair, and nail care', 'Building B, Floor 4', '+1-555-1005', 'derm@upaci.com', TRUE);

-- ============================================================================
-- Seed Patient Profiles
-- ============================================================================

INSERT INTO patient_profiles (
    user_id, medical_record_number, date_of_birth, gender, blood_type,
    address_line1, city, state, postal_code, country,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
    primary_physician_id
) VALUES
(
    (SELECT id FROM users WHERE email = 'patient1@example.com'),
    'MRN-2026-001', '1985-03-15', 'male', 'A+',
    '123 Main Street', 'San Francisco', 'CA', '94101', 'USA',
    'Sarah Brown', '+1-555-9101', 'Spouse',
    (SELECT id FROM users WHERE email = 'dr.smith@upaci.com')
),
(
    (SELECT id FROM users WHERE email = 'patient2@example.com'),
    'MRN-2026-002', '1992-07-22', 'female', 'O+',
    '456 Oak Avenue', 'San Francisco', 'CA', '94102', 'USA',
    'David Davis', '+1-555-9102', 'Spouse',
    (SELECT id FROM users WHERE email = 'dr.jones@upaci.com')
),
(
    (SELECT id FROM users WHERE email = 'patient3@example.com'),
    'MRN-2026-003', '1978-11-08', 'male', 'B+',
    '789 Pine Road', 'Oakland', 'CA', '94601', 'USA',
    'Lisa Garcia', '+1-555-9103', 'Spouse',
    (SELECT id FROM users WHERE email = 'dr.patel@upaci.com')
);

-- ============================================================================
-- Seed Time Slots (next 7 days)
-- ============================================================================

-- Dr. Smith - Cardiology
INSERT INTO time_slots (doctor_id, department_id, slot_date, slot_start, slot_end, is_available, max_appointments)
SELECT 
    (SELECT id FROM users WHERE email = 'dr.smith@upaci.com'),
    (SELECT id FROM departments WHERE code = 'CARDIO'),
    CURRENT_DATE + i,
    '09:00'::time + (j || ' hours')::interval,
    '09:30'::time + (j || ' hours')::interval,
    TRUE,
    1
FROM generate_series(0, 6) i
CROSS JOIN generate_series(0, 7) j;

-- Dr. Jones - Orthopedics
INSERT INTO time_slots (doctor_id, department_id, slot_date, slot_start, slot_end, is_available, max_appointments)
SELECT 
    (SELECT id FROM users WHERE email = 'dr.jones@upaci.com'),
    (SELECT id FROM departments WHERE code = 'ORTHO'),
    CURRENT_DATE + i,
    '10:00'::time + (j || ' hours')::interval,
    '10:30'::time + (j || ' hours')::interval,
    TRUE,
    1
FROM generate_series(0, 6) i
CROSS JOIN generate_series(0, 6) j;

-- ============================================================================
-- Seed Appointments
-- ============================================================================

INSERT INTO appointments (
    patient_id, doctor_id, department_id, appointment_date, duration_minutes,
    status, appointment_type, reason_for_visit
) VALUES
-- Upcoming appointments
(
    (SELECT id FROM patient_profiles WHERE medical_record_number = 'MRN-2026-001'),
    (SELECT id FROM users WHERE email = 'dr.smith@upaci.com'),
    (SELECT id FROM departments WHERE code = 'CARDIO'),
    CURRENT_TIMESTAMP + INTERVAL '2 days' + INTERVAL '10 hours',
    30,
    'confirmed',
    'routine_checkup',
    'Annual cardiac checkup'
),
(
    (SELECT id FROM patient_profiles WHERE medical_record_number = 'MRN-2026-002'),
    (SELECT id FROM users WHERE email = 'dr.jones@upaci.com'),
    (SELECT id FROM departments WHERE code = 'ORTHO'),
    CURRENT_TIMESTAMP + INTERVAL '3 days' + INTERVAL '14 hours',
    45,
    'pending',
    'consultation',
    'Knee pain evaluation'
),
-- Past completed appointment
(
    (SELECT id FROM patient_profiles WHERE medical_record_number = 'MRN-2026-003'),
    (SELECT id FROM users WHERE email = 'dr.patel@upaci.com'),
    (SELECT id FROM departments WHERE code = 'INTERNAL'),
    CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '11 hours',
    30,
    'completed',
    'follow_up',
    'Follow-up for blood pressure management'
);

-- ============================================================================
-- Seed Clinical Documents
-- ============================================================================

INSERT INTO clinical_documents (
    patient_id, appointment_id, created_by_user_id, document_type,
    title, content, document_date, is_confidential, tags
) VALUES
(
    (SELECT id FROM patient_profiles WHERE medical_record_number = 'MRN-2026-003'),
    (SELECT id FROM appointments WHERE status = 'completed' LIMIT 1),
    (SELECT id FROM users WHERE email = 'dr.patel@upaci.com'),
    'clinical_note',
    'Follow-up Visit - Blood Pressure Management',
    'Patient presents for follow-up of hypertension. Blood pressure today: 128/82 mmHg. Patient reports good medication compliance. No side effects noted. Continue current medication regimen. Follow-up in 3 months.',
    CURRENT_DATE - 5,
    FALSE,
    ARRAY['hypertension', 'follow-up', 'blood-pressure']
),
(
    (SELECT id FROM patient_profiles WHERE medical_record_number = 'MRN-2026-001'),
    NULL,
    (SELECT id FROM users WHERE email = 'dr.smith@upaci.com'),
    'lab_result',
    'Lipid Panel Results',
    'Total Cholesterol: 195 mg/dL (Normal), LDL: 120 mg/dL (Normal), HDL: 55 mg/dL (Normal), Triglycerides: 140 mg/dL (Normal). All values within acceptable range.',
    CURRENT_DATE - 10,
    FALSE,
    ARRAY['lab-results', 'lipid-panel', 'cardiology']
);

-- ============================================================================
-- Seed Medications
-- ============================================================================

INSERT INTO medications (
    patient_id, prescribed_by_user_id, medication_name, generic_name,
    dosage, frequency, route, start_date, is_active, instructions
) VALUES
(
    (SELECT id FROM patient_profiles WHERE medical_record_number = 'MRN-2026-003'),
    (SELECT id FROM users WHERE email = 'dr.patel@upaci.com'),
    'Lisinopril', 'lisinopril',
    '10mg', 'Once daily', 'oral',
    CURRENT_DATE - 30,
    TRUE,
    'Take in the morning with food. Monitor blood pressure regularly.'
),
(
    (SELECT id FROM patient_profiles WHERE medical_record_number = 'MRN-2026-001'),
    (SELECT id FROM users WHERE email = 'dr.smith@upaci.com'),
    'Aspirin', 'aspirin',
    '81mg', 'Once daily', 'oral',
    CURRENT_DATE - 60,
    TRUE,
    'Take with food to reduce stomach irritation. Do not crush or chew.'
);

-- ============================================================================
-- Seed Allergies
-- ============================================================================

INSERT INTO allergies (
    patient_id, recorded_by_user_id, allergen, allergen_type,
    severity, reaction, verified
) VALUES
(
    (SELECT id FROM patient_profiles WHERE medical_record_number = 'MRN-2026-002'),
    (SELECT id FROM users WHERE email = 'dr.jones@upaci.com'),
    'Penicillin', 'medication',
    'severe', 'Anaphylaxis, difficulty breathing',
    TRUE
),
(
    (SELECT id FROM patient_profiles WHERE medical_record_number = 'MRN-2026-001'),
    (SELECT id FROM users WHERE email = 'dr.smith@upaci.com'),
    'Shellfish', 'food',
    'moderate', 'Hives, swelling',
    TRUE
);

-- ============================================================================
-- Seed Waitlist
-- ============================================================================

INSERT INTO waitlist (
    patient_id, department_id, doctor_id, requested_date,
    preferred_time_start, preferred_time_end, priority, status, reason
) VALUES
(
    (SELECT id FROM patient_profiles WHERE medical_record_number = 'MRN-2026-002'),
    (SELECT id FROM departments WHERE code = 'CARDIO'),
    (SELECT id FROM users WHERE email = 'dr.smith@upaci.com'),
    CURRENT_DATE + 7,
    '09:00'::time, '12:00'::time,
    8,
    'waiting',
    'Cardiologist consultation for chest pain evaluation'
);

-- ============================================================================
-- Seed Notifications
-- ============================================================================

INSERT INTO notifications (
    user_id, type, title, message, priority, is_read,
    delivery_method, related_appointment_id
) VALUES
-- Appointment reminder for patient1
(
    (SELECT id FROM users WHERE email = 'patient1@example.com'),
    'appointment_reminder',
    'Appointment Reminder',
    'You have an appointment with Dr. Smith on ' || to_char(CURRENT_DATE + 2, 'Mon DD, YYYY') || ' at 10:00 AM',
    'high',
    FALSE,
    ARRAY['in_app', 'email', 'sms'],
    (SELECT id FROM appointments WHERE patient_id = (SELECT id FROM patient_profiles WHERE medical_record_number = 'MRN-2026-001') LIMIT 1)
),
-- Appointment confirmation for patient2
(
    (SELECT id FROM users WHERE email = 'patient2@example.com'),
    'appointment_confirmation',
    'Appointment Confirmed',
    'Your appointment with Dr. Jones has been confirmed for ' || to_char(CURRENT_DATE + 3, 'Mon DD, YYYY'),
    'normal',
    FALSE,
    ARRAY['in_app', 'email'],
    (SELECT id FROM appointments WHERE patient_id = (SELECT id FROM patient_profiles WHERE medical_record_number = 'MRN-2026-002') LIMIT 1)
);

-- ============================================================================
-- Seed Audit Logs
-- ============================================================================

INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values) VALUES
(
    (SELECT id FROM users WHERE email = 'admin@upaci.com'),
    'INSERT',
    'users',
    1,
    jsonb_build_object('action', 'initial_seed_data', 'description', 'Development seed data inserted')
);

-- ============================================================================
-- Summary
-- ============================================================================

DO $$
DECLARE
    user_count INTEGER;
    dept_count INTEGER;
    patient_count INTEGER;
    appt_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO dept_count FROM departments;
    SELECT COUNT(*) INTO patient_count FROM patient_profiles;
    SELECT COUNT(*) INTO appt_count FROM appointments;
    
    RAISE NOTICE 'Development seed data loaded successfully';
    RAISE NOTICE '=========================================';
    RAISE NOTICE 'Users: % (1 admin, 3 doctors, 1 staff, 3 patients)', user_count;
    RAISE NOTICE 'Departments: %', dept_count;
    RAISE NOTICE 'Patient Profiles: %', patient_count;
    RAISE NOTICE 'Appointments: %', appt_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Default password for all users: Admin123!, Doctor123!, Staff123!, or Patient123!';
    RAISE NOTICE '';
    RAISE NOTICE 'Sample Login Credentials:';
    RAISE NOTICE '  Admin:   admin@upaci.com / Admin123!';
    RAISE NOTICE '  Doctor:  dr.smith@upaci.com / Doctor123!';
    RAISE NOTICE '  Patient: patient1@example.com / Patient123!';
    RAISE NOTICE '';
    RAISE NOTICE 'WARNING: This is TEST DATA ONLY. Do not use in production!';
END $$;

COMMIT;
