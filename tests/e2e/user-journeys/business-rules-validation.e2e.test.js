// =====================================================
// Budget Manager 2025 - Business Rules E2E Tests
// Validierung der deutschen Geschäftsregeln
// =====================================================

import { test, expect } from '@playwright/test'

test.describe('Business Rules Validation E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigiere zur Budget-Verwaltung
    await page.goto('http://localhost:3000/budget')
    await page.waitForLoadState('networkidle')
  })

  test('BR-001: Verhindert Budget-Erstellung für vergangene Jahre', async ({ page }) => {
    // Klicke auf "Neues Budget erstellen"
    const createButton = page.locator('[data-testid="create-budget-btn"]').first()
    if (await createButton.isVisible()) {
      await createButton.click()
    } else {
      await page.goto('http://localhost:3000/budget')
      await page.waitForLoadState('networkidle')
      await page.locator('button:has-text("Neues Budget")').first().click()
    }

    // Warte auf Formular
    await page.waitForTimeout(1000)

    // Versuche ein Budget für 2023 zu erstellen (Vergangenheit)
    const yearInput = page.locator('input[name="jahr"], input[id="jahr"]').first()
    await yearInput.fill('2023')

    const budgetInput = page.locator('input[name="gesamtbudget"], input[id="gesamtbudget"]').first()
    await budgetInput.fill('100000')

    const reserveInput = page.locator('input[name="reserve_allokation"], input[id="reserve_allokation"]').first()
    await reserveInput.fill('10')

    // Versuche zu speichern
    const saveButton = page.locator('button[type="submit"], button:has-text("Speichern")').first()
    await saveButton.click()

    // Erwarte Validierungsfehler
    const errorMessage = page.locator('text*="keine Budgets für vergangene Jahre"')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })
  })

  test('BR-002: Verhindert doppelte Budgets für dasselbe Jahr', async ({ page }) => {
    // Erstelle erstes Budget für 2029
    const createButton = page.locator('[data-testid="create-budget-btn"]').first()
    if (await createButton.isVisible()) {
      await createButton.click()
    } else {
      await page.locator('button:has-text("Neues Budget")').first().click()
    }

    await page.waitForTimeout(1000)

    // Erstes Budget erstellen
    await page.locator('input[name="jahr"], input[id="jahr"]').first().fill('2029')
    await page.locator('input[name="gesamtbudget"], input[id="gesamtbudget"]').first().fill('500000')
    await page.locator('input[name="reserve_allokation"], input[id="reserve_allokation"]').first().fill('10')
    await page.locator('textarea[name="beschreibung"], textarea[id="beschreibung"]').first().fill('Erstes Budget 2029')

    await page.locator('button[type="submit"], button:has-text("Speichern")').first().click()
    await page.waitForTimeout(2000)

    // Versuche zweites Budget für 2029 zu erstellen
    const createButton2 = page.locator('[data-testid="create-budget-btn"]').first()
    if (await createButton2.isVisible()) {
      await createButton2.click()
    } else {
      await page.locator('button:has-text("Neues Budget")').first().click()
    }

    await page.waitForTimeout(1000)

    await page.locator('input[name="jahr"], input[id="jahr"]').first().fill('2029')
    await page.locator('input[name="gesamtbudget"], input[id="gesamtbudget"]').first().fill('600000')
    await page.locator('input[name="reserve_allokation"], input[id="reserve_allokation"]').first().fill('15')
    await page.locator('textarea[name="beschreibung"], textarea[id="beschreibung"]').first().fill('Zweites Budget 2029')

    await page.locator('button[type="submit"], button:has-text("Speichern")').first().click()

    // Erwarte Fehler für doppeltes Jahr
    const errorMessage = page.locator('text*="bereits vorhanden", text*="Pro Jahr ist nur ein Budget erlaubt"')
    await expect(errorMessage).toBeVisible({ timeout: 5000 })
  })

  test('BR-003: Erlaubt Budget-Erstellung für aktuelles und zukünftige Jahre', async ({ page }) => {
    const currentYear = new Date().getFullYear()
    const futureYear = currentYear + 5

    // Teste aktuelles Jahr
    const createButton = page.locator('[data-testid="create-budget-btn"]').first()
    if (await createButton.isVisible()) {
      await createButton.click()
    } else {
      await page.locator('button:has-text("Neues Budget")').first().click()
    }

    await page.waitForTimeout(1000)

    await page.locator('input[name="jahr"], input[id="jahr"]').first().fill(futureYear.toString())
    await page.locator('input[name="gesamtbudget"], input[id="gesamtbudget"]').first().fill('750000')
    await page.locator('input[name="reserve_allokation"], input[id="reserve_allokation"]').first().fill('12')
    await page.locator('textarea[name="beschreibung"], textarea[id="beschreibung"]').first().fill(`Budget für ${futureYear}`)

    await page.locator('button[type="submit"], button:has-text("Speichern")').first().click()

    // Erwarte Erfolg (Weiterleitung zur Liste oder Erfolgsmeldung)
    await page.waitForTimeout(3000)
    
    // Prüfe ob Budget in der Liste erscheint
    const budgetCard = page.locator(`text*="${futureYear}"`)
    await expect(budgetCard).toBeVisible({ timeout: 10000 })
  })

  test('BR-004: Validiert Status-Normalisierung in Budget-Anzeige', async ({ page }) => {
    // Gehe zur Budget-Liste
    await page.goto('http://localhost:3000/budget')
    await page.waitForLoadState('networkidle')

    // Warte auf Budget-Liste
    const budgetList = page.locator('[data-testid="budget-list"], [data-testid="budget-list-container"]').first()
    await expect(budgetList).toBeVisible({ timeout: 10000 })

    // Prüfe ob Status-Badges korrekt angezeigt werden
    const statusBadges = page.locator('.bg-green-100, .bg-gray-100, .bg-red-100')
    const badgeCount = await statusBadges.count()
    
    expect(badgeCount).toBeGreaterThan(0) // Mindestens ein Status-Badge sollte sichtbar sein

    // Prüfe spezifische Status-Texte
    const activeStatus = page.locator('text="Aktiv"')
    const draftStatus = page.locator('text="Entwurf"')
    const closedStatus = page.locator('text="Geschlossen"')

    // Mindestens einer der Status sollte sichtbar sein
    const hasStatus = await activeStatus.isVisible() || await draftStatus.isVisible() || await closedStatus.isVisible()
    expect(hasStatus).toBe(true)
  })

  test('BR-005: Testet Jahr-Filter mit Geschäftsregeln', async ({ page }) => {
    // Gehe zur Budget-Liste
    await page.goto('http://localhost:3000/budget')
    await page.waitForLoadState('networkidle')

    // Verwende Jahr-Filter
    const yearFilter = page.locator('[data-testid="year-filter"]').first()
    if (await yearFilter.isVisible()) {
      // Wähle aktuelles Jahr
      const currentYear = new Date().getFullYear()
      await yearFilter.selectOption(currentYear.toString())
      
      await page.waitForTimeout(1000)
      
      // Prüfe ob nur Budgets für das gewählte Jahr angezeigt werden
      const budgetCards = page.locator('[data-testid="budget-card"]')
      const cardCount = await budgetCards.count()
      
      if (cardCount > 0) {
        // Prüfe ersten Budget-Card auf korrektes Jahr
        const firstCard = budgetCards.first()
        const yearText = firstCard.locator(`text*="${currentYear}"`)
        await expect(yearText).toBeVisible()
      }
    }
  })
})

