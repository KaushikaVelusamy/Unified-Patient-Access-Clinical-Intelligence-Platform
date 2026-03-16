---
title: Navigation Map — Unified Patient Access & Clinical Intelligence Platform
source: .propel/context/docs/figma_spec.md
date: 2026-03-16
---

# Navigation Map — Unified Patient Access & Clinical Intelligence Platform

## Flow Index

| Flow ID | Flow Name | Persona | Screens | Entry | Exit |
|---|---|---|---|---|---|
| FL-001 | Patient Appointment Booking | Patient | SCR-003 → SCR-006 → SCR-007 → SCR-031 → SCR-010 → SCR-015 | SCR-003 | SCR-015 |
| FL-002 | Patient Intake | Patient | SCR-006 → SCR-018 / SCR-019 | SCR-006 | SCR-018 / SCR-019 |
| FL-003 | Staff Walk-in Management | Staff | SCR-002 → SCR-005 → SCR-025 → SCR-026 / SCR-027 → SCR-028 | SCR-002 | SCR-028 |
| FL-004 | Admin User Management | Admin | SCR-001 → SCR-004 → SCR-020 → SCR-023 → SCR-024 | SCR-001 | SCR-024 |
| FL-005 | Clinical Document Flow | Patient/Staff | SCR-006 → SCR-016 → SCR-017 → SCR-030 → SCR-029 | SCR-006 | SCR-029 |
| FL-006 | Appointment Reschedule/Cancel | Patient | SCR-006 → SCR-010 → SCR-008 / SCR-009 | SCR-006 | SCR-008 / SCR-009 |
| FL-007 | Insurance Pre-check | Patient | SCR-007 → SCR-031 → SCR-010 | SCR-007 | SCR-010 |

## Cross-Screen Navigation Index

| Source Screen | Target Screen | Trigger Element | Trigger Action | Flow(s) |
|---|---|---|---|---|
| SCR-001 | SCR-004 | #login-btn | Submit login | FL-004 |
| SCR-002 | SCR-005 | #login-btn | Submit login | FL-003 |
| SCR-003 | SCR-006 | #login-btn | Submit login | FL-001, FL-002, FL-005, FL-006 |
| SCR-004 | SCR-020 | #create-user-btn | Click "Create User" | FL-004 |
| SCR-004 | SCR-021 | .edit-user-link | Click "Edit" on user row | FL-004 |
| SCR-004 | SCR-024 | #audit-log-nav | Click "Audit Log" nav | FL-004 |
| SCR-005 | SCR-025 | #walkin-queue-nav | Click "Walk-in Queue" nav | FL-003 |
| SCR-005 | SCR-028 | #alerts-nav | Click "Alerts" nav | FL-003 |
| SCR-005 | SCR-010 | .appointment-row | Click appointment row | — |
| SCR-005 | SCR-011 | #waitlist-nav | Click "Waitlist" nav | — |
| SCR-006 | SCR-007 | #book-appointment-btn | Click "Book Appointment" | FL-001 |
| SCR-006 | SCR-010 | .appointment-card | Click appointment card | FL-006 |
| SCR-006 | SCR-016 | #upload-docs-btn | Click "Upload Documents" | FL-005 |
| SCR-006 | SCR-018 | #ai-intake-btn | Click "AI Intake" | FL-002 |
| SCR-006 | SCR-019 | #manual-intake-btn | Click "Manual Intake" | FL-002 |
| SCR-006 | SCR-013 | #reminders-nav | Click "Reminders" nav | — |
| SCR-006 | SCR-014 | #calendar-sync-nav | Click "Calendar Sync" nav | — |
| SCR-006 | SCR-011 | #waitlist-nav | Click "Waitlist" nav | — |
| SCR-007 | SCR-031 | #check-insurance-btn | Click "Check Insurance" step | FL-001, FL-007 |
| SCR-007 | SCR-010 | #confirm-booking-btn | Submit booking | FL-001 |
| SCR-010 | SCR-008 | #reschedule-btn | Click "Reschedule" | FL-006 |
| SCR-010 | SCR-009 | #cancel-btn | Click "Cancel Appointment" | FL-006 |
| SCR-010 | SCR-012 | #slot-swap-btn | Click "Swap Slot" | — |
| SCR-010 | SCR-015 | #view-confirmation-btn | Click "View Confirmation" | FL-001 |
| SCR-016 | SCR-017 | #view-documents-btn | Click "View Documents" | FL-005 |
| SCR-017 | SCR-030 | #medical-coding-btn | Click "Medical Coding" | FL-005 |
| SCR-017 | SCR-029 | #conflicts-alert | Click conflict alert | FL-005 |
| SCR-018 | SCR-019 | #switch-to-manual | Click "Switch to Manual" | FL-002 |
| SCR-019 | SCR-018 | #switch-to-ai | Click "Switch to AI" | FL-002 |
| SCR-020 | SCR-023 | #assign-roles-btn | Click "Assign Roles" | FL-004 |
| SCR-021 | SCR-022 | #deactivate-btn | Click "Deactivate User" | FL-004 |
| SCR-021 | SCR-023 | #assign-roles-btn | Click "Assign Roles" | FL-004 |
| SCR-025 | SCR-026 | .mark-arrival-btn | Click "Mark Arrived" | FL-003 |
| SCR-025 | SCR-027 | .mark-noshow-btn | Click "No Show" | FL-003 |
| SCR-031 | SCR-010 | #proceed-btn | Click "Proceed to Confirm" | FL-007 |

## Dead-End Analysis

All screens have at minimum one outbound navigation path (back to parent dashboard via sidebar). No dead-end screens identified.

## Sidebar Navigation Structure

### Patient Sidebar

| Order | Label | Target | Icon |
|---|---|---|---|
| 1 | Dashboard | SCR-006 | 🏠 |
| 2 | Book Appointment | SCR-007 | 📅 |
| 3 | My Appointments | SCR-010 | 📋 |
| 4 | Waitlist | SCR-011 | ⏳ |
| 5 | Upload Documents | SCR-016 | 📁 |
| 6 | My Documents | SCR-017 | 📄 |
| 7 | Intake | SCR-018 | 💬 |
| 8 | Reminders | SCR-013 | 🔔 |
| 9 | Calendar Sync | SCR-014 | 🗓️ |

### Staff Sidebar

| Order | Label | Target | Icon |
|---|---|---|---|
| 1 | Dashboard | SCR-005 | 🏠 |
| 2 | Walk-in Queue | SCR-025 | 👥 |
| 3 | Appointments | SCR-010 | 📋 |
| 4 | Waitlist | SCR-011 | ⏳ |
| 5 | No-Show Alerts | SCR-028 | ⚠️ |
| 6 | Medication Conflicts | SCR-029 | 💊 |
| 7 | Medical Coding | SCR-030 | 🏥 |
| 8 | Reminders | SCR-013 | 🔔 |
| 9 | Notifications | SCR-015 | ✉️ |

### Admin Sidebar

| Order | Label | Target | Icon |
|---|---|---|---|
| 1 | Dashboard | SCR-004 | 🏠 |
| 2 | Create User | SCR-020 | ➕ |
| 3 | Manage Users | SCR-021 | 👤 |
| 4 | Assign Roles | SCR-023 | 🔑 |
| 5 | Audit Log | SCR-024 | 📜 |
