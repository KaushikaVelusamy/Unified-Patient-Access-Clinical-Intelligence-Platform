/**
 * Playwright E2E Accessibility Tests
 *
 * Runs axe-core WCAG 2.2 AA scans on all 13 application screens.
 * Public screens are tested directly; authenticated screens go through login first.
 *
 * @task US_043 TASK_001
 */

import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/* ── Screen definitions ── */

interface Screen {
  id: string;
  name: string;
  path: string;
  role?: 'patient' | 'staff' | 'admin';
}

const PUBLIC_SCREENS: Screen[] = [
  { id: 'SCR-001', name: 'Login / Register', path: '/login' },
];

const AUTHENTICATED_SCREENS: Screen[] = [
  { id: 'SCR-002', name: 'Patient Dashboard', path: '/patient/dashboard', role: 'patient' },
  { id: 'SCR-003', name: 'Staff Dashboard', path: '/staff/dashboard', role: 'staff' },
  { id: 'SCR-004', name: 'Admin Dashboard', path: '/admin/dashboard', role: 'admin' },
  { id: 'SCR-005', name: 'Profile & Settings', path: '/patient/profile', role: 'patient' },
  { id: 'SCR-006', name: 'Appointment Booking', path: '/appointments/book', role: 'patient' },
  { id: 'SCR-007', name: 'Patient Intake', path: '/intake', role: 'patient' },
  { id: 'SCR-008', name: 'Document Upload', path: '/documents/upload', role: 'patient' },
  { id: 'SCR-009', name: 'Queue Management', path: '/staff/queue', role: 'staff' },
  { id: 'SCR-010', name: 'Clinical Data Review', path: '/staff/clinical-review', role: 'staff' },
  { id: 'SCR-011', name: 'Appointment Management', path: '/staff/appointments', role: 'staff' },
  { id: 'SCR-012', name: 'Audit Logs', path: '/admin/audit-logs', role: 'admin' },
  { id: 'SCR-014', name: 'User Management', path: '/admin/users', role: 'admin' },
];

const TEST_USERS: Record<string, { email: string; password: string }> = {
  patient: {
    email: process.env.TEST_PATIENT_EMAIL || 'patient@test.com',
    password: process.env.TEST_PATIENT_PASSWORD || 'Test@123',
  },
  staff: {
    email: process.env.TEST_STAFF_EMAIL || 'staff@test.com',
    password: process.env.TEST_STAFF_PASSWORD || 'Test@123',
  },
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'Test@123',
  },
};

/* ── Helper: login ── */

async function loginAs(page: import('@playwright/test').Page, role: string): Promise<void> {
  const user = TEST_USERS[role];
  if (!user) throw new Error(`No test user for role: ${role}`);

  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.getByLabel(/email/i).fill(user.email);
  await page.getByLabel(/password/i).fill(user.password);
  await page.getByRole('button', { name: /log\s*in|sign\s*in/i }).click();
  await page.waitForURL(/\/(patient|staff|admin)/, { timeout: 15_000 });
}

/* ── Helper: axe scan ── */

async function scanPage(page: import('@playwright/test').Page): Promise<import('axe-core').AxeResults> {
  return new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .analyze();
}

/* ── Tests: Public screens ── */

test.describe('Accessibility — Public Screens', () => {
  for (const screen of PUBLIC_SCREENS) {
    test(`${screen.id} ${screen.name} has no WCAG AA violations`, async ({ page }) => {
      await page.goto(screen.path, { waitUntil: 'domcontentloaded' });
      const results = await scanPage(page);

      expect(
        results.violations,
        `${screen.id} ${screen.name}: ${results.violations.length} violations found`,
      ).toEqual([]);
    });
  }
});

/* ── Tests: Authenticated screens ── */

test.describe('Accessibility — Authenticated Screens', () => {
  for (const screen of AUTHENTICATED_SCREENS) {
    test(`${screen.id} ${screen.name} has no WCAG AA violations`, async ({ page }) => {
      await loginAs(page, screen.role!);
      await page.goto(screen.path, { waitUntil: 'domcontentloaded' });
      const results = await scanPage(page);

      expect(
        results.violations,
        `${screen.id} ${screen.name}: ${results.violations.length} violations found`,
      ).toEqual([]);
    });
  }
});

/* ── Tests: Responsive breakpoints ── */

const BREAKPOINTS = [
  { name: 'Mobile 375', width: 375, height: 812 },
  { name: 'Tablet 768', width: 768, height: 1024 },
  { name: 'Desktop 1440', width: 1440, height: 900 },
];

test.describe('Accessibility — Responsive Breakpoints', () => {
  for (const bp of BREAKPOINTS) {
    test(`Login at ${bp.name} has no WCAG AA violations`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto('/login', { waitUntil: 'domcontentloaded' });
      const results = await scanPage(page);

      expect(
        results.violations,
        `Login at ${bp.name}: ${results.violations.length} violations`,
      ).toEqual([]);
    });
  }
});
