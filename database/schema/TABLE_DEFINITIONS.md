# Database Table Definitions

Complete specification of all tables in the Clinical Appointment Platform (UPACI) database.

## Table of Contents

- [Core Tables](#core-tables)
  - [users](#users)
  - [departments](#departments)
  - [patient_profiles](#patient_profiles)
  - [audit_logs](#audit_logs)
- [Appointment Tables](#appointment-tables)
  - [appointments](#appointments)
  - [time_slots](#time_slots)
  - [waitlist](#waitlist)
- [Clinical Tables](#clinical-tables)
  - [clinical_documents](#clinical_documents)
  - [medications](#medications)
  - [allergies](#allergies)
- [System Tables](#system-tables)
  - [notifications](#notifications)

---

## Core Tables

### users

**Purpose:** Core user authentication and profile table for all system users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Unique user identifier |
| email | VARCHAR(255) | NOT NULL, UNIQUE | User email address for login |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| role | VARCHAR(20) | NOT NULL, CHECK | User role: 'patient', 'doctor', 'staff', 'admin' |
| first_name | VARCHAR(100) | NOT NULL | User's first name |
| last_name | VARCHAR(100) | NOT NULL | User's last name |
| phone_number | VARCHAR(20) | NULL | Contact phone number |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | Account active status (soft delete) |
| is_verified | BOOLEAN | NOT NULL, DEFAULT FALSE | Email verification status |
| verification_token | VARCHAR(255) | NULL | Email verification token |
| reset_password_token | VARCHAR(255) | NULL | Password reset token |
| reset_password_expires | TIMESTAMPTZ | NULL | Token expiration timestamp |
| last_login_at | TIMESTAMPTZ | NULL | Last successful login timestamp |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp (auto-updated) |

**Indexes:**
- `idx_users_email` (B-tree on email)
- `idx_users_role` (B-tree on role WHERE is_active = TRUE)
- `idx_users_last_login` (B-tree on last_login_at DESC)
- `idx_users_created_at` (B-tree on created_at DESC)

**Triggers:**
- `update_users_updated_at`: Auto-updates updated_at on UPDATE

---

### departments

**Purpose:** Hospital departments and medical specializations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Unique department identifier |
| name | VARCHAR(100) | NOT NULL | Department name |
| code | VARCHAR(20) | NOT NULL, UNIQUE | Short department code (e.g., CARDIO, ORTHO) |
| description | TEXT | NULL | Department description |
| location | VARCHAR(255) | NULL | Physical location in facility |
| phone_number | VARCHAR(20) | NULL | Department phone number |
| email | VARCHAR(255) | NULL | Department email |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | Whether department accepts appointments |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_departments_code` (B-tree on code)
- `idx_departments_active` (B-tree on is_active WHERE is_active = TRUE)

---

### patient_profiles

**Purpose:** Extended patient information and medical records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Unique patient profile identifier |
| user_id | BIGINT | NOT NULL, UNIQUE, FK→users.id | Linked user account |
| medical_record_number | VARCHAR(50) | NOT NULL, UNIQUE | Unique MRN |
| date_of_birth | DATE | NOT NULL | Patient date of birth |
| gender | VARCHAR(20) | CHECK | 'male', 'female', 'other', 'prefer_not_to_say' |
| blood_type | VARCHAR(5) | CHECK | 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-' |
| address_line1 | VARCHAR(255) | NULL | Primary address line |
| address_line2 | VARCHAR(255) | NULL | Secondary address line |
| city | VARCHAR(100) | NULL | City |
| state | VARCHAR(100) | NULL | State/province |
| postal_code | VARCHAR(20) | NULL | Postal/ZIP code |
| country | VARCHAR(100) | NULL | Country |
| emergency_contact_name | VARCHAR(200) | NULL | Emergency contact name |
| emergency_contact_phone | VARCHAR(20) | NULL | Emergency contact phone |
| emergency_contact_relationship | VARCHAR(50) | NULL | Relationship to patient |
| insurance_provider | VARCHAR(200) | NULL | Insurance company name |
| insurance_policy_number | VARCHAR(100) | NULL | Policy number |
| primary_physician_id | BIGINT | FK→users.id | Primary care physician |
| notes | TEXT | NULL | Additional patient notes |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_patient_profiles_user_id` (B-tree on user_id)
- `idx_patient_profiles_mrn` (B-tree on medical_record_number)
- `idx_patient_profiles_primary_physician` (B-tree on primary_physician_id)
- `idx_patient_profiles_dob` (B-tree on date_of_birth)

**Foreign Keys:**
- `fk_patient_profiles_user_id`: ON DELETE CASCADE
- `fk_patient_profiles_primary_physician`: ON DELETE SET NULL

---

## Appointment Tables

### appointments

**Purpose:** Core appointment bookings and scheduling.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Unique appointment identifier |
| patient_id | BIGINT | NOT NULL, FK→patient_profiles.id | Patient booking appointment |
| doctor_id | BIGINT | NOT NULL, FK→users.id | Doctor assigned |
| department_id | BIGINT | NOT NULL, FK→departments.id | Department hosting appointment |
| appointment_date | TIMESTAMPTZ | NOT NULL | Scheduled date and time |
| duration_minutes | INTEGER | NOT NULL, DEFAULT 30, CHECK | Duration (1-480 minutes) |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending', CHECK | 'pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'rescheduled' |
| appointment_type | VARCHAR(50) | NOT NULL, CHECK | 'consultation', 'follow_up', 'emergency', 'routine_checkup', 'diagnostic', 'treatment' |
| reason_for_visit | TEXT | NULL | Patient-provided reason |
| cancellation_reason | TEXT | NULL | Reason if cancelled |
| notes | TEXT | NULL | Additional notes |
| cancelled_at | TIMESTAMPTZ | NULL | Cancellation timestamp |
| cancelled_by | BIGINT | FK→users.id | User who cancelled |
| checked_in_at | TIMESTAMPTZ | NULL | Check-in timestamp |
| completed_at | TIMESTAMPTZ | NULL | Completion timestamp |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Constraints:**
- `chk_appointment_date_future`: appointment_date >= created_at
- `chk_status_cancelled_fields`: If cancelled, must have cancellation_reason, cancelled_at, cancelled_by

**Indexes:**
- `idx_appointments_patient_id`, `idx_appointments_doctor_id`, `idx_appointments_department_id`
- `idx_appointments_date`, `idx_appointments_status`
- `idx_appointments_doctor_date` (composite)
- `idx_appointments_upcoming` (partial: upcoming appointments only)

---

### time_slots

**Purpose:** Doctor availability time slots for scheduling.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Unique slot identifier |
| doctor_id | BIGINT | NOT NULL, FK→users.id | Doctor |
| department_id | BIGINT | NOT NULL, FK→departments.id | Department |
| slot_date | DATE | NOT NULL | Slot date |
| slot_start | TIME | NOT NULL | Start time |
| slot_end | TIME | NOT NULL | End time |
| is_available | BOOLEAN | NOT NULL, DEFAULT TRUE | Availability status |
| max_appointments | INTEGER | NOT NULL, DEFAULT 1, CHECK | Max bookings per slot |
| booked_count | INTEGER | NOT NULL, DEFAULT 0, CHECK | Current bookings |
| notes | TEXT | NULL | Slot notes |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Constraints:**
- `chk_time_slot_valid`: slot_end > slot_start
- `chk_booked_within_max`: booked_count <= max_appointments
- `uq_doctor_slot`: UNIQUE(doctor_id, slot_date, slot_start)

---

## Clinical Tables

### clinical_documents

**Purpose:** Medical documents with AI vector embeddings for semantic search.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Unique document identifier |
| patient_id | BIGINT | NOT NULL, FK→patient_profiles.id | Document owner |
| appointment_id | BIGINT | FK→appointments.id | Associated appointment |
| created_by_user_id | BIGINT | NOT NULL, FK→users.id | Creator (doctor/staff) |
| document_type | VARCHAR(50) | NOT NULL, CHECK | 'clinical_note', 'prescription', 'lab_result', etc. |
| title | VARCHAR(255) | NOT NULL | Document title |
| content | TEXT | NOT NULL | Document content/body |
| document_date | DATE | NOT NULL | Document date |
| file_url | VARCHAR(500) | NULL | Attached file URL |
| file_size_bytes | BIGINT | CHECK | File size if attached |
| mime_type | VARCHAR(100) | NULL | File MIME type |
| is_confidential | BOOLEAN | NOT NULL, DEFAULT FALSE | Extra sensitive flag |
| tags | VARCHAR(100)[] | NULL | Searchable tags array |
| metadata | JSONB | NULL | Structured additional data |
| **embedding** | **vector(1536)** | NULL | **OpenAI ada-002 embedding for semantic search** |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- B-tree indexes on all foreign keys, document_type, document_date
- GIN indexes on tags (array) and metadata (JSONB)
- **IVFFlat index on embedding for vector similarity search**

**Foreign Keys:**
- `fk_clinical_documents_patient_id`: ON DELETE RESTRICT
- `fk_clinical_documents_appointment_id`: ON DELETE SET NULL

---

## System Tables

### notifications

**Purpose:** Multi-channel notification system for alerts and reminders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGSERIAL | PRIMARY KEY | Unique notification identifier |
| user_id | BIGINT | NOT NULL, FK→users.id | Notification recipient |
| type | VARCHAR(50) | NOT NULL, CHECK | 'appointment_reminder', 'test_result_available', etc. |
| title | VARCHAR(255) | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification message body |
| priority | VARCHAR(20) | NOT NULL, DEFAULT 'normal', CHECK | 'low', 'normal', 'high', 'urgent' |
| is_read | BOOLEAN | NOT NULL, DEFAULT FALSE | Read status |
| read_at | TIMESTAMPTZ | NULL | Read timestamp |
| delivery_method | VARCHAR(50)[] | NOT NULL, DEFAULT '{in_app}' | Array: 'in_app', 'email', 'sms', 'push' |
| email_sent | BOOLEAN | NOT NULL, DEFAULT FALSE | Email delivery status |
| email_sent_at | TIMESTAMPTZ | NULL | Email sent timestamp |
| sms_sent | BOOLEAN | NOT NULL, DEFAULT FALSE | SMS delivery status |
| sms_sent_at | TIMESTAMPTZ | NULL | SMS sent timestamp |
| push_sent | BOOLEAN | NOT NULL, DEFAULT FALSE | Push notification status |
| push_sent_at | TIMESTAMPTZ | NULL | Push sent timestamp |
| action_url | VARCHAR(500) | NULL | Action button URL |
| action_label | VARCHAR(100) | NULL | Action button label |
| related_appointment_id | BIGINT | FK→appointments.id | Related appointment |
| related_document_id | BIGINT | FK→clinical_documents.id | Related document |
| expires_at | TIMESTAMPTZ | NULL | Expiration timestamp |
| metadata | JSONB | NULL | Additional structured data |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Record creation timestamp |

**Constraints:**
- `chk_read_timestamp`: If is_read = TRUE, read_at must be NOT NULL

**Indexes:**
- `idx_notifications_user_unread` (partial: unread notifications only)
- B-tree indexes on user_id, type, priority, created_at

---

**Table Definitions Version:** 1.0.0  
**Last Updated:** March 18, 2026  
**Total Tables:** 11  
**Clinical Appointment Platform Team**
