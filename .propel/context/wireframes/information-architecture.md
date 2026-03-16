---
title: Information Architecture — Unified Patient Access & Clinical Intelligence Platform
source: .propel/context/docs/figma_spec.md
date: 2026-03-16
---

# Information Architecture — Unified Patient Access & Clinical Intelligence Platform

## 1. Wireframe Specification

**Fidelity Level**: High
**Screen Type**: Web
**Viewport**: 1440 × 900 px

## 2. System Overview

The Unified Patient Access & Clinical Intelligence Platform is a HIPAA-compliant healthcare application that bridges patient appointment booking and clinical data management. It serves three primary user roles — **Patient**, **Staff** (front desk / call center), and **Admin** — and delivers smart scheduling, clinical document intelligence, and trust-first AI intake capabilities.

## 3. Wireframe References

### Generated Wireframes

**HTML Wireframes**:

| Screen / Feature | File Path | Description | Fidelity | Date Created |
|---|---|---|---|---|
| Admin Login | [./Hi-Fi/wireframe-SCR-001-admin-login.html](./Hi-Fi/wireframe-SCR-001-admin-login.html) | Admin authentication screen | High | 2026-03-16 |
| Staff Login | [./Hi-Fi/wireframe-SCR-002-staff-login.html](./Hi-Fi/wireframe-SCR-002-staff-login.html) | Staff authentication screen | High | 2026-03-16 |
| Patient Login | [./Hi-Fi/wireframe-SCR-003-patient-login.html](./Hi-Fi/wireframe-SCR-003-patient-login.html) | Patient authentication screen | High | 2026-03-16 |
| Admin Dashboard | [./Hi-Fi/wireframe-SCR-004-admin-dashboard.html](./Hi-Fi/wireframe-SCR-004-admin-dashboard.html) | Admin overview with user stats and audit summary | High | 2026-03-16 |
| Staff Dashboard | [./Hi-Fi/wireframe-SCR-005-staff-dashboard.html](./Hi-Fi/wireframe-SCR-005-staff-dashboard.html) | Staff overview with queue, appointments, and alerts | High | 2026-03-16 |
| Patient Dashboard | [./Hi-Fi/wireframe-SCR-006-patient-dashboard.html](./Hi-Fi/wireframe-SCR-006-patient-dashboard.html) | Patient landing with appointments, documents, intake | High | 2026-03-16 |
| Book Appointment | [./Hi-Fi/wireframe-SCR-007-book-appointment.html](./Hi-Fi/wireframe-SCR-007-book-appointment.html) | Multi-step appointment booking form | High | 2026-03-16 |
| Reschedule Appointment | [./Hi-Fi/wireframe-SCR-008-reschedule-appointment.html](./Hi-Fi/wireframe-SCR-008-reschedule-appointment.html) | Slot picker for rescheduling | High | 2026-03-16 |
| Cancel Appointment | [./Hi-Fi/wireframe-SCR-009-cancel-appointment.html](./Hi-Fi/wireframe-SCR-009-cancel-appointment.html) | Cancellation confirmation dialog | High | 2026-03-16 |
| Appointment Details | [./Hi-Fi/wireframe-SCR-010-appointment-details.html](./Hi-Fi/wireframe-SCR-010-appointment-details.html) | Full appointment information view | High | 2026-03-16 |
| Waitlist Management | [./Hi-Fi/wireframe-SCR-011-waitlist-management.html](./Hi-Fi/wireframe-SCR-011-waitlist-management.html) | Waitlist queue management | High | 2026-03-16 |
| Slot Swap | [./Hi-Fi/wireframe-SCR-012-slot-swap.html](./Hi-Fi/wireframe-SCR-012-slot-swap.html) | Dynamic preferred slot swap | High | 2026-03-16 |
| Automated Reminders | [./Hi-Fi/wireframe-SCR-013-automated-reminders.html](./Hi-Fi/wireframe-SCR-013-automated-reminders.html) | Reminder configuration and history | High | 2026-03-16 |
| Calendar Sync | [./Hi-Fi/wireframe-SCR-014-calendar-sync.html](./Hi-Fi/wireframe-SCR-014-calendar-sync.html) | Google/Outlook calendar integration | High | 2026-03-16 |
| Email/SMS Confirmation | [./Hi-Fi/wireframe-SCR-015-email-sms-confirmation.html](./Hi-Fi/wireframe-SCR-015-email-sms-confirmation.html) | Notification log and templates | High | 2026-03-16 |
| Upload Clinical Documents | [./Hi-Fi/wireframe-SCR-016-upload-documents.html](./Hi-Fi/wireframe-SCR-016-upload-documents.html) | Document upload with drag-and-drop | High | 2026-03-16 |
| View Uploaded Documents | [./Hi-Fi/wireframe-SCR-017-view-documents.html](./Hi-Fi/wireframe-SCR-017-view-documents.html) | Document gallery and profile view | High | 2026-03-16 |
| AI Conversational Intake | [./Hi-Fi/wireframe-SCR-018-ai-intake.html](./Hi-Fi/wireframe-SCR-018-ai-intake.html) | AI chat-based patient intake | High | 2026-03-16 |
| Manual Intake Form | [./Hi-Fi/wireframe-SCR-019-manual-intake.html](./Hi-Fi/wireframe-SCR-019-manual-intake.html) | Traditional form-based intake | High | 2026-03-16 |
| Create User | [./Hi-Fi/wireframe-SCR-020-create-user.html](./Hi-Fi/wireframe-SCR-020-create-user.html) | Admin user creation form | High | 2026-03-16 |
| Update User | [./Hi-Fi/wireframe-SCR-021-update-user.html](./Hi-Fi/wireframe-SCR-021-update-user.html) | Admin user edit form | High | 2026-03-16 |
| Deactivate User | [./Hi-Fi/wireframe-SCR-022-deactivate-user.html](./Hi-Fi/wireframe-SCR-022-deactivate-user.html) | User deactivation confirmation | High | 2026-03-16 |
| Assign Roles | [./Hi-Fi/wireframe-SCR-023-assign-roles.html](./Hi-Fi/wireframe-SCR-023-assign-roles.html) | Role assignment interface | High | 2026-03-16 |
| Audit Log | [./Hi-Fi/wireframe-SCR-024-audit-log.html](./Hi-Fi/wireframe-SCR-024-audit-log.html) | Immutable audit trail viewer | High | 2026-03-16 |
| Walk-in Queue | [./Hi-Fi/wireframe-SCR-025-walkin-queue.html](./Hi-Fi/wireframe-SCR-025-walkin-queue.html) | Same-day walk-in queue management | High | 2026-03-16 |
| Mark Arrival | [./Hi-Fi/wireframe-SCR-026-mark-arrival.html](./Hi-Fi/wireframe-SCR-026-mark-arrival.html) | Patient arrival confirmation | High | 2026-03-16 |
| Mark No Show | [./Hi-Fi/wireframe-SCR-027-mark-no-show.html](./Hi-Fi/wireframe-SCR-027-mark-no-show.html) | No-show marking with audit log | High | 2026-03-16 |
| High-Risk / No-Show Alerts | [./Hi-Fi/wireframe-SCR-028-noshow-alerts.html](./Hi-Fi/wireframe-SCR-028-noshow-alerts.html) | Risk assessment alert dashboard | High | 2026-03-16 |
| Medication Conflict Alerts | [./Hi-Fi/wireframe-SCR-029-medication-conflicts.html](./Hi-Fi/wireframe-SCR-029-medication-conflicts.html) | Medication conflict flagging | High | 2026-03-16 |
| Medical Coding | [./Hi-Fi/wireframe-SCR-030-medical-coding.html](./Hi-Fi/wireframe-SCR-030-medical-coding.html) | ICD-10 / CPT code generation | High | 2026-03-16 |
| Insurance Pre-check | [./Hi-Fi/wireframe-SCR-031-insurance-precheck.html](./Hi-Fi/wireframe-SCR-031-insurance-precheck.html) | Insurance verification against dummy records | High | 2026-03-16 |

### Component Inventory

**Reference**: See [Component Inventory](./component-inventory.md) for detailed component documentation including:

- Complete component specifications
- Component states and variants
- Responsive behavior details
- Reusability analysis
- Implementation priorities

## 4. User Personas & Flows

### Persona 1: Patient

- **Role**: Patient (tech-savvy and non-tech users, various age groups)
- **Goals**: Book appointments easily, upload clinical documents, complete intake, receive reminders
- **Key Screens**: SCR-003, SCR-006, SCR-007, SCR-008, SCR-009, SCR-010, SCR-016, SCR-017, SCR-018, SCR-019, SCR-031
- **Primary Flow**: Patient Login → Patient Dashboard → Book Appointment → Insurance Pre-check → Appointment Details → Email Confirmation
- **Decision Points**: AI vs Manual Intake; Reschedule vs Cancel appointment

### Persona 2: Staff (Front Desk / Call Center)

- **Role**: Staff member managing bookings, walk-ins, queues, and clinical review
- **Goals**: Efficiently manage queues, resolve conflicts, mark arrivals, review clinical data
- **Key Screens**: SCR-002, SCR-005, SCR-007, SCR-010, SCR-011, SCR-012, SCR-025, SCR-026, SCR-027, SCR-028, SCR-029, SCR-030
- **Primary Flow**: Staff Login → Staff Dashboard → Walk-in Queue → Mark Arrival / Mark No Show → Alerts
- **Decision Points**: Walk-in vs Scheduled; Medication conflict resolution; No-show risk flagging

### Persona 3: Admin

- **Role**: IT or operations manager for user management and access control
- **Goals**: Manage users, assign roles, ensure compliance, review audit logs
- **Key Screens**: SCR-001, SCR-004, SCR-020, SCR-021, SCR-022, SCR-023, SCR-024
- **Primary Flow**: Admin Login → Admin Dashboard → Create/Update User → Assign Roles → Audit Log
- **Decision Points**: Activate vs Deactivate user; Role assignment

### User Flow Diagrams

- **FL-001**: Patient Appointment Booking — SCR-003 → SCR-006 → SCR-007 → SCR-031 → SCR-010 → SCR-015
- **FL-002**: Patient Intake — SCR-006 → SCR-018 / SCR-019
- **FL-003**: Staff Walk-in Management — SCR-002 → SCR-005 → SCR-025 → SCR-026 / SCR-027 → SCR-028
- **FL-004**: Admin User Management — SCR-001 → SCR-004 → SCR-020 → SCR-023 → SCR-024
- **FL-005**: Clinical Document Flow — SCR-006 → SCR-016 → SCR-017 → SCR-030 → SCR-029
- **FL-006**: Appointment Reschedule/Cancel — SCR-006 → SCR-010 → SCR-008 / SCR-009
- **FL-007**: Insurance Pre-check — SCR-007 → SCR-031 → SCR-010

## 5. Screen Hierarchy

### Level 1: Authentication

- **SCR-001 Admin Login** (P0 — Critical) — [wireframe-SCR-001-admin-login.html](./Hi-Fi/wireframe-SCR-001-admin-login.html)
  - Description: Admin credential entry with role-based routing
  - User Entry Point: Yes
  - Key Components: Login Form, Logo, Error Alert

- **SCR-002 Staff Login** (P0 — Critical) — [wireframe-SCR-002-staff-login.html](./Hi-Fi/wireframe-SCR-002-staff-login.html)
  - Description: Staff credential entry
  - User Entry Point: Yes
  - Key Components: Login Form, Logo, Error Alert

- **SCR-003 Patient Login** (P0 — Critical) — [wireframe-SCR-003-patient-login.html](./Hi-Fi/wireframe-SCR-003-patient-login.html)
  - Description: Patient credential entry
  - User Entry Point: Yes
  - Key Components: Login Form, Logo, Error Alert

### Level 1: Dashboards

- **SCR-004 Admin Dashboard** (P0 — Critical) — [wireframe-SCR-004-admin-dashboard.html](./Hi-Fi/wireframe-SCR-004-admin-dashboard.html)
  - Description: Overview stats, user management shortcuts, recent audit activity
  - Parent Screen: SCR-001
  - Key Components: Stat Cards, Data Table, Sidebar Nav, Quick Actions

- **SCR-005 Staff Dashboard** (P0 — Critical) — [wireframe-SCR-005-staff-dashboard.html](./Hi-Fi/wireframe-SCR-005-staff-dashboard.html)
  - Description: Today's queue, upcoming appointments, alerts
  - Parent Screen: SCR-002
  - Key Components: Stat Cards, Queue Table, Alert Cards, Sidebar Nav

- **SCR-006 Patient Dashboard** (P0 — Critical) — [wireframe-SCR-006-patient-dashboard.html](./Hi-Fi/wireframe-SCR-006-patient-dashboard.html)
  - Description: Upcoming appointments, documents, intake status, notifications
  - Parent Screen: SCR-003
  - Key Components: Appointment Cards, Document List, Intake CTA, Notification Feed

### Level 2: Appointment Management

- **SCR-007 Book Appointment** (P0 — Critical) — [wireframe-SCR-007-book-appointment.html](./Hi-Fi/wireframe-SCR-007-book-appointment.html)
  - Description: Multi-step booking with provider selection, date/time, and insurance pre-check
  - Parent Screen: SCR-006
  - Key Components: Step Indicator, Date Picker, Time Slots, Form Inputs, Buttons

- **SCR-008 Reschedule Appointment** (P1 — High) — [wireframe-SCR-008-reschedule-appointment.html](./Hi-Fi/wireframe-SCR-008-reschedule-appointment.html)
  - Description: Date/time re-selection for existing appointment
  - Parent Screen: SCR-010
  - Key Components: Appointment Summary Card, Date Picker, Time Slots

- **SCR-009 Cancel Appointment** (P1 — High) — [wireframe-SCR-009-cancel-appointment.html](./Hi-Fi/wireframe-SCR-009-cancel-appointment.html)
  - Description: Cancellation reason form with confirmation dialog
  - Parent Screen: SCR-010
  - Key Components: Confirmation Modal, Reason Select, Buttons

- **SCR-010 Appointment Details** (P0 — Critical) — [wireframe-SCR-010-appointment-details.html](./Hi-Fi/wireframe-SCR-010-appointment-details.html)
  - Description: Full appointment summary, actions (reschedule/cancel), status badges
  - Parent Screen: SCR-006
  - Key Components: Detail Card, Status Badge, Action Buttons, Timeline

- **SCR-011 Waitlist Management** (P1 — High) — [wireframe-SCR-011-waitlist-management.html](./Hi-Fi/wireframe-SCR-011-waitlist-management.html)
  - Description: Waitlist queue with position, priority, and notification status
  - Parent Screen: SCR-005 / SCR-006
  - Key Components: Data Table, Badge, Filter Bar

- **SCR-012 Slot Swap** (P2 — Medium) — [wireframe-SCR-012-slot-swap.html](./Hi-Fi/wireframe-SCR-012-slot-swap.html)
  - Description: Dynamic preferred slot swap between patients
  - Parent Screen: SCR-010
  - Key Components: Swap Interface, Slot Cards, Confirm Button

### Level 2: Notifications

- **SCR-013 Automated Reminders** (P1 — High) — [wireframe-SCR-013-automated-reminders.html](./Hi-Fi/wireframe-SCR-013-automated-reminders.html)
  - Description: Reminder template configuration and delivery history
  - Parent Screen: SCR-005 / SCR-006
  - Key Components: Template Editor, Delivery Log Table, Toggle Switches

- **SCR-014 Calendar Sync** (P1 — High) — [wireframe-SCR-014-calendar-sync.html](./Hi-Fi/wireframe-SCR-014-calendar-sync.html)
  - Description: Google/Outlook calendar connection and sync settings
  - Parent Screen: SCR-006
  - Key Components: Provider Cards, Toggle, Sync Status Badge

- **SCR-015 Email/SMS Confirmation** (P1 — High) — [wireframe-SCR-015-email-sms-confirmation.html](./Hi-Fi/wireframe-SCR-015-email-sms-confirmation.html)
  - Description: Notification delivery log and PDF confirmation view
  - Parent Screen: SCR-010
  - Key Components: Log Table, Preview Panel, Badge

### Level 2: Document Management

- **SCR-016 Upload Clinical Documents** (P1 — High) — [wireframe-SCR-016-upload-documents.html](./Hi-Fi/wireframe-SCR-016-upload-documents.html)
  - Description: Drag-and-drop document upload with extraction status
  - Parent Screen: SCR-006
  - Key Components: Drop Zone, File List, Progress Bar, Alert

- **SCR-017 View Uploaded Documents** (P1 — High) — [wireframe-SCR-017-view-documents.html](./Hi-Fi/wireframe-SCR-017-view-documents.html)
  - Description: Unified patient profile built from extracted documents
  - Parent Screen: SCR-006 / SCR-016
  - Key Components: Document Gallery, Profile Cards, Tabs, Search

### Level 2: Intake

- **SCR-018 AI Conversational Intake** (P1 — High) — [wireframe-SCR-018-ai-intake.html](./Hi-Fi/wireframe-SCR-018-ai-intake.html)
  - Description: AI chat-based intake with switchable manual fallback
  - Parent Screen: SCR-006
  - Key Components: Chat UI, Message Bubbles, Input Bar, Switch Toggle

- **SCR-019 Manual Intake Form** (P1 — High) — [wireframe-SCR-019-manual-intake.html](./Hi-Fi/wireframe-SCR-019-manual-intake.html)
  - Description: Traditional multi-section form intake
  - Parent Screen: SCR-006
  - Key Components: Form Sections, Inputs, Progress Indicator, Submit Button

### Level 2: User Management (Admin)

- **SCR-020 Create User** (P0 — Critical) — [wireframe-SCR-020-create-user.html](./Hi-Fi/wireframe-SCR-020-create-user.html)
  - Description: New user registration form
  - Parent Screen: SCR-004
  - Key Components: Form Inputs, Role Select, Submit Button

- **SCR-021 Update User** (P1 — High) — [wireframe-SCR-021-update-user.html](./Hi-Fi/wireframe-SCR-021-update-user.html)
  - Description: Edit existing user details
  - Parent Screen: SCR-004
  - Key Components: Pre-filled Form, Save Button, Avatar

- **SCR-022 Deactivate User** (P1 — High) — [wireframe-SCR-022-deactivate-user.html](./Hi-Fi/wireframe-SCR-022-deactivate-user.html)
  - Description: Deactivation confirmation with reason
  - Parent Screen: SCR-004 / SCR-021
  - Key Components: Confirmation Modal, Reason Input, Danger Button

- **SCR-023 Assign Roles** (P0 — Critical) — [wireframe-SCR-023-assign-roles.html](./Hi-Fi/wireframe-SCR-023-assign-roles.html)
  - Description: Role-permission assignment matrix
  - Parent Screen: SCR-004 / SCR-020
  - Key Components: Role Matrix Table, Checkboxes, Save Button

- **SCR-024 Audit Log** (P0 — Critical) — [wireframe-SCR-024-audit-log.html](./Hi-Fi/wireframe-SCR-024-audit-log.html)
  - Description: Immutable audit trail with filtering
  - Parent Screen: SCR-004
  - Key Components: Data Table, Filter Bar, Export Button, Date Range Picker

### Level 2: Queue & Walk-in Management (Staff)

- **SCR-025 Walk-in Queue** (P1 — High) — [wireframe-SCR-025-walkin-queue.html](./Hi-Fi/wireframe-SCR-025-walkin-queue.html)
  - Description: Same-day walk-in patient queue
  - Parent Screen: SCR-005
  - Key Components: Queue Table, Add Walk-in Button, Status Badges

- **SCR-026 Mark Arrival** (P1 — High) — [wireframe-SCR-026-mark-arrival.html](./Hi-Fi/wireframe-SCR-026-mark-arrival.html)
  - Description: Patient arrival confirmation interface
  - Parent Screen: SCR-025
  - Key Components: Patient Card, Confirm Button, Status Update

- **SCR-027 Mark No Show** (P1 — High) — [wireframe-SCR-027-mark-no-show.html](./Hi-Fi/wireframe-SCR-027-mark-no-show.html)
  - Description: No-show marking with immutable audit logging
  - Parent Screen: SCR-025
  - Key Components: Patient Card, Reason Input, Confirm Modal, Audit Badge

- **SCR-028 High-Risk / No-Show Alerts** (P1 — High) — [wireframe-SCR-028-noshow-alerts.html](./Hi-Fi/wireframe-SCR-028-noshow-alerts.html)
  - Description: Risk assessment dashboard for flagged appointments
  - Parent Screen: SCR-005
  - Key Components: Alert Cards, Risk Badge, Data Table, Filter Bar

### Level 2: Clinical Data & Coding

- **SCR-029 Medication Conflict Alerts** (P2 — Medium) — [wireframe-SCR-029-medication-conflicts.html](./Hi-Fi/wireframe-SCR-029-medication-conflicts.html)
  - Description: Medication conflict detection and staff review
  - Parent Screen: SCR-017 / SCR-005
  - Key Components: Conflict Cards, Alert Banner, Action Buttons, Detail Panel

- **SCR-030 Medical Coding** (P2 — Medium) — [wireframe-SCR-030-medical-coding.html](./Hi-Fi/wireframe-SCR-030-medical-coding.html)
  - Description: ICD-10 / CPT code generation from aggregated data
  - Parent Screen: SCR-017
  - Key Components: Code Table, AI Suggestion Cards, Verify Button, Search

### Level 2: Insurance

- **SCR-031 Insurance Pre-check** (P1 — High) — [wireframe-SCR-031-insurance-precheck.html](./Hi-Fi/wireframe-SCR-031-insurance-precheck.html)
  - Description: Insurance verification against internal dummy records
  - Parent Screen: SCR-007
  - Key Components: Insurance Form, Verification Result Card, Status Badge

### Screen Priority Legend

- **P0**: Critical path screens (must-have for MVP)
- **P1**: High-priority screens (core functionality)
- **P2**: Medium-priority screens (important features)
- **P3**: Low-priority screens (nice-to-have)

### Modal / Dialog / Overlay Inventory

| Modal/Dialog Name | Type | Trigger Context | Parent Screen | Wireframe Reference | Priority |
|---|---|---|---|---|---|
| Cancel Appointment Confirmation | Modal | Click "Cancel" on appointment | SCR-010 | SCR-009 | P1 |
| Deactivate User Confirmation | Dialog | Click "Deactivate" on user row | SCR-004, SCR-021 | SCR-022 | P1 |
| Mark No-Show Confirmation | Dialog | Click "No Show" on queue row | SCR-025 | SCR-027 | P1 |
| Logout Confirmation | Dialog | Click "Logout" in sidebar | All authenticated screens | Inline | P0 |
| Delete Document Confirmation | Dialog | Click "Delete" on document | SCR-017 | Inline | P2 |
| Slot Swap Confirmation | Modal | Confirm swap selection | SCR-012 | Inline | P2 |
| Session Timeout Warning | Dialog | 15-min timeout approaching | All authenticated screens | Inline | P0 |

**Modal Behavior Notes:**

- **Responsive Behavior:** Modals render as centered overlays on desktop; full-screen sheets on mobile
- **Dismissal Actions:** Close button (top-right), overlay-click, ESC key, or successful action
- **Focus Management:** Tab-trap within modal, return focus on close
- **Accessibility:** `role="dialog"`, `aria-labelledby`, `aria-describedby` on all modals

## 6. Navigation Architecture

```
Patient Login (SCR-003)
└── Patient Dashboard (SCR-006)
    ├── Book Appointment (SCR-007)
    │   └── Insurance Pre-check (SCR-031)
    │       └── Appointment Details (SCR-010)
    │           ├── Reschedule (SCR-008)
    │           ├── Cancel (SCR-009)
    │           ├── Slot Swap (SCR-012)
    │           └── Email/SMS Confirmation (SCR-015)
    ├── Waitlist Management (SCR-011)
    ├── Appointment Details (SCR-010)
    ├── Upload Documents (SCR-016)
    │   └── View Documents (SCR-017)
    │       ├── Medical Coding (SCR-030)
    │       └── Medication Conflicts (SCR-029)
    ├── AI Intake (SCR-018)
    ├── Manual Intake (SCR-019)
    ├── Automated Reminders (SCR-013)
    └── Calendar Sync (SCR-014)

Staff Login (SCR-002)
└── Staff Dashboard (SCR-005)
    ├── Walk-in Queue (SCR-025)
    │   ├── Mark Arrival (SCR-026)
    │   └── Mark No Show (SCR-027)
    ├── High-Risk/No-Show Alerts (SCR-028)
    ├── Waitlist Management (SCR-011)
    ├── Appointment Details (SCR-010)
    ├── Medical Coding (SCR-030)
    └── Medication Conflicts (SCR-029)

Admin Login (SCR-001)
└── Admin Dashboard (SCR-004)
    ├── Create User (SCR-020)
    │   └── Assign Roles (SCR-023)
    ├── Update User (SCR-021)
    │   ├── Assign Roles (SCR-023)
    │   └── Deactivate User (SCR-022)
    └── Audit Log (SCR-024)
```

### Navigation Patterns

- **Primary Navigation**: Persistent left sidebar with role-based menu items, collapsible sections
- **Secondary Navigation**: Top bar with breadcrumbs, search, and user profile
- **Contextual Navigation**: Action buttons within cards and tables for drill-down

## 7. Interaction Patterns

### Pattern 1: Appointment Booking (Multi-Step)

- **Trigger**: Patient clicks "Book Appointment" on dashboard
- **Flow**: Step 1 (Select Provider/Type) → Step 2 (Date/Time) → Step 3 (Insurance Pre-check) → Step 4 (Confirm)
- **Screens Involved**: SCR-007, SCR-031, SCR-010, SCR-015
- **Feedback**: Loading skeleton during search, success alert on confirmation, email/PDF delivery
- **Components Used**: Step Indicator, Date Picker, Time Slot Grid, Form Inputs, Confirmation Card

### Pattern 2: Walk-in Queue Management

- **Trigger**: Staff clicks "Add Walk-in" on queue screen
- **Flow**: Add patient → Assign to queue → Mark Arrival / Mark No Show → Update alerts
- **Screens Involved**: SCR-025, SCR-026, SCR-027, SCR-028
- **Feedback**: Real-time queue updates, success/warning badges
- **Components Used**: Queue Table, Patient Card, Status Badge, Confirmation Dialog

### Pattern 3: Clinical Document Upload & Extraction

- **Trigger**: Patient clicks "Upload Documents" on dashboard
- **Flow**: Upload → Extraction processing → View extracted profile → Medical coding → Conflict check
- **Screens Involved**: SCR-016, SCR-017, SCR-030, SCR-029
- **Feedback**: Progress bar during upload, skeleton during extraction, conflict alerts
- **Components Used**: Drop Zone, File List, Progress Bar, Profile Cards, Alert Banner

### Pattern 4: AI vs Manual Intake Switch

- **Trigger**: Patient selects intake method on dashboard
- **Flow**: Choose AI or Manual → Complete intake → Submit → Update profile
- **Screens Involved**: SCR-018, SCR-019
- **Feedback**: Chat responses (AI), form validation (Manual), switch toggle confirmation
- **Components Used**: Chat UI, Form Sections, Toggle Switch, Progress Indicator

### Pattern 5: Admin User Lifecycle

- **Trigger**: Admin clicks "New User" or selects existing user
- **Flow**: Create → Assign Roles → (later) Update → Deactivate
- **Screens Involved**: SCR-020, SCR-021, SCR-022, SCR-023, SCR-024
- **Feedback**: Success toast on save, confirmation modal on deactivate, audit log entry
- **Components Used**: Form Inputs, Role Matrix, Confirmation Dialog, Data Table

## 8. Error Handling

### Error Scenario 1: Network Error

- **Trigger**: API call failure due to connectivity loss
- **Error Screen/State**: Inline alert banner on affected screen
- **User Action**: Retry button or wait for reconnection
- **Recovery Flow**: Automatic retry with exponential backoff; manual retry via button

### Error Scenario 2: Form Validation Error

- **Trigger**: Invalid or missing required fields on submission
- **Error Screen/State**: Inline field-level errors with red border and message
- **User Action**: Correct highlighted fields and resubmit
- **Recovery Flow**: Focus moves to first error field; errors clear on valid input

### Error Scenario 3: Session Timeout

- **Trigger**: 15-minute inactivity timeout
- **Error Screen/State**: Session Timeout Warning dialog → redirect to login
- **User Action**: Click "Stay Logged In" to extend session or re-authenticate
- **Recovery Flow**: Re-login preserves intended destination via return URL

### Error Scenario 4: Insurance Pre-check Failure

- **Trigger**: No matching insurance record found
- **Error Screen/State**: Warning card on SCR-031 with details
- **User Action**: Verify and re-enter insurance details or proceed without coverage
- **Recovery Flow**: Edit insurance info and retry; or continue booking flow

### Error Scenario 5: Document Upload Failure

- **Trigger**: Unsupported format, file too large, or server error
- **Error Screen/State**: Error badge on failed file in upload list
- **User Action**: Remove failed file and re-upload with correct format/size
- **Recovery Flow**: Clear error, re-select file, retry upload

## 9. Responsive Strategy

| Breakpoint | Width | Layout Changes | Navigation Changes | Component Adaptations |
|---|---|---|---|---|
| Mobile | 375px | Single column, stacked sections | Hamburger menu, off-canvas sidebar | Cards full-width, smaller stat cards, simplified tables |
| Tablet | 768px | 2-column grid for cards/stats | Collapsed sidebar with icon-only mode | Tables with horizontal scroll, reduced padding |
| Desktop | 1440px | Multi-column layout, full sidebar | Expanded sidebar with labels | Full data tables, side-by-side panels |

### Responsive Wireframe Variants

- All HTML wireframes are built desktop-first at 1440px
- Responsive adaptation documented via CSS media queries (see design-system.css)

## 10. Accessibility

### WCAG Compliance

- **Target Level**: AA (WCAG 2.1)
- **Color Contrast**: All text meets 4.5:1 ratio; UI components meet 3:1
- **Keyboard Navigation**: All interactive elements reachable via Tab, Enter, Escape
- **Screen Reader Support**: ARIA landmarks, labels, live regions for dynamic content

### Accessibility Considerations by Screen

| Screen | Key Accessibility Features | Notes |
|---|---|---|
| Login (SCR-001–003) | Auto-focus on email input, error announced via `aria-live` | |
| Dashboards (SCR-004–006) | Landmark regions, stat cards read by SR | |
| Booking (SCR-007) | Step indicator as `aria-current="step"`, form labels | |
| Data Tables (SCR-024, SCR-025) | Sortable with `aria-sort`, row selection announced | |
| Modals (SCR-009, SCR-022) | Focus trap, `role="dialog"`, `aria-modal="true"` | |
| Chat (SCR-018) | `aria-live="polite"` for new messages | |

### Focus Order

- Tab order follows visual reading order (top-left to bottom-right)
- Skip navigation link provided for sidebar
- Modal focus traps return focus to trigger element on close
- Roving tabindex for tab bars and composite widgets

## 11. Content Strategy

### Content Hierarchy

- **H1**: Page title (one per screen)
- **H2**: Section headings within content area
- **H3**: Card titles, subsection headings
- **Body Text**: Descriptions, help text, status messages
- **Placeholder Content**: Realistic healthcare-themed placeholder text used throughout wireframes

### Content Types by Screen

| Screen | Content Types | Notes |
|---|---|---|
| Dashboards | Stats, tables, cards, alerts | Real-time data visualization |
| Booking | Form fields, time slots, confirmations | Multi-step wizard |
| Documents | Files, extracted data, profile cards | AI-generated extractions |
| Intake | Chat messages (AI) or form fields (Manual) | Switchable mode |
| Admin | User tables, role matrices, audit logs | Permission-driven visibility |
