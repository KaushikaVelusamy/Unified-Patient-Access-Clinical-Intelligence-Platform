# Sequence Diagrams for Use Cases

---

## UC-001: Patient Appointment Booking
@startuml
actor Patient
actor Staff
actor System
Patient -> System: Request appointment booking
System -> System: Check slot availability
alt Slot available
    System -> Patient: Confirm booking
    System -> Staff: Notify new booking
else Waitlist
    System -> Patient: Offer waitlist
end
System -> Patient: Send confirmation/reminder
@enduml

---

## UC-002: Patient Intake (AI/Manual)
@startuml
actor Patient
actor System
Patient -> System: Select intake method (AI/manual)
System -> Patient: Present intake form or AI chat
Patient -> System: Submit intake data
System -> System: Process and store intake
System -> Patient: Confirm completion
@enduml

---

## UC-003: Clinical Data Aggregation
@startuml
actor Patient
actor Staff
actor System
Patient -> System: Upload clinical documents
System -> System: Extract and aggregate data
System -> Staff: Present unified profile
Staff -> System: Review/resolve conflicts
@enduml

---

## UC-004: Send Appointment Details as PDF
@startuml
actor Patient
actor System
Patient -> System: Book appointment
System -> System: Generate PDF
System -> Patient: Send PDF via email
@enduml

---

## UC-005: Rule Based No Show Risk Assessment
@startuml
actor System
actor Staff
System -> System: Evaluate appointment risk
alt High risk
    System -> Staff: Notify high-risk appointment
end
@enduml

---

## UC-006: Admin User Management
@startuml
actor Admin
actor System
Admin -> System: Manage users (create/update/deactivate/assign roles)
System -> System: Validate and apply changes
System -> Admin: Confirm changes
@enduml

---

## UC-007: Staff Walk-in and Queue Management
@startuml
actor Staff
actor System
Staff -> System: Add walk-in/manage queue
System -> System: Update queue
System -> Staff: Confirm/notify
@enduml

---

## UC-008: Role-Based Access Control and Audit Logging
@startuml
actor Admin
actor Staff
actor Patient
actor System
Admin -> System: Access admin features
Staff -> System: Access staff features
Patient -> System: Access patient features
System -> System: Log all actions
@enduml

---

## UC-009: Restrict Patient Self-Check-In
@startuml
actor Patient
actor System
Patient -> System: Attempt self-check-in
System -> Patient: Block action, display message
@enduml

---

## UC-010: Highlight Medication Conflicts
@startuml
actor Staff
actor System
Staff -> System: Access patient profile
System -> System: Analyze medication data
alt Conflict detected
    System -> Staff: Highlight conflict
end
@enduml

---

## UC-011: Staff Marks No Show
@startuml
actor Staff
actor System
Staff -> System: Mark patient as no-show
System -> System: Log action immutably
System -> Staff: Confirm action
@enduml

---

## UC-012: Patient Dashboard Access
@startuml
actor Patient
actor System
Patient -> System: Login
System -> Patient: Grant dashboard access
Patient -> System: View/manage appointments, upload docs, complete intake, receive notifications
@enduml
