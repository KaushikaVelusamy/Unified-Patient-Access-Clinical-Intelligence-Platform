# Task - TASK_003_BE_CALENDAR_API_INTEGRATION

## Requirement Reference
- User Story: US_017  
- Story Location: `.propel/context/tasks/us_017/us_017.md`
- Acceptance Criteria:
    - AC1: Call Google Calendar API or Microsoft Graph API based on user's calendar_provider
    - AC1: Create/update/delete calendar events with appointment details
    - AC1: Event title "[Clinic Name] - Appointment with [Provider]", description, start/end time, location, 24-hour reminder
    - AC1: Retries up to 2 times on API failure with exponential backoff (5s, 15s delays)
    - AC1: Log sync status (calendar_synced_at timestamp)
- Edge Cases:
    - OAuth token expires: Detect 401, trigger token refresh, retry operation
    - Rate limit exceeded: Queue in calendar_sync_queue table

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

> **Note**: Backend API service only

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | N/A | N/A |
| Backend | Node.js | 20.x |
| Backend | Express | 4.x |
| Backend | TypeScript | 5.3.x |
| Backend | googleapis | 118.x |
| Backend | @microsoft/microsoft-graph-client | 3.x |
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

> **Note**: Backend API service only - no AI

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | No |
| **Platform Target** | N/A |
| **Min OS Version** | N/A |
| **Mobile Framework** | N/A |

> **Note**: Backend API service only

## Task Overview
Implement calendar event management service using Google Calendar API and Microsoft Graph API. Service functions: (1) `createCalendarEvent(appointmentId)` - Create new calendar event. (2) `updateCalendarEvent(appointmentId)` - Update existing event (for reschedule). (3) `deleteCalendarEvent(appointmentId)` - Delete event (for cancellation). Event structure: summary "[Clinic Name] - Appointment with [Provider]", description (appointment details, preparation instructions), start/end dateTime (ISO 8601 with timezone), location (clinic address), reminders (24 hours before via popup). API integration: For Google, use googleapis calendar.events.insert/patch/delete. For Microsoft, use graph /me/events POST/PATCH/DELETE. Retry logic: Up to 2 retries with exponential backoff (5s, 15s) on network errors. Error handling: 401 → refreshAccessToken and retry, 429 → queue operation, 403/404 → log error and mark sync failed. Update database: Store calendar_event_id from API response, set calendar_synced_at, update calendar_sync_status. Integrate with appointment operations (book, reschedule, cancel) to automatically trigger sync.

## Dependent Tasks
- US_017 TASK_001: Database schema with calendar columns must exist
- US_017 TASK_002: OAuth service with token refresh must exist
- US_013 TASK_002: Appointment booking API must exist
- US_014 TASK_002: Appointment rescheduling API must exist

## Impacted Components
**Modified:**
- server/src/services/appointmentBookingService.ts (Add calendar sync trigger)
- server/src/services/appointmentRescheduleService.ts (US_014, add calendar sync)

**New:**
- server/src/services/calendarSyncService.ts (Main calendar sync logic)
- server/src/services/googleCalendarService.ts (Google Calendar API wrapper)
- server/src/services/microsoftCalendarService.ts (Microsoft Graph API wrapper)
- server/src/utils/calendarEventBuilder.ts (Build event payload)

## Implementation Plan
1. **Calendar Event Builder**: Create standardized event object
2. **Google Calendar Service**: Wrapper for googleapis calendar operations
3. **Microsoft Calendar Service**: Wrapper for Microsoft Graph calendar operations
4. **Calendar Sync Service**: Orchestrator that selects provider and handles retries
5. **Retry Logic**: Exponential backoff (5s, 15s) with max 2 retries
6. **Error Handling**: Token refresh on 401, queue on 429, log on other errors
7. **Database Updates**: Store event ID, update sync status
8. **Integration**: Hook into booking/reschedule/cancel operations
9. **Testing**: Mock API responses for unit tests

## Current Project State
```
ASSIGNMENT/
├── server/                  # Backend (US_001)
│   ├── src/
│   │   ├── services/
│   │   │   ├── appointmentBookingService.ts (US_013 TASK_002)
│   │   │   ├── appointmentRescheduleService.ts (US_014 TASK_002)
│   │   │   └── calendarOAuthService.ts (US_017 TASK_002)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/calendarSyncService.ts | Main calendar sync orchestrator |
| CREATE | server/src/services/googleCalendarService.ts | Google Calendar API wrapper |
| CREATE | server/src/services/microsoftCalendarService.ts | Microsoft Graph API wrapper |
| CREATE | server/src/utils/calendarEventBuilder.ts | Event payload builder |
| MODIFY | server/src/services/appointmentBookingService.ts | Add calendar sync trigger |
| MODIFY | server/src/services/appointmentRescheduleService.ts | Add calendar sync trigger |

> 2 modified files, 4 new files created

## External References
- [Google Calendar Events API](https://developers.google.com/calendar/api/v3/reference/events)
- [Microsoft Graph Calendar API](https://learn.microsoft.com/en-us/graph/api/resources/event)
- [Exponential Backoff](https://en.wikipedia.org/wiki/Exponential_backoff)
- [HTTP 429 Rate Limiting](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)

## Build Commands
```bash
# Dependencies already installed from TASK_002

# Start backend server
cd server
npm run dev

# Test calendar event creation
node -e "
const { createCalendarEvent } = require('./dist/services/calendarSyncService');
createCalendarEvent(123) // appointment_id
  .then(result => console.log('Event created:', result))
  .catch(err => console.error('Creation failed:', err));
"

# Expected output:
# Event created: { eventId: 'abc123xyz', status: 'synced' }

# Verify database
psql -U postgres -d clinic_db -c "SELECT id, calendar_event_id, calendar_synced_at, calendar_sync_status FROM appointments WHERE id = 123;"
# Expected: calendar_event_id populated, calendar_sync_status='synced'

# Test update (reschedule)
node -e "
const { updateCalendarEvent } = require('./dist/services/calendarSyncService');
updateCalendarEvent(123)
  .then(result => console.log('Event updated:', result))
  .catch(err => console.error('Update failed:', err));
"

# Test delete (cancellation)
node -e "
const { deleteCalendarEvent } = require('./dist/services/calendarSyncService');
deleteCalendarEvent(123)
  .then(result => console.log('Event deleted:', result))
  .catch(err => console.error('Deletion failed:', err));
"

# Test token refresh on 401
# Mock 401 error from calendar API
# Expected: refreshAccessToken called, operation retried

# Test rate limit (429)
# Mock 429 error
# Expected: Operation queued in calendar_sync_queue

# Build
npm run build
```

## Implementation Validation Strategy
- [ ] createCalendarEvent creates event in user's calendar
- [ ] Event summary: "[Clinic Name] - Appointment with [Provider]"
- [ ] Event includes: description, start/end time (ISO 8601), location
- [ ] Event has 24-hour reminder (popup notification)
- [ ] calendar_event_id stored in database after creation
- [ ] updateCalendarEvent updates existing event by calendar_event_id
- [ ] deleteCalendarEvent removes event from calendar
- [ ] Retry logic: 2 retries with 5s, 15s backoff
- [ ] 401 error: refreshAccessToken called, operation retried
- [ ] 429 error: Operation queued in calendar_sync_queue
- [ ] calendar_sync_status updated: pending → synced/failed
- [ ] calendar_synced_at timestamp recorded on success
- [ ] Booking service triggers createCalendarEvent
- [ ] Reschedule service triggers updateCalendarEvent
- [ ] Cancel service triggers deleteCalendarEvent

## Implementation Checklist

### Calendar Event Builder (server/src/utils/calendarEventBuilder.ts)
- [ ] Import: formatDate, formatTime, moment-timezone
- [ ] interface AppointmentData {
- [ ]   appointment_date: string;
- [ ]   start_time: string;
- [ ]   end_time: string;
- [ ]   provider_name: string;
- [ ]   provider_specialty?: string;
- [ ]   reason: string;
- [ ]   patient_name: string;
- [ ] }
- [ ] const CLINIC_NAME = process.env.CLINIC_NAME || 'Clinic';
- [ ] const CLINIC_LOCATION = process.env.CLINIC_LOCATION || '123 Main St, City, State 12345';
- [ ] const CLINIC_PHONE = process.env.CLINIC_PHONE_NUMBER || '1-800-CLINIC';
- [ ] const TIMEZONE = process.env.CLINIC_TIMEZONE || 'America/New_York';
- [ ] export const buildGoogleCalendarEvent = (appointment: AppointmentData) => {
- [ ]   const startDateTime = moment.tz(`${appointment.appointment_date} ${appointment.start_time}`, TIMEZONE);
- [ ]   const endDateTime = moment.tz(`${appointment.appointment_date} ${appointment.end_time}`, TIMEZONE);
- [ ]   return {
- [ ]     summary: `${CLINIC_NAME} - Appointment with ${appointment.provider_name}`,
- [ ]     description: `${appointment.reason}\n\nProvider: ${appointment.provider_name}${appointment.provider_specialty ? ` (${appointment.provider_specialty})` : ''}\n\nWhat to bring:\n- Photo ID\n- Insurance card\n- List of current medications\n\nFor questions, call ${CLINIC_PHONE}`,
- [ ]     location: CLINIC_LOCATION,
- [ ]     start: {
- [ ]       dateTime: startDateTime.toISOString(),
- [ ]       timeZone: TIMEZONE
- [ ]     },
- [ ]     end: {
- [ ]       dateTime: endDateTime.toISOString(),
- [ ]       timeZone: TIMEZONE
- [ ]     },
- [ ]     reminders: {
- [ ]       useDefault: false,
- [ ]       overrides: [
- [ ]         { method: 'popup', minutes: 24 * 60 } // 24 hours
- [ ]       ]
- [ ]     }
- [ ]   };
- [ ] };
- [ ] export const buildMicrosoftCalendarEvent = (appointment: AppointmentData) => {
- [ ]   const startDateTime = moment.tz(`${appointment.appointment_date} ${appointment.start_time}`, TIMEZONE);
- [ ]   const endDateTime = moment.tz(`${appointment.appointment_date} ${appointment.end_time}`, TIMEZONE);
- [ ]   return {
- [ ]     subject: `${CLINIC_NAME} - Appointment with ${appointment.provider_name}`,
- [ ]     body: {
- [ ]       contentType: 'text',
- [ ]       content: `${appointment.reason}\n\nProvider: ${appointment.provider_name}${appointment.provider_specialty ? ` (${appointment.provider_specialty})` : ''}\n\nWhat to bring:\n- Photo ID\n- Insurance card\n- List of current medications\n\nFor questions, call ${CLINIC_PHONE}`
- [ ]     },
- [ ]     location: {
- [ ]       displayName: CLINIC_LOCATION
- [ ]     },
- [ ]     start: {
- [ ]       dateTime: startDateTime.toISOString(),
- [ ]       timeZone: TIMEZONE
- [ ]     },
- [ ]     end: {
- [ ]       dateTime: endDateTime.toISOString(),
- [ ]       timeZone: TIMEZONE
- [ ]     },
- [ ]     isReminderOn: true,
- [ ]     reminderMinutesBeforeStart: 24 * 60 // 24 hours
- [ ]   };
- [ ] };

### Google Calendar Service (server/src/services/googleCalendarService.ts)
- [ ] Import: google from 'googleapis', decryptToken, buildGoogleCalendarEvent
- [ ] export const createGoogleEvent = async (accessToken: string, eventData: any) => {
- [ ]   const oauth2Client = new google.auth.OAuth2();
- [ ]   oauth2Client.setCredentials({ access_token: accessToken });
- [ ]   const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
- [ ]   const response = await calendar.events.insert({
- [ ]     calendarId: 'primary',
- [ ]     requestBody: eventData
- [ ]   });
- [ ]   return response.data.id;
- [ ] };
- [ ] export const updateGoogleEvent = async (accessToken: string, eventId: string, eventData: any) => {
- [ ]   const oauth2Client = new google.auth.OAuth2();
- [ ]   oauth2Client.setCredentials({ access_token: accessToken });
- [ ]   const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
- [ ]   const response = await calendar.events.patch({
- [ ]     calendarId: 'primary',
- [ ]     eventId,
- [ ]     requestBody: eventData
- [ ]   });
- [ ]   return response.data.id;
- [ ] };
- [ ] export const deleteGoogleEvent = async (accessToken: string, eventId: string) => {
- [ ]   const oauth2Client = new google.auth.OAuth2();
- [ ]   oauth2Client.setCredentials({ access_token: accessToken });
- [ ]   const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
- [ ]   await calendar.events.delete({
- [ ]     calendarId: 'primary',
- [ ]     eventId
- [ ]   });
- [ ] };

### Microsoft Calendar Service (server/src/services/microsoftCalendarService.ts)
- [ ] Import: Client from '@microsoft/microsoft-graph-client', decryptToken, buildMicrosoftCalendarEvent
- [ ] const getGraphClient = (accessToken: string) => {
- [ ]   return Client.init({
- [ ]     authProvider: (done) => {
- [ ]       done(null, accessToken);
- [ ]     }
- [ ]   });
- [ ] };
- [ ] export const createMicrosoftEvent = async (accessToken: string, eventData: any) => {
- [ ]   const client = getGraphClient(accessToken);
- [ ]   const event = await client.api('/me/events').post(eventData);
- [ ]   return event.id;
- [ ] };
- [ ] export const updateMicrosoftEvent = async (accessToken: string, eventId: string, eventData: any) => {
- [ ]   const client = getGraphClient(accessToken);
- [ ]   const event = await client.api(`/me/events/${eventId}`).patch(eventData);
- [ ]   return event.id;
- [ ] };
- [ ] export const deleteMicrosoftEvent = async (accessToken: string, eventId: string) => {
- [ ]   const client = getGraphClient(accessToken);
- [ ]   await client.api(`/me/events/${eventId}`).delete();
- [ ] };

### Calendar Sync Service (server/src/services/calendarSync Service.ts)
- [ ] Import: pool (pg), decryptToken, refreshAccessToken, createGoogleEvent, updateGoogleEvent, deleteGoogleEvent, createMicrosoftEvent, updateMicrosoftEvent, deleteMicrosoftEvent, buildGoogleCalendarEvent, buildMicrosoftCalendarEvent
- [ ] const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
- [ ] const executeWithRetry = async (operation: () => Promise<any>, retries: number = 2, attempt: number = 1): Promise<any> => {
- [ ]   try {
- [ ]     return await operation();
- [ ]   } catch (error) {
- [ ]     if (attempt > retries) {
- [ ]       throw error;
- [ ]     }
- [ ]     const backoffMs = attempt === 1 ? 5000 : 15000; // 5s, 15s
- [ ]     console.log(`Retry attempt ${attempt + 1} after ${backoffMs / 1000}s...`);
- [ ]     await sleep(backoffMs);
- [ ]     return executeWithRetry(operation, retries, attempt + 1);
- [ ]   }
- [ ] };
- [ ] export const createCalendarEvent = async (appointmentId: number) => {
- [ ]   try {
- [ ]     // Get appointment and patient details
- [ ]     const result = await pool.query(
- [ ]       'SELECT a.*, p.calendar_provider, p.calendar_access_token, p.calendar_sync_enabled, p.first_name, p.last_name, pr.name AS provider_name, pr.specialty AS provider_specialty FROM appointments a JOIN patients p ON a.patient_id = p.id JOIN providers pr ON a.provider_id = pr.id WHERE a.id = $1',
- [ ]       [appointmentId]
- [ ]     );
- [ ]     if (result.rows.length === 0) {
- [ ]       throw new Error('Appointment not found');
- [ ]     }
- [ ]     const appointment = result.rows[0];
- [ ]     if (!appointment.calendar_sync_enabled || !appointment.calendar_access_token) {
- [ ]       console.log(`Calendar sync not enabled for appointment ${appointmentId}`);
- [ ]       return { skipped: true };
- [ ]     }
- [ ]     const accessToken = await decryptToken(appointment.calendar_access_token);
- [ ]     const eventData = appointment.calendar_provider === 'google'
- [ ]       ? buildGoogleCalendarEvent(appointment)
- [ ]       : buildMicrosoftCalendarEvent(appointment);
- [ ]     // Execute with retry
- [ ]     const eventId = await executeWithRetry(async () => {
- [ ]       if (appointment.calendar_provider === 'google') {
- [ ]         return await createGoogleEvent(accessToken, eventData);
- [ ]       } else {
- [ ]         return await createMicrosoftEvent(accessToken, eventData);
- [ ]       }
- [ ]     });
- [ ]     // Update database
- [ ]     await pool.query(
- [ ]       'UPDATE appointments SET calendar_event_id = $1, calendar_synced_at = NOW(), calendar_sync_status = $2 WHERE id = $3',
- [ ]       [eventId, 'synced', appointmentId]
- [ ]     );
- [ ]     return { eventId, status: 'synced' };
- [ ]   } catch (error) {
- [ ]     console.error(`Calendar sync error for appointment ${appointmentId}:`, error);
- [ ]     // Handle 401 (token expired)
- [ ]     if (error.response?.status === 401 || error.statusCode === 401) {
- [ ]       console.log('Token expired, attempting refresh...');
- [ ]       try {
- [ ]         const newAccessToken = await refreshAccessToken(appointment.patient_id);
- [ ]         // Retry operation with new token
- [ ]         return createCalendarEvent(appointmentId);
- [ ]       } catch (refreshError) {
- [ ]         // Refresh failed, disable sync
- [ ]         await pool.query('UPDATE patients SET calendar_sync_enabled = FALSE, calendar_sync_last_error = $1 WHERE id = $2', ['Token refresh failed', appointment.patient_id]);
- [ ]         throw refreshError;
- [ ]       }
- [ ]     }
- [ ]     // Handle 429 (rate limit) - queue operation
- [ ]     if (error.response?.status === 429 || error.statusCode === 429) {
- [ ]       await pool.query(
- [ ]         'INSERT INTO calendar_sync_queue (appointment_id, operation, payload, status) VALUES ($1, $2, $3, $4)',
- [ ]         [appointmentId, 'create', JSON.stringify({...appointment}), 'pending']
- [ ]       );
- [ ]       return { queued: true };
- [ ]     }
- [ ]     // Update sync status to failed
- [ ]     await pool.query(
- [ ]       'UPDATE appointments SET calendar_sync_status = $1, calendar_sync_retries = calendar_sync_retries + 1 WHERE id = $2',
- [ ]       ['failed', appointmentId]
- [ ]     );
- [ ]     throw error;
- [ ]   }
- [ ] };
- [ ] export const updateCalendarEvent = async (appointmentId: number) => {
- [ ]   // Similar to createCalendarEvent but calls updateGoogleEvent/updateMicrosoftEvent
- [ ]   // Using existing calendar_event_id from database
- [ ] };
- [ ] export const deleteCalendarEvent = async (appointmentId: number) => {
- [ ]   // Similar to createCalendarEvent but calls deleteGoogleEvent/deleteMicrosoftEvent
- [ ] };

### Update Booking Service (server/src/services/appointmentBookingService.ts)
- [ ] Import: createCalendarEvent
- [ ] // After successful appointment booking
- [ ] setImmediate(async () => {
- [ ]   try {
- [ ]     await createCalendarEvent(bookedAppointment.id);
- [ ]   } catch (error) {
- [ ]     console.error('Calendar sync failed:', error);
- [ ]     // Non-blocking - appointment still booked
- [ ]   }
- [ ] });

### Update Reschedule Service (server/src/services/appointmentRescheduleService.ts)
- [ ] Import: updateCalendarEvent
- [ ] // After successful reschedule
- [ ] setImmediate(async () => {
- [ ]   try {
- [ ]     await updateCalendarEvent(appointmentId);
- [ ]   } catch (error) {
- [ ]     console.error('Calendar sync failed:', error);
- [ ]   }
- [ ] });

### Testing Checklist
- [ ] Test createCalendarEvent with Google Calendar
- [ ] Verify event created in Google Calendar with correct details
- [ ] Test createCalendarEvent with Microsoft Outlook
- [ ] Verify event created in Outlook with correct details
- [ ] Test updateCalendarEvent (reschedule scenario)
- [ ] Verify event updated in calendar
- [ ] Test deleteCalendarEvent (cancellation scenario)
- [ ] Verify event removed from calendar
- [ ] Test retry logic: Mock network error, verify 2 retries with backoff
- [ ] Test 401 handling: Mock expired token, verify refreshAccessToken called
- [ ] Test 429 handling: Mock rate limit, verify operation queued
- [ ] Verify database updates: calendar_event_id, calendar_synced_at, calendar_sync_status
- [ ] Integration test: Book appointment → Event created in calendar
- [ ] Integration test: Reschedule → Event updated in calendar
- [ ] Integration test: Cancel → Event deleted from calendar
