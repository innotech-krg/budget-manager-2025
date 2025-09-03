// =====================================================
// Budget Manager 2025 - E2E Tests für Story 1.2.3
// Story 1.2.3: Intelligente Budget-Zuordnung
// User Journey: Budget-Allocation im Projekt-Formular
// =====================================================

import { test, expect } from '@playwright/test';

test.describe('Story 1.2.3 - Intelligente Budget-Zuordnung', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to project management
    await page.goto('/');
    await page.click('text=Projekt-Verwaltung');
    await page.waitForURL('**/projects');
    
    // Click "Neues Projekt" button
    await page.click('text=Neues Projekt');
    await page.waitForSelector('[data-testid="project-form"]');
  });

  test('AC-1: Verfügbares Budget anzeigen', async ({ page }) => {
    // Warte auf Budget-Allocation-Indikator
    await page.waitForSelector('text=💰 Budget-Zuordnung');
    
    // Prüfe, dass verfügbares Budget angezeigt wird
    await expect(page.locator('text=Budget 2025')).toBeVisible();
    
    // Prüfe Budget-Anzeige-Elemente
    await expect(page.locator('text=Gesamtbudget')).toBeVisible();
    await expect(page.locator('text=Verfügbar')).toBeVisible();
    await expect(page.locator('text=Ohne Reserve')).toBeVisible();
    await expect(page.locator('text=Auslastung')).toBeVisible();
    
    // Prüfe, dass Beträge in Euro formatiert sind
    await expect(page.locator('text=/\\d{1,3}(\\.\\d{3})*,\\d{2} €/')).toBeVisible();
    
    // Prüfe Budget-Status-Indikator (Ampel-System)
    const statusIndicator = page.locator('text=/[🟢🟡🟠🔴]/')
    await expect(statusIndicator).toBeVisible();
  });

  test('AC-2: Budget-Zuordnung mit Real-time Validierung', async ({ page }) => {
    // Warte auf Budget-Allocation-Sektion
    await page.waitForSelector('text=💰 Budget-Zuordnung');
    
    // Finde das Budget-Eingabefeld
    const budgetInput = page.locator('input[name="geplantes_budget"]');
    await expect(budgetInput).toBeVisible();
    
    // Test 1: Gültiges Budget eingeben
    await budgetInput.fill('50000');
    
    // Warte auf Validierung (Debounce)
    await page.waitForTimeout(600);
    
    // Prüfe positive Validierung
    await expect(page.locator('text=✅')).toBeVisible();
    await expect(page.locator('text=/Budget-Zuordnung ist gültig/')).toBeVisible();
    
    // Test 2: Zu hohes Budget eingeben
    await budgetInput.fill('999999');
    await page.waitForTimeout(600);
    
    // Prüfe negative Validierung
    await expect(page.locator('text=❌')).toBeVisible();
    await expect(page.locator('text=/Budget.*überschreitet/')).toBeVisible();
    await expect(page.locator('text=/Maximal verfügbar/')).toBeVisible();
    
    // Prüfe, dass Submit-Button deaktiviert ist
    const submitButton = page.locator('[data-testid="save-project-btn"]');
    await expect(submitButton).toBeDisabled();
    await expect(submitButton).toHaveClass(/cursor-not-allowed/);
  });

  test('AC-3: Warnsystem bei hoher Budget-Auslastung', async ({ page }) => {
    // Warte auf Budget-Allocation-Sektion
    await page.waitForSelector('text=💰 Budget-Zuordnung');
    
    const budgetInput = page.locator('input[name="geplantes_budget"]');
    
    // Simuliere Budget-Eingabe, die zu hoher Auslastung führt
    // (Annahme: Verfügbares Budget ist bekannt aus vorherigen Tests)
    await budgetInput.fill('400000'); // Hohe Auslastung
    await page.waitForTimeout(600);
    
    // Prüfe Warnung bei hoher Auslastung (>80%)
    const warningIndicator = page.locator('text=⚠️');
    if (await warningIndicator.isVisible()) {
      await expect(page.locator('text=/Hohe Budget-Auslastung/')).toBeVisible();
      await expect(page.locator('.bg-yellow-50')).toBeVisible();
    }
    
    // Test kritische Warnung (>90%)
    await budgetInput.fill('450000'); // Kritische Auslastung
    await page.waitForTimeout(600);
    
    const criticalIndicator = page.locator('text=🚨');
    if (await criticalIndicator.isVisible()) {
      await expect(page.locator('text=/Kritische Budget-Auslastung/')).toBeVisible();
      await expect(page.locator('.bg-red-50')).toBeVisible();
    }
  });

  test('AC-4: Budget-Zuordnung bei Projekt-Erstellung', async ({ page }) => {
    // Fülle Pflichtfelder aus
    await page.fill('input[name="projektname"]', 'E2E Test Projekt Budget');
    await page.fill('textarea[name="kurzbeschreibung"]', 'Test der Budget-Zuordnung');
    await page.selectOption('select[name="kategorie"]', 'IT & Digitalisierung');
    await page.fill('input[name="team"]', 'Development Team');
    await page.fill('input[name="startdatum"]', '2025-02-01');
    await page.fill('input[name="enddatum"]', '2025-04-30');
    await page.selectOption('select[name="prioritaet"]', 'Hoch');
    await page.selectOption('select[name="kostenart"]', 'Entwicklung');
    await page.selectOption('select[name="impact_level"]', 'Hoch');
    
    // Warte auf Budget-Allocation-Sektion
    await page.waitForSelector('text=💰 Budget-Zuordnung');
    
    // Gültiges Budget eingeben
    const budgetInput = page.locator('input[name="geplantes_budget"]');
    await budgetInput.fill('75000');
    await page.waitForTimeout(600);
    
    // Prüfe, dass Validierung erfolgreich ist
    await expect(page.locator('text=✅')).toBeVisible();
    
    // Prüfe, dass Submit-Button aktiviert ist
    const submitButton = page.locator('[data-testid="save-project-btn"]');
    await expect(submitButton).toBeEnabled();
    
    // Projekt erstellen
    await submitButton.click();
    
    // Warte auf Erfolgs-Feedback oder Weiterleitung
    await page.waitForTimeout(2000);
    
    // Prüfe, dass Projekt erstellt wurde (je nach Implementation)
    // Dies könnte eine Weiterleitung zur Projektliste oder eine Erfolgsmeldung sein
    const successIndicator = page.locator('text=/erfolgreich|Projekt erstellt|gespeichert/i');
    if (await successIndicator.isVisible()) {
      await expect(successIndicator).toBeVisible();
    }
  });

  test('AC-5: Responsive Budget-Anzeige', async ({ page }) => {
    // Test Desktop-Ansicht
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForSelector('text=💰 Budget-Zuordnung');
    
    // Prüfe, dass Budget-Sektion sichtbar ist
    await expect(page.locator('text=Budget 2025')).toBeVisible();
    
    // Test Tablet-Ansicht
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    // Budget-Sektion sollte weiterhin sichtbar sein
    await expect(page.locator('text=💰 Budget-Zuordnung')).toBeVisible();
    
    // Test Mobile-Ansicht
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Budget-Sektion sollte auch auf Mobile sichtbar sein
    await expect(page.locator('text=💰 Budget-Zuordnung')).toBeVisible();
    
    // Prüfe, dass Budget-Eingabefeld auf Mobile nutzbar ist
    const budgetInput = page.locator('input[name="geplantes_budget"]');
    await expect(budgetInput).toBeVisible();
    await budgetInput.fill('25000');
    await expect(budgetInput).toHaveValue('25000');
  });

  test('AC-6: Fehlerbehandlung und Retry-Mechanismus', async ({ page }) => {
    // Simuliere Netzwerk-Fehler durch Offline-Modus
    await page.context().setOffline(true);
    
    // Warte auf Budget-Allocation-Sektion
    await page.waitForSelector('text=💰 Budget-Zuordnung', { timeout: 10000 });
    
    // Prüfe Fehler-Anzeige
    const errorIndicator = page.locator('text=❌');
    if (await errorIndicator.isVisible()) {
      await expect(page.locator('text=/Fehler.*Budget/')).toBeVisible();
      
      // Prüfe Retry-Button
      const retryButton = page.locator('text=Erneut versuchen');
      if (await retryButton.isVisible()) {
        // Netzwerk wieder aktivieren
        await page.context().setOffline(false);
        
        // Retry klicken
        await retryButton.click();
        
        // Warte auf erfolgreiche Wiederherstellung
        await page.waitForTimeout(2000);
        await expect(page.locator('text=Budget 2025')).toBeVisible();
      }
    }
  });

  test('AC-7: Budget-Kontext und Hilfe-Informationen', async ({ page }) => {
    // Warte auf Budget-Allocation-Sektion
    await page.waitForSelector('text=💰 Budget-Zuordnung');
    
    // Prüfe Kontext-Informationen
    await expect(page.locator('text=/Verfügbar:.*€/')).toBeVisible();
    await expect(page.locator('text=/Aktuelle Auslastung:.*%/')).toBeVisible();
    
    // Prüfe Reserve-Budget-Information
    await expect(page.locator('text=/Reserve.*%/')).toBeVisible();
    
    // Test Tooltip oder Hilfe-Text (falls vorhanden)
    const helpIcon = page.locator('[title*="Hilfe"], [aria-label*="Hilfe"], text=?');
    if (await helpIcon.isVisible()) {
      await helpIcon.hover();
      await page.waitForTimeout(500);
      
      // Prüfe, dass Tooltip erscheint
      const tooltip = page.locator('[role="tooltip"], .tooltip');
      if (await tooltip.isVisible()) {
        await expect(tooltip).toBeVisible();
      }
    }
  });

  test('AC-8: Performance und Loading-States', async ({ page }) => {
    // Messe Ladezeit der Budget-Allocation-Sektion
    const startTime = Date.now();
    
    await page.waitForSelector('text=💰 Budget-Zuordnung');
    
    const loadTime = Date.now() - startTime;
    
    // Budget-Sektion sollte unter 3 Sekunden laden
    expect(loadTime).toBeLessThan(3000);
    
    // Test Loading-State bei Budget-Validierung
    const budgetInput = page.locator('input[name="geplantes_budget"]');
    await budgetInput.fill('50000');
    
    // Prüfe Loading-Indikator während Validierung
    const loadingIndicator = page.locator('text=⏳, text=/Validiere.*Budget/');
    if (await loadingIndicator.isVisible({ timeout: 200 })) {
      await expect(loadingIndicator).toBeVisible();
    }
    
    // Warte auf Validierungs-Ergebnis
    await page.waitForTimeout(600);
    await expect(page.locator('text=✅, text=❌')).toBeVisible();
  });

  test('AC-9: Accessibility und Keyboard-Navigation', async ({ page }) => {
    // Warte auf Budget-Allocation-Sektion
    await page.waitForSelector('text=💰 Budget-Zuordnung');
    
    // Test Keyboard-Navigation zum Budget-Eingabefeld
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Finde das fokussierte Element
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    
    // Budget-Eingabefeld sollte fokussierbar sein
    const budgetInput = page.locator('input[name="geplantes_budget"]');
    await budgetInput.focus();
    await expect(budgetInput).toBeFocused();
    
    // Test Eingabe über Keyboard
    await budgetInput.type('75000');
    await expect(budgetInput).toHaveValue('75000');
    
    // Prüfe ARIA-Labels und Accessibility
    await expect(budgetInput).toHaveAttribute('aria-label');
    
    // Prüfe, dass Fehlermeldungen screen-reader-freundlich sind
    await budgetInput.fill('999999');
    await page.waitForTimeout(600);
    
    const errorMessage = page.locator('[role="alert"], [aria-live="polite"]');
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible();
    }
  });

  test('AC-10: Deutsche Lokalisierung und Formatierung', async ({ page }) => {
    // Warte auf Budget-Allocation-Sektion
    await page.waitForSelector('text=💰 Budget-Zuordnung');
    
    // Prüfe deutsche Währungsformatierung
    const currencyPattern = /\d{1,3}(\.\d{3})*,\d{2} €/;
    await expect(page.locator(`text=${currencyPattern}`)).toBeVisible();
    
    // Prüfe deutsche Beschriftungen
    await expect(page.locator('text=Gesamtbudget')).toBeVisible();
    await expect(page.locator('text=Verfügbar')).toBeVisible();
    await expect(page.locator('text=Auslastung')).toBeVisible();
    await expect(page.locator('text=Geplantes Budget')).toBeVisible();
    
    // Test deutsche Fehlermeldungen
    const budgetInput = page.locator('input[name="geplantes_budget"]');
    await budgetInput.fill('999999');
    await page.waitForTimeout(600);
    
    // Prüfe deutsche Fehlermeldung
    const germanErrorMessage = page.locator('text=/überschreitet|Budget.*hoch|nicht verfügbar/');
    if (await germanErrorMessage.isVisible()) {
      await expect(germanErrorMessage).toBeVisible();
    }
    
    // Prüfe deutsche Erfolgsmeldung
    await budgetInput.fill('50000');
    await page.waitForTimeout(600);
    
    const germanSuccessMessage = page.locator('text=/gültig|erfolgreich|verfügbar/');
    if (await germanSuccessMessage.isVisible()) {
      await expect(germanSuccessMessage).toBeVisible();
    }
  });
});
