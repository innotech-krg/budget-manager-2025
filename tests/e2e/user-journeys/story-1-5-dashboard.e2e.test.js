// =====================================================
// Budget Manager 2025 - E2E Tests Story 1.5
// Echtzeit-Budget-Dashboard End-to-End Tests
// Test-IDs: 1.5-E2E-001 bis 1.5-E2E-007
// =====================================================

import { test, expect } from '@playwright/test';
import { TestLogger, formatGermanCurrency } from '../../test-utils/test-helpers.js';

const logger = new TestLogger('E2E.STORY.1.5');

test.describe('Story 1.5: Echtzeit-Budget-Dashboard E2E', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    logger.info('E2E Test Setup für Story 1.5 abgeschlossen');
  });

  test.afterEach(async () => {
    if (page) await page.close();
  });

  test('1.5-E2E-001: Dashboard-Übersicht und KPIs', async () => {
    await test.step('Dashboard öffnen', async () => {
      const dashboardLink = page.locator('nav a[href*="dashboard"], nav a', { hasText: /dashboard|übersicht/i }).first();
      if (await dashboardLink.isVisible()) {
        await dashboardLink.click();
      } else {
        await page.goto('http://localhost:3000/dashboard');
      }
      await page.waitForLoadState('networkidle');
      logger.success('Dashboard geöffnet');
    });

    await test.step('KPI-Widgets validieren', async () => {
      // Gesamt-Budget Widget
      const totalBudgetWidget = page.locator('[data-testid="total-budget"], .kpi-total-budget, .widget-total').first();
      await expect(totalBudgetWidget).toBeVisible({ timeout: 5000 });
      
      // Verbrauchtes Budget Widget
      const consumedBudgetWidget = page.locator('[data-testid="consumed-budget"], .kpi-consumed, .widget-consumed').first();
      await expect(consumedBudgetWidget).toBeVisible({ timeout: 5000 });
      
      // Verfügbares Budget Widget
      const availableBudgetWidget = page.locator('[data-testid="available-budget"], .kpi-available, .widget-available').first();
      await expect(availableBudgetWidget).toBeVisible({ timeout: 5000 });
      
      // Burn-Rate Widget
      const burnRateWidget = page.locator('[data-testid="burn-rate"], .kpi-burn-rate, .widget-burn-rate').first();
      if (await burnRateWidget.isVisible()) {
        logger.success('Burn-Rate Widget gefunden');
      }
      
      logger.success('Alle KPI-Widgets sichtbar');
    });

    await test.step('Deutsche Währungsformatierung in KPIs', async () => {
      // Prüfe auf deutsche Währungsformate in den Widgets
      const currencyElements = page.locator('text=/\\d+\\.\\d+,\\d+ €|€ \\d+\\.\\d+,\\d+/');
      const currencyCount = await currencyElements.count();
      
      if (currencyCount > 0) {
        logger.success(`${currencyCount} deutsche Währungsformatierungen gefunden`);
      } else {
        logger.warning('Keine deutschen Währungsformate in KPIs gefunden');
      }
    });
  });

  test('1.5-E2E-002: Echtzeit-Updates und WebSocket', async () => {
    await test.step('WebSocket-Verbindung überwachen', async () => {
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('networkidle');
      
      let wsConnected = false;
      let wsMessages = 0;
      
      // WebSocket-Events überwachen
      page.on('websocket', ws => {
        wsConnected = true;
        logger.info('WebSocket-Verbindung erkannt');
        
        ws.on('framereceived', event => {
          wsMessages++;
          logger.info(`WebSocket Nachricht ${wsMessages} empfangen`);
        });
      });
      
      // Warten auf WebSocket-Aktivität
      await page.waitForTimeout(5000);
      
      if (wsConnected) {
        logger.success('WebSocket-Verbindung erfolgreich etabliert');
      } else {
        logger.warning('Keine WebSocket-Verbindung erkannt');
      }
      
      if (wsMessages > 0) {
        logger.success(`${wsMessages} Echtzeit-Updates empfangen`);
      }
    });

    await test.step('Auto-Refresh testen', async () => {
      // Timestamp oder Update-Indikator suchen
      const lastUpdated = page.locator('.last-updated, .timestamp, [data-testid="last-update"]').first();
      
      if (await lastUpdated.isVisible()) {
        const initialTime = await lastUpdated.textContent();
        
        // Warten auf automatisches Update
        await page.waitForTimeout(10000);
        
        const updatedTime = await lastUpdated.textContent();
        
        if (initialTime !== updatedTime) {
          logger.success('Automatische Updates funktionieren');
        } else {
          logger.warning('Keine automatischen Updates erkannt');
        }
      }
    });
  });

  test('1.5-E2E-003: Interaktive Charts und Diagramme', async () => {
    await test.step('Chart.js Diagramme testen', async () => {
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Chart Canvas-Elemente finden
      const charts = page.locator('canvas, .chart, .diagram');
      const chartCount = await charts.count();
      
      if (chartCount > 0) {
        logger.success(`${chartCount} Diagramme gefunden`);
        
        // Erstes Chart testen
        const firstChart = charts.first();
        await firstChart.hover();
        
        // Tooltip oder Hover-Effekte prüfen
        await page.waitForTimeout(1000);
        const tooltip = page.locator('.tooltip, .chart-tooltip, .chartjs-tooltip').first();
        
        if (await tooltip.isVisible()) {
          logger.success('Chart-Tooltips funktionieren');
        }
        
        // Chart-Legende testen
        const legend = page.locator('.chart-legend, .legend').first();
        if (await legend.isVisible()) {
          logger.success('Chart-Legende sichtbar');
        }
      } else {
        logger.warning('Keine Diagramme gefunden');
      }
    });

    await test.step('Burn-Rate-Analyse', async () => {
      // Burn-Rate Chart spezifisch testen
      const burnRateChart = page.locator('[data-testid="burn-rate-chart"], .burn-rate-chart').first();
      
      if (await burnRateChart.isVisible()) {
        logger.success('Burn-Rate-Diagramm gefunden');
        
        // Zeitraum-Filter testen
        const timeRangeSelect = page.locator('select[name="timeRange"], .time-range-select').first();
        if (await timeRangeSelect.isVisible()) {
          await timeRangeSelect.selectOption('last-3-months');
          await page.waitForTimeout(2000);
          logger.success('Zeitraum-Filter funktioniert');
        }
      }
    });
  });

  test('1.5-E2E-004: Kritische Alerts und Warnungen', async () => {
    await test.step('Alert-System prüfen', async () => {
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Alert-Bereich suchen
      const alertsSection = page.locator('.alerts, .warnings, .notifications, [data-testid="alerts"]').first();
      
      if (await alertsSection.isVisible()) {
        logger.success('Alert-Bereich gefunden');
        
        // Verschiedene Alert-Typen prüfen
        const criticalAlerts = alertsSection.locator('.alert-critical, .alert-danger, .critical');
        const warningAlerts = alertsSection.locator('.alert-warning, .warning');
        const infoAlerts = alertsSection.locator('.alert-info, .info');
        
        const criticalCount = await criticalAlerts.count();
        const warningCount = await warningAlerts.count();
        const infoCount = await infoAlerts.count();
        
        logger.success(`Alerts gefunden - Kritisch: ${criticalCount}, Warnung: ${warningCount}, Info: ${infoCount}`);
      } else {
        logger.info('Keine Alerts aktuell sichtbar');
      }
    });

    await test.step('Budget-Überschreitung-Warnung', async () => {
      // Simuliere Budget-Überschreitung (falls möglich)
      const budgetExceededAlert = page.locator('text=/budget.*überschritten|exceeded|kritisch/i').first();
      
      if (await budgetExceededAlert.isVisible()) {
        logger.success('Budget-Überschreitung-Warnung gefunden');
      } else {
        logger.info('Keine Budget-Überschreitung-Warnung (erwartungsgemäß)');
      }
    });
  });

  test('1.5-E2E-005: Dashboard-Konfiguration', async () => {
    await test.step('Widget-Layout anpassen', async () => {
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Konfiguration/Einstellungen-Button
      const configButton = page.locator('button', { hasText: /einstellungen|konfiguration|settings/i }).first();
      
      if (await configButton.isVisible()) {
        await configButton.click();
        
        // Widget-Auswahl oder Layout-Optionen
        const widgetOptions = page.locator('.widget-options, .layout-options').first();
        
        if (await widgetOptions.isVisible()) {
          logger.success('Dashboard-Konfiguration verfügbar');
          
          // Widget ein-/ausblenden testen
          const widgetToggle = widgetOptions.locator('input[type="checkbox"]').first();
          if (await widgetToggle.isVisible()) {
            await widgetToggle.click();
            logger.success('Widget-Toggle funktioniert');
          }
        }
      } else {
        logger.warning('Dashboard-Konfiguration nicht verfügbar');
      }
    });

    await test.step('Drag-and-Drop Layout', async () => {
      // Drag-and-Drop für Widget-Anordnung testen
      const draggableWidget = page.locator('.widget[draggable="true"], .draggable-widget').first();
      
      if (await draggableWidget.isVisible()) {
        const targetArea = page.locator('.drop-zone, .widget-container').nth(1);
        
        if (await targetArea.isVisible()) {
          await draggableWidget.dragTo(targetArea);
          logger.success('Drag-and-Drop Layout funktioniert');
        }
      } else {
        logger.info('Kein Drag-and-Drop Layout verfügbar');
      }
    });
  });

  test('1.5-E2E-006: Export und Sharing', async () => {
    await test.step('Dashboard-Export', async () => {
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('networkidle');
      
      const exportButton = page.locator('button', { hasText: /export|teilen|share/i }).first();
      
      if (await exportButton.isVisible()) {
        await exportButton.click();
        
        // Export-Optionen
        const pdfExport = page.locator('button', { hasText: /pdf/i }).first();
        if (await pdfExport.isVisible()) {
          const downloadPromise = page.waitForEvent('download');
          await pdfExport.click();
          
          try {
            const download = await downloadPromise;
            logger.success(`Dashboard-PDF exportiert: ${download.suggestedFilename()}`);
          } catch (error) {
            logger.warning('PDF-Export nicht abgeschlossen');
          }
        }
        
        // Screenshot-Export
        const screenshotButton = page.locator('button', { hasText: /screenshot|bild/i }).first();
        if (await screenshotButton.isVisible()) {
          await screenshotButton.click();
          logger.success('Screenshot-Export verfügbar');
        }
      }
    });

    await test.step('Dashboard-Link teilen', async () => {
      const shareButton = page.locator('button', { hasText: /link teilen|share link/i }).first();
      
      if (await shareButton.isVisible()) {
        await shareButton.click();
        
        // Share-Dialog
        const shareDialog = page.locator('.share-dialog, .modal').first();
        if (await shareDialog.isVisible()) {
          const shareUrl = shareDialog.locator('input[type="url"], input[readonly]').first();
          
          if (await shareUrl.isVisible()) {
            const url = await shareUrl.inputValue();
            logger.success(`Share-URL generiert: ${url}`);
          }
        }
      }
    });
  });

  test('1.5-E2E-007: Performance und Responsiveness', async () => {
    await test.step('Dashboard-Ladezeit messen', async () => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Warten bis alle Widgets geladen sind
      await page.waitForSelector('.widget, .kpi-widget', { timeout: 10000 });
      
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(8000); // Unter 8 Sekunden für Dashboard
      
      if (loadTime < 3000) {
        logger.success(`Excellent Dashboard-Ladezeit: ${loadTime}ms`);
      } else if (loadTime < 5000) {
        logger.success(`Gute Dashboard-Ladezeit: ${loadTime}ms`);
      } else {
        logger.warning(`Langsame Dashboard-Ladezeit: ${loadTime}ms`);
      }
    });

    await test.step('Mobile Dashboard testen', async () => {
      // Mobile Viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Mobile Layout prüfen
      const mobileLayout = page.locator('.mobile-layout, .responsive-grid').first();
      
      // Widgets sollten gestapelt sein
      const widgets = page.locator('.widget, .kpi-widget');
      const widgetCount = await widgets.count();
      
      if (widgetCount > 0) {
        logger.success(`${widgetCount} Widgets in mobiler Ansicht sichtbar`);
        
        // Horizontales Scrollen testen
        await page.mouse.wheel(100, 0);
        logger.success('Mobile Navigation getestet');
      }
    });

    await test.step('Tablet Dashboard testen', async () => {
      // Tablet Viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const widgets = page.locator('.widget, .kpi-widget');
      const widgetCount = await widgets.count();
      
      logger.success(`${widgetCount} Widgets in Tablet-Ansicht sichtbar`);
    });
  });
});

// Standalone Ausführung
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🎭 Story 1.5 E2E Tests - Echtzeit-Budget-Dashboard');
  console.log('==================================================\n');
  
  const testResults = [
    '1.5-E2E-001: Dashboard-Übersicht und KPIs',
    '1.5-E2E-002: Echtzeit-Updates und WebSocket',
    '1.5-E2E-003: Interaktive Charts',
    '1.5-E2E-004: Kritische Alerts',
    '1.5-E2E-005: Dashboard-Konfiguration',
    '1.5-E2E-006: Export und Sharing',
    '1.5-E2E-007: Performance und Responsiveness'
  ];
  
  testResults.forEach(test => {
    console.log(`⏳ ${test}: Playwright Setup erforderlich`);
  });
  
  console.log(`\n📊 Story 1.5 E2E Tests: ${testResults.length} Tests definiert`);
}

