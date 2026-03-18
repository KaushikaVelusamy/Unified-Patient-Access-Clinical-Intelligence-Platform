# Entity Relationship Diagram (ERD)

Clinical Appointment Platform (UPACI) - Database Schema

## Mermaid ERD

```mermaid
erDiagram
    users ||--o{ patient_profiles : "has"
    users ||--o{ appointments : "doctor"
    users ||--o{ appointments : "cancelled_by"
    users ||--o{ time_slots : "owns"
    users ||--o{ clinical_documents : "creates"
    users ||--o{ medications : "prescribes"
    users ||--o{ allergies : "records"
    users ||--o{ audit_logs : "performs"
    users ||--o{ notifications : "receives"
    
    departments ||--o{ appointments : "hosts"
    departments ||--o{ time_slots : "manages"
    departments ||--o{ waitlist : "manages"
    
    patient_profiles ||--o{ appointments : "books"
    patient_profiles ||--o{ waitlist : "joins"
    patient_profiles ||--o{ clinical_documents : "owns"
    patient_profiles ||--o{ medications : "takes"
    patient_profiles ||--o{ allergies : "has"
    
    appointments ||--o{ clinical_documents : "generates"
    appointments ||--o{ notifications : "triggers"
    appointments ||--o{ waitlist : "fulfills"
    
    clinical_documents ||--o{ medications : "prescribes"
    clinical_documents ||--o{ notifications : "notifies"
    
    users {
        BIGSERIAL id PK
        VARCHAR email UK
        VARCHAR password_hash
        VARCHAR role
        VARCHAR first_name
        VARCHAR last_name
        VARCHAR phone_number
        BOOLEAN is_active
        BOOLEAN is_verified
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }
    
    departments {
        BIGSERIAL id PK
        VARCHAR name
        VARCHAR code UK
        TEXT description
        VARCHAR location
        VARCHAR phone_number
        BOOLEAN is_active
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }
    
    patient_profiles {
        BIGSERIAL id PK
        BIGINT user_id FK UK
        VARCHAR medical_record_number UK
        DATE date_of_birth
        VARCHAR gender
        VARCHAR blood_type
        VARCHAR address_line1
        VARCHAR city
        VARCHAR state
        BIGINT primary_physician_id FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }
    
    appointments {
        BIGSERIAL id PK
        BIGINT patient_id FK
        BIGINT doctor_id FK
        BIGINT department_id FK
        TIMESTAMPTZ appointment_date
        INTEGER duration_minutes
        VARCHAR status
        VARCHAR appointment_type
        TEXT reason_for_visit
        TEXT cancellation_reason
        BIGINT cancelled_by FK
        TIMESTAMPTZ cancelled_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }
    
    time_slots {
        BIGSERIAL id PK
        BIGINT doctor_id FK
        BIGINT department_id FK
        DATE slot_date
        TIME slot_start
        TIME slot_end
        BOOLEAN is_available
        INTEGER max_appointments
        INTEGER booked_count
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }
    
    waitlist {
        BIGSERIAL id PK
        BIGINT patient_id FK
        BIGINT department_id FK
        BIGINT doctor_id FK
        DATE requested_date
        TIME preferred_time_start
        TIME preferred_time_end
        INTEGER priority
        VARCHAR status
        TEXT reason
        BIGINT scheduled_appointment_id FK
        TIMESTAMPTZ expires_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }
    
    clinical_documents {
        BIGSERIAL id PK
        BIGINT patient_id FK
        BIGINT appointment_id FK
        BIGINT created_by_user_id FK
        VARCHAR document_type
        VARCHAR title
        TEXT content
        DATE document_date
        VARCHAR file_url
        BOOLEAN is_confidential
        VARCHAR[] tags
        JSONB metadata
        vector_1536 embedding
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }
    
    medications {
        BIGSERIAL id PK
        BIGINT patient_id FK
        BIGINT prescribed_by_user_id FK
        BIGINT clinical_document_id FK
        VARCHAR medication_name
        VARCHAR dosage
        VARCHAR frequency
        VARCHAR route
        DATE start_date
        DATE end_date
        BOOLEAN is_active
        TEXT instructions
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }
    
    allergies {
        BIGSERIAL id PK
        BIGINT patient_id FK
        BIGINT recorded_by_user_id FK
        VARCHAR allergen
        VARCHAR allergen_type
        VARCHAR severity
        TEXT reaction
        DATE onset_date
        BOOLEAN verified
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }
    
    audit_logs {
        BIGSERIAL id PK
        BIGINT user_id FK
        VARCHAR action
        VARCHAR table_name
        BIGINT record_id
        JSONB old_values
        JSONB new_values
        INET ip_address
        TEXT user_agent
        TIMESTAMPTZ timestamp
    }
    
    notifications {
        BIGSERIAL id PK
        BIGINT user_id FK
        VARCHAR type
        VARCHAR title
        TEXT message
        VARCHAR priority
        BOOLEAN is_read
        TIMESTAMPTZ read_at
        VARCHAR[] delivery_method
        VARCHAR action_url
        BIGINT related_appointment_id FK
        BIGINT related_document_id FK
        TIMESTAMPTZ expires_at
        JSONB metadata
        TIMESTAMPTZ created_at
    }
```

## Table Relationships

### Core Entities

1. **users** (Central entity)
   - One user can have one patient_profile (1:1)
   - One doctor can have many appointments (1:M)
   - One doctor can have many time_slots (1:M)
   - One user can create many clinical_documents (1:M)
   - One user can prescribe many medications (1:M)
   - One user can record many allergies (1:M)

2. **departments**
   - One department can host many appointments (1:M)
   - One department can manage many time_slots (1:M)
   - One department can have many waitlist entries (1:M)

3. **patient_profiles**
   - One patient can book many appointments (1:M)
   - One patient can own many clinical_documents (1:M)
   - One patient can take many medications (1:M)
   - One patient can have many allergies (1:M)

### Appointment System

4. **appointments**
   - Many appointments belong to one patient (M:1)
   - Many appointments belong to one doctor (M:1)
   - Many appointments belong to one department (M:1)
   - One appointment can generate many clinical_documents (1:M)
   - One appointment can trigger many notifications (1:M)

5. **time_slots**
   - Defines doctor availability
   - Many slots belong to one doctor (M:1)
   - Many slots belong to one department (M:1)

6. **waitlist**
   - Manages appointment waiting list
   - Many waitlist entries for one patient (M:1)
   - Links to scheduled appointment when fulfilled (M:1)

### Clinical Data

7. **clinical_documents**
   - Stores medical records with AI embeddings
   - Many documents belong to one patient (M:1)
   - Many documents belong to one appointment (M:1)
   - One document can prescribe many medications (1:M)
   - Uses pgvector for semantic search

8. **medications**
   - Active and historical medication records
   - Many medications for one patient (M:1)
   - Many medications prescribed by one doctor (M:1)
   - Optionally linked to prescription document (M:1)

9. **allergies**
   - Patient allergy records
   - Many allergies for one patient (M:1)
   - Many allergies recorded by one user (M:1)

### System Tables

10. **audit_logs**
    - Comprehensive audit trail
    - Many logs for one user (M:1)
    - Tracks all database operations

11. **notifications**
    - Multi-channel notification system
    - Many notifications for one user (M:1)
    - Can link to appointments or documents

## Cascade Actions

### ON DELETE CASCADE
- `patient_profiles.user_id` → `users.id`: Delete profile when user deleted
- `medications.patient_id` → `patient_profiles.id`: Delete medications when patient deleted
- `allergies.patient_id` → `patient_profiles.id`: Delete allergies when patient deleted
- `notifications.user_id` → `users.id`: Delete notifications when user deleted

### ON DELETE RESTRICT
- `appointments.patient_id` → `patient_profiles.id`: Cannot delete patient with appointments
- `appointments.doctor_id` → `users.id`: Cannot delete doctor with appointments
- `clinical_documents.patient_id` → `patient_profiles.id`: Cannot delete patient with documents

### ON DELETE SET NULL
- `appointments.cancelled_by` → `users.id`: Set NULL when cancelling user deleted
- `clinical_documents.appointment_id` → `appointments.id`: Set NULL when appointment deleted
- `notifications.related_appointment_id` → `appointments.id`: Set NULL when appointment deleted

## Indexes

### B-tree Indexes
- All foreign keys have indexes for join performance
- Timestamp columns indexed for date range queries
- Status/enum columns indexed for filtering
- Composite indexes on frequently queried combinations

### GIN Indexes
- JSONB columns (metadata, audit_logs values)
- Array columns (tags, delivery_method)

### IVFFlat Indexes
- `clinical_documents.embedding` for vector similarity search
- Cosine distance operator (<->)

## Data Integrity

### Primary Keys
- All tables use BIGSERIAL for scalability (supports 9,223,372,036,854,775,807 rows)

### Unique Constraints
- `users.email`: One email per user
- `departments.code`: Unique department codes
- `patient_profiles.user_id`: One profile per user
- `patient_profiles.medical_record_number`: Unique MRN
- `time_slots (doctor_id, slot_date, slot_start)`: No overlapping slots

### Check Constraints
- Role values: 'patient', 'doctor', 'staff', 'admin'
- Status values: Valid enum values per table
- Date validations: appointment_date >= created_at
- Numeric ranges: priority (1-10), duration_minutes (1-480)

### Triggers
- `update_updated_at_column()`: Auto-update updated_at on all tables with that column

---

**ERD Version:** 1.0.0  
**Last Updated:** March 18, 2026  
**Clinical Appointment Platform Team**
