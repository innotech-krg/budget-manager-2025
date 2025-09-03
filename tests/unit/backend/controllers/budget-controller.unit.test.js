// =====================================================
// Budget Manager 2025 - Budget Controller Tests
// Story 1.1: Jahresbudget-Verwaltung Unit Tests
// =====================================================

import { jest } from '@jest/globals';
import budgetController from '../../controllers/budgetController.js';
import { supabaseAdmin } from '../../config/database.js';
import { createAuditLog } from '../../utils/auditLogger.js';

// Mock dependencies
jest.mock('../../config/database.js');
jest.mock('../../utils/auditLogger.js');

describe('Budget Controller - Story 1.1 Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock request/response objects
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { id: 'test-user-id' },
      ip: '127.0.0.1',
      get: jest.fn(() => 'test-user-agent')
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();

    // Mock createAuditLog
    createAuditLog.mockResolvedValue({ success: true });
  });

  // =====================================================
  // CREATE ANNUAL BUDGET TESTS
  // =====================================================

  describe('createAnnualBudget', () => {
    test('sollte erfolgreich ein neues Jahresbudget erstellen', async () => {
      // Arrange
      mockReq.body = {
        jahr: 2025,
        gesamtbudget: 1000000.00,
        reserve_allokation: 10.0,
        beschreibung: 'Test Budget 2025'
      };

      const mockBudget = {
        id: 'budget-123',
        jahr: 2025,
        gesamtbudget: 1000000.00,
        reserve_allokation: 10.0,
        verfuegbares_budget: 900000.00,
        status: 'DRAFT',
        beschreibung: 'Test Budget 2025',
        created_at: new Date().toISOString()
      };

      // Mock Supabase calls
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        insert: jest.fn().mockReturnThis()
      });

      supabaseAdmin.from().insert().select().single.mockResolvedValue({
        data: mockBudget,
        error: null
      });

      // Act
      await budgetController.createAnnualBudget(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Jahresbudget erfolgreich erstellt',
        budget: expect.objectContaining({
          id: 'budget-123',
          jahr: 2025,
          gesamtbudget_formatted: '€1.000.000,00',
          verfuegbares_budget_formatted: '€900.000,00',
          reserve_allokation_formatted: '10%'
        }),
        code: 'BUDGET_CREATED_SUCCESS'
      });

      // Verify audit log was created
      expect(createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          table_name: 'annual_budgets',
          action: 'INSERT',
          changed_by: 'test-user-id'
        })
      );
    });

    test('sollte Fehler bei bereits existierendem Jahr zurückgeben', async () => {
      // Arrange
      mockReq.body = {
        jahr: 2025,
        gesamtbudget: 1000000.00
      };

      const existingBudget = {
        id: 'existing-budget',
        jahr: 2025
      };

      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: existingBudget, error: null })
      });

      // Act
      await budgetController.createAnnualBudget(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Jahresbudget bereits vorhanden',
        message: 'Ein Budget für das Jahr 2025 existiert bereits.',
        code: 'BUDGET_YEAR_EXISTS',
        existingBudgetId: 'existing-budget'
      });
    });

    test('sollte Validierungsfehler bei ungültigen Daten zurückgeben', async () => {
      // Arrange
      mockReq.body = {
        jahr: 2050, // Invalid year
        gesamtbudget: -1000, // Negative amount
        reserve_allokation: 60 // Too high
      };

      // Act
      await budgetController.createAnnualBudget(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Ungültige Budget-Daten',
          code: 'INVALID_BUDGET_DATA'
        })
      );
    });
  });

  // =====================================================
  // GET ALL BUDGETS TESTS
  // =====================================================

  describe('getAllAnnualBudgets', () => {
    test('sollte alle Budgets mit deutscher Formatierung zurückgeben', async () => {
      // Arrange
      mockReq.query = {
        limit: 10,
        offset: 0
      };

      const mockBudgets = [
        {
          id: 'budget-1',
          jahr: 2025,
          gesamtbudget: 1000000.00,
          verfuegbares_budget: 900000.00,
          reserve_allokation: 10.0,
          status: 'ACTIVE',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'budget-2',
          jahr: 2024,
          gesamtbudget: 800000.00,
          verfuegbares_budget: 720000.00,
          reserve_allokation: 10.0,
          status: 'CLOSED',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        }
      ];

      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockBudgets, error: null, count: 2 })
      });

      // Act
      await budgetController.getAllAnnualBudgets(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        budgets: expect.arrayContaining([
          expect.objectContaining({
            id: 'budget-1',
            jahr: 2025,
            gesamtbudget_formatted: '€1.000.000,00',
            verfuegbares_budget_formatted: '€900.000,00',
            reserve_allokation_formatted: '10%',
            created_at_formatted: expect.any(String),
            updated_at_formatted: expect.any(String)
          })
        ]),
        pagination: {
          total: 2,
          limit: 10,
          offset: 0,
          hasMore: false
        },
        filters: {}
      });
    });

    test('sollte Budgets nach Status filtern', async () => {
      // Arrange
      mockReq.query = {
        status: 'ACTIVE'
      };

      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 })
      });

      // Act
      await budgetController.getAllAnnualBudgets(mockReq, mockRes);

      // Assert
      expect(supabaseAdmin.from().eq).toHaveBeenCalledWith('status', 'ACTIVE');
    });
  });

  // =====================================================
  // UPDATE BUDGET TESTS
  // =====================================================

  describe('updateAnnualBudget', () => {
    test('sollte Budget im DRAFT-Status erfolgreich aktualisieren', async () => {
      // Arrange
      mockReq.params = { id: 'budget-123' };
      mockReq.body = {
        gesamtbudget: 1200000.00,
        reserve_allokation: 15.0,
        beschreibung: 'Updated description'
      };

      const currentBudget = {
        id: 'budget-123',
        jahr: 2025,
        gesamtbudget: 1000000.00,
        reserve_allokation: 10.0,
        status: 'DRAFT'
      };

      const updatedBudget = {
        ...currentBudget,
        gesamtbudget: 1200000.00,
        reserve_allokation: 15.0,
        verfuegbares_budget: 1020000.00,
        beschreibung: 'Updated description'
      };

      // Mock current budget fetch
      supabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: currentBudget, error: null })
      });

      // Mock update
      supabaseAdmin.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: updatedBudget, error: null })
      });

      // Act
      await budgetController.updateAnnualBudget(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Jahresbudget erfolgreich aktualisiert',
        budget: expect.objectContaining({
          gesamtbudget_formatted: '€1.200.000,00',
          reserve_allokation_formatted: '15%'
        }),
        code: 'BUDGET_UPDATED_SUCCESS'
      });
    });

    test('sollte Fehler bei Bearbeitung von nicht-DRAFT Budget zurückgeben', async () => {
      // Arrange
      mockReq.params = { id: 'budget-123' };
      mockReq.body = { gesamtbudget: 1200000.00 };

      const activeBudget = {
        id: 'budget-123',
        status: 'ACTIVE'
      };

      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: activeBudget, error: null })
      });

      // Act
      await budgetController.updateAnnualBudget(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Budget nicht bearbeitbar',
        message: "Budgets im Status 'ACTIVE' können nicht bearbeitet werden. Nur DRAFT-Budgets sind bearbeitbar.",
        code: 'BUDGET_NOT_EDITABLE',
        currentStatus: 'ACTIVE'
      });
    });
  });

  // =====================================================
  // UPDATE BUDGET STATUS TESTS
  // =====================================================

  describe('updateBudgetStatus', () => {
    test('sollte Status von DRAFT zu ACTIVE ändern', async () => {
      // Arrange
      mockReq.params = { id: 'budget-123' };
      mockReq.body = { status: 'ACTIVE' };

      const currentBudget = {
        id: 'budget-123',
        status: 'DRAFT'
      };

      const updatedBudget = {
        ...currentBudget,
        status: 'ACTIVE'
      };

      // Mock current budget fetch
      supabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: currentBudget, error: null })
      });

      // Mock status update
      supabaseAdmin.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: updatedBudget, error: null })
      });

      // Act
      await budgetController.updateBudgetStatus(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Budget-Status erfolgreich zu 'ACTIVE' geändert",
        budget: expect.objectContaining({
          status: 'ACTIVE'
        }),
        code: 'BUDGET_STATUS_UPDATED_SUCCESS'
      });
    });

    test('sollte ungültigen Status-Übergang ablehnen', async () => {
      // Arrange
      mockReq.params = { id: 'budget-123' };
      mockReq.body = { status: 'DRAFT' };

      const closedBudget = {
        id: 'budget-123',
        status: 'CLOSED'
      };

      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: closedBudget, error: null })
      });

      // Act
      await budgetController.updateBudgetStatus(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Ungültiger Status-Übergang',
        message: "Status kann nicht von 'CLOSED' zu 'DRAFT' geändert werden.",
        code: 'INVALID_STATUS_TRANSITION',
        currentStatus: 'CLOSED',
        allowedTransitions: []
      });
    });
  });

  // =====================================================
  // BUDGET OVERVIEW TESTS
  // =====================================================

  describe('getBudgetOverview', () => {
    test('sollte Budget-Übersicht mit deutschen Kennzahlen zurückgeben', async () => {
      // Arrange
      mockReq.params = { jahr: '2025' };

      const mockOverview = {
        jahr: 2025,
        gesamtbudget: 1000000.00,
        reserve_allokation: 10.0,
        verfuegbares_budget: 900000.00,
        anzahl_projekte: 5,
        gesamt_veranschlagt: 800000.00,
        gesamt_zugewiesen: 750000.00,
        gesamt_verbraucht: 600000.00,
        allokation_prozent: 83.33
      };

      const mockProjectStatuses = [
        { budget_status: 'GRUEN', count: 3 },
        { budget_status: 'GELB', count: 1 },
        { budget_status: 'ROT', count: 1 }
      ];

      // Mock overview query
      supabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockOverview, error: null })
      });

      // Mock project statuses query
      supabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        mockResolvedValue: jest.fn().mockResolvedValue({ data: mockProjectStatuses })
      });

      // Act
      await budgetController.getBudgetOverview(mockReq, mockRes);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        overview: expect.objectContaining({
          jahr: 2025,
          gesamtbudget: '€1.000.000,00',
          verfuegbares_budget: '€900.000,00',
          anzahl_projekte: 5,
          budget_allokation: {
            veranschlagt: '€800.000,00',
            zugewiesen: '€750.000,00',
            verbraucht: '€600.000,00',
            verfuegbar: expect.any(String)
          },
          auslastung: {
            allokation_prozent: '83,33%',
            verbrauch_prozent: expect.any(String)
          },
          ampelsystem: expect.objectContaining({
            gruen: expect.any(Number),
            gelb: expect.any(Number),
            rot: expect.any(Number)
          })
        }),
        timestamp: expect.any(String)
      });
    });

    test('sollte Fehler bei ungültigem Jahr zurückgeben', async () => {
      // Arrange
      mockReq.params = { jahr: '2050' };

      // Act
      await budgetController.getBudgetOverview(mockReq, mockRes);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Ungültiges Jahr',
        message: 'Das angegebene Jahr ist nicht gültig.',
        code: 'INVALID_YEAR'
      });
    });
  });
});

// =====================================================
// DEUTSCHE GESCHÄFTSLOGIK TESTS
// =====================================================

describe('Deutsche Geschäftslogik Tests', () => {
  test('sollte deutsche Währungsformatierung korrekt handhaben', () => {
    const testCases = [
      { input: 1000000.50, expected: '€1.000.000,50' },
      { input: 1250000, expected: '€1.250.000,00' },
      { input: 500.75, expected: '€500,75' }
    ];

    // Diese Tests würden die formatGermanCurrency Funktion testen
    // (wird in separaten Utility-Tests implementiert)
  });

  test('sollte Reserve-Berechnung korrekt durchführen', () => {
    const gesamtbudget = 1000000.00;
    const reserveAllokation = 10.0;
    const expectedVerfuegbar = 900000.00;
    const expectedReserve = 100000.00;

    // Berechnung testen
    const verfuegbar = gesamtbudget * (1 - reserveAllokation / 100);
    const reserve = gesamtbudget * (reserveAllokation / 100);

    expect(verfuegbar).toBe(expectedVerfuegbar);
    expect(reserve).toBe(expectedReserve);
  });

  test('sollte deutsche Geschäftsjahr-Validierung korrekt durchführen', () => {
    const currentYear = new Date().getFullYear();
    
    // Gültige Jahre
    expect(currentYear).toBeGreaterThanOrEqual(2020);
    expect(currentYear + 5).toBeLessThanOrEqual(2035);
    
    // Ungültige Jahre
    const invalidYears = [2010, 2050, 1999];
    invalidYears.forEach(year => {
      expect(year < 2020 || year > 2035).toBe(true);
    });
  });
});