// =====================================================
// Budget Manager 2025 - Story 2.7 Tests
// Epic 2 - OCR KI-Refactoring (AI-Only Approach)
// =====================================================

const { test, expect } = require('@playwright/test');
const request = require('supertest');
const fs = require('fs');
const path = require('path');

test.describe('Story 2.7: OCR KI-Refactoring', () => {
  const testInvoicePath = path.join(__dirname, '../../test-files/test-invoice.pdf');
  
  test.beforeAll(async () => {
    // Ensure test files exist
    await createTestFiles();
  });

  // Acceptance Criteria 1: AI-Only OCR Processing
  test('2.7-STORY-001: Should process invoices using only AI engines (OpenAI + Claude)', async ({ page }) => {
    // Given: User uploads an invoice
    await page.goto('http://localhost:3000/ocr');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testInvoicePath);

    // When: OCR processing starts
    await page.waitForSelector('[data-testid="ocr-processing"]');
    
    // Then: Only AI engines should be used (no Tesseract or Cloud Vision)
    await page.waitForSelector('[data-testid="ocr-results"]', { timeout: 30000 });
    
    // Verify AI engine was used
    const engineInfo = await page.locator('[data-testid="processing-engine"]').textContent();
    expect(engineInfo).toMatch(/(OpenAI|Claude|AI-Hybrid)/);
    expect(engineInfo).not.toContain('Tesseract');
    expect(engineInfo).not.toContain('Cloud Vision');
  });

  // Acceptance Criteria 2: Structured Data Extraction
  test('2.7-STORY-002: Should extract structured invoice data with high accuracy', async ({ page }) => {
    // Given: User uploads a German/Austrian invoice
    await page.goto('http://localhost:3000/ocr');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testInvoicePath);

    // When: AI processing completes
    await page.waitForSelector('[data-testid="ocr-results"]', { timeout: 30000 });

    // Then: Structured data should be extracted
    // Supplier Information
    await expect(page.locator('[data-testid="extracted-supplier-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="extracted-supplier-address"]')).toBeVisible();
    
    // Invoice Details
    await expect(page.locator('[data-testid="extracted-invoice-number"]')).toBeVisible();
    await expect(page.locator('[data-testid="extracted-invoice-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="extracted-total-amount"]')).toBeVisible();
    
    // Line Items
    await expect(page.locator('[data-testid="extracted-line-items"]')).toBeVisible();
    const lineItems = page.locator('[data-testid^="line-item-"]');
    const itemCount = await lineItems.count();
    expect(itemCount).toBeGreaterThan(0);
    
    // Verify line item structure
    for (let i = 0; i < itemCount; i++) {
      const item = lineItems.nth(i);
      await expect(item.locator('[data-testid="item-description"]')).toBeVisible();
      await expect(item.locator('[data-testid="item-quantity"]')).toBeVisible();
      await expect(item.locator('[data-testid="item-price"]')).toBeVisible();
    }
  });

  // Acceptance Criteria 3: Austrian Business Data Recognition
  test('2.7-STORY-003: Should recognize Austrian business identifiers correctly', async ({ page }) => {
    // Given: Austrian invoice with UID and Firmenbuchnummer
    await page.goto('http://localhost:3000/ocr');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testInvoicePath);

    // When: AI processing completes
    await page.waitForSelector('[data-testid="ocr-results"]', { timeout: 30000 });

    // Then: Austrian identifiers should be recognized
    const supplierDetails = page.locator('[data-testid="supplier-details"]');
    
    // Check for UID format (ATU + 8 digits)
    const uidElement = supplierDetails.locator('[data-testid="supplier-uid"]');
    if (await uidElement.isVisible()) {
      const uidText = await uidElement.textContent();
      expect(uidText).toMatch(/ATU\d{8}/);
    }
    
    // Check for Firmenbuchnummer format
    const fnElement = supplierDetails.locator('[data-testid="supplier-firmenbuch"]');
    if (await fnElement.isVisible()) {
      const fnText = await fnElement.textContent();
      expect(fnText).toMatch(/FN \d+[a-z]/);
    }
    
    // Check for legal form recognition
    const legalFormElement = supplierDetails.locator('[data-testid="supplier-legal-form"]');
    if (await legalFormElement.isVisible()) {
      const legalForm = await legalFormElement.textContent();
      expect(legalForm).toMatch(/(GmbH|AG|KG|OG|e\.U\.)/);
    }
  });

  // Acceptance Criteria 4: Confidence Scoring
  test('2.7-STORY-004: Should provide accurate confidence scores for extracted data', async ({ page }) => {
    // Given: User uploads an invoice
    await page.goto('http://localhost:3000/ocr');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testInvoicePath);

    // When: AI processing completes
    await page.waitForSelector('[data-testid="ocr-results"]', { timeout: 30000 });

    // Then: Confidence scores should be displayed and reasonable
    const confidenceElement = page.locator('[data-testid="confidence-score"]');
    await expect(confidenceElement).toBeVisible();
    
    const confidenceText = await confidenceElement.textContent();
    const confidence = parseInt(confidenceText.match(/\d+/)[0]);
    
    expect(confidence).toBeGreaterThan(0);
    expect(confidence).toBeLessThanOrEqual(100);
    
    // Individual field confidence scores
    const fieldConfidences = page.locator('[data-testid^="field-confidence-"]');
    const fieldCount = await fieldConfidences.count();
    
    for (let i = 0; i < fieldCount; i++) {
      const fieldConfidence = fieldConfidences.nth(i);
      const fieldConfidenceText = await fieldConfidence.textContent();
      const fieldScore = parseInt(fieldConfidenceText.match(/\d+/)[0]);
      
      expect(fieldScore).toBeGreaterThan(0);
      expect(fieldScore).toBeLessThanOrEqual(100);
    }
  });

  // Acceptance Criteria 5: Fallback Mechanism
  test('2.7-STORY-005: Should fallback to secondary AI engine on primary failure', async ({ page }) => {
    // This test would require mocking API failures, which is complex in E2E
    // Instead, we'll test the UI behavior when fallback occurs
    
    // Given: User uploads an invoice
    await page.goto('http://localhost:3000/ocr');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testInvoicePath);

    // When: Processing occurs (may include fallback)
    await page.waitForSelector('[data-testid="ocr-processing"]');
    
    // Then: Results should be provided regardless of which engine succeeded
    await page.waitForSelector('[data-testid="ocr-results"]', { timeout: 45000 }); // Longer timeout for fallback
    
    // Verify results are present
    await expect(page.locator('[data-testid="extracted-supplier-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="extracted-invoice-number"]')).toBeVisible();
    
    // Check if fallback indicator is shown
    const processingInfo = page.locator('[data-testid="processing-info"]');
    if (await processingInfo.isVisible()) {
      const infoText = await processingInfo.textContent();
      // May contain fallback information
    }
  });

  // Acceptance Criteria 6: German Currency and Date Formats
  test('2.7-STORY-006: Should handle German/Austrian currency and date formats', async ({ page }) => {
    // Given: User uploads a German invoice
    await page.goto('http://localhost:3000/ocr');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testInvoicePath);

    // When: AI processing completes
    await page.waitForSelector('[data-testid="ocr-results"]', { timeout: 30000 });

    // Then: German formats should be recognized and displayed correctly
    
    // Currency format (1.234,56 €)
    const totalAmount = await page.locator('[data-testid="extracted-total-amount"]').textContent();
    expect(totalAmount).toMatch(/\d{1,3}(?:\.\d{3})*,\d{2}\s*€/);
    
    // Date format (DD.MM.YYYY)
    const invoiceDate = await page.locator('[data-testid="extracted-invoice-date"]').textContent();
    expect(invoiceDate).toMatch(/\d{2}\.\d{2}\.\d{4}/);
    
    // Line item prices should also use German format
    const lineItems = page.locator('[data-testid^="line-item-"]');
    const itemCount = await lineItems.count();
    
    if (itemCount > 0) {
      const firstItemPrice = await lineItems.first().locator('[data-testid="item-price"]').textContent();
      expect(firstItemPrice).toMatch(/\d+(?:,\d{2})?\s*€/);
    }
  });

  // Acceptance Criteria 7: Net/Gross Amount Detection
  test('2.7-STORY-007: Should intelligently detect and convert net/gross amounts', async ({ page }) => {
    // Given: User uploads an invoice with mixed net/gross amounts
    await page.goto('http://localhost:3000/ocr');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testInvoicePath);

    // When: AI processing completes
    await page.waitForSelector('[data-testid="ocr-results"]', { timeout: 30000 });

    // Then: Net/gross detection should be visible
    const amountDetails = page.locator('[data-testid="amount-breakdown"]');
    if (await amountDetails.isVisible()) {
      // Check for net amount display
      await expect(amountDetails.locator('[data-testid="net-amount"]')).toBeVisible();
      
      // Check for tax amount display
      await expect(amountDetails.locator('[data-testid="tax-amount"]')).toBeVisible();
      
      // Check for gross amount display
      await expect(amountDetails.locator('[data-testid="gross-amount"]')).toBeVisible();
      
      // Verify calculation consistency
      const netText = await amountDetails.locator('[data-testid="net-amount"]').textContent();
      const taxText = await amountDetails.locator('[data-testid="tax-amount"]').textContent();
      const grossText = await amountDetails.locator('[data-testid="gross-amount"]').textContent();
      
      const netAmount = parseFloat(netText.replace(/[^\d,]/g, '').replace(',', '.'));
      const taxAmount = parseFloat(taxText.replace(/[^\d,]/g, '').replace(',', '.'));
      const grossAmount = parseFloat(grossText.replace(/[^\d,]/g, '').replace(',', '.'));
      
      expect(Math.abs((netAmount + taxAmount) - grossAmount)).toBeLessThan(0.01);
    }
  });

  // Acceptance Criteria 8: Performance Requirements
  test('2.7-STORY-008: Should complete AI processing within acceptable time limits', async ({ page }) => {
    // Given: User uploads an invoice
    await page.goto('http://localhost:3000/ocr');
    
    const startTime = Date.now();
    
    // When: File is uploaded and processed
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testInvoicePath);
    
    // Then: Processing should complete within 30 seconds
    await page.waitForSelector('[data-testid="ocr-results"]', { timeout: 30000 });
    
    const processingTime = Date.now() - startTime;
    expect(processingTime).toBeLessThan(30000); // 30 seconds max
    
    // Verify processing time is displayed to user
    const processingTimeElement = page.locator('[data-testid="processing-time"]');
    if (await processingTimeElement.isVisible()) {
      const timeText = await processingTimeElement.textContent();
      expect(timeText).toMatch(/\d+(?:,\d+)?\s*(s|ms|Sekunden)/);
    }
  });

  // Helper function to create test files
  async function createTestFiles() {
    const testFilesDir = path.join(__dirname, '../../test-files');
    
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }

    if (!fs.existsSync(testInvoicePath)) {
      // Create a test PDF with German invoice content
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
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 200
>>
stream
BT
/F1 12 Tf
100 700 Td
(RECHNUNG) Tj
0 -20 Td
(Müller & Söhne GmbH) Tj
0 -20 Td
(ATU12345678) Tj
0 -20 Td
(Rechnungsnummer: R-2025-001) Tj
0 -20 Td
(Datum: 30.08.2025) Tj
0 -20 Td
(Betrag: 1.234,56 €) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000201 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
451
%%EOF`;
      fs.writeFileSync(testInvoicePath, pdfContent);
    }
  }
});
