# Sprint Plan

## Overview
This sprint plan allocates user stories into time-boxed sprints based on dependency ordering, team capacity, and business value. Each sprint has a clear goal and respects capacity constraints.

## Assumptions
- Sprint duration: 2 weeks
- Team size: 8 (2 FE, 2 BE, 1 AI/ML, 1 QA, 1 DevOps, 1 UI/UX)
- Velocity: 8 SP/person/sprint = 64 SP/sprint
- Buffer: 20% (effective velocity: 51 SP/sprint)

## Sprint Allocation

| Sprint | Sprint Goal                                      | User Stories (Epic/ID)                | Story Points | Notes/Dependencies                |
|--------|--------------------------------------------------|---------------------------------------|-------------|-----------------------------------|
| 1      | Core booking, intake, and patient profile        | EP-001_01, EP-002_01, EP-003_01       | 8+8+8=24    | Foundational flows                |
| 2      | Staff ops, reminders, insurance, PDF confirmation| EP-006_01, EP-008_01, EP-005_01, EP-009_01 | 8+5+5+5=23 | Staff, notifications, insurance   |
| 3      | Coding, conflicts, dashboard, admin, access      | EP-004_01, EP-010_01, EP-011_01, EP-012_01 | 8+8+5+8=29 | Clinical, admin, security         |
| 4      | No-show, audit, self-check-in restriction        | EP-007_01, EP-013_01                  | 8+3=11      | Risk, compliance                  |

## Sprint Goals
- **Sprint 1:** Deliver core patient flows (booking, intake, profile)
- **Sprint 2:** Enable staff operations, reminders, insurance, and PDF confirmations
- **Sprint 3:** Complete clinical, admin, and security features
- **Sprint 4:** Finalize risk, audit, and compliance features

## Notes
- All user stories are INVEST-compliant and mapped to epics.
- Dependencies are respected (core flows before staff/clinical/admin features).
- Buffer included for unplanned work and risk.
- Adjustments can be made based on actual team velocity and feedback.
