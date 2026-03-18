# Task - TASK_001_BE_INSURANCE_PRECHECK_SERVICE

## Requirement Reference
- User Story: US_037
- Story Location: `.propel/context/tasks/us_037/us_037.md`
- Acceptance Criteria:
    - AC1: Scheduled job 24h before appointment calls external insurance API (Availity/Change Healthcare) with patient+insurance info, receives eligibility response (Active/Inactive/Requires_Auth/Copay), stores in insurance_verifications table, displays status badge in staff queue (Green/Red/Yellow), displays details in patient profile, notifies staff if status issue, retries 3x on failure with exponential backoff (1min, 5min, 15min)
- Edge Cases:
    - Insurance API down: Show "Verification Pending", queue retry, alert admin after 3 failures
    - Missing insurance: Flag "Insurance Info Incomplete", notify staff to collect at check-in
    - Multiple insurance plans: Verify primary only, show "Secondary Insurance" indicator for manual review

## Design References (Frontend Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **UI Impact** | Yes (Badge in queue + Patient Profile panel) |
| **Figma URL** | .propel/context/docs/figma_spec.md#SCR-009 |
| **Wireframe Status** | AVAILABLE |
| **Wireframe Type** | HTML |
| **Wireframe Path/URL** | .propel/context/wireframes/Hi-Fi/wireframe-SCR-009-staff-queue-management.html |
| **Screen Spec** | SCR-009 (Staff Queue Insurance Status column), SCR-011 (Patient Profile Insurance Info panel) |
| **UXR Requirements** | NFR-REL02 (Retry logic), TR-003 (External API integration), UXR-402 (Real-time status badges), UXR-501 (Error recovery patterns) |
| **Design Tokens** | Status badges: Green "Verified ✓", Red "Issue ✗", Yellow "Pending ⏳", Popover: 350px shadow backdrop |

> **Wireframe Components:**
> - SCR-009 Staff Queue: Insurance Status column with color-coded badges, click badge opens details popover
> - Insurance popover: Problem description (Inactive/Auth Required/API Error), recommended action (Contact patient/Request auth/Retry), "Contact" button triggers reminder notification
> - SCR-011 Patient Profile Insurance Info panel: Card with Insurance Plan, Member ID, Status badge, Copay Amount, Deductible Remaining, Coverage Dates, Authorization Notes textarea (if required), Last Verified timestamp, "Re-verify Now" button triggers immediate API call
> - Verification history: Expandable section with past attempts (timestamp + result)

## Applicable Technology Stack
| Layer | Technology | Version |
|-------|------------|---------|  
| Frontend | React | 18.2.x |
| Backend | Node.js | 20.x LTS |
| Backend | Express | 4.x |
| Backend | Axios | 1.x (Insurance API client) |
| Backend | Bull | 4.x (Queue retry logic) |
| Database | PostgreSQL | 16.x |
| Cache | Redis | 5.x |
| AI/ML | N/A | N/A |

## AI References (AI Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **AI Impact** | No |
| **AIR Requirements** | N/A |
| **AI Pattern** | N/A |
| **Prompt Template Path** | N/A |
| **Guardrails Config** | N/A |
| **Model Provider** | N/A |

## Mobile References (Mobile Tasks Only)
| Reference Type | Value |
|----------------|-------|
| **Mobile Impact** | Yes (Responsive badges) |
| **Platform Target** | Web |
| **Min OS Version** | iOS 14+, Android 10+ |
| **Mobile Framework** | React |

## Task Overview
Implement insurance pre-check service: (1) Cron job (node-cron) runs daily at 8AM checking appointments 24h ahead, (2) External insurance API integration (Availity or Change Healthcare SDK), (3) POST to insurance API with patient_id, insurance_plan, member_id, appointment_date, (4) Parse response: {eligibility: 'active'|'inactive'|'requires_auth', copay_amount, deductible_remaining, coverage_start_date, coverage_end_date, requires_authorization: boolean}, (5) Store in insurance_verifications table (patient_id, appointment_id, verification_date, status, copay, deductible, notes, api_response_code), (6) Retry logic: 3 attempts with exponential backoff (1min, 5min, 15min) using Bull queue, (7) Circuit breaker: After 3 consecutive failures, pause 1 hour + alert admin, (8) Staff queue badge display (Green "Verified", Red "Issue", Yellow "Pending"), (9) Patient profile Insurance Info panel displays copay, coverage dates, auth requirements, (10) Staff notification if status='inactive' or 'requires_auth', (11) "Re-verify Now" button triggers immediate verification.

## Dependent Tasks
- US_020 Task 001: Staff queue (displays insurance status badge)
- US_035: Admin config (insurance API credentials stored)
- US_016 Task 001: Automated reminders (sends notification if issue)

## Impacted Components
**New:**
- server/src/services/insurance-verification.service.ts (Insurance API client)
- server/src/jobs/insurance-precheck-worker.ts (Daily cron job)
- server/src/queues/insurance-verification-queue.ts (Bull queue for retries)
- server/src/controllers/insurance.controller.ts (Insurance endpoints)
- server/src/routes/insurance.routes.ts (GET /insurance/:patientId, POST /insurance/reverify)
- app/src/components/InsuranceStatusBadge.tsx (Badge in queue)
- app/src/components/InsuranceInfoPanel.tsx (Patient profile panel)
- app/src/components/InsuranceDetailsPopover.tsx (Click badge popover)

**Modified:**
- server/db/schema.sql (Add insurance_verifications table)
- server/src/config/insurance-api-config.ts (API credentials)

## Implementation Plan
1. Database schema: CREATE TABLE insurance_verifications (id SERIAL, patient_id UUID REFERENCES patients(id), appointment_id UUID REFERENCES appointments(id), verification_date TIMESTAMP DEFAULT NOW(), status VARCHAR(50), copay_amount DECIMAL(10,2), deductible_remaining DECIMAL(10,2), coverage_start_date DATE, coverage_end_date DATE, requires_authorization BOOLEAN, notes TEXT, api_response_code INTEGER, retry_count INTEGER DEFAULT 0)
2. Insurance API client (insurance-verification.service.ts):
   - verifyEligibility(patientId, appointmentId): Load patient insurance, call Availity/Change Healthcare API, parse response
   - Retry logic: On failure (HTTP 500+), throw error → Bull queue retries with backoff
   - Circuit breaker: Track consecutive_failures in Redis (key: insurance-api-failures), if ≥3, pause 1 hour
3. Bull queue (insurance-verification-queue.ts):
   - Queue name: 'insurance-verification-queue'
   - Retry strategy: attempts: 3, backoff: {type: 'exponential', delay: 60000} (1min, 2min, 4min)
   - Job processor: Call verifyEligibility, store result in database
4. Cron job (insurance-precheck-worker.ts):
   - Schedule: '0 8 * * *' (8AM daily)
   - Query: SELECT * FROM appointments WHERE appointment_datetime BETWEEN NOW()+INTERVAL '23 hours' AND NOW()+INTERVAL '25 hours' AND status IN ('Scheduled', 'Arrived')
   - For each appointment, add job to insurance-verification-queue
5. POST /api/insurance/reverify:
   - verifyToken, requireRole('staff')
   - Accepts {appointmentId}, triggers immediate verification
   - Returns {status, copay, deductible, requires_authorization}
6. GET /api/insurance/:patientId:
   - Returns latest insurance verification for patient
   - Includes verification history (last 5 attempts)
7. Frontend InsuranceStatusBadge: Displays badge based on status (verified=green, issue=red, pending=yellow)
8. InsuranceInfoPanel: Card with insurance details, "Re-verify Now" button calls POST /insurance/reverify
9. Notification: If status='inactive' or 'requires_auth', call POST /api/notifications with type='insurance_issue'
10. Alert admin: If circuit breaker trips, send email to admin@example.com

## Current Project State
```
ASSIGNMENT/
├── server/src/ (admin services exist)
├── server/src/queues/ (to be created)
└── (insurance verification to be added)
```

## Expected Changes
| Action | File Path | Description |
|--------|-----------|-------------|
| CREATE | server/src/services/insurance-verification.service.ts | Insurance API client |
| CREATE | server/src/jobs/insurance-precheck-worker.ts | Cron job |
| CREATE | server/src/queues/insurance-verification-queue.ts | Bull queue |
| CREATE | server/src/controllers/insurance.controller.ts | Insurance handlers |
| CREATE | server/src/routes/insurance.routes.ts | Insurance endpoints |
| CREATE | app/src/components/InsuranceStatusBadge.tsx | Queue badge |
| CREATE | app/src/components/InsuranceInfoPanel.tsx | Profile panel |
| CREATE | app/src/components/InsuranceDetailsPopover.tsx | Popover |
| UPDATE | server/db/schema.sql | Add insurance_verifications table |
| UPDATE | server/src/config/insurance-api-config.ts | API credentials |

## External References
- [Availity API Documentation](https://developer.availity.com/)
- [Change Healthcare API](https://developers.changehealthcare.com/)
- [Bull Queue Documentation](https://github.com/OptimalBits/bull)
- [FR-014 Insurance Verification](../../../.propel/context/docs/spec.md#FR-014)
- [NFR-REL02 Retry Logic](../../../.propel/context/docs/spec.md#NFR-REL02)
- [TR-003 External API Integration](../../../.propel/context/docs/spec.md#TR-003)

## Build Commands
```bash
cd server
npm install bull axios node-cron
npm run dev

# Test insurance verification
curl -X POST http://localhost:3001/api/insurance/reverify \
  -H "Authorization: Bearer <staff-token>" \
  -d '{"appointmentId": "appt-uuid"}' \
  -H "Content-Type: application/json"
```

## Implementation Validation Strategy
- [ ] Unit tests: verifyEligibility returns {status, copay, deductible}
- [ ] Integration tests: POST /insurance/reverify triggers verification
- [ ] Bull installed: package.json shows bull@4.x
- [ ] insurance_verifications table exists: \d insurance_verifications shows columns
- [ ] Cron job scheduled: Console logs "Insurance pre-check job started" at 8AM
- [ ] API call: Cron job queries appointments 24h ahead, calls insurance API for each
- [ ] Response parsing: API returns eligibility → status='active', copay=$25, deductible=$500
- [ ] Database storage: Query insurance_verifications → see verification_date, status, copay
- [ ] Retry logic: Simulate API failure → job retries 3x with backoff (1min, 5min, 15min)
- [ ] Circuit breaker: 3 consecutive failures → Redis key insurance-api-failures=3, pause 1 hour
- [ ] Frontend badge: Staff queue shows "Verified ✓" (green), "Issue ✗" (red), "Pending ⏳" (yellow)
- [ ] Badge click: Opens InsuranceDetailsPopover with problem description + recommended action
- [ ] Patient profile: InsuranceInfoPanel displays insurance plan, copay, deductible, coverage dates
- [ ] Re-verify button: Click "Re-verify Now" → POST /insurance/reverify → status updated
- [ ] Staff notification: status='inactive' → notification sent "Insurance verification failed for Patient X"
- [ ] Verification history: Expandable section shows past 5 attempts with timestamps
- [ ] Missing insurance: Patient without insurance → flag "Insurance Info Incomplete"
- [ ] Multiple plans: Primary insurance verified, secondary shows "Secondary Insurance" indicator

## Implementation Checklist
- [ ] Install dependencies: `npm install bull axios node-cron`
- [ ] Create insurance_verifications table
- [ ] Implement insurance-verification.service.ts with API client
- [ ] Create insurance-verification-queue.ts with Bull + retry logic
- [ ] Create insurance-precheck-worker.ts cron job
- [ ] Implement circuit breaker with Redis tracking
- [ ] Create insurance.controller.ts + insurance.routes.ts
- [ ] Create InsuranceStatusBadge.tsx + InsuranceInfoPanel.tsx + InsuranceDetailsPopover.tsx
- [ ] Integrate badge into staff queue
- [ ] Test insurance verification flow
- [ ] Validate retry logic + circuit breaker
- [ ] Document insurance API in server/README.md
