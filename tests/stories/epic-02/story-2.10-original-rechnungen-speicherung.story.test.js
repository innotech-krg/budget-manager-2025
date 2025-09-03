// =====================================================
// Budget Manager 2025 - Story 2.10 Tests
// Epic 2 - Original-Rechnungen Speicherung & Verwaltung
// =====================================================

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('Story 2.10: Original-Rechnungen Speicherung & Verwaltung', () => {
  const testInvoicePath = path.join(__dirname, '../../test-files/test-invoice.pdf');
  
  test.beforeAll(async () => {
    await createTestFiles();
  });

  // Acceptance Criteria 1: Automatic Document Storage
  test('2.10-STORY-001: Should automatically store original documents during OCR processing', async ({ page }) => {
    // Given: User uploads an invoice for OCR processing
    await page.goto('http://localhost:3000/ocr');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testInvoicePath);

    // When: OCR processing completes
    await page.waitForSelector('[data-testid="ocr-results"]', { timeout: 30000 });

    // Then: Original document should be automatically stored and accessible
    await expect(page.locator('[data-testid="document-viewer"]')).toBeVisible();
    await expect(page.locator('[data-testid="original-document"]')).toBeVisible();
    
    // Verify document metadata is displayed
    await expect(page.locator('[data-testid="document-filename"]')).toContainText('test-invoice.pdf');
    await expect(page.locator('[data-testid="document-size"]')).toBeVisible();
    await expect(page.locator('[data-testid="upload-timestamp"]')).toBeVisible();
  });

  // Acceptance Criteria 2: 10-Year Retention Policy
  test('2.10-STORY-002: Should enforce 10-year retention policy automatically', async ({ page }) => {
    // Given: User uploads a document
    await page.goto('http://localhost:3000/ocr');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testInvoicePath);

    // When: Document is stored
    await page.waitForSelector('[data-testid="document-viewer"]', { timeout: 30000 });

    // Then: 10-year retention should be automatically set
    await page.click('[data-testid="document-details-btn"]');
    await expect(page.locator('[data-testid="retention-info"]')).toBeVisible();
    
    const retentionText = await page.locator('[data-testid="retention-date"]').textContent();
    const currentYear = new Date().getFullYear();
    const retentionYear = currentYear + 10;
    
    expect(retentionText).toContain(retentionYear.toString());
    
    // Verify German compliance message
    await expect(page.locator('[data-testid="compliance-message"]')).toContainText('10 Jahre');
    await expect(page.locator('[data-testid="compliance-message"]')).toContainText('deutsche Vorschrift');
  });

  // Acceptance Criteria 3: Supabase Storage Integration
  test('2.10-STORY-003: Should store documents in Supabase Storage with proper organization', async ({ page }) => {
    // Given: User uploads multiple documents
    await page.goto('http://localhost:3000/ocr');
    
    // Upload first document
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testInvoicePath);
    await page.waitForSelector('[data-testid="document-viewer"]', { timeout: 30000 });
    
    // Verify storage information is displayed
    await page.click('[data-testid="document-details-btn"]');
    await expect(page.locator('[data-testid="storage-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="storage-bucket"]')).toContainText('invoice-pdfs');
    
    // Verify document path follows organization pattern
    const storagePath = await page.locator('[data-testid="storage-path"]').textContent();
    expect(storagePath).toMatch(/invoices\/\d{4}\/\d{2}\//); // invoices/YYYY/MM/ pattern
  });

  // Acceptance Criteria 4: Document Access and Download
  test('2.10-STORY-004: Should provide secure document access and download functionality', async ({ page }) => {
    // Given: Document is stored in the system
    await page.goto('http://localhost:3000/ocr');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testInvoicePath);
    await page.waitForSelector('[data-testid="document-viewer"]', { timeout: 30000 });

    // When: User requests document download
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-original-btn"]');
    const download = await downloadPromise;

    // Then: Document should be downloaded with correct filename
    expect(download.suggestedFilename()).toBe('test-invoice.pdf');
    
    // Verify download tracking
    await page.reload();
    await page.waitForSelector('[data-testid="document-viewer"]');
    await page.click('[data-testid="document-details-btn"]');
    
    const accessCount = await page.locator('[data-testid="access-count"]').textContent();
    expect(accessCount).toMatch(/\d+x aufgerufen/);
  });

  // Acceptance Criteria 5: Document Viewing
  test('2.10-STORY-005: Should provide in-browser document viewing capability', async ({ page }) => {
    // Given: Document is stored in the system
    await page.goto('http://localhost:3000/ocr');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testInvoicePath);
    await page.waitForSelector('[data-testid="document-viewer"]', { timeout: 30000 });

    // When: User clicks view document
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      page.click('[data-testid="view-original-btn"]')
    ]);

    // Then: Document should open in new tab with signed URL
    await newPage.waitForLoadState();
    expect(newPage.url()).toMatch(/signed-url|blob:|supabase/);
    
    // Verify document content is accessible
    const title = await newPage.title();
    expect(title).toBeTruthy();
    
    await newPage.close();
  });

  // Acceptance Criteria 6: Project Integration
  test('2.10-STORY-006: Should display original documents in project invoice positions', async ({ page }) => {
    // Given: Invoice is processed and assigned to project
    await page.goto('http://localhost:3000/ocr');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testInvoicePath);
    await page.waitForSelector('[data-testid="ocr-results"]', { timeout: 30000 });

    // Assign to project and approve
    await page.click('[data-testid="confirm-supplier-btn"]');
    
    const projectDropdown = page.locator('[data-testid="project-dropdown"]').first();
    await projectDropdown.click();
    await page.locator('[data-testid^="project-option-"]').first().click();
    
    await page.click('[data-testid="approve-invoice-btn"]');
    await page.waitForSelector('[data-testid="approval-success"]');

    // When: User navigates to project details
    await page.goto('http://localhost:3000/projects');
    await page.click('[data-testid^="project-card-"]');
    await page.waitForSelector('[data-testid="project-details"]');

    // Then: Original document should be accessible from invoice positions
    const invoicePositions = page.locator('[data-testid="invoice-positions-table"]');
    await expect(invoicePositions).toBeVisible();
    
    const documentButton = page.locator('[data-testid="view-document-btn"]').first();
    await expect(documentButton).toBeVisible();
    
    // Click to expand document view
    await documentButton.click();
    await expect(page.locator('[data-testid="embedded-document-viewer"]')).toBeVisible();
  });

  // Acceptance Criteria 7: Duplicate Detection
  test('2.10-STORY-007: Should detect and handle duplicate documents', async ({ page }) => {
    // Given: User uploads a document
    await page.goto('http://localhost:3000/ocr');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testInvoicePath);
    await page.waitForSelector('[data-testid="document-viewer"]', { timeout: 30000 });

    // When: User uploads the same document again
    await page.goto('http://localhost:3000/ocr');
    await fileInput.setInputFiles(testInvoicePath);

    // Then: Duplicate should be detected and handled appropriately
    await page.waitForSelector('[data-testid="duplicate-detection"]', { timeout: 15000 });
    await expect(page.locator('[data-testid="duplicate-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="duplicate-warning"]')).toContainText('bereits vorhanden');
    
    // User should have options to proceed or cancel
    await expect(page.locator('[data-testid="proceed-anyway-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="cancel-upload-btn"]')).toBeVisible();
  });

  // Acceptance Criteria 8: Version Management
  test('2.10-STORY-008: Should handle document versions for modified files', async ({ page }) => {
    // Given: Original document is uploaded
    await page.goto('http://localhost:3000/ocr');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testInvoicePath);
    await page.waitForSelector('[data-testid="document-viewer"]', { timeout: 30000 });

    // Create a modified version
    const modifiedPath = path.join(__dirname, '../../test-files/modified-invoice.pdf');
    const originalContent = fs.readFileSync(testInvoicePath);
    const modifiedContent = Buffer.concat([originalContent, Buffer.from('\n% Modified')]);
    fs.writeFileSync(modifiedPath, modifiedContent);

    // When: Modified version is uploaded
    await page.goto('http://localhost:3000/documents/upload');
    await page.setInputFiles('[data-testid="file-input"]', modifiedPath);
    await page.click('[data-testid="upload-btn"]');

    // Then: New version should be created
    await page.waitForSelector('[data-testid="version-info"]');
    await expect(page.locator('[data-testid="version-number"]')).toContainText('Version 2');
    
    // Both versions should be accessible
    await expect(page.locator('[data-testid="version-history"]')).toBeVisible();
    const versionList = page.locator('[data-testid^="version-"]');
    const versionCount = await versionList.count();
    expect(versionCount).toBe(2);

    // Cleanup
    fs.unlinkSync(modifiedPath);
  });

  // Acceptance Criteria 9: Access Logging and Audit Trail
  test('2.10-STORY-009: Should maintain comprehensive access logs for audit compliance', async ({ page }) => {
    // Given: Document is stored and accessed multiple times
    await page.goto('http://localhost:3000/ocr');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testInvoicePath);
    await page.waitForSelector('[data-testid="document-viewer"]', { timeout: 30000 });

    // Perform various access operations
    await page.click('[data-testid="view-original-btn"]');
    await page.waitForTimeout(1000);
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-original-btn"]');
    await downloadPromise;

    // When: User views access log
    await page.click('[data-testid="document-details-btn"]');
    await page.click('[data-testid="view-access-log-btn"]');

    // Then: Comprehensive audit trail should be displayed
    await expect(page.locator('[data-testid="access-log"]')).toBeVisible();
    
    const logEntries = page.locator('[data-testid^="log-entry-"]');
    const entryCount = await logEntries.count();
    expect(entryCount).toBeGreaterThan(0);
    
    // Verify log entry details
    const firstEntry = logEntries.first();
    await expect(firstEntry.locator('[data-testid="access-type"]')).toBeVisible();
    await expect(firstEntry.locator('[data-testid="access-timestamp"]')).toBeVisible();
    await expect(firstEntry.locator('[data-testid="access-user"]')).toBeVisible();
    
    // Verify German timestamp format
    const timestamp = await firstEntry.locator('[data-testid="access-timestamp"]').textContent();
    expect(timestamp).toMatch(/\d{2}\.\d{2}\.\d{4}/); // DD.MM.YYYY format
  });

  // Acceptance Criteria 10: German Filename Support
  test('2.10-STORY-010: Should handle German characters in filenames correctly', async ({ page }) => {
    // Given: File with German characters in name
    const germanPath = path.join(__dirname, '../../test-files/Rechnung_Müller_&_Söhne_GmbH.pdf');
    fs.copyFileSync(testInvoicePath, germanPath);

    // When: User uploads file with German characters
    await page.goto('http://localhost:3000/documents/upload');
    await page.setInputFiles('[data-testid="file-input"]', germanPath);
    await page.click('[data-testid="upload-btn"]');

    // Then: German characters should be preserved and displayed correctly
    await page.waitForSelector('[data-testid="upload-success"]');
    await expect(page.locator('[data-testid="uploaded-filename"]')).toContainText('Müller_&_Söhne');
    
    // Verify in document viewer
    await expect(page.locator('[data-testid="document-filename"]')).toContainText('Rechnung_Müller_&_Söhne_GmbH.pdf');
    
    // Verify download preserves German characters
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-btn"]');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('Rechnung_Müller_&_Söhne_GmbH.pdf');

    // Cleanup
    fs.unlinkSync(germanPath);
  });

  // Acceptance Criteria 11: Storage Optimization
  test('2.10-STORY-011: Should optimize storage usage and provide storage statistics', async ({ page }) => {
    // Given: Multiple documents are uploaded
    await page.goto('http://localhost:3000/ocr');
    const fileInput = page.locator('input[type="file"]');
    
    // Upload multiple documents
    for (let i = 0; i < 3; i++) {
      await fileInput.setInputFiles(testInvoicePath);
      await page.waitForSelector('[data-testid="document-viewer"]', { timeout: 30000 });
      if (i < 2) {
        await page.reload();
      }
    }

    // When: User views storage statistics
    await page.goto('http://localhost:3000/admin/storage');
    await page.waitForSelector('[data-testid="storage-stats"]');

    // Then: Storage information should be displayed
    await expect(page.locator('[data-testid="total-documents"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-storage-used"]')).toBeVisible();
    await expect(page.locator('[data-testid="storage-by-month"]')).toBeVisible();
    
    // Verify German formatting
    const storageUsed = await page.locator('[data-testid="total-storage-used"]').textContent();
    expect(storageUsed).toMatch(/(KB|MB|GB)/);
  });

  // Acceptance Criteria 12: Error Handling and Recovery
  test('2.10-STORY-012: Should handle storage errors gracefully with user feedback', async ({ page }) => {
    // Given: User attempts to upload a very large file (simulated)
    await page.goto('http://localhost:3000/documents/upload');
    
    // Create a large file (simulated by modifying client-side validation)
    await page.evaluate(() => {
      // Mock a large file scenario
      window.simulateLargeFile = true;
    });

    // When: Upload is attempted
    const fileInput = page.locator('[data-testid="file-input"]');
    await fileInput.setInputFiles(testInvoicePath);
    await page.click('[data-testid="upload-btn"]');

    // Then: Appropriate error message should be displayed
    await page.waitForSelector('[data-testid="upload-error"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    
    // Verify German error message
    const errorText = await page.locator('[data-testid="error-message"]').textContent();
    expect(errorText).toMatch(/(Fehler|Datei zu groß|Upload fehlgeschlagen)/);
    
    // Verify retry option is available
    await expect(page.locator('[data-testid="retry-upload-btn"]')).toBeVisible();
  });

  // Helper function to create test files
  async function createTestFiles() {
    const testFilesDir = path.join(__dirname, '../../test-files');
    
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }

    if (!fs.existsSync(testInvoicePath)) {
      const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000074 00000 n 
0000000120 00000 n 
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
179
%%EOF`;
      fs.writeFileSync(testInvoicePath, pdfContent);
    }
  }
});
