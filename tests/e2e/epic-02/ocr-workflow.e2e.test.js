// =====================================================
// Budget Manager 2025 - OCR Workflow End-to-End Tests
// Epic 2 - Vollständiger OCR-zu-Budget Workflow
// =====================================================

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('OCR Workflow E2E', () => {
  const testInvoicePath = path.join(__dirname, '../../test-files/test-invoice.pdf');
  
  test.beforeAll(async () => {
    // Ensure test files exist
    await createTestFiles();
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to application
    await page.goto('http://localhost:3000');
    
    // Wait for app to load
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 });
  });

  test('2.E2E-001: Complete OCR workflow - Upload to Budget Assignment', async ({ page }) => {
    // Step 1: Navigate to OCR page
    await page.click('[data-testid="nav-ocr"]');
    await page.waitForSelector('[data-testid="ocr-upload-area"]');

    // Step 2: Upload invoice
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testInvoicePath);

    // Step 3: Wait for OCR processing
    await page.waitForSelector('[data-testid="ocr-processing"]', { timeout: 5000 });
    await page.waitForSelector('[data-testid="ocr-results"]', { timeout: 30000 });

    // Step 4: Verify OCR results display
    await expect(page.locator('[data-testid="extracted-supplier-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="extracted-invoice-number"]')).toBeVisible();
    await expect(page.locator('[data-testid="extracted-total-amount"]')).toBeVisible();

    // Step 5: Verify confidence score is reasonable
    const confidenceText = await page.locator('[data-testid="confidence-score"]').textContent();
    const confidence = parseInt(confidenceText.match(/\d+/)[0]);
    expect(confidence).toBeGreaterThan(50);
    expect(confidence).toBeLessThanOrEqual(100);

    // Step 6: Verify supplier confirmation section
    await expect(page.locator('[data-testid="supplier-confirmation"]')).toBeVisible();
    
    // Step 7: Confirm supplier
    await page.click('[data-testid="confirm-supplier-btn"]');
    await page.waitForSelector('[data-testid="supplier-confirmed"]');

    // Step 8: Verify project assignment section
    await expect(page.locator('[data-testid="project-assignments"]')).toBeVisible();
    
    // Step 9: Assign line items to projects
    const lineItems = page.locator('[data-testid^="line-item-"]');
    const itemCount = await lineItems.count();
    
    for (let i = 0; i < itemCount; i++) {
      const projectDropdown = lineItems.nth(i).locator('[data-testid="project-dropdown"]');
      await projectDropdown.click();
      
      // Select first available project
      const firstProject = page.locator('[data-testid^="project-option-"]').first();
      await firstProject.click();
      
      // Verify assignment
      await expect(lineItems.nth(i).locator('[data-testid="project-assigned"]')).toBeVisible();
    }

    // Step 10: Verify budget impact display
    await expect(page.locator('[data-testid="budget-impact"]')).toBeVisible();
    const budgetImpact = await page.locator('[data-testid="budget-impact-amount"]').textContent();
    expect(budgetImpact).toMatch(/\d+[.,]\d{2}\s*€/); // German currency format

    // Step 11: Approve invoice
    await page.click('[data-testid="approve-invoice-btn"]');
    
    // Step 12: Wait for approval confirmation
    await page.waitForSelector('[data-testid="approval-success"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="approval-success"]')).toContainText('erfolgreich');

    // Step 13: Verify redirect to dashboard or success page
    await page.waitForURL(/\/(dashboard|success)/, { timeout: 5000 });

    // Step 14: Navigate to projects to verify budget update
    await page.click('[data-testid="nav-projects"]');
    await page.waitForSelector('[data-testid="projects-list"]');

    // Step 15: Check that project budget was updated
    const projectCard = page.locator('[data-testid^="project-card-"]').first();
    await expect(projectCard.locator('[data-testid="consumed-budget"]')).toBeVisible();
    
    const consumedBudget = await projectCard.locator('[data-testid="consumed-budget"]').textContent();
    expect(consumedBudget).toMatch(/\d+[.,]\d{2}\s*€/);
  });

  test('2.E2E-002: OCR with manual corrections and reprocessing', async ({ page }) => {
    // Step 1: Upload invoice
    await page.goto('http://localhost:3000/ocr');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testInvoicePath);

    // Step 2: Wait for OCR results
    await page.waitForSelector('[data-testid="ocr-results"]', { timeout: 30000 });

    // Step 3: Make manual corrections
    const supplierNameField = page.locator('[data-testid="supplier-name-input"]');
    await supplierNameField.clear();
    await supplierNameField.fill('Corrected Supplier GmbH');

    const invoiceNumberField = page.locator('[data-testid="invoice-number-input"]');
    await invoiceNumberField.clear();
    await invoiceNumberField.fill('CORR-2025-001');

    // Step 4: Verify corrections are reflected in UI
    await expect(page.locator('[data-testid="supplier-name-display"]')).toContainText('Corrected Supplier GmbH');
    await expect(page.locator('[data-testid="invoice-number-display"]')).toContainText('CORR-2025-001');

    // Step 5: Add manual line item
    await page.click('[data-testid="add-manual-item-btn"]');
    await page.fill('[data-testid="manual-item-description"]', 'Manual Test Item');
    await page.fill('[data-testid="manual-item-quantity"]', '2');
    await page.fill('[data-testid="manual-item-price"]', '150.00');
    await page.click('[data-testid="save-manual-item-btn"]');

    // Step 6: Verify manual item appears in list
    await expect(page.locator('[data-testid="line-items-list"]')).toContainText('Manual Test Item');

    // Step 7: Proceed with approval
    await page.click('[data-testid="confirm-supplier-btn"]');
    await page.click('[data-testid="approve-invoice-btn"]');

    // Step 8: Verify success with corrections
    await page.waitForSelector('[data-testid="approval-success"]');
    await expect(page.locator('[data-testid="approval-success"]')).toContainText('Korrekturen gespeichert');
  });

  test('2.E2E-003: Document viewer integration during OCR review', async ({ page }) => {
    // Step 1: Upload invoice
    await page.goto('http://localhost:3000/ocr');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testInvoicePath);

    // Step 2: Wait for OCR processing and document storage
    await page.waitForSelector('[data-testid="ocr-results"]', { timeout: 30000 });

    // Step 3: Verify document viewer is displayed
    await expect(page.locator('[data-testid="document-viewer"]')).toBeVisible();
    await expect(page.locator('[data-testid="original-document"]')).toBeVisible();

    // Step 4: Test document download
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-original-btn"]');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('test-invoice.pdf');

    // Step 5: Test document view in new tab
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      page.click('[data-testid="view-original-btn"]')
    ]);
    
    await newPage.waitForLoadState();
    expect(newPage.url()).toMatch(/signed-url|blob:/);
    await newPage.close();

    // Step 6: Verify document metadata display
    await page.click('[data-testid="document-details-btn"]');
    await expect(page.locator('[data-testid="document-metadata"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-size"]')).toContainText('KB');
    await expect(page.locator('[data-testid="upload-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="retention-date"]')).toContainText('2035'); // 10 years retention
  });

  test('2.E2E-004: Project budget impact visualization', async ({ page }) => {
    // Step 1: Navigate to projects and note initial budget
    await page.goto('http://localhost:3000/projects');
    await page.waitForSelector('[data-testid="projects-list"]');
    
    const firstProject = page.locator('[data-testid^="project-card-"]').first();
    const initialBudget = await firstProject.locator('[data-testid="available-budget"]').textContent();
    const initialAmount = parseFloat(initialBudget.replace(/[^\d,]/g, '').replace(',', '.'));

    // Step 2: Upload and process invoice
    await page.goto('http://localhost:3000/ocr');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testInvoicePath);
    await page.waitForSelector('[data-testid="ocr-results"]', { timeout: 30000 });

    // Step 3: Assign all items to the first project
    const lineItems = page.locator('[data-testid^="line-item-"]');
    const itemCount = await lineItems.count();
    let totalAssigned = 0;

    for (let i = 0; i < itemCount; i++) {
      const item = lineItems.nth(i);
      const amountText = await item.locator('[data-testid="item-amount"]').textContent();
      const amount = parseFloat(amountText.replace(/[^\d,]/g, '').replace(',', '.'));
      totalAssigned += amount;

      const projectDropdown = item.locator('[data-testid="project-dropdown"]');
      await projectDropdown.click();
      await page.locator('[data-testid^="project-option-"]').first().click();
    }

    // Step 4: Verify budget impact preview
    const budgetImpactAmount = await page.locator('[data-testid="budget-impact-amount"]').textContent();
    const impactAmount = parseFloat(budgetImpactAmount.replace(/[^\d,]/g, '').replace(',', '.'));
    expect(Math.abs(impactAmount - totalAssigned)).toBeLessThan(0.01); // Allow for rounding

    // Step 5: Approve invoice
    await page.click('[data-testid="confirm-supplier-btn"]');
    await page.click('[data-testid="approve-invoice-btn"]');
    await page.waitForSelector('[data-testid="approval-success"]');

    // Step 6: Verify budget was actually updated
    await page.goto('http://localhost:3000/projects');
    await page.waitForSelector('[data-testid="projects-list"]');
    
    const updatedProject = page.locator('[data-testid^="project-card-"]').first();
    const finalBudget = await updatedProject.locator('[data-testid="available-budget"]').textContent();
    const finalAmount = parseFloat(finalBudget.replace(/[^\d,]/g, '').replace(',', '.'));

    expect(finalAmount).toBeLessThan(initialAmount);
    expect(Math.abs((initialAmount - finalAmount) - totalAssigned)).toBeLessThan(0.01);
  });

  test('2.E2E-005: Error handling and recovery', async ({ page }) => {
    // Step 1: Test with corrupted file
    await page.goto('http://localhost:3000/ocr');
    
    // Create a corrupted file
    const corruptedPath = path.join(__dirname, '../../test-files/corrupted.pdf');
    fs.writeFileSync(corruptedPath, 'This is not a valid PDF file');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(corruptedPath);

    // Step 2: Verify error handling
    await page.waitForSelector('[data-testid="ocr-error"]', { timeout: 15000 });
    await expect(page.locator('[data-testid="ocr-error"]')).toContainText('Fehler');

    // Step 3: Test retry functionality
    await page.click('[data-testid="retry-ocr-btn"]');
    await fileInput.setInputFiles(testInvoicePath);
    await page.waitForSelector('[data-testid="ocr-results"]', { timeout: 30000 });

    // Step 4: Verify successful recovery
    await expect(page.locator('[data-testid="extracted-supplier-name"]')).toBeVisible();

    // Cleanup
    fs.unlinkSync(corruptedPath);
  });

  test('2.E2E-006: Mobile responsiveness', async ({ page }) => {
    // Step 1: Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Step 2: Navigate to OCR page
    await page.goto('http://localhost:3000/ocr');
    
    // Step 3: Verify mobile layout
    await expect(page.locator('[data-testid="mobile-ocr-layout"]')).toBeVisible();
    
    // Step 4: Test mobile file upload
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testInvoicePath);
    
    // Step 5: Verify mobile OCR results layout
    await page.waitForSelector('[data-testid="ocr-results"]', { timeout: 30000 });
    await expect(page.locator('[data-testid="mobile-results-layout"]')).toBeVisible();
    
    // Step 6: Test mobile project assignment
    const projectDropdown = page.locator('[data-testid="project-dropdown"]').first();
    await projectDropdown.click();
    await expect(page.locator('[data-testid="mobile-project-list"]')).toBeVisible();
  });

  test('2.E2E-007: Accessibility compliance', async ({ page }) => {
    // Step 1: Navigate to OCR page
    await page.goto('http://localhost:3000/ocr');
    
    // Step 2: Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    // Step 3: Test screen reader labels
    const uploadArea = page.locator('[data-testid="ocr-upload-area"]');
    await expect(uploadArea).toHaveAttribute('aria-label');
    
    // Step 4: Upload file and test results accessibility
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testInvoicePath);
    await page.waitForSelector('[data-testid="ocr-results"]', { timeout: 30000 });
    
    // Step 5: Verify ARIA labels on form elements
    const supplierInput = page.locator('[data-testid="supplier-name-input"]');
    await expect(supplierInput).toHaveAttribute('aria-label');
    
    const invoiceInput = page.locator('[data-testid="invoice-number-input"]');
    await expect(invoiceInput).toHaveAttribute('aria-label');
    
    // Step 6: Test focus management
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('2.E2E-008: Performance benchmarks', async ({ page }) => {
    // Step 1: Start performance monitoring
    await page.goto('http://localhost:3000/ocr');
    
    // Step 2: Measure upload and processing time
    const startTime = Date.now();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testInvoicePath);
    
    // Step 3: Wait for OCR completion
    await page.waitForSelector('[data-testid="ocr-results"]', { timeout: 30000 });
    const processingTime = Date.now() - startTime;
    
    // Step 4: Verify performance benchmarks
    expect(processingTime).toBeLessThan(25000); // Should complete within 25 seconds
    
    // Step 5: Measure UI responsiveness
    const uiStartTime = Date.now();
    await page.click('[data-testid="confirm-supplier-btn"]');
    await page.waitForSelector('[data-testid="supplier-confirmed"]');
    const uiResponseTime = Date.now() - uiStartTime;
    
    expect(uiResponseTime).toBeLessThan(2000); // UI should respond within 2 seconds
    
    // Step 6: Measure approval processing
    const approvalStartTime = Date.now();
    await page.click('[data-testid="approve-invoice-btn"]');
    await page.waitForSelector('[data-testid="approval-success"]');
    const approvalTime = Date.now() - approvalStartTime;
    
    expect(approvalTime).toBeLessThan(5000); // Approval should complete within 5 seconds
  });

  // Helper function to create test files
  async function createTestFiles() {
    const testFilesDir = path.join(__dirname, '../../test-files');
    
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }

    if (!fs.existsSync(testInvoicePath)) {
      // Create a minimal PDF for testing
      const pdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n179\n%%EOF';
      fs.writeFileSync(testInvoicePath, pdfContent);
    }
  }
});
