import { Page, Locator } from '@playwright/test';

export class DocumentUploadPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get fileInput(): Locator {
    return this.page.getByLabel('Select File');
  }

  get documentTypeSelect(): Locator {
    return this.page.getByLabel('Document Type');
  }

  get uploadButton(): Locator {
    return this.page.getByRole('button', { name: 'Upload' });
  }

  get successMessage(): Locator {
    return this.page.getByText('Document uploaded successfully');
  }

  get aiExtractionStatus(): Locator {
    return this.page.getByText('AI extraction in progress');
  }

  get errorAlert(): Locator {
    return this.page.getByRole('alert');
  }

  async uploadDocument(filePath: string, type: string): Promise<void> {
    await this.fileInput.setInputFiles(filePath);
    await this.documentTypeSelect.selectOption(type);
    await this.uploadButton.click();
  }
}
