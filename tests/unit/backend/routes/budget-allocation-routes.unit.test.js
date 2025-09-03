// =====================================================
// Budget Manager 2025 - Budget Allocation Routes Tests
// Story 1.2.3: Intelligente Budget-Zuordnung
// =====================================================

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock the budget allocation service
const mockBudgetAllocationService = {
  getAvailableBudget: jest.fn(),
  validateBudgetAllocation: jest.fn(),
  reserveBudget: jest.fn(),
  releaseBudget: jest.fn(),
  getBudgetStatistics: jest.fn()
};

// Mock the service module
jest.unstable_mockModule('../../../../backend/src/services/budgetAllocationService.js', () => ({
  budgetAllocationService: mockBudgetAllocationService
}));

// Import after mocking
const budgetAllocationRoutes = await import('../../../../backend/src/routes/budgetAllocationRoutes.js');

describe('Budget Allocation Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/budget-allocation', budgetAllocationRoutes.default);
    jest.clearAllMocks();
  });

  describe('GET /api/budget-allocation/available/:jahr', () => {
    it('sollte verfügbares Budget für gültiges Jahr zurückgeben', async () => {
      const mockBudget = {
        jahr: 2025,
        gesamtbudget: 500000,
        zugewiesenes_budget: 100000,
        verfuegbares_budget: 400000,
        reserve_budget: 50000,
        verfuegbar_ohne_reserve: 350000,
        reserve_allokation: 10,
        anzahl_projekte: 3,
        auslastung_prozent: 20,
        budget_status: 'GRUEN',
        annual_budget_id: 'budget-id-2025'
      };

      mockBudgetAllocationService.getAvailableBudget.mockResolvedValue(mockBudget);

      const response = await request(app)
        .get('/api/budget-allocation/available/2025')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.availableBudget.jahr).toBe(2025);
      expect(response.body.availableBudget.gesamtbudget_formatted).toBe('500.000,00 €');
      expect(response.body.timestamp).toBeDefined();
      expect(mockBudgetAllocationService.getAvailableBudget).toHaveBeenCalledWith(2025);
    });

    it('sollte 404 zurückgeben wenn kein Budget existiert', async () => {
      mockBudgetAllocationService.getAvailableBudget.mockRejectedValue(
        new Error('Kein aktives Budget für Jahr 2025 gefunden')
      );

      const response = await request(app)
        .get('/api/budget-allocation/available/2025')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('NO_ACTIVE_BUDGET');
      expect(response.body.code).toBe('NO_ACTIVE_BUDGET_FOUND');
    });

    it('sollte 400 zurückgeben für ungültiges Jahr', async () => {
      const response = await request(app)
        .get('/api/budget-allocation/available/1999')
        .expect(400);

      expect(response.body.error).toBe('Validierungsfehler');
      expect(response.body.details[0].field).toBe('jahr');
    });

    it('sollte 400 zurückgeben für nicht-numerisches Jahr', async () => {
      const response = await request(app)
        .get('/api/budget-allocation/available/invalid')
        .expect(400);

      expect(response.body.error).toBe('Validierungsfehler');
    });
  });

  describe('POST /api/budget-allocation/validate', () => {
    it('sollte gültige Budget-Zuordnung bestätigen', async () => {
      const mockValidation = {
        isValid: true,
        availableBudget: { jahr: 2025, verfuegbares_budget: 400000 },
        newUtilization: 30,
        warning: null
      };

      mockBudgetAllocationService.validateBudgetAllocation.mockResolvedValue(mockValidation);

      const response = await request(app)
        .post('/api/budget-allocation/validate')
        .send({
          jahr: 2025,
          geplantes_budget: 50000
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.isValid).toBe(true);
      expect(response.body.newUtilization).toBe(30);
      expect(mockBudgetAllocationService.validateBudgetAllocation).toHaveBeenCalledWith(2025, 50000, null);
    });

    it('sollte ungültige Budget-Zuordnung ablehnen', async () => {
      const mockValidation = {
        isValid: false,
        error: 'BUDGET_EXCEEDED',
        message: 'Budget überschritten',
        maxAllowedBudget: 100000,
        availableBudget: { jahr: 2025 }
      };

      mockBudgetAllocationService.validateBudgetAllocation.mockResolvedValue(mockValidation);

      const response = await request(app)
        .post('/api/budget-allocation/validate')
        .send({
          jahr: 2025,
          geplantes_budget: 200000
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.isValid).toBe(false);
      expect(response.body.error).toBe('BUDGET_EXCEEDED');
      expect(response.body.maxAllowedBudget_formatted).toBe('100.000,00 €');
    });

    it('sollte Warnung bei hoher Auslastung zurückgeben', async () => {
      const mockValidation = {
        isValid: true,
        availableBudget: { jahr: 2025 },
        newUtilization: 85,
        warning: {
          level: 'WARNING',
          message: 'Hohe Budget-Auslastung'
        }
      };

      mockBudgetAllocationService.validateBudgetAllocation.mockResolvedValue(mockValidation);

      const response = await request(app)
        .post('/api/budget-allocation/validate')
        .send({
          jahr: 2025,
          geplantes_budget: 100000
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.warning).toBeDefined();
      expect(response.body.warning.level).toBe('WARNING');
    });

    it('sollte 400 zurückgeben für fehlende Pflichtfelder', async () => {
      const response = await request(app)
        .post('/api/budget-allocation/validate')
        .send({
          jahr: 2025
          // geplantes_budget fehlt
        })
        .expect(400);

      expect(response.body.error).toBe('Validierungsfehler');
    });
  });

  describe('POST /api/budget-allocation/reserve', () => {
    it('sollte Budget erfolgreich reservieren', async () => {
      const mockResult = {
        success: true,
        project: {
          id: 'project-id',
          geplantes_budget: 50000
        },
        availableBudget: { jahr: 2025 },
        message: 'Budget erfolgreich reserviert'
      };

      mockBudgetAllocationService.reserveBudget.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/budget-allocation/reserve')
        .send({
          projekt_id: 'project-id',
          geplantes_budget: 50000
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.project.id).toBe('project-id');
      expect(response.body.message).toContain('erfolgreich');
      expect(mockBudgetAllocationService.reserveBudget).toHaveBeenCalledWith('project-id', 50000);
    });

    it('sollte 400 zurückgeben bei fehlgeschlagener Reservierung', async () => {
      const mockResult = {
        success: false,
        error: 'BUDGET_EXCEEDED',
        message: 'Budget überschritten'
      };

      mockBudgetAllocationService.reserveBudget.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/budget-allocation/reserve')
        .send({
          projekt_id: 'project-id',
          geplantes_budget: 200000
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('BUDGET_EXCEEDED');
    });

    it('sollte 400 zurückgeben für ungültige UUID', async () => {
      const response = await request(app)
        .post('/api/budget-allocation/reserve')
        .send({
          projekt_id: 'invalid-uuid',
          geplantes_budget: 50000
        })
        .expect(400);

      expect(response.body.error).toBe('Validierungsfehler');
    });
  });

  describe('POST /api/budget-allocation/release', () => {
    it('sollte Budget erfolgreich freigeben', async () => {
      const mockResult = {
        success: true,
        releasedBudget: 50000,
        availableBudget: { jahr: 2025 },
        message: 'Budget erfolgreich freigegeben'
      };

      mockBudgetAllocationService.releaseBudget.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/budget-allocation/release')
        .send({
          projekt_id: 'project-id'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.releasedBudget).toBe(50000);
      expect(response.body.releasedBudget_formatted).toBe('50.000,00 €');
      expect(mockBudgetAllocationService.releaseBudget).toHaveBeenCalledWith('project-id');
    });

    it('sollte 400 zurückgeben bei ungültigem Status', async () => {
      const mockResult = {
        success: false,
        error: 'INVALID_STATUS',
        message: 'Ungültiger Status für Freigabe'
      };

      mockBudgetAllocationService.releaseBudget.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/budget-allocation/release')
        .send({
          projekt_id: 'project-id'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('INVALID_STATUS');
    });
  });

  describe('GET /api/budget-allocation/statistics/:jahr', () => {
    it('sollte Budget-Statistiken zurückgeben', async () => {
      const mockStatistics = {
        jahr: 2025,
        gesamtbudget: 500000,
        zugewiesenes_budget: 200000,
        verfuegbares_budget: 300000,
        topProjects: [
          { name: 'Projekt A', geplantes_budget: 100000 }
        ],
        statusDistribution: [
          { status: 'aktiv', count: 2, budget: 150000 }
        ],
        timestamp: '2025-01-01T00:00:00Z'
      };

      mockBudgetAllocationService.getBudgetStatistics.mockResolvedValue(mockStatistics);

      const response = await request(app)
        .get('/api/budget-allocation/statistics/2025')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.statistics.jahr).toBe(2025);
      expect(response.body.statistics.topProjects).toHaveLength(1);
      expect(response.body.statistics.statusDistribution).toHaveLength(1);
      expect(mockBudgetAllocationService.getBudgetStatistics).toHaveBeenCalledWith(2025);
    });

    it('sollte 500 zurückgeben bei Service-Fehler', async () => {
      mockBudgetAllocationService.getBudgetStatistics.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/budget-allocation/statistics/2025')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('STATISTICS_ERROR');
    });
  });

  describe('GET /api/budget-allocation/health', () => {
    it('sollte Health-Check zurückgeben', async () => {
      const response = await request(app)
        .get('/api/budget-allocation/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.service).toBe('budget-allocation');
      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.version).toBe('1.0.0');
    });
  });
});
