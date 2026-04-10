# Accessibility Audit Report

**Date**: April 9, 2026
**Auditor**: Automated (axe-core 4.x) + Manual Review
**Standard**: WCAG 2.2 Level AA
**Task**: US_043 TASK_001

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Screens Audited** | 13 (SCR-001 – SCR-014, excluding SCR-013 reserved) |
| **Critical Violations** | TBD (baseline pending first full scan) |
| **Serious Violations** | TBD |
| **Moderate Violations** | TBD |
| **Minor Violations** | TBD |
| **Compliance Rate** | TBD% |

> This report establishes the **baseline** audit structure. Violation counts will be populated after running the automated + manual audit passes described below.

---

## Audit Methodology

1. **Automated scan** — axe-core 4.x integrated via `vitest-axe` (unit) and `@axe-core/playwright` (E2E)
2. **Manual verification** — Screen-reader walk-through (NVDA, VoiceOver), keyboard-only navigation, zoom to 200 %
3. **Contrast check** — WebAIM Contrast Checker + axe `color-contrast` rule

---

## Violations by Screen

### SCR-001: Login / Register

| Severity | Rule | Description | Element(s) | Priority |
|----------|------|-------------|------------|----------|
| — | — | Baseline scan pending | — | — |

### SCR-002: Patient Dashboard

| Severity | Rule | Description | Element(s) | Priority |
|----------|------|-------------|------------|----------|
| — | — | Baseline scan pending | — | — |

### SCR-003: Staff Dashboard

| Severity | Rule | Description | Element(s) | Priority |
|----------|------|-------------|------------|----------|
| — | — | Baseline scan pending | — | — |

### SCR-004: Admin Dashboard

| Severity | Rule | Description | Element(s) | Priority |
|----------|------|-------------|------------|----------|
| — | — | Baseline scan pending | — | — |

### SCR-005: Profile & Settings

| Severity | Rule | Description | Element(s) | Priority |
|----------|------|-------------|------------|----------|
| — | — | Baseline scan pending | — | — |

### SCR-006: Appointment Booking

| Severity | Rule | Description | Element(s) | Priority |
|----------|------|-------------|------------|----------|
| — | — | Baseline scan pending | — | — |

### SCR-007: Patient Intake

| Severity | Rule | Description | Element(s) | Priority |
|----------|------|-------------|------------|----------|
| — | — | Baseline scan pending | — | — |

### SCR-008: Document Upload

| Severity | Rule | Description | Element(s) | Priority |
|----------|------|-------------|------------|----------|
| — | — | Baseline scan pending | — | — |

### SCR-009: Queue Management

| Severity | Rule | Description | Element(s) | Priority |
|----------|------|-------------|------------|----------|
| — | — | Baseline scan pending | — | — |

### SCR-010: Clinical Data Review

| Severity | Rule | Description | Element(s) | Priority |
|----------|------|-------------|------------|----------|
| — | — | Baseline scan pending | — | — |

### SCR-011: Appointment Management (Staff)

| Severity | Rule | Description | Element(s) | Priority |
|----------|------|-------------|------------|----------|
| — | — | Baseline scan pending | — | — |

### SCR-012: Audit Logs

| Severity | Rule | Description | Element(s) | Priority |
|----------|------|-------------|------------|----------|
| — | — | Baseline scan pending | — | — |

### SCR-014: User Management

| Severity | Rule | Description | Element(s) | Priority |
|----------|------|-------------|------------|----------|
| — | — | Baseline scan pending | — | — |

---

## Violation Categories Summary

| Category | Count |
|----------|-------|
| Color Contrast | TBD |
| Keyboard Navigation | TBD |
| ARIA Labels / Roles | TBD |
| Focus Indicators | TBD |
| Form Labels | TBD |
| Image Alt Text | TBD |
| Heading Hierarchy | TBD |

---

## Remediation Roadmap

### Phase 1 — Critical (Week 1)

- Fix all **critical** violations across every screen
- Priority: color-contrast failures on primary CTAs, missing form labels

### Phase 2 — Serious (Week 2)

- Fix all **serious** violations
- Priority: ARIA landmarks, focus management in modals, live-region announcements

### Phase 3 — Moderate / Minor (Weeks 3–4)

- Fix remaining moderate and minor issues
- Priority: heading hierarchy, redundant ARIA, decorative image alt text

---

## Baseline Metrics

| Screen | Critical | Serious | Moderate | Minor | Total |
|--------|----------|---------|----------|-------|-------|
| SCR-001 | — | — | — | — | — |
| SCR-002 | — | — | — | — | — |
| SCR-003 | — | — | — | — | — |
| SCR-004 | — | — | — | — | — |
| SCR-005 | — | — | — | — | — |
| SCR-006 | — | — | — | — | — |
| SCR-007 | — | — | — | — | — |
| SCR-008 | — | — | — | — | — |
| SCR-009 | — | — | — | — | — |
| SCR-010 | — | — | — | — | — |
| SCR-011 | — | — | — | — | — |
| SCR-012 | — | — | — | — | — |
| SCR-014 | — | — | — | — | — |
| **Total** | **—** | **—** | **—** | **—** | **—** |

> Populate after running: `npm run test:a11y` and `cd test-automation && npx playwright test --project=accessibility`
