# Task - TASK_006_BE_WAITLIST_ACCEPTANCE_INTEGRATION

## Requirement Reference
- User Story: US_015  
- Story Location: `.propel/context/tasks/us_015/us_015.md`
- Acceptance Criteria:
    - AC1: When patient accepts slot via "Book Now" from notification, system books appointment and updates waitlist status='accepted'
- Edge Cases:
    - Hold expired before booking: Show error "This slot hold has expired"
    - Slot taken by another patient: Show error "Slot no longer available"
    - Booking multiple waitlist slots: Handle gracefully

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

> **Note**: Backend integration logic only

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x |
| Backend | Express | 4.x |
| Backend | TypeScript | 5.3.x |
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

> **Note**: Backend integration only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend integration only

## Task Overview
Enhance appointment booking API (US_013 TASK_002) to handle waitlist-originated bookings. When POST /api/appointments includes waitlist_id query parameter: (1) Validate waitlist entry exists and belongs to patient. (2) Check waitlist status='notified' (patient was notified). (3) Validate hold not expired (slot_hold_expires_at > NOW()). (4) Acquire database lock on waitlist entry (FOR UPDATE). (5) Book appointment using existing booking logic. (6) Update waitlist status='accepted', store booked appointment_id. (7) Log ACCEPT_WAITLIST action to audit log. If hold expired: Return HTTP 410 "This slot hold has expired". If slot taken: Return HTTP 409 "Slot no longer available". Transaction safety: Book appointment + update waitlist atomically. Also handle edge case: If patient manually books different slot while on waitlist, update other waitlist entries to 'cancelled' automatically.

## Dependent Tasks
- US_011 TASK_001: Audit logging service must exist
- US_013 TASK_002: Appointment booking API must exist
- US_015 TASK_001: Waitlist table must exist
- US_015 TASK_002: Waitlist API must exist
- US_015 TASK_004: Notification service must exist

## Impacted Components
**Modified:**
- server/src/services/appointmentBookingService.ts (Add waitlist acceptance logic)
- server/src/controllers/appointmentController.ts (Handle waitlist_id param)

**New:**
- server/src/services/waitlistAcceptanceService.ts (Waitlist acceptance orchestration)
- server/src/middleware/validateWaitlistAcceptance.ts (Validation middleware)

## Implementation Plan
1. **Validation Middleware**: Check waitlist_id provided, verify ownership, status, expiration
2. **Database Lock**: Acquire FOR UPDATE lock on waitlist entry
3. **Hold Expiration Check**: Validate slot_hold_expires_at > NOW()
4. **Slot Availability**: Verify slot still available (not booked by another user)
5. **Transaction Begin**: Start database transaction
6. **Book Appointment**: Call existing booking service
7. **Update Waitlist**: Set status='accepted', appointment_id=booked_id
8. **Cancel Other Waitlists**: If patient has other active waitlist entries, set to 'cancelled'
9. **Audit Log**: Log ACCEPT_WAITLIST action
10. **Transaction Commit**: Commit if all successful, rollback on error
11. **Error Handling**: 410 for expired, 409 for taken, 400 for invalid, 500 for errors

## Current Project State
```
ASSIGNMENT/
├── server/                  # Backend (US_001)
│   ├── src/
│   │   ├── services/
│   │   │   ├── appointmentBookingService.ts (US_013 TASK_002)
│   │   │   ├── waitlistService.ts (US_015 TASK_002)
│   │   │   └── waitlistNotificationService.ts (US_015 TASK_004)
│   │   └── controllers/
│   │       └── appointmentController.ts (US_013 TASK_002)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/waitlistAcceptanceService.ts | Waitlist acceptance orchestration |
| CREATE | server/src/middleware/validateWaitlistAcceptance.ts | Validation middleware |
| MODIFY | server/src/services/appointmentBookingService.ts | Add waitlist acceptance logic |
| MODIFY | server/src/controllers/appointmentController.ts | Handle waitlist_id parameter |

> 2 modified files, 2 new files created

## External References
- [PostgreSQL FOR UPDATE](https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE)
- [Transaction Management](https://node-postgres.com/features/transactions)
- [HTTP Status 410 Gone](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/410)

## Build Commands
```bash
# Start backend server
cd server
npm run dev

# Test waitlist acceptance booking
# 1. Create waitlist entry, trigger notification
# 2. Call booking API with waitlist_id
curl -X POST "http://localhost:3000/api/appointments?waitlist_id=123" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "provider_id": 789,
    "appointment_date": "2026-03-25",
    "start_time": "10:00:00",
    "end_time": "10:30:00",
    "reason": "Follow-up"
  }'

# Expected response (201 Created):
{
  "id": 456,
  "patient_id": 123,
  "provider_id": 789,
  "appointment_date": "2026-03-25",
  "start_time": "10:00:00",
  "end_time": "10:30:00",
  "status": "scheduled",
  "waitlist_accepted": true
}

# Verify waitlist status updated
psql -U postgres -d clinic_db -c "SELECT status, appointment_id FROM waitlist WHERE id = 123;"
# Expected: status='accepted', appointment_id=456

# Test expired hold
# Manually set slot_hold_expires_at to past time
psql -U postgres -d clinic_db -c "UPDATE waitlist SET slot_hold_expires_at = NOW() - INTERVAL '1 minute' WHERE id = 123;"
curl -X POST "http://localhost:3000/api/appointments?waitlist_id=123" ...
# Expected: 410 "This slot hold has expired"

# Test slot taken
# Book slot with different user first
# Then try waitlist acceptance
# Expected: 409 "Slot no longer available"

# Test unauthorized
# Try to accept another user's waitlist
# Expected: 403 Unauthorized

# Verify audit log
psql -U postgres -d clinic_db -c "SELECT * FROM audit_logs WHERE action = 'ACCEPT_WAITLIST' ORDER BY created_at DESC LIMIT 1;"

# Build
npm run build
```

## Implementation Validation Strategy
- [ ] Booking API accepts waitlist_id query parameter
- [ ] Validate waitlist entry exists (404 if not found)
- [ ] Validate patient owns waitlist entry (403 if unauthorized)
- [ ] Validate waitlist status='notified' (400 if not notified)
- [ ] Validate hold not expired: slot_hold_expires_at > NOW() (410 if expired)
- [ ] Database lock: FOR UPDATE on waitlist entry
- [ ] Slot availability check (409 if taken)
- [ ] Transaction: Book appointment + update waitlist atomically
- [ ] Waitlist status updated to 'accepted'
- [ ] appointment_id stored in waitlist record
- [ ] Other patient waitlist entries updated to 'cancelled'
- [ ] Audit log: ACCEPT_WAITLIST action recorded
- [ ] Transaction rollback on any error
- [ ] Appropriate HTTP status codes: 201, 400, 403, 404, 409, 410, 500

## Implementation Checklist

### Validation Middleware (server/src/middleware/validateWaitlistAcceptance.ts)
- [ ] Import: Request, Response, NextFunction, pool (pg)
- [ ] export const validateWaitlistAcceptance = async (req: Request, res: Response, next: NextFunction) => {
- [ ]   const waitlist_id = req.query.waitlist_id;
- [ ]   if (!waitlist_id) {
- [ ]     return next(); // No waitlist, proceed with regular booking
- [ ]   }
- [ ]   const patient_id = req.user.id;
- [ ]   try {
- [ ]     // Check waitlist entry exists and belongs to patient
- [ ]     const waitlistResult = await pool.query(
- [ ]       'SELECT * FROM waitlist WHERE id = $1',
- [ ]       [waitlist_id]
- [ ]     );
- [ ]     if (waitlistResult.rows.length === 0) {
- [ ]       return res.status(404).json({ error: 'Waitlist entry not found', code: 'WAITLIST_NOT_FOUND' });
- [ ]     }
- [ ]     const waitlistEntry = waitlistResult.rows[0];
- [ ]     // Verify ownership
- [ ]     if (waitlistEntry.patient_id !== patient_id) {
- [ ]       return res.status(403).json({ error: 'Unauthorized to accept this waitlist entry', code: 'UNAUTHORIZED' });
- [ ]     }
- [ ]     // Verify status is 'notified'
- [ ]     if (waitlistEntry.status !== 'notified') {
- [ ]       return res.status(400).json({ error: 'Waitlist entry must be in notified status', code: 'INVALID_STATUS', currentStatus: waitlistEntry.status });
- [ ]     }
- [ ]     // Verify hold not expired
- [ ]     const holdExpiresAt = new Date(waitlistEntry.slot_hold_expires_at);
- [ ]     if (holdExpiresAt <= new Date()) {
- [ ]       return res.status(410).json({ error: 'This slot hold has expired. Please join the waitlist again.', code: 'HOLD_EXPIRED' });
- [ ]     }
- [ ]     // Attach waitlist entry to request
- [ ]     req.waitlistEntry = waitlistEntry;
- [ ]     next();
- [ ]   } catch (error) {
- [ ]     console.error('Waitlist acceptance validation error:', error);
- [ ]     res.status(500).json({ error: 'Failed to validate waitlist acceptance' });
- [ ]   }
- [ ] };

### Waitlist Acceptance Service (server/src/services/waitlistAcceptanceService.ts)
- [ ] Import: pool (pg), auditLogger, bookAppointment (from appointmentBookingService)
- [ ] interface AcceptWaitlistData {
- [ ]   waitlist_id: number;
- [ ]   patient_id: number;
- [ ]   provider_id: number;
- [ ]   appointment_date: string;
- [ ]   start_time: string;
- [ ]   end_time: string;
- [ ]   reason?: string;
- [ ] }
- [ ] export const acceptWaitlistSlot = async (data: AcceptWaitlistData) => {
- [ ]   const client = await pool.connect();
- [ ]   try {
- [ ]     await client.query('BEGIN');
- [ ]     // Lock waitlist entry
- [ ]     const waitlistLock = await client.query(
- [ ]       'SELECT * FROM waitlist WHERE id = $1 FOR UPDATE',
- [ ]       [data.waitlist_id]
- [ ]     );
- [ ]     const waitlistEntry = waitlistLock.rows[0];
- [ ]     // Double-check hold not expired (race condition protection)
- [ ]     if (new Date(waitlistEntry.slot_hold_expires_at) <= new Date()) {
- [ ]       throw { status: 410, code: 'HOLD_EXPIRED', message: 'This slot hold has expired' };
- [ ]     }
- [ ]     // Check slot availability (might be taken by someone else)
- [ ]     const slotCheck = await client.query(
- [ ]       'SELECT COUNT(*) FROM appointments WHERE provider_id = $1 AND appointment_date = $2 AND start_time = $3 AND status != $4',
- [ ]       [data.provider_id, data.appointment_date, data.start_time, 'cancelled']
- [ ]     );
- [ ]     if (parseInt(slotCheck.rows[0].count) > 0) {
- [ ]       throw { status: 409, code: 'SLOT_TAKEN', message: 'Slot no longer available' };
- [ ]     }
- [ ]     // Book appointment (reuse existing booking logic)
- [ ]     const appointmentResult = await client.query(
- [ ]       'INSERT INTO appointments (patient_id, provider_id, appointment_date, start_time, end_time, reason, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *',
- [ ]       [data.patient_id, data.provider_id, data.appointment_date, data.start_time, data.end_time, data.reason || '', 'scheduled']
- [ ]     );
- [ ]     const bookedAppointment = appointmentResult.rows[0];
- [ ]     // Update waitlist status to 'accepted'
- [ ]     await client.query(
- [ ]       'UPDATE waitlist SET status = $1, appointment_id = $2, updated_at = NOW() WHERE id = $3',
- [ ]       ['accepted', bookedAppointment.id, data.waitlist_id]
- [ ]     );
- [ ]     // Cancel other active waitlist entries for this patient
- [ ]     await client.query(
- [ ]       'UPDATE waitlist SET status = $1, updated_at = NOW() WHERE patient_id = $2 AND id != $3 AND status IN ($4, $5)',
- [ ]       ['cancelled', data.patient_id, data.waitlist_id, 'waiting', 'notified']
- [ ]     );
- [ ]     // Audit log
- [ ]     await auditLogger.log({
- [ ]       user_id: data.patient_id,
- [ ]       action: 'ACCEPT_WAITLIST',
- [ ]       entity_type: 'waitlist',
- [ ]       entity_id: data.waitlist_id,
- [ ]       changes: {
- [ ]         status: 'accepted',
- [ ]         appointment_id: bookedAppointment.id,
- [ ]         appointment_details: { date: data.appointment_date, start_time: data.start_time }
- [ ]       },
- [ ]       ip_address: 'server-internal',
- [ ]       user_agent: 'waitlist-acceptance-service'
- [ ]     });
- [ ]     await client.query('COMMIT');
- [ ]     return { ...bookedAppointment, waitlist_accepted: true };
- [ ]   } catch (error) {
- [ ]     await client.query('ROLLBACK');
- [ ]     throw error;
- [ ]   } finally {
- [ ]     client.release();
- [ ]   }
- [ ] };

### Update Appointment Controller (server/src/controllers/appointmentController.ts)
- [ ] Import: acceptWaitlistSlot
- [ ] export const createAppointment = async (req: Request, res: Response) => {
- [ ]   try {
- [ ]     const patient_id = req.user.id;
- [ ]     const { provider_id, appointment_date, start_time, end_time, reason } = req.body;
- [ ]     const waitlist_id = req.query.waitlist_id ? parseInt(req.query.waitlist_id as string) : null;
- [ ]     let appointment;
- [ ]     if (waitlist_id) {
- [ ]       // Waitlist acceptance booking
- [ ]       appointment = await acceptWaitlistSlot({
- [ ]         waitlist_id,
- [ ]         patient_id,
- [ ]         provider_id,
- [ ]         appointment_date,
- [ ]         start_time,
- [ ]         end_time,
- [ ]         reason
- [ ]       });
- [ ]     } else {
- [ ]       // Regular booking (existing logic)
- [ ]       appointment = await bookAppointment({
- [ ]         patient_id,
- [ ]         provider_id,
- [ ]         appointment_date,
- [ ]         start_time,
- [ ]         end_time,
- [ ]         reason
- [ ]       });
- [ ]     }
- [ ]     res.status(201).json(appointment);
- [ ]   } catch (error) {
- [ ]     console.error('Create appointment error:', error);
- [ ]     if (error.status === 410) {
- [ ]       return res.status(410).json({ error: error.message, code: error.code });
- [ ]     }
- [ ]     if (error.status === 409) {
- [ ]       return res.status(409).json({ error: error.message, code: error.code });
- [ ]     }
- [ ]     res.status(500).json({ error: 'Failed to create appointment' });
- [ ]   }
- [ ] };

### Update Appointment Routes (server/src/routes/appointmentRoutes.ts)
- [ ] Import: validateWaitlistAcceptance
- [ ] router.post('/', authenticate, validateWaitlistAcceptance, createAppointment);

### Frontend: Update Booking Page (app/src/pages/AppointmentBooking.tsx)
- [ ] Check for query params: ?waitlist_id=X&date=Y&time=Z&auto_fill=true
- [ ] If auto_fill=true, pre-fill form with date, time, provider
- [ ] If waitlist_id provided, include in POST request:
- [ ] const response = await axios.post(`/api/appointments?waitlist_id=${waitlistId}`, appointmentData);
- [ ] Handle 410 error: Show error "This slot hold has expired", redirect to waitlist
- [ ] Handle 409 error: Show error "Slot no longer available", reload slots

### Testing Checklist
- [ ] Test regular booking (no waitlist_id) → Works as before
- [ ] Test waitlist acceptance with valid hold → 201, appointment created, waitlist status='accepted'
- [ ] Test expired hold → 410 error with descriptive message
- [ ] Test slot taken → 409 error with descriptive message
- [ ] Test unauthorized (different patient) → 403 error
- [ ] Test invalid waitlist_id → 404 error
- [ ] Test wrong status (status='waiting') → 400 error
- [ ] Verify other patient waitlist entries cancelled
- [ ] Verify audit log: ACCEPT_WAITLIST entry
- [ ] Verify transaction rollback on error
- [ ] Integration test: Full flow from notification → book now → booking confirmed
- [ ] Test frontend auto-fill: Query params populate form correctly
- [ ] Test frontend error handling: 410 and 409 errors display properly
