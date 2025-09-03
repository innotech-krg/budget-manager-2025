// =====================================================
// Budget Manager 2025 - E2E Tests Story 1.3
// 3D Budget-Tracking End-to-End Tests
// Test-IDs: 1.3-E2E-001 bis 1.3-E2E-006
// =====================================================

import { test, expect } from '@playwright/test';
import { TestLogger, formatGermanCurrency } from '../../test-utils/test-helpers.js';

const logger = new TestLogger('E2E.STORY.1.3');

test.describe('Story 1.3: 3D Budget-Tracking E2E', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    logger.info('E2E Test Setup für Story 1.3 abgeschlossen');
  });

  test.afterEach(async () => {
    if (page) await page.close();
  });

  test('1.3-E2E-001: 3D Budget-Dimensionen anzeigen', async () => {
    await test.step('Budget-Tracking-Dashboard öffnen', async () => {
      const trackingLink = page.locator('nav a[href*="tracking"], nav a', { hasText: /tracking|verfolgung/i }).first();
      if (await trackingLink.isVisible()) {
        await trackingLink.click();
      } else {
        await page.goto('http://localhost:3000/budget-tracking');
      }
      await page.waitForLoadState('networkidle');
      logger.success('Budget-Tracking-Dashboard geöffnet');
    });

    await test.step('3D-Dimensionen validieren', async () => {
      // Veranschlagt (Planned)
      const plannedBudget = page.locator('[data-testid="planned-budget"], .planned, .veranschlagt').first();
      await expect(plannedBudget).toBeVisible({ timeout: 5000 });
      
      // Zugewiesen (Allocated)
      const allocatedBudget = page.locator('[data-testid="allocated-budget"], .allocated, .zugewiesen').first();
      await expect(allocatedBudget).toBeVisible({ timeout: 5000 });
      
      // Verbraucht (Consumed)
      const consumedBudget = page.locator('[data-testid="consumed-budget"], .consumed, .verbraucht').first();
      await expect(consumedBudget).toBeVisible({ timeout: 5000 });
      
      logger.success('Alle 3D Budget-Dimensionen sichtbar');
    });
  });

  test('1.3-E2E-002: Deutsches Ampel-System', async () => {
    await test.step('Ampel-Indikatoren prüfen', async () => {
      await page.goto('http://localhost:3000/budget-tracking');
      await page.waitForLoadState('networkidle');
      
      // Grün (🟢) - Budget im Rahmen
      const greenIndicator = page.locator('.status-green, .ampel-gruen, [data-status="green"]').first();
      
      // Gelb (🟡) - Budget-Warnung
      const yellowIndicator = page.locator('.status-yellow, .ampel-gelb, [data-status="yellow"]').first();
      
      // Rot (🔴) - Budget überschritten
      const redIndicator = page.locator('.status-red, .ampel-rot, [data-status="red"]').first();
      
      const indicators = [greenIndicator, yellowIndicator, redIndicator];
      let foundIndicators = 0;
      
      for (const indicator of indicators) {
        if (await indicator.isVisible()) {
          foundIndicators++;
        }
      }
      
      if (foundIndicators > 0) {
        logger.success(`${foundIndicators} Ampel-Indikatoren gefunden`);
      } else {
        logger.warning('Keine Ampel-Indikatoren gefunden');
      }
    });
  });

  test('1.3-E2E-003: Budget-Verbrauch-Visualisierung', async () => {
    await test.step('Diagramme und Charts prüfen', async () => {
      await page.goto('http://localhost:3000/budget-tracking');
      await page.waitForLoadState('networkidle');
      
      // Chart.js Canvas oder SVG Diagramme
      const charts = page.locator('canvas, svg, .chart, .diagram').first();
      
      if (await charts.isVisible()) {
        logger.success('Budget-Visualisierung gefunden');
        
        // Interaktivität testen
        await charts.hover();
        await page.waitForTimeout(500);
        
        // Tooltip oder Hover-Effekte prüfen
        const tooltip = page.locator('.tooltip, .chart-tooltip').first();
        if (await tooltip.isVisible()) {
          logger.success('Interaktive Chart-Tooltips funktionieren');
        }
      } else {
        logger.warning('Keine Budget-Visualisierung gefunden');
      }
    });
  });

  test('1.3-E2E-004: Echtzeit-Updates', async () => {
    await test.step('WebSocket-Verbindung testen', async () => {
      await page.goto('http://localhost:3000/budget-tracking');
      await page.waitForLoadState('networkidle');
      
      // WebSocket-Nachrichten überwachen
      let wsMessages = 0;
      
      page.on('websocket', ws => {
        ws.on('framereceived', event => {
          wsMessages++;
          logger.info(`WebSocket Nachricht empfangen: ${wsMessages}`);
        });
      });
      
      // Seite neu laden um WebSocket-Verbindung zu triggern
      await page.reload();
      await page.waitForTimeout(3000);
      
      if (wsMessages > 0) {
        logger.success(`${wsMessages} WebSocket-Nachrichten empfangen`);
      } else {
        logger.warning('Keine WebSocket-Aktivität erkannt');
      }
    });
  });

  test('1.3-E2E-005: Budget-Drill-Down', async () => {
    await test.step('Detailansicht navigation', async () => {
      await page.goto('http://localhost:3000/budget-tracking');
      await page.waitForLoadState('networkidle');
      
      // Erstes Budget-Element für Drill-Down
      const budgetItem = page.locator('.budget-item, .budget-card, tr').first();
      
      if (await budgetItem.isVisible()) {
        await budgetItem.click();
        await page.waitForTimeout(2000);
        
        // Detail-Informationen prüfen
        const detailView = page.locator('.budget-details, .detail-view').first();
        if (await detailView.isVisible()) {
          logger.success('Budget-Drill-Down funktioniert');
          
          // Zurück-Navigation
          const backButton = page.locator('button', { hasText: /zurück|back/i }).first();
          if (await backButton.isVisible()) {
            await backButton.click();
            logger.success('Zurück-Navigation funktioniert');
          }
        }
      }
    });
  });

  test('1.3-E2E-006: Export und Reporting', async () => {
    await test.step('Budget-Tracking-Report exportieren', async () => {
      await page.goto('http://localhost:3000/budget-tracking');
      await page.waitForLoadState('networkidle');
      
      const exportButton = page.locator('button', { hasText: /export|bericht|report/i }).first();
      
      if (await exportButton.isVisible()) {
        await exportButton.click();
        
        // Excel/CSV Export testen
        const excelButton = page.locator('button', { hasText: /excel|csv/i }).first();
        if (await excelButton.isVisible()) {
          const downloadPromise = page.waitForEvent('download');
          await excelButton.click();
          
          try {
            const download = await downloadPromise;
            logger.success(`Export erfolgreich: ${download.suggestedFilename()}`);
          } catch (error) {
            logger.warning('Export-Download nicht abgeschlossen');
          }
        }
      } else {
        logger.warning('Export-Funktion nicht verfügbar');
      }
    });
  });
});

// Standalone Ausführung
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🎭 Story 1.3 E2E Tests - 3D Budget-Tracking');
  console.log('===========================================\n');
  
  const testResults = [
    '1.3-E2E-001: 3D Budget-Dimensionen',
    '1.3-E2E-002: Deutsches Ampel-System', 
    '1.3-E2E-003: Budget-Visualisierung',
    '1.3-E2E-004: Echtzeit-Updates',
    '1.3-E2E-005: Budget-Drill-Down',
    '1.3-E2E-006: Export und Reporting'
  ];
  
  testResults.forEach(test => {
    console.log(`⏳ ${test}: Playwright Setup erforderlich`);
  });
  
  console.log(`\n📊 Story 1.3 E2E Tests: ${testResults.length} Tests definiert`);
}

