---
title: Patient Appointment Booking - Automated Test Workflow
test_feature: Patient Appointment Booking
source: FR-001, UC-001
---

# Test Workflow: Patient Appointment Booking

## Test Case List
| TC-ID             | Summary                                 | Type        |
|-------------------|-----------------------------------------|-------------|
| TC-UC001-HP-001   | Book, reschedule, cancel appointment    | happy_path  |
| TC-UC001-EC-001   | Book with edge slot, waitlist, swap     | edge_case   |
| TC-UC001-ER-001   | Book with invalid data, double booking  | error       |

## Test Cases

### TC-UC001-HP-001: Book, reschedule, cancel appointment
- **Preconditions:** Patient is authenticated
- **Steps:**
  1. Navigate to dashboard
  2. Book appointment (valid slot)
  3. Reschedule appointment
  4. Cancel appointment
- **Expected:** Each action is confirmed and reflected in UI and notifications

### TC-UC001-EC-001: Book with edge slot, waitlist, swap
- **Preconditions:** Patient is authenticated
- **Steps:**
  1. Attempt to book last available slot
  2. Join waitlist for preferred slot
  3. System auto-swaps when slot opens
- **Expected:** Booking, waitlist, and swap are handled correctly

### TC-UC001-ER-001: Book with invalid data, double booking
- **Preconditions:** Patient is authenticated
- **Steps:**
  1. Attempt to book with missing/invalid data
  2. Attempt to double-book same slot
- **Expected:** Errors are shown, booking is not created

## Test Data (YAML)
```yaml
valid_patient:
  username: patient1
  password: password
invalid_patient:
  username: patient1
  password: wrongpass
slots:
  - time: '2026-03-20T09:00'
    available: true
  - time: '2026-03-20T10:00'
    available: false
```

## Selector Strategy
- getByRole for buttons, forms
- getByLabel for inputs
- getByTestId for custom components
- Fallback: CSS selectors

## Pass/Fail Criteria
- All confirmations visible in UI
- Notifications sent (email/SMS)
- No double bookings allowed
- Errors shown for invalid actions
