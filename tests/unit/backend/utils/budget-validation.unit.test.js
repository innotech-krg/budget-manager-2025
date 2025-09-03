// =====================================================
// Budget Manager 2025 - Budget Validation Tests
// Deutsche Geschäftsregeln-Validierung Tests
// =====================================================

import { jest } from '@jest/globals';
import {
  validateBudgetData,
  validateBudgetStatus,
  validateProjectBudgetData,
  validateBudgetTransferData,
  validateBudgetAllocation,
  validateGermanCurrencyFormat
} from '../../utils/budgetValidation.js';

describe('Budget Validation Tests', () => {

  // =====================================================
  // BUDGET DATA VALIDATION TESTS
  // =====================================================

  describe('validateBudgetData', () => {
    test('sollte gültige Budget-Daten akzeptieren', () => {
      const validBudgetData = {
        jahr: 2025,
        gesamtbudget: 1000000.00,
        reserve_allokation: 10.0,
        beschreibung: 'Test Budget für 2025'
      };

      const result = validateBudgetData(validBudgetData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.validatedData).toEqual({
        jahr: 2025,
        gesamtbudget: 1000000.00,
        reserve_allokation: 10.0,
        beschreibung: 'Test Budget für 2025'
      });
    });

    test('sollte ungültiges Jahr ablehnen', () => {
      const invalidBudgetData = {
        jahr: 2050, // Too far in future
        gesamtbudget: 1000000.00
      };

      const result = validateBudgetData(invalidBudgetData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Jahr muss eine gültige Jahreszahl sein (aktuelles Jahr ±5 Jahre)'
      );
    });

    test('sollte negatives Gesamtbudget ablehnen', () => {
      const invalidBudgetData = {
        jahr: 2025,
        gesamtbudget: -1000
      };

      const result = validateBudgetData(invalidBudgetData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Gesamtbudget muss größer als 0 sein'
      );
    });

    test('sollte zu hohe Reserve-Allokation ablehnen', () => {
      const invalidBudgetData = {
        jahr: 2025,
        gesamtbudget: 1000000.00,
        reserve_allokation: 60 // Too high
      };

      const result = validateBudgetData(invalidBudgetData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Reserve-Allokation muss zwischen 0% und 50% liegen'
      );
    });

    test('sollte zu lange Beschreibung ablehnen', () => {
      const invalidBudgetData = {
        jahr: 2025,
        gesamtbudget: 1000000.00,
        beschreibung: 'x'.repeat(1001) // Too long
      };

      const result = validateBudgetData(invalidBudgetData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Beschreibung darf maximal 1000 Zeichen lang sein'
      );
    });

    test('sollte fehlende Pflichtfelder erkennen', () => {
      const incompleteBudgetData = {};

      const result = validateBudgetData(incompleteBudgetData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Jahr ist erforderlich');
      expect(result.errors).toContain('Gesamtbudget ist erforderlich');
    });
  });

  // =====================================================
  // BUDGET STATUS VALIDATION TESTS
  // =====================================================

  describe('validateBudgetStatus', () => {
    test('sollte gültige Status akzeptieren', () => {
      const validStatuses = ['DRAFT', 'ACTIVE', 'CLOSED'];

      validStatuses.forEach(status => {
        const result = validateBudgetStatus(status);
        expect(result.isValid).toBe(true);
        expect(result.validatedStatus).toBe(status);
      });
    });

    test('sollte ungültige Status ablehnen', () => {
      const invalidStatuses = ['INVALID', 'PENDING', '', null, undefined];

      invalidStatuses.forEach(status => {
        const result = validateBudgetStatus(status);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    test('sollte Case-insensitive Status handhaben', () => {
      const result = validateBudgetStatus('active');
      expect(result.isValid).toBe(true);
      expect(result.validatedStatus).toBe('ACTIVE');
    });
  });

  // =====================================================
  // PROJECT BUDGET DATA VALIDATION TESTS
  // =====================================================

  describe('validateProjectBudgetData', () => {
    test('sollte gültige Projekt-Budget-Daten akzeptieren', () => {
      const validProjectBudget = {
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        veranschlagt: 50000.00,
        zugewiesen: 45000.00,
        kategorie: 'ENTWICKLUNG'
      };

      const result = validateProjectBudgetData(validProjectBudget);

      expect(result.isValid).toBe(true);
      expect(result.validatedData).toEqual({
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        veranschlagt: 50000.00,
        zugewiesen: 45000.00,
        kategorie: 'ENTWICKLUNG'
      });
    });

    test('sollte negative Beträge ablehnen', () => {
      const invalidProjectBudget = {
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        veranschlagt: -1000,
        zugewiesen: -500
      };

      const result = validateProjectBudgetData(invalidProjectBudget);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Veranschlagtes Budget darf nicht negativ sein'
      );
      expect(result.errors).toContain(
        'Zugewiesenes Budget darf nicht negativ sein'
      );
    });

    test('sollte zu hohe Beträge ablehnen', () => {
      const invalidProjectBudget = {
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        veranschlagt: 100000000 // Too high
      };

      const result = validateProjectBudgetData(invalidProjectBudget);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Veranschlagtes Budget ist zu hoch (Maximum: €99.999.999,99)'
      );
    });
  });

  // =====================================================
  // BUDGET TRANSFER VALIDATION TESTS
  // =====================================================

  describe('validateBudgetTransferData', () => {
    test('sollte gültige Transfer-Daten akzeptieren', () => {
      const validTransfer = {
        von_project_id: '123e4567-e89b-12d3-a456-426614174000',
        zu_project_id: '987fcdeb-51d2-43a8-b567-123456789abc',
        betrag: 10000.00,
        grund: 'Budget-Umverteilung aufgrund geänderter Prioritäten'
      };

      const result = validateBudgetTransferData(validTransfer);

      expect(result.isValid).toBe(true);
      expect(result.validatedData).toEqual({
        von_project_id: '123e4567-e89b-12d3-a456-426614174000',
        zu_project_id: '987fcdeb-51d2-43a8-b567-123456789abc',
        betrag: 10000.00,
        grund: 'Budget-Umverteilung aufgrund geänderter Prioritäten'
      });
    });

    test('sollte Selbst-Transfer ablehnen', () => {
      const selfTransfer = {
        von_project_id: '123e4567-e89b-12d3-a456-426614174000',
        zu_project_id: '123e4567-e89b-12d3-a456-426614174000', // Same as source
        betrag: 10000.00,
        grund: 'Test transfer'
      };

      const result = validateBudgetTransferData(selfTransfer);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Projekt kann nicht Budget zu sich selbst transferieren'
      );
    });

    test('sollte zu kurzen Grund ablehnen', () => {
      const invalidTransfer = {
        von_project_id: '123e4567-e89b-12d3-a456-426614174000',
        zu_project_id: '987fcdeb-51d2-43a8-b567-123456789abc',
        betrag: 10000.00,
        grund: 'Kurz' // Too short
      };

      const result = validateBudgetTransferData(invalidTransfer);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Transfer-Grund muss mindestens 10 Zeichen lang sein'
      );
    });
  });

  // =====================================================
  // BUDGET ALLOCATION VALIDATION TESTS
  // =====================================================

  describe('validateBudgetAllocation', () => {
    test('sollte gültige Budget-Allokation ohne Warnungen akzeptieren', () => {
      const verfuegbaresBudget = 100000.00;
      const neuZugewiesenesBudget = 80000.00;

      const result = validateBudgetAllocation(verfuegbaresBudget, neuZugewiesenesBudget);

      expect(result.isValid).toBe(true);
      expect(result.hasWarnings).toBe(false);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.calculations).toEqual({
        verfuegbares_budget: 100000.00,
        neu_zugewiesenes_budget: 80000.00,
        restbudget: 20000.00,
        ueberschreitung: 0
      });
    });

    test('sollte Warnung bei geringer Reserve geben', () => {
      const verfuegbaresBudget = 100000.00;
      const neuZugewiesenesBudget = 95000.00; // Only 5% remaining

      const result = validateBudgetAllocation(verfuegbaresBudget, neuZugewiesenesBudget);

      expect(result.isValid).toBe(true);
      expect(result.hasWarnings).toBe(true);
      expect(result.warnings).toContain(
        'Geringes Restbudget. Empfehlung: 10% Reserve beibehalten.'
      );
    });

    test('sollte Warnung bei geringer Überschreitung geben', () => {
      const verfuegbaresBudget = 100000.00;
      const neuZugewiesenesBudget = 110000.00; // 10% overspend

      const result = validateBudgetAllocation(verfuegbaresBudget, neuZugewiesenesBudget);

      expect(result.isValid).toBe(true);
      expect(result.hasWarnings).toBe(true);
      expect(result.warnings).toContain(
        expect.stringContaining('Budget-Überschreitung')
      );
    });

    test('sollte erhebliche Überschreitung warnen', () => {
      const verfuegbaresBudget = 100000.00;
      const neuZugewiesenesBudget = 130000.00; // 30% overspend

      const result = validateBudgetAllocation(verfuegbaresBudget, neuZugewiesenesBudget);

      expect(result.isValid).toBe(true);
      expect(result.hasWarnings).toBe(true);
      expect(result.warnings).toContain(
        expect.stringContaining('Erhebliche Budget-Überschreitung')
      );
    });

    test('sollte zu hohe Überschreitung ablehnen', () => {
      const verfuegbaresBudget = 100000.00;
      const neuZugewiesenesBudget = 160000.00; // 60% overspend

      const result = validateBudgetAllocation(verfuegbaresBudget, neuZugewiesenesBudget);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('Budget-Überschreitung zu hoch')
      );
    });

    test('sollte negative Beträge ablehnen', () => {
      const verfuegbaresBudget = 100000.00;
      const neuZugewiesenesBudget = -1000.00;

      const result = validateBudgetAllocation(verfuegbaresBudget, neuZugewiesenesBudget);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Zugewiesenes Budget muss größer als 0 sein'
      );
    });
  });

  // =====================================================
  // GERMAN CURRENCY FORMAT VALIDATION TESTS
  // =====================================================

  describe('validateGermanCurrencyFormat', () => {
    test('sollte gültige deutsche Währungsformate akzeptieren', () => {
      const validFormats = [
        '€1.000.000,50',
        '1.250.000,00',
        '€500,75',
        '1.000,00',
        '€100',
        '50,25'
      ];

      validFormats.forEach(format => {
        const result = validateGermanCurrencyFormat(format);
        expect(result.isValid).toBe(true);
        expect(result.formattedValue).toBeGreaterThan(0);
      });
    });

    test('sollte ungültige Währungsformate ablehnen', () => {
      const invalidFormats = [
        '1,000,000.50', // American format
        '$1000', // Wrong currency
        '1.000.000.50', // Wrong decimal separator
        'abc', // Not a number
        '', // Empty
        null, // Null
        undefined // Undefined
      ];

      invalidFormats.forEach(format => {
        const result = validateGermanCurrencyFormat(format);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    test('sollte Währungsformat mit und ohne Euro-Symbol akzeptieren', () => {
      const withSymbol = validateGermanCurrencyFormat('€1.000,50');
      const withoutSymbol = validateGermanCurrencyFormat('1.000,50');

      expect(withSymbol.isValid).toBe(true);
      expect(withoutSymbol.isValid).toBe(true);
      expect(withSymbol.formattedValue).toBe(withoutSymbol.formattedValue);
    });
  });
});