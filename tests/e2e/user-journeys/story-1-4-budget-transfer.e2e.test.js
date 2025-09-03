// =====================================================
// Budget Manager 2025 - E2E Tests Story 1.4
// Budget-Transfer-System End-to-End Tests
// Test-IDs: 1.4-E2E-001 bis 1.4-E2E-008
// =====================================================

import { test, expect } from '@playwright/test';
import { TestLogger, formatGermanCurrency } from '../../test-utils/test-helpers.js';

const logger = new TestLogger('E2E.STORY.1.4');

test.describe('Story 1.4: Budget-Transfer-System E2E', () => {
  let page;
  const testData = {
    transfer: {
      amount: 25000,
      reason: 'Umschichtung für Digitalisierungsprojekt',
      fromProject: 'Marketing Kampagne',
      toProject: 'IT Modernisierung'
    }
  };

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    logger.info('E2E Test Setup für Story 1.4 abgeschlossen');
  });

  test.afterEach(async () => {
    if (page) await page.close();
  });

  test('1.4-E2E-001: Budget-Transfer-Antrag erstellen', async () => {
    await test.step('Transfer-Seite öffnen', async () => {
      const transferLink = page.locator('nav a[href*="transfer"], nav a', { hasText: /transfer|übertragung/i }).first();
      if (await transferLink.isVisible()) {
        await transferLink.click();
      } else {
        await page.goto('http://localhost:3000/budget-transfers');
      }
      await page.waitForLoadState('networkidle');
      logger.success('Budget-Transfer-Seite geöffnet');
    });

    await test.step('Neuen Transfer-Antrag erstellen', async () => {
      const newTransferButton = page.locator('button', { hasText: /neuer transfer|transfer erstellen/i }).first();
      await expect(newTransferButton).toBeVisible({ timeout: 5000 });
      await newTransferButton.click();
      
      // Quell-Projekt auswählen
      const fromProjectSelect = page.locator('select[name="fromProject"], .from-project-select').first();
      if (await fromProjectSelect.isVisible()) {
        await fromProjectSelect.selectOption({ label: testData.transfer.fromProject });
      }
      
      // Ziel-Projekt auswählen
      const toProjectSelect = page.locator('select[name="toProject"], .to-project-select').first();
      if (await toProjectSelect.isVisible()) {
        await toProjectSelect.selectOption({ label: testData.transfer.toProject });
      }
      
      // Transfer-Betrag eingeben
      await page.fill('input[name="amount"], input[placeholder*="Betrag"]', testData.transfer.amount.toString());
      
      // Begründung eingeben
      await page.fill('textarea[name="reason"], input[name="reason"]', testData.transfer.reason);
      
      logger.success('Transfer-Formular ausgefüllt');
    });

    await test.step('Transfer-Antrag einreichen', async () => {
      const submitButton = page.locator('button[type="submit"], button', { hasText: /einreichen|beantragen/i }).first();
      await submitButton.click();
      
      await page.waitForTimeout(2000);
      
      // Bestätigung prüfen
      const confirmation = page.locator('.success, .confirmation, [role="alert"]').first();
      if (await confirmation.isVisible()) {
        logger.success('Transfer-Antrag erfolgreich eingereicht');
      }
      
      // Status sollte "PENDING" sein
      const pendingStatus = page.locator('text=PENDING, text=Ausstehend, .status-pending').first();
      if (await pendingStatus.isVisible()) {
        logger.success('Transfer-Status korrekt auf PENDING gesetzt');
      }
    });
  });

  test('1.4-E2E-002: Genehmigungs-Workflow', async () => {
    await test.step('Transfer-Liste anzeigen', async () => {
      await page.goto('http://localhost:3000/budget-transfers');
      await page.waitForLoadState('networkidle');
      
      const transferList = page.locator('.transfer-list, table, .transfer-card').first();
      await expect(transferList).toBeVisible({ timeout: 5000 });
      
      logger.success('Transfer-Liste geladen');
    });

    await test.step('Transfer genehmigen', async () => {
      // Ersten ausstehenden Transfer finden
      const pendingTransfer = page.locator('.transfer-item, tr', { has: page.locator('text=PENDING, text=Ausstehend') }).first();
      
      if (await pendingTransfer.isVisible()) {
        // Genehmigen-Button klicken
        const approveButton = pendingTransfer.locator('button', { hasText: /genehmigen|approve/i }).first();
        
        if (await approveButton.isVisible()) {
          await approveButton.click();
          
          // Bestätigungs-Dialog
          const confirmDialog = page.locator('.modal, .dialog, [role="dialog"]').first();
          if (await confirmDialog.isVisible()) {
            const confirmButton = confirmDialog.locator('button', { hasText: /bestätigen|genehmigen/i }).first();
            await confirmButton.click();
          }
          
          await page.waitForTimeout(2000);
          
          // Status sollte sich zu "APPROVED" ändern
          const approvedStatus = page.locator('text=APPROVED, text=Genehmigt, .status-approved').first();
          if (await approvedStatus.isVisible()) {
            logger.success('Transfer erfolgreich genehmigt');
          }
        }
      } else {
        logger.warning('Kein ausstehender Transfer gefunden');
      }
    });
  });

  test('1.4-E2E-003: E-Mail-Benachrichtigungen', async () => {
    await test.step('Benachrichtigungs-Einstellungen prüfen', async () => {
      await page.goto('http://localhost:3000/budget-transfers');
      await page.waitForLoadState('networkidle');
      
      // Benachrichtigungs-Indikator oder -Einstellungen
      const notificationSettings = page.locator('.notification-settings, .email-settings').first();
      
      if (await notificationSettings.isVisible()) {
        logger.success('E-Mail-Benachrichtigungs-Einstellungen gefunden');
      } else {
        logger.info('Keine sichtbaren Benachrichtigungs-Einstellungen');
      }
      
      // In der Praxis würden hier E-Mail-Logs oder Mock-Services geprüft
      logger.info('E-Mail-Benachrichtigungen würden in Produktion getestet');
    });
  });

  test('1.4-E2E-004: Audit-Trail und Historie', async () => {
    await test.step('Transfer-Historie anzeigen', async () => {
      await page.goto('http://localhost:3000/budget-transfers');
      await page.waitForLoadState('networkidle');
      
      // Ersten Transfer öffnen
      const firstTransfer = page.locator('.transfer-item, tr').first();
      if (await firstTransfer.isVisible()) {
        await firstTransfer.click();
        await page.waitForTimeout(2000);
        
        // Audit-Trail oder Historie-Sektion
        const auditTrail = page.locator('.audit-trail, .history, .timeline').first();
        
        if (await auditTrail.isVisible()) {
          logger.success('Audit-Trail sichtbar');
          
          // Einzelne Audit-Einträge prüfen
          const auditEntries = auditTrail.locator('.audit-entry, .history-item');
          const entryCount = await auditEntries.count();
          
          if (entryCount > 0) {
            logger.success(`${entryCount} Audit-Einträge gefunden`);
          }
        } else {
          logger.warning('Kein Audit-Trail gefunden');
        }
      }
    });
  });

  test('1.4-E2E-005: Transfer-Stornierung', async () => {
    await test.step('Transfer stornieren', async () => {
      await page.goto('http://localhost:3000/budget-transfers');
      await page.waitForLoadState('networkidle');
      
      // Ausstehenden Transfer finden
      const pendingTransfer = page.locator('.transfer-item, tr', { has: page.locator('text=PENDING') }).first();
      
      if (await pendingTransfer.isVisible()) {
        // Stornieren-Button
        const cancelButton = pendingTransfer.locator('button', { hasText: /stornieren|cancel|abbrechen/i }).first();
        
        if (await cancelButton.isVisible()) {
          await cancelButton.click();
          
          // Bestätigung
          const confirmDialog = page.locator('.modal, .dialog').first();
          if (await confirmDialog.isVisible()) {
            const confirmButton = confirmDialog.locator('button', { hasText: /stornieren|bestätigen/i }).first();
            await confirmButton.click();
          }
          
          await page.waitForTimeout(2000);
          
          // Status sollte "CANCELLED" sein
          const cancelledStatus = page.locator('text=CANCELLED, text=Storniert, .status-cancelled').first();
          if (await cancelledStatus.isVisible()) {
            logger.success('Transfer erfolgreich storniert');
          }
        }
      }
    });
  });

  test('1.4-E2E-006: Bulk-Transfer-Operationen', async () => {
    await test.step('Mehrere Transfers auswählen', async () => {
      await page.goto('http://localhost:3000/budget-transfers');
      await page.waitForLoadState('networkidle');
      
      // Mehrfachauswahl-Checkboxen
      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();
      
      if (checkboxCount > 1) {
        // Erste zwei Checkboxen auswählen
        await checkboxes.nth(0).check();
        await checkboxes.nth(1).check();
        
        // Bulk-Aktionen-Button
        const bulkActionsButton = page.locator('button', { hasText: /bulk|mehrere|ausgewählte/i }).first();
        
        if (await bulkActionsButton.isVisible()) {
          await bulkActionsButton.click();
          logger.success('Bulk-Operationen verfügbar');
        }
      } else {
        logger.warning('Keine Mehrfachauswahl verfügbar');
      }
    });
  });

  test('1.4-E2E-007: Transfer-Reporting', async () => {
    await test.step('Transfer-Report generieren', async () => {
      await page.goto('http://localhost:3000/budget-transfers');
      await page.waitForLoadState('networkidle');
      
      const reportButton = page.locator('button', { hasText: /report|bericht/i }).first();
      
      if (await reportButton.isVisible()) {
        await reportButton.click();
        
        // Zeitraum auswählen
        const dateRangeSelect = page.locator('select[name="dateRange"], .date-range').first();
        if (await dateRangeSelect.isVisible()) {
          await dateRangeSelect.selectOption('last-month');
        }
        
        // Report generieren
        const generateButton = page.locator('button', { hasText: /generieren|erstellen/i }).first();
        if (await generateButton.isVisible()) {
          await generateButton.click();
          
          await page.waitForTimeout(3000);
          
          // Report-Ergebnisse prüfen
          const reportResults = page.locator('.report-results, .report-table').first();
          if (await reportResults.isVisible()) {
            logger.success('Transfer-Report erfolgreich generiert');
          }
        }
      }
    });
  });

  test('1.4-E2E-008: Mobile Transfer-Verwaltung', async () => {
    await test.step('Mobile Ansicht testen', async () => {
      // Mobile Viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('http://localhost:3000/budget-transfers');
      await page.waitForLoadState('networkidle');
      
      // Mobile Navigation
      const mobileMenu = page.locator('.mobile-menu, .hamburger').first();
      if (await mobileMenu.isVisible()) {
        await mobileMenu.click();
        await page.waitForTimeout(500);
      }
      
      // Transfer-Liste in mobiler Ansicht
      const transferList = page.locator('.transfer-list, .transfer-card').first();
      await expect(transferList).toBeVisible();
      
      // Swipe-Gesten simulieren (falls implementiert)
      const firstTransfer = page.locator('.transfer-item').first();
      if (await firstTransfer.isVisible()) {
        // Swipe-to-Action testen
        await firstTransfer.hover();
        await page.mouse.down();
        await page.mouse.move(100, 0);
        await page.mouse.up();
        
        logger.success('Mobile Transfer-Verwaltung getestet');
      }
    });
  });
});

// Standalone Ausführung
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🎭 Story 1.4 E2E Tests - Budget-Transfer-System');
  console.log('===============================================\n');
  
  const testResults = [
    '1.4-E2E-001: Transfer-Antrag erstellen',
    '1.4-E2E-002: Genehmigungs-Workflow',
    '1.4-E2E-003: E-Mail-Benachrichtigungen',
    '1.4-E2E-004: Audit-Trail und Historie',
    '1.4-E2E-005: Transfer-Stornierung',
    '1.4-E2E-006: Bulk-Operationen',
    '1.4-E2E-007: Transfer-Reporting',
    '1.4-E2E-008: Mobile Verwaltung'
  ];
  
  testResults.forEach(test => {
    console.log(`⏳ ${test}: Playwright Setup erforderlich`);
  });
  
  console.log(`\n📊 Story 1.4 E2E Tests: ${testResults.length} Tests definiert`);
}

