# Epics

The following epics are derived from the epic decomposition and traceability table:

| Epic ID  | Title                                 | Description                                                                 | Mapped Requirements           | Business Value                                      |
|----------|---------------------------------------|-----------------------------------------------------------------------------|-------------------------------|-----------------------------------------------------|
| EP-001   | Patient Appointment Booking           | Enable patients to book, reschedule, and cancel appointments via web UI.     | FR-001, FR-002, FR-003, UC-001| Reduces no-shows, improves patient experience       |
| EP-002   | Patient Intake (AI/Manual)            | Provide AI-assisted and manual intake options, switchable at any time.       | FR-004, UC-002, UC-009        | Flexible, efficient data collection                 |
| EP-003   | Clinical Document Upload & Extraction | Enable upload and extraction of clinical documents to build unified profiles.| FR-006, FR-007, UC-003, UC-010| Saves staff time, improves data accuracy            |
| EP-004   | Medical Coding & Conflict Detection   | Map ICD-10/CPT codes and highlight medication conflicts.                     | FR-008, FR-016, UC-003, UC-004, UC-010| Ensures accurate billing, improves safety |
| EP-005   | Insurance Pre-check                   | Perform insurance pre-check against internal dummy records.                  | FR-009, UC-003                | Reduces claim denials, improves transparency        |
| EP-006   | Staff Walk-in & Queue Management      | Allow staff to manage walk-ins, same-day queues, and mark arrivals.          | FR-005, UC-001, UC-007        | Streamlines operations, reduces wait times          |
| EP-007   | No Show Risk Assessment & Handling    | Perform rule-based no-show risk assessment and allow staff to mark no-shows. | FR-014, FR-017, UC-005, UC-011| Reduces lost revenue, enables intervention          |
| EP-008   | Automated Reminders & Notifications   | Send automated reminders via SMS/Email and support calendar sync.            | FR-003, UC-001                | Reduces no-shows, improves engagement               |
| EP-009   | PDF Appointment Confirmation          | Send appointment details as a PDF in email after booking.                    | FR-011, FR-012, UC-004, UC-007| Improves communication, reduces confusion           |
| EP-010   | Patient Dashboard                     | Provide each patient with a secure dashboard to manage appointments, etc.    | FR-018, UC-012                | Empowers patients, increases engagement             |
| EP-011   | Admin User Management                 | Provide an Admin Operations interface for user management.                   | FR-015, UC-006                | Simplifies administration, supports compliance       |
| EP-012   | Role-Based Access & Audit Logging     | Enforce strict role-based access control and immutable audit logging.        | FR-010, UC-002, UC-008        | Ensures compliance, enhances security               |
| EP-013   | Restrict Patient Self-Check-In        | Prevent patient self-check-in via app, web, or QR code.                      | FR-013, UC-009                | Ensures process control, supports compliance         |

# Dependency Mapping

- See original epic_decomposition.md for process flow and dependencies.
