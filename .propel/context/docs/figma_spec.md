---
title: Figma Specification
source: .propel/context/docs/spec.md
---

# Screen Inventory

## 1. Login Screens
- Admin Login
- Staff Login
- Patient Login

## 2. Dashboards
- Admin Dashboard
- Staff Dashboard
- Patient Dashboard / Landing Screen

## 3. Appointment Management
- Book Appointment
- Reschedule Appointment
- Cancel Appointment
- Appointment Details
- Waitlist Management
- Slot Swap

## 4. Notifications
- Automated Reminders
- Calendar Sync
- Email/SMS Confirmation

## 5. Document Management
- Upload Clinical Documents
- View Uploaded Documents

## 6. Intake
- AI Conversational Intake
- Manual Intake Form

## 7. User Management (Admin)
- Create User
- Update User
- Deactivate User
- Assign Roles
- Audit Log

## 8. Queue & Walk-in Management (Staff)
- Walk-in Queue
- Mark Arrival
- Mark No Show
- High-Risk/No-Show Alerts

## 9. Clinical Data & Coding
- Medication Conflict Alerts
- Medical Coding (ICD-10, CPT)

## 10. Insurance
- Insurance Pre-check

# Screen States & Flows
- Loading, Success, Error, Empty States for all screens
- Modal dialogs for confirmations and errors
- Navigation flows between login, dashboard, and feature screens

# Component Mapping
- Buttons, Inputs, Tables, Cards, Alerts, Modals, Tabs, Avatars, Badges
- Role-based visibility for actions and data

# Design Tokens (see designsystem.md)
- Colors, Typography, Spacing, Border Radius, Shadows, Iconography

# Notes
- All screens must be accessible (WCAG 2.1 AA)
- Responsive layouts for desktop, tablet, mobile
- HIPAA-compliant data handling and privacy indicators
