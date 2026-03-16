import { test, expect } from '@playwright/test';

// TC-001: Patient Appointment Booking

test.describe('Patient Appointment Booking', () => {
  test('Patient books, reschedules, cancels appointment', async ({ page }) => {
    // Given a patient is authenticated
    await page.goto('/login');
    await page.fill('#username', 'patient1');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/);

    // When they book an appointment
    await page.click('text=Book Appointment');
    await page.selectOption('#appointment-type', 'General');
    await page.click('button:has-text("Book")');
    await expect(page.locator('.confirmation')).toContainText('confirmed');

    // When they reschedule
    await page.click('text=My Appointments');
    await page.click('button:has-text("Reschedule")');
    await page.selectOption('#appointment-type', 'Specialist');
    await page.click('button:has-text("Reschedule")');
    await expect(page.locator('.confirmation')).toContainText('rescheduled');

    // When they cancel
    await page.click('text=My Appointments');
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('.confirmation')).toContainText('cancelled');
  });
});
