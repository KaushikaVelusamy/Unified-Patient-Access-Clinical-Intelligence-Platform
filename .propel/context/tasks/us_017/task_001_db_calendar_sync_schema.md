# Task - TASK_001_DB_CALENDAR_SYNC_SCHEMA

## Requirement Reference
- User Story: US_017  
- Story Location: `.propel/context/tasks/us_017/us_017.md`
- Acceptance Criteria:
    - AC1: Store user's connected calendar account (calendar_provider column in users table)
    - AC1: Store OAuth tokens for calendar access
    - AC1: Log sync status (calendar_synced_at timestamp)
- Edge Cases:
    - OAuth token expires: Mark calendar_sync_enabled=false
    - Rate limit tracking: Store last_sync_attempt timestamp

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | No |
| **Figma URL** | N/A |
| **Wireframe Status** | N/A |
| **Wireframe Type** | N/A |
| **Wireframe Path/URL** | N/A |
| **Screen Spec** | N/A |
| **UXR Requirements** | N/A |
| **Design Tokens** | N/A |

> **Note**: Database schema task only

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | N/A | N/A |
| Database | PostgreSQL | 15+ |
| Database | node-postgres (pg) | 8.x |

**Note**: All code and libraries MUST be compatible with versions above.

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

> **Note**: Database schema only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Database schema only

## Task Overview
Extend users/patients table and appointments table to support calendar sync tracking. Add columns to users: calendar_provider (google/outlook/null), calendar_sync_enabled (default false), calendar_access_token (encrypted), calendar_refresh_token (encrypted), calendar_token_expires_at (timestamp), calendar_sync_last_error (text), calendar_connected_at (timestamp). Add to appointments: calendar_event_id (external ID from Google/Outlook), calendar_synced_at (timestamp), calendar_sync_status (pending/synced/failed), calendar_sync_retries (integer, max 2). Create calendar_sync_queue table for rate limiting: id, appointment_id, operation (create/update/delete), payload (JSONB), status (pending/processing/completed/failed), retry_count, scheduled_at, processed_at, error_message. Add indexes for queue processing and sync status lookups.

## Dependent Tasks
- US_007: Users/patients table must exist
- US_007: Appointments table must exist

## Impacted Components
**Modified:**
- None

**New:**
- database/migrations/XXX_add_calendar_sync_to_users.sql (Extend users table)
- database/migrations/XXX_add_calendar_sync_to_appointments.sql (Extend appointments table)
- database/migrations/XXX_create_calendar_sync_queue_table.sql (Queue table for rate limiting)
- database/migrations/XXX_add_calendar_sync_indexes.sql (Performance indexes)

## Implementation Plan
1. **Extend Users Table**: Add calendar provider, OAuth tokens (encrypted), sync settings
2. **Extend Appointments Table**: Add calendar event ID, sync status, sync timestamp
3. **Calendar Sync Queue Table**: For rate limiting with Redis-like behavior in PostgreSQL
4. **Encryption**: Use PostgreSQL pgcrypto extension for token encryption
5. **Indexes**: Add indexes on sync status, queue processing
6. **Constraints**: Add CHECK constraints for valid provider/status values
7. **Triggers**: Auto-update calendar_sync_status based on sync attempts

## Current Project State
```
ASSIGNMENT/
├── database/
│   ├── migrations/ (US_007)
│   │   ├── 001_create_patients_table.sql
│   │   ├── 002_create_appointments_table.sql
│   │   └── ...
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | database/migrations/XXX_add_calendar_sync_to_users.sql | Calendar OAuth and sync columns |
| CREATE | database/migrations/XXX_add_calendar_sync_to_appointments.sql | Calendar event tracking columns |
| CREATE | database/migrations/XXX_create_calendar_sync_queue_table.sql | Queue table for rate limiting |
| CREATE | database/migrations/XXX_add_calendar_sync_indexes.sql | Performance indexes |

> 0 modified files, 4 new files created

## External References
- [PostgreSQL pgcrypto](https://www.postgresql.org/docs/current/pgcrypto.html)
- [OAuth2 Token Storage](https://www.oauth.com/oauth2-servers/access-tokens/access-token-response/)
- [Google Calendar API](https://developers.google.com/calendar/api/v3/reference)
- [Microsoft Graph Calendar](https://learn.microsoft.com/en-us/graph/api/resources/calendar)

## Build Commands
```bash
# Enable pgcrypto extension
psql -U postgres -d clinic_db -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

# Apply migrations in order
cd database

# 1. Add calendar sync to users
psql -U postgres -d clinic_db -f migrations/XXX_add_calendar_sync_to_users.sql

# 2. Add calendar sync to appointments
psql -U postgres -d clinic_db -f migrations/XXX_add_calendar_sync_to_appointments.sql

# 3. Create calendar sync queue
psql -U postgres -d clinic_db -f migrations/XXX_create_calendar_sync_queue_table.sql

# 4. Add indexes
psql -U postgres -d clinic_db -f migrations/XXX_add_calendar_sync_indexes.sql

# Verify users table structure
psql -U postgres -d clinic_db -c "\d patients"

# Expected new columns:
# - calendar_provider (VARCHAR(20))
# - calendar_sync_enabled (BOOLEAN DEFAULT FALSE)
# - calendar_access_token (TEXT) -- encrypted
# - calendar_refresh_token (TEXT) -- encrypted
# - calendar_token_expires_at (TIMESTAMP)
# - calendar_sync_last_error (TEXT)
# - calendar_connected_at (TIMESTAMP)

# Verify appointments table
psql -U postgres -d clinic_db -c "\d appointments"

# Expected new columns:
# - calendar_event_id (VARCHAR(255))
# - calendar_synced_at (TIMESTAMP)
# - calendar_sync_status (VARCHAR(20))
# - calendar_sync_retries (INTEGER DEFAULT 0)

# Verify queue table
psql -U postgres -d clinic_db -c "\d calendar_sync_queue"

# Test token encryption
psql -U postgres -d clinic_db <<EOF
UPDATE patients 
SET calendar_access_token = pgp_sym_encrypt('test_token_123', 'encryption_key')
WHERE id = 1;

SELECT pgp_sym_decrypt(calendar_access_token::bytea, 'encryption_key') AS decrypted_token
FROM patients WHERE id = 1;
EOF
```

## Implementation Validation Strategy
- [ ] pgcrypto extension enabled
- [ ] Users table has calendar_provider column (google/outlook/null)
- [ ] Users table has calendar_sync_enabled column (boolean, default false)
- [ ] Users table has encrypted token columns (calendar_access_token, calendar_refresh_token)
- [ ] Users table has calendar_token_expires_at column (timestamp)
- [ ] Appointments table has calendar_event_id column (external ID storage)
- [ ] Appointments table has calendar_synced_at column (timestamp)
- [ ] Appointments table has calendar_sync_status column (pending/synced/failed)
- [ ] Appointments table has calendar_sync_retries column (integer, default 0)
- [ ] calendar_sync_queue table created with required columns
- [ ] Indexes on calendar_sync_enabled, calendar_sync_status exist
- [ ] Index on queue (status, scheduled_at) for processing
- [ ] CHECK constraints validate provider and status values
- [ ] Token encryption/decryption works correctly

## Implementation Checklist

### Enable Encryption Extension (prerequisite)
- [ ] -- Enable pgcrypto for token encryption
- [ ] CREATE EXTENSION IF NOT EXISTS pgcrypto;

### Extend Users/Patients Table (database/migrations/XXX_add_calendar_sync_to_users.sql)
- [ ] -- Migration: Add calendar sync columns to patients table
- [ ] ALTER TABLE patients ADD COLUMN IF NOT EXISTS calendar_provider VARCHAR(20);
- [ ] ALTER TABLE patients ADD COLUMN IF NOT EXISTS calendar_sync_enabled BOOLEAN DEFAULT FALSE NOT NULL;
- [ ] ALTER TABLE patients ADD COLUMN IF NOT EXISTS calendar_access_token TEXT;
- [ ] ALTER TABLE patients ADD COLUMN IF NOT EXISTS calendar_refresh_token TEXT;
- [ ] ALTER TABLE patients ADD COLUMN IF NOT EXISTS calendar_token_expires_at TIMESTAMP;
- [ ] ALTER TABLE patients ADD COLUMN IF NOT EXISTS calendar_sync_last_error TEXT;
- [ ] ALTER TABLE patients ADD COLUMN IF NOT EXISTS calendar_connected_at TIMESTAMP;
- [ ] COMMENT ON COLUMN patients.calendar_provider IS 'Calendar provider: google, outlook, or null';
- [ ] COMMENT ON COLUMN patients.calendar_sync_enabled IS 'Whether calendar sync is active (false if token expired)';
- [ ] COMMENT ON COLUMN patients.calendar_access_token IS 'Encrypted OAuth access token for calendar API';
- [ ] COMMENT ON COLUMN patients.calendar_refresh_token IS 'Encrypted OAuth refresh token for renewals';
- [ ] COMMENT ON COLUMN patients.calendar_token_expires_at IS 'Access token expiration timestamp';
- [ ] COMMENT ON COLUMN patients.calendar_sync_last_error IS 'Last calendar sync error message';
- [ ] COMMENT ON COLUMN patients.calendar_connected_at IS 'Timestamp when calendar was first connected';
- [ ] -- Add CHECK constraint for valid providers
- [ ] ALTER TABLE patients ADD CONSTRAINT chk_calendar_provider CHECK (calendar_provider IN ('google', 'outlook', NULL));

### Extend Appointments Table (database/migrations/XXX_add_calendar_sync_to_appointments.sql)
- [ ] -- Migration: Add calendar sync tracking to appointments table
- [ ] ALTER TABLE appointments ADD COLUMN IF NOT EXISTS calendar_event_id VARCHAR(255);
- [ ] ALTER TABLE appointments ADD COLUMN IF NOT EXISTS calendar_synced_at TIMESTAMP;
- [ ] ALTER TABLE appointments ADD COLUMN IF NOT EXISTS calendar_sync_status VARCHAR(20) DEFAULT 'pending';
- [ ] ALTER TABLE appointments ADD COLUMN IF NOT EXISTS calendar_sync_retries INTEGER DEFAULT 0 NOT NULL;
- [ ] COMMENT ON COLUMN appointments.calendar_event_id IS 'External calendar event ID from Google/Outlook API';
- [ ] COMMENT ON COLUMN appointments.calendar_synced_at IS 'Timestamp when calendar sync completed';
- [ ] COMMENT ON COLUMN appointments.calendar_sync_status IS 'Sync status: pending, synced, failed';
- [ ] COMMENT ON COLUMN appointments.calendar_sync_retries IS 'Number of sync retry attempts (max 2)';
- [ ] -- Add CHECK constraint for valid sync status
- [ ] ALTER TABLE appointments ADD CONSTRAINT chk_calendar_sync_status CHECK (calendar_sync_status IN ('pending', 'synced', 'failed', NULL));
- [ ] ALTER TABLE appointments ADD CONSTRAINT chk_calendar_sync_retries CHECK (calendar_sync_retries >= 0 AND calendar_sync_retries <= 2);

### Create Calendar Sync Queue Table (database/migrations/XXX_create_calendar_sync_queue_table.sql)
- [ ] -- Migration: Create queue table for calendar sync rate limiting
- [ ] DROP TABLE IF EXISTS calendar_sync_queue CASCADE;
- [ ] CREATE TABLE calendar_sync_queue (
- [ ]   id SERIAL PRIMARY KEY,
- [ ]   appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
- [ ]   operation VARCHAR(20) NOT NULL,
- [ ]   payload JSONB NOT NULL,
- [ ]   status VARCHAR(20) DEFAULT 'pending' NOT NULL,
- [ ]   retry_count INTEGER DEFAULT 0 NOT NULL,
- [ ]   scheduled_at TIMESTAMP DEFAULT NOW() NOT NULL,
- [ ]   processed_at TIMESTAMP,
- [ ]   error_message TEXT,
- [ ]   created_at TIMESTAMP DEFAULT NOW() NOT NULL,
- [ ]   CONSTRAINT chk_queue_operation CHECK (operation IN ('create', 'update', 'delete')),
- [ ]   CONSTRAINT chk_queue_status CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
- [ ]   CONSTRAINT chk_queue_retry_count CHECK (retry_count >= 0 AND retry_count <= 2)
- [ ] );
- [ ] COMMENT ON TABLE calendar_sync_queue IS 'Queue for calendar sync operations to handle rate limiting';
- [ ] COMMENT ON COLUMN calendar_sync_queue.operation IS 'Calendar operation: create, update, or delete';
- [ ] COMMENT ON COLUMN calendar_sync_queue.payload IS 'JSON payload with appointment details for sync';
- [ ] COMMENT ON COLUMN calendar_sync_queue.status IS 'Queue item status: pending, processing, completed, failed';
- [ ] COMMENT ON COLUMN calendar_sync_queue.retry_count IS 'Number of retry attempts (max 2)';
- [ ] COMMENT ON COLUMN calendar_sync_queue.scheduled_at IS 'When to process this queue item (for rate limiting)';

### Add Performance Indexes (database/migrations/XXX_add_calendar_sync_indexes.sql)
- [ ] -- Migration: Add indexes for calendar sync queries
- [ ] CREATE INDEX idx_patients_calendar_sync ON patients(calendar_sync_enabled) WHERE calendar_sync_enabled = TRUE;
- [ ] CREATE INDEX idx_patients_calendar_provider ON patients(calendar_provider) WHERE calendar_provider IS NOT NULL;
- [ ] CREATE INDEX idx_appointments_calendar_status ON appointments(calendar_sync_status) WHERE calendar_sync_status = 'pending';
- [ ] CREATE INDEX idx_appointments_calendar_event ON appointments(calendar_event_id) WHERE calendar_event_id IS NOT NULL;
- [ ] CREATE INDEX idx_calendar_queue_processing ON calendar_sync_queue(status, scheduled_at) WHERE status IN ('pending', 'processing');
- [ ] CREATE INDEX idx_calendar_queue_appointment ON calendar_sync_queue(appointment_id);
- [ ] COMMENT ON INDEX idx_patients_calendar_sync IS 'Fast lookup for patients with calendar sync enabled';
- [ ] COMMENT ON INDEX idx_appointments_calendar_status IS 'Find appointments pending calendar sync';
- [ ] COMMENT ON INDEX idx_calendar_queue_processing IS 'Process queue items in order respecting rate limits';

### Verification Queries
- [ ] -- Verify users/patients table structure
- [ ] SELECT column_name, data_type, column_default, is_nullable
- [ ] FROM information_schema.columns
- [ ] WHERE table_name = 'patients' AND column_name LIKE 'calendar%'
- [ ] ORDER BY ordinal_position;
- [ ] -- Verify appointments table structure
- [ ] SELECT column_name, data_type, column_default
- [ ] FROM information_schema.columns
- [ ] WHERE table_name = 'appointments' AND column_name LIKE 'calendar%'
- [ ] ORDER BY ordinal_position;
- [ ] -- Verify queue table
- [ ] SELECT column_name, data_type FROM information_schema.columns
- [ ] WHERE table_name = 'calendar_sync_queue'
- [ ] ORDER BY ordinal_position;
- [ ] -- Verify indexes
- [ ] SELECT indexname, indexdef FROM pg_indexes
- [ ] WHERE tablename IN ('patients', 'appointments', 'calendar_sync_queue')
- [ ] AND indexname LIKE '%calendar%';
- [ ] -- Test encryption (with sample key)
- [ ] UPDATE patients SET calendar_access_token = pgp_sym_encrypt('sample_token', 'test_key') WHERE id = 1;
- [ ] SELECT pgp_sym_decrypt(calendar_access_token::bytea, 'test_key') FROM patients WHERE id = 1;
- [ ] -- Expected: 'sample_token'
