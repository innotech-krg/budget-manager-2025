// =====================================================
// Budget Manager 2025 - Budget Allocation Service Tests
// Story 1.2.3: Intelligente Budget-Zuordnung
// =====================================================

import { jest } from '@jest/globals';
import { budgetAllocationService } from '../../../../backend/src/services/budgetAllocationService.js';

// Mock Supabase
const mockSupabaseAdmin = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        })),
        in: jest.fn()
      }))
    }))
  }))
};

// Mock database module
jest.unstable_mockModule('../../../../backend/src/config/database.js', () => ({
  supabaseAdmin: mockSupabaseAdmin,
  formatGermanCurrency: jest.fn((amount) => parseFloat(amount)),
  toGermanCurrency: jest.fn((amount) => `${amount.toLocaleString('de-DE')} €`)
}));

describe('BudgetAllocationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAvailableBudget', () => {
    it('sollte verfügbares Budget für ein Jahr berechnen', async () => {
      // Mock annual budget
      const mockAnnualBudget = {
        id: 'budget-id-2025',
        jahr: 2025,
        gesamtbudget: 500000,
        reserve_allokation: 10
      };

      // Mock projects
      const mockProjects = [
        { geplantes_budget: 50000, status: 'aktiv' },
        { geplantes_budget: 30000, status: 'geplant' }
      ];

      // Setup mocks
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({ data: mockAnnualBudget, error: null })
            }))
          }))
        }))
      });

      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: mockProjects, error: null })
          }))
        }))
      });

      const result = await budgetAllocationService.getAvailableBudget(2025);

      expect(result).toEqual({
        jahr: 2025,
        gesamtbudget: 500000,
        zugewiesenes_budget: 80000,
        verfuegbares_budget: 420000,
        reserve_budget: 50000,
        verfuegbar_ohne_reserve: 370000,
        reserve_allokation: 10,
        anzahl_projekte: 2,
        auslastung_prozent: 16,
        budget_status: 'GRUEN',
        annual_budget_id: 'budget-id-2025'
      });
    });

    it('sollte Fehler werfen wenn kein aktives Budget existiert', async () => {
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
            }))
          }))
        }))
      });

      await expect(budgetAllocationService.getAvailableBudget(2025))
        .rejects.toThrow('Kein aktives Budget für Jahr 2025 gefunden');
    });

    it('sollte Budget-Status korrekt berechnen', () => {
      // Test verschiedene Auslastungsgrade
      expect(budgetAllocationService.calculateBudgetStatus(50000, 100000)).toBe('GRUEN'); // 50% Auslastung
      expect(budgetAllocationService.calculateBudgetStatus(25000, 100000)).toBe('GELB');  // 75% Auslastung
      expect(budgetAllocationService.calculateBudgetStatus(10000, 100000)).toBe('ORANGE'); // 90% Auslastung
      expect(budgetAllocationService.calculateBudgetStatus(2000, 100000)).toBe('ROT');    // 98% Auslastung
    });
  });

  describe('validateBudgetAllocation', () => {
    it('sollte gültige Budget-Zuordnung bestätigen', async () => {
      const mockAvailableBudget = {
        jahr: 2025,
        gesamtbudget: 500000,
        zugewiesenes_budget: 100000,
        verfuegbares_budget: 400000
      };

      // Mock getAvailableBudget
      jest.spyOn(budgetAllocationService, 'getAvailableBudget')
        .mockResolvedValue(mockAvailableBudget);

      const result = await budgetAllocationService.validateBudgetAllocation(2025, 50000);

      expect(result.isValid).toBe(true);
      expect(result.availableBudget).toEqual(mockAvailableBudget);
      expect(result.newUtilization).toBe(30); // (100000 + 50000) / 500000 * 100
    });

    it('sollte ungültige Budget-Zuordnung ablehnen', async () => {
      const mockAvailableBudget = {
        jahr: 2025,
        gesamtbudget: 500000,
        zugewiesenes_budget: 450000,
        verfuegbares_budget: 50000
      };

      jest.spyOn(budgetAllocationService, 'getAvailableBudget')
        .mockResolvedValue(mockAvailableBudget);

      const result = await budgetAllocationService.validateBudgetAllocation(2025, 100000);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('BUDGET_EXCEEDED');
      expect(result.maxAllowedBudget).toBe(50000);
    });

    it('sollte Warnung bei hoher Auslastung geben', async () => {
      const mockAvailableBudget = {
        jahr: 2025,
        gesamtbudget: 500000,
        zugewiesenes_budget: 350000,
        verfuegbares_budget: 150000
      };

      jest.spyOn(budgetAllocationService, 'getAvailableBudget')
        .mockResolvedValue(mockAvailableBudget);

      const result = await budgetAllocationService.validateBudgetAllocation(2025, 100000);

      expect(result.isValid).toBe(true);
      expect(result.warning).toBeDefined();
      expect(result.warning.level).toBe('CRITICAL'); // 90% Auslastung
      expect(result.newUtilization).toBe(90);
    });
  });

  describe('reserveBudget', () => {
    it('sollte Budget erfolgreich reservieren', async () => {
      const mockProject = {
        id: 'project-id',
        annual_budget_id: 'budget-id',
        name: 'Test Projekt',
        jahr: 2025
      };

      const mockValidation = {
        isValid: true,
        availableBudget: { jahr: 2025 }
      };

      const mockUpdatedProject = {
        ...mockProject,
        geplantes_budget: 50000,
        budget_reserviert_am: '2025-01-01T00:00:00Z'
      };

      // Setup mocks
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: mockProject, error: null })
          }))
        }))
      });

      mockSupabaseAdmin.from.mockReturnValueOnce({
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({ data: mockUpdatedProject, error: null })
            }))
          }))
        }))
      });

      jest.spyOn(budgetAllocationService, 'validateBudgetAllocation')
        .mockResolvedValue(mockValidation);
      jest.spyOn(budgetAllocationService, 'getAvailableBudget')
        .mockResolvedValue({ jahr: 2025 });

      const result = await budgetAllocationService.reserveBudget('project-id', 50000);

      expect(result.success).toBe(true);
      expect(result.project).toEqual(mockUpdatedProject);
      expect(result.message).toContain('erfolgreich');
    });

    it('sollte Reservierung bei ungültiger Validierung ablehnen', async () => {
      const mockProject = {
        id: 'project-id',
        jahr: 2025
      };

      const mockValidation = {
        isValid: false,
        error: 'BUDGET_EXCEEDED',
        message: 'Budget überschritten'
      };

      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: mockProject, error: null })
          }))
        }))
      });

      jest.spyOn(budgetAllocationService, 'validateBudgetAllocation')
        .mockResolvedValue(mockValidation);

      const result = await budgetAllocationService.reserveBudget('project-id', 100000);

      expect(result.success).toBe(false);
      expect(result.error).toBe('BUDGET_EXCEEDED');
    });
  });

  describe('releaseBudget', () => {
    it('sollte Budget erfolgreich freigeben', async () => {
      const mockProject = {
        id: 'project-id',
        geplantes_budget: 50000,
        name: 'Test Projekt',
        jahr: 2025,
        status: 'storniert'
      };

      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: mockProject, error: null })
          }))
        }))
      });

      mockSupabaseAdmin.from.mockReturnValueOnce({
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ error: null })
        }))
      });

      jest.spyOn(budgetAllocationService, 'getAvailableBudget')
        .mockResolvedValue({ jahr: 2025 });

      const result = await budgetAllocationService.releaseBudget('project-id');

      expect(result.success).toBe(true);
      expect(result.releasedBudget).toBe(50000);
      expect(result.message).toContain('erfolgreich freigegeben');
    });

    it('sollte Freigabe bei ungültigem Status ablehnen', async () => {
      const mockProject = {
        id: 'project-id',
        status: 'aktiv'
      };

      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: mockProject, error: null })
          }))
        }))
      });

      const result = await budgetAllocationService.releaseBudget('project-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_STATUS');
    });
  });

  describe('getBudgetStatistics', () => {
    it('sollte Budget-Statistiken berechnen', async () => {
      const mockAvailableBudget = {
        jahr: 2025,
        gesamtbudget: 500000,
        zugewiesenes_budget: 200000,
        verfuegbares_budget: 300000
      };

      const mockTopProjects = [
        { name: 'Projekt A', geplantes_budget: 100000, status: 'aktiv' },
        { name: 'Projekt B', geplantes_budget: 50000, status: 'geplant' }
      ];

      const mockStatusDistribution = [
        { status: 'aktiv', geplantes_budget: 150000 },
        { status: 'geplant', geplantes_budget: 50000 }
      ];

      jest.spyOn(budgetAllocationService, 'getAvailableBudget')
        .mockResolvedValue(mockAvailableBudget);

      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn().mockResolvedValue({ data: mockTopProjects })
            }))
          }))
        }))
      });

      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: mockStatusDistribution })
        }))
      });

      const result = await budgetAllocationService.getBudgetStatistics(2025);

      expect(result.jahr).toBe(2025);
      expect(result.topProjects).toHaveLength(2);
      expect(result.statusDistribution).toHaveLength(2);
      expect(result.timestamp).toBeDefined();
    });
  });
});
