import { Page, Locator } from '@playwright/test';

export class StaffDashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get dashboardHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Staff Dashboard' });
  }

  get queueManagementLink(): Locator {
    return this.page.getByRole('link', { name: 'Queue Management' });
  }

  async navigateToQueueManagement(): Promise<void> {
    await this.queueManagementLink.click();
  }
}
