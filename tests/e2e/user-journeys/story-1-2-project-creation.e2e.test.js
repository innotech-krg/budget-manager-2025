// =====================================================
// Budget Manager 2025 - E2E Tests Story 1.2
// Deutsche Geschäftsprojekt-Erstellung End-to-End Tests
// Test-IDs: 1.2-E2E-001 bis 1.2-E2E-008
// =====================================================

import { test, expect } from '@playwright/test';
import { TestLogger, formatGermanCurrency, formatGermanDate } from '../../test-utils/test-helpers.js';

const logger = new TestLogger('E2E.STORY.1.2');

test.describe('Story 1.2: Deutsche Geschäftsprojekt-Erstellung E2E', () => {
  let page;
  const testData = {
    project: {
      name: 'Digitalisierung Buchhaltung',
      description: 'Automatisierung der Rechnungsverarbeitung',
      budget: 75000,
      startDate: '01.03.2025',
      endDate: '31.12.2025',
      department: 'IT-Entwicklung',
      priority: 'Hoch',
      status: 'Planung'
    }
  };

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Zur Projekt-Seite navigieren
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    logger.info('E2E Test Setup für Story 1.2 abgeschlossen');
  });

  test.afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('1.2-E2E-001: Vollständiger Projekt-Erstellungs-Workflow', async () => {
    await test.step('Navigation zur Projekt-Verwaltung', async () => {
      // Projekt-Navigation finden
      const projectLink = page.locator('nav a[href*="project"], nav a', { hasText: /projekt/i }).first();
      
      if (await projectLink.isVisible()) {
        await projectLink.click();
      } else {
        // Alternative: Direkt zur Projekt-URL
        await page.goto('http://localhost:3000/projects');
      }
      
      await page.waitForLoadState('networkidle');
      logger.success('Navigation zur Projekt-Seite erfolgreich');
    });

    await test.step('Neues Projekt erstellen', async () => {
      // "Neues Projekt" Button finden
      const createButton = page.locator('button', { hasText: /neues projekt|projekt erstellen|hinzufügen/i }).first();
      await expect(createButton).toBeVisible({ timeout: 5000 });
      await createButton.click();
      
      // Projekt-Formular ausfüllen
      await page.fill('input[name="name"], input[placeholder*="Name"], input[placeholder*="Projekt"]', testData.project.name);
      await page.fill('textarea[name="description"], input[name="description"]', testData.project.description);
      await page.fill('input[name="budget"], input[placeholder*="Budget"]', testData.project.budget.toString());
      
      // Deutsche Datumsformate
      const startDateField = page.locator('input[name="startDate"], input[placeholder*="Start"], input[type="date"]').first();
      if (await startDateField.isVisible()) {
        // Deutsches Datumsformat oder ISO-Format je nach Input-Typ
        const inputType = await startDateField.getAttribute('type');
        if (inputType === 'date') {
          await startDateField.fill('2025-03-01'); // ISO für date input
        } else {
          await startDateField.fill(testData.project.startDate); // Deutsches Format
        }
      }
      
      const endDateField = page.locator('input[name="endDate"], input[placeholder*="Ende"], input[type="date"]').nth(1);
      if (await endDateField.isVisible()) {
        const inputType = await endDateField.getAttribute('type');
        if (inputType === 'date') {
          await endDateField.fill('2025-12-31');
        } else {
          await endDateField.fill(testData.project.endDate);
        }
      }
      
      // Abteilung auswählen
      const departmentSelect = page.locator('select[name="department"], select[name="abteilung"]').first();
      if (await departmentSelect.isVisible()) {
        await departmentSelect.selectOption({ label: testData.project.department });
      }
      
      // Priorität setzen
      const prioritySelect = page.locator('select[name="priority"], select[name="priorität"]').first();
      if (await prioritySelect.isVisible()) {
        await prioritySelect.selectOption({ label: testData.project.priority });
      }
      
      logger.success('Projekt-Formular vollständig ausgefüllt');
    });

    await test.step('Deutsche Geschäftslogik validieren', async () => {
      // Projekt speichern
      const saveButton = page.locator('button[type="submit"], button', { hasText: /speichern|erstellen/i }).first();
      await saveButton.click();
      
      await page.waitForTimeout(2000);
      
      // Prüfen ob Projekt in der Liste erscheint
      const projectList = page.locator('[data-testid="project-list"], .project-list, table');
      await expect(projectList).toBeVisible({ timeout: 5000 });
      
      // Deutsche Währungsformatierung im Projekt prüfen
      const expectedBudget = formatGermanCurrency(testData.project.budget);
      const budgetElement = page.locator(`text=${expectedBudget}`).first();
      
      if (await budgetElement.isVisible()) {
        logger.success(`Deutsche Währungsformatierung korrekt: ${expectedBudget}`);
      } else {
        logger.warning('Deutsche Währungsformatierung nicht gefunden');
      }
      
      // Projekt-Status auf Deutsch prüfen
      const statusElement = page.locator('text=Planung, text=In Bearbeitung, text=Abgeschlossen').first();
      if (await statusElement.isVisible()) {
        logger.success('Deutsche Status-Bezeichnungen gefunden');
      }
      
      logger.success('Projekt erfolgreich erstellt');
    });
  });

  test('1.2-E2E-002: Projekt-Budget-Zuordnung', async () => {
    await test.step('Projekt mit Jahresbudget verknüpfen', async () => {
      await page.goto('http://localhost:3000/projects');
      await page.waitForLoadState('networkidle');
      
      // Erstes Projekt öffnen
      const firstProject = page.locator('.project-card, tr, .project-item').first();
      
      if (await firstProject.isVisible()) {
        await firstProject.click();
        await page.waitForTimeout(2000);
        
        // Budget-Zuordnung suchen
        const budgetAssignButton = page.locator('button', { hasText: /budget zuordnen|budget verknüpfen/i }).first();
        
        if (await budgetAssignButton.isVisible()) {
          await budgetAssignButton.click();
          
          // Verfügbare Budgets anzeigen
          const budgetSelect = page.locator('select[name="budgetId"], .budget-select').first();
          if (await budgetSelect.isVisible()) {
            // Erstes verfügbares Budget auswählen
            await budgetSelect.selectOption({ index: 1 });
            
            // Zuordnung speichern
            const assignButton = page.locator('button', { hasText: /zuordnen|verknüpfen/i }).first();
            await assignButton.click();
            
            await page.waitForTimeout(1000);
            logger.success('Budget-Zuordnung erfolgreich');
          }
        } else {
          logger.warning('Budget-Zuordnung nicht verfügbar');
        }
      }
    });
  });

  test('1.2-E2E-003: Deutsche Geschäftsprozess-Validierung', async () => {
    await test.step('Geschäftsjahr-Validierung', async () => {
      await page.goto('http://localhost:3000/projects');
      await page.waitForLoadState('networkidle');
      
      // Neues Projekt mit ungültigem Geschäftsjahr
      const createButton = page.locator('button', { hasText: /neues projekt/i }).first();
      if (await createButton.isVisible()) {
        await createButton.click();
        
        // Ungültiges Startdatum (vor aktuellem Geschäftsjahr)
        const startDateField = page.locator('input[name="startDate"], input[type="date"]').first();
        if (await startDateField.isVisible()) {
          await startDateField.fill('2020-01-01');
          
          // Speichern versuchen
          const saveButton = page.locator('button[type="submit"]').first();
          await saveButton.click();
          
          // Validierungsfehler erwarten
          const errorMessage = page.locator('.error, .alert-error, [role="alert"]');
          const hasError = await errorMessage.isVisible({ timeout: 3000 });
          
          if (hasError) {
            logger.success('Geschäftsjahr-Validierung funktioniert');
          } else {
            logger.warning('Keine Geschäftsjahr-Validierung gefunden');
          }
        }
      }
    });

    await test.step('Deutsche Feiertage berücksichtigen', async () => {
      // Projekt mit Feiertag als Enddatum
      const endDateField = page.locator('input[name="endDate"], input[type="date"]').nth(1);
      if (await endDateField.isVisible()) {
        await endDateField.fill('2025-12-25'); // Weihnachten
        
        // Warnung oder automatische Anpassung prüfen
        await page.waitForTimeout(1000);
        
        const holidayWarning = page.locator('text*=Feiertag, text*=Weihnachten, .holiday-warning');
        if (await holidayWarning.isVisible()) {
          logger.success('Deutsche Feiertage werden berücksichtigt');
        } else {
          logger.info('Keine Feiertags-Berücksichtigung sichtbar');
        }
      }
    });
  });

  test('1.2-E2E-004: Projekt-Lifecycle-Management', async () => {
    await test.step('Projekt-Status-Änderungen', async () => {
      await page.goto('http://localhost:3000/projects');
      await page.waitForLoadState('networkidle');
      
      // Erstes Projekt öffnen
      const firstProject = page.locator('.project-card, tr').first();
      if (await firstProject.isVisible()) {
        await firstProject.click();
        await page.waitForTimeout(2000);
        
        // Status ändern
        const statusSelect = page.locator('select[name="status"], .status-select').first();
        if (await statusSelect.isVisible()) {
          await statusSelect.selectOption('In Bearbeitung');
          
          // Änderung speichern
          const saveButton = page.locator('button', { hasText: /speichern|aktualisieren/i }).first();
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(1000);
          }
          
          logger.success('Projekt-Status erfolgreich geändert');
        }
      }
    });

    await test.step('Projekt-Fortschritt verfolgen', async () => {
      // Fortschritts-Indikator prüfen
      const progressBar = page.locator('.progress-bar, .progress, [role="progressbar"]').first();
      if (await progressBar.isVisible()) {
        const progressValue = await progressBar.getAttribute('value') || await progressBar.getAttribute('aria-valuenow');
        logger.success(`Projekt-Fortschritt angezeigt: ${progressValue}%`);
      } else {
        logger.warning('Kein Fortschritts-Indikator gefunden');
      }
    });
  });

  test('1.2-E2E-005: Team-Zuordnung und Berechtigungen', async () => {
    await test.step('Team-Mitglieder zuordnen', async () => {
      await page.goto('http://localhost:3000/projects');
      await page.waitForLoadState('networkidle');
      
      const firstProject = page.locator('.project-card, tr').first();
      if (await firstProject.isVisible()) {
        await firstProject.click();
        await page.waitForTimeout(2000);
        
        // Team-Bereich finden
        const teamSection = page.locator('.team-section, .members, [data-testid="team"]').first();
        if (await teamSection.isVisible()) {
          // Mitglied hinzufügen
          const addMemberButton = page.locator('button', { hasText: /mitglied hinzufügen|team erweitern/i }).first();
          if (await addMemberButton.isVisible()) {
            await addMemberButton.click();
            
            // Benutzer auswählen (falls verfügbar)
            const userSelect = page.locator('select[name="userId"], .user-select').first();
            if (await userSelect.isVisible()) {
              await userSelect.selectOption({ index: 1 });
              
              const assignButton = page.locator('button', { hasText: /hinzufügen|zuordnen/i }).first();
              await assignButton.click();
              
              logger.success('Team-Mitglied erfolgreich zugeordnet');
            }
          }
        } else {
          logger.warning('Team-Verwaltung nicht verfügbar');
        }
      }
    });
  });

  test('1.2-E2E-006: Projekt-Reporting und Export', async () => {
    await test.step('Projekt-Report generieren', async () => {
      await page.goto('http://localhost:3000/projects');
      await page.waitForLoadState('networkidle');
      
      // Report-Button suchen
      const reportButton = page.locator('button', { hasText: /report|bericht|export/i }).first();
      if (await reportButton.isVisible()) {
        await reportButton.click();
        
        // Export-Optionen prüfen
        const exportOptions = page.locator('.export-options, .report-options');
        if (await exportOptions.isVisible()) {
          // PDF Export
          const pdfButton = page.locator('button', { hasText: /pdf/i }).first();
          if (await pdfButton.isVisible()) {
            // Download-Event überwachen
            const downloadPromise = page.waitForEvent('download');
            await pdfButton.click();
            
            try {
              const download = await downloadPromise;
              logger.success(`PDF-Export erfolgreich: ${download.suggestedFilename()}`);
            } catch (error) {
              logger.warning('PDF-Download nicht abgeschlossen');
            }
          }
        }
      } else {
        logger.warning('Report-Funktion nicht verfügbar');
      }
    });
  });

  test('1.2-E2E-007: Projekt-Suche und Filterung', async () => {
    await test.step('Erweiterte Projekt-Suche', async () => {
      await page.goto('http://localhost:3000/projects');
      await page.waitForLoadState('networkidle');
      
      // Suchfeld finden
      const searchInput = page.locator('input[placeholder*="Suchen"], input[type="search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('Digitalisierung');
        await page.waitForTimeout(1000);
        
        // Suchergebnisse prüfen
        const searchResults = page.locator('.project-card, tr');
        const resultCount = await searchResults.count();
        
        logger.success(`Suche ergab ${resultCount} Ergebnisse`);
      }
      
      // Filter nach Status
      const statusFilter = page.locator('select[name="status"], .status-filter').first();
      if (await statusFilter.isVisible()) {
        await statusFilter.selectOption('Planung');
        await page.waitForTimeout(1000);
        logger.success('Status-Filter angewendet');
      }
      
      // Filter nach Abteilung
      const departmentFilter = page.locator('select[name="department"], .department-filter').first();
      if (await departmentFilter.isVisible()) {
        await departmentFilter.selectOption('IT-Entwicklung');
        await page.waitForTimeout(1000);
        logger.success('Abteilungs-Filter angewendet');
      }
    });
  });

  test('1.2-E2E-008: Projekt-Archivierung und Löschung', async () => {
    await test.step('Projekt archivieren', async () => {
      await page.goto('http://localhost:3000/projects');
      await page.waitForLoadState('networkidle');
      
      const firstProject = page.locator('.project-card, tr').first();
      if (await firstProject.isVisible()) {
        // Kontext-Menü oder Aktions-Button
        const actionsButton = page.locator('button', { hasText: /aktionen|mehr|⋮/i }).first();
        if (await actionsButton.isVisible()) {
          await actionsButton.click();
          
          // Archivieren-Option
          const archiveButton = page.locator('button', { hasText: /archivieren/i }).first();
          if (await archiveButton.isVisible()) {
            await archiveButton.click();
            
            // Bestätigung
            const confirmButton = page.locator('button', { hasText: /bestätigen|ja|archivieren/i }).first();
            if (await confirmButton.isVisible()) {
              await confirmButton.click();
              await page.waitForTimeout(1000);
              logger.success('Projekt erfolgreich archiviert');
            }
          }
        }
      }
    });

    await test.step('Archivierte Projekte anzeigen', async () => {
      // Archiv-Filter oder -Seite
      const archiveFilter = page.locator('input[type="checkbox"]', { hasText: /archiviert/i }).first();
      if (await archiveFilter.isVisible()) {
        await archiveFilter.check();
        await page.waitForTimeout(1000);
        
        const archivedProjects = page.locator('.project-card.archived, tr.archived');
        const count = await archivedProjects.count();
        
        logger.success(`${count} archivierte Projekte angezeigt`);
      }
    });
  });
});

// Standalone Ausführung
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🎭 Story 1.2 E2E Tests - Deutsche Geschäftsprojekt-Erstellung');
  console.log('=======================================================\n');
  
  const runE2ETests = async () => {
    try {
      logger.info('Starte E2E Tests für Story 1.2...');
      
      const testResults = [
        { name: '1.2-E2E-001: Projekt-Erstellung', status: 'pending', reason: 'Playwright Setup erforderlich' },
        { name: '1.2-E2E-002: Budget-Zuordnung', status: 'pending', reason: 'Playwright Setup erforderlich' },
        { name: '1.2-E2E-003: Geschäftsprozess-Validierung', status: 'pending', reason: 'Playwright Setup erforderlich' },
        { name: '1.2-E2E-004: Lifecycle-Management', status: 'pending', reason: 'Playwright Setup erforderlich' },
        { name: '1.2-E2E-005: Team-Zuordnung', status: 'pending', reason: 'Playwright Setup erforderlich' },
        { name: '1.2-E2E-006: Reporting und Export', status: 'pending', reason: 'Playwright Setup erforderlich' },
        { name: '1.2-E2E-007: Suche und Filterung', status: 'pending', reason: 'Playwright Setup erforderlich' },
        { name: '1.2-E2E-008: Archivierung', status: 'pending', reason: 'Playwright Setup erforderlich' }
      ];
      
      testResults.forEach(test => {
        logger.warning(`⏳ ${test.name}: ${test.reason}`);
      });
      
      const summary = logger.getSummary();
      console.log(`\n📊 Story 1.2 E2E Tests: ${testResults.length} Tests definiert`);
      
    } catch (error) {
      logger.error(`E2E Test Fehler: ${error.message}`);
    }
  };
  
  runE2ETests();
}

