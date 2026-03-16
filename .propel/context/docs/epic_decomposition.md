# Epic Decomposition (Process Flow Order)

## EP-001: Patient Appointment Booking
- Description: Enable patients to book, reschedule, and cancel appointments via web UI.
- Mapped Requirements: FR-001, FR-002, FR-003, UC-001
- Business Value: Reduces no-shows, improves patient experience, increases schedule utilization

## EP-002: Patient Intake (AI/Manual)
- Description: Provide AI-assisted and manual intake options, switchable at any time.
- Mapped Requirements: FR-004, UC-002, UC-009
- Business Value: Flexible, efficient data collection, supports all patient types

## EP-003: Clinical Document Upload & Data Extraction
- Description: Enable upload and extraction of clinical documents to build unified patient profiles.
- Mapped Requirements: FR-006, FR-007, UC-003, UC-010
- Business Value: Saves staff time, improves data accuracy, supports clinical decision-making

## EP-004: Medical Coding & Conflict Detection
- Description: Map ICD-10/CPT codes from aggregated data and highlight medication conflicts.
- Mapped Requirements: FR-008, FR-016, UC-003, UC-004, UC-010
- Business Value: Ensures accurate billing, improves patient safety

## EP-005: Insurance Pre-check
- Description: Perform insurance pre-check against internal dummy records.
- Mapped Requirements: FR-009, UC-003
- Business Value: Reduces claim denials, improves patient transparency

## EP-006: Staff Walk-in & Queue Management
- Description: Allow staff to manage walk-ins, same-day queues, and mark arrivals.
- Mapped Requirements: FR-005, UC-001, UC-007
- Business Value: Streamlines clinic operations, reduces wait times

## EP-007: No Show Risk Assessment & Handling
- Description: Perform rule-based no-show risk assessment and allow staff to mark no-shows.
- Mapped Requirements: FR-014, FR-017, UC-005, UC-011
- Business Value: Reduces lost revenue, enables proactive intervention

## EP-008: Automated Reminders & Notifications
- Description: Send automated reminders via SMS/Email and support calendar sync.
- Mapped Requirements: FR-003, UC-001
- Business Value: Reduces no-shows, improves patient engagement

## EP-009: PDF Appointment Confirmation
- Description: Send appointment details as a PDF in email after booking.
- Mapped Requirements: FR-011, FR-012, UC-004, UC-007
- Business Value: Improves communication, reduces confusion

## EP-010: Patient Dashboard
- Description: Provide each patient with a secure dashboard to manage appointments, documents, intake, and notifications.
- Mapped Requirements: FR-018, UC-012
- Business Value: Empowers patients, increases engagement

## EP-011: Admin User Management
- Description: Provide an Admin Operations interface for user management.
- Mapped Requirements: FR-015, UC-006
- Business Value: Simplifies user administration, supports compliance

## EP-012: Role-Based Access & Audit Logging
- Description: Enforce strict role-based access control and immutable audit logging.
- Mapped Requirements: FR-010, UC-002, UC-008
- Business Value: Ensures compliance, enhances security

## EP-013: Restrict Patient Self-Check-In
- Description: Prevent patient self-check-in via app, web, or QR code.
- Mapped Requirements: FR-013, UC-009
- Business Value: Ensures process control, supports compliance

## Epic to Functional Requirement & Use Case Traceability Table

| Epic ID  | Functional Requirements (FR)         | Use Cases (UC)         |
|----------|--------------------------------------|------------------------|
| EP-001   | FR-001, FR-002, FR-003              | UC-001                 |
| EP-002   | FR-004                              | UC-002, UC-009         |
| EP-003   | FR-006, FR-007                      | UC-003, UC-010         |
| EP-004   | FR-008, FR-016                      | UC-003, UC-004, UC-010 |
| EP-005   | FR-009                              | UC-003                 |
| EP-006   | FR-005                              | UC-001, UC-007         |
| EP-007   | FR-014, FR-017                      | UC-005, UC-011         |
| EP-008   | FR-003                              | UC-001                 |
| EP-009   | FR-011, FR-012                      | UC-004, UC-007         |
| EP-010   | FR-018                              | UC-012                 |
| EP-011   | FR-015                              | UC-006                 |
| EP-012   | FR-010                              | UC-002, UC-008         |
| EP-013   | FR-013                              | UC-009                 |

**Note:** All functional requirements and use cases are mapped to at least one epic.
