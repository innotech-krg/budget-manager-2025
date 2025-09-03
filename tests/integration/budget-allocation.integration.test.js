// =====================================================
// Budget Manager 2025 - Budget Allocation Integration Tests
// Story 1.2.3: Intelligente Budget-Zuordnung
// =====================================================

import { jest } from '@jest/globals';
import request from 'supertest';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';

// Mock Supabase für Integration Tests
const mockSupabaseAdmin = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        })),
        in: jest.fn(),
        single: jest.fn()
      })),
      order: jest.fn(() => ({
        limit: jest.fn()
      }))
    })),
    insert: jest.fn(),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }))
};

// Mock database module
jest.unstable_mockModule('../../backend/src/config/database.js', () => ({
  supabaseAdmin: mockSupabaseAdmin,
  formatGermanCurrency: (amount) => parseFloat(amount),
  toGermanCurrency: (amount) => `${amount.toLocaleString('de-DE')} €`
}));

// Import after mocking
const budgetAllocationRoutes = await import('../../backend/src/routes/budgetAllocationRoutes.js');

describe('Budget Allocation Integration Tests', () => {
  let app;
  let server;

  beforeAll(() => {
    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/budget-allocation', budgetAllocationRoutes.default);
    
    server = createServer(app);
  });

  afterAll(() => {
    if (server) {
      server.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Budget Allocation Workflow', () => {
    it('sollte kompletten Budget-Zuordnungs-Workflow durchführen', async () => {
      // 1. Setup: Mock annual budget
      const mockAnnualBudget = {
        id: 'budget-2025',
        jahr: 2025,
        gesamtbudget: 500000,
        reserve_allokation: 10
      };

      // 2. Setup: Mock existing projects
      const mockExistingProjects = [
        { geplantes_budget: 100000, status: 'aktiv' },
        { geplantes_budget: 50000, status: 'geplant' }
      ];

      // Mock getAvailableBudget calls
      mockSupabaseAdmin.from.mockImplementation((table) => {
        if (table === 'annual_budgets') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: jest.fn().mockResolvedValue({ 
                    data: mockAnnualBudget, 
                    error: null 
                  })
                })
              })
            })
          };
        } else if (table === 'projects') {
          return {
            select: () => ({
              eq: () => ({
                in: jest.fn().mockResolvedValue({ 
                  data: mockExistingProjects, 
                  error: null 
                })
              })
            })
          };
        }
        return {};
      });

      // Step 1: Get available budget
      const budgetResponse = await request(app)
        .get('/api/budget-allocation/available/2025')
        .expect(200);

      expect(budgetResponse.body.success).toBe(true);
      expect(budgetResponse.body.availableBudget.jahr).toBe(2025);
      expect(budgetResponse.body.availableBudget.gesamtbudget).toBe(500000);
      expect(budgetResponse.body.availableBudget.zugewiesenes_budget).toBe(150000);
      expect(budgetResponse.body.availableBudget.verfuegbares_budget).toBe(350000);

      // Step 2: Validate budget allocation (valid)
      const validationResponse = await request(app)
        .post('/api/budget-allocation/validate')
        .send({
          jahr: 2025,
          geplantes_budget: 100000
        })
        .expect(200);

      expect(validationResponse.body.success).toBe(true);
      expect(validationResponse.body.isValid).toBe(true);
      expect(validationResponse.body.newUtilization).toBe(50); // (150000 + 100000) / 500000 * 100

      // Step 3: Validate budget allocation (invalid - too high)
      const invalidValidationResponse = await request(app)
        .post('/api/budget-allocation/validate')
        .send({
          jahr: 2025,
          geplantes_budget: 400000 // Exceeds available budget
        })
        .expect(400);

      expect(invalidValidationResponse.body.success).toBe(false);
      expect(invalidValidationResponse.body.isValid).toBe(false);
      expect(invalidValidationResponse.body.error).toBe('BUDGET_EXCEEDED');

      // Step 4: Reserve budget for project
      const mockProject = {
        id: 'project-123',
        annual_budget_id: 'budget-2025',
        name: 'Test Projekt',
        jahr: 2025
      };

      const mockUpdatedProject = {
        ...mockProject,
        geplantes_budget: 100000,
        budget_reserviert_am: '2025-01-01T00:00:00Z'
      };

      // Mock project operations
      mockSupabaseAdmin.from.mockImplementation((table) => {
        if (table === 'projects' && mockSupabaseAdmin.from.mock.calls.length > 4) {
          // For reserve operation
          return {
            select: () => ({
              eq: () => ({
                single: jest.fn().mockResolvedValue({ 
                  data: mockProject, 
                  error: null 
                })
              })
            }),
            update: () => ({
              eq: () => ({
                select: () => ({
                  single: jest.fn().mockResolvedValue({ 
                    data: mockUpdatedProject, 
                    error: null 
                  })
                })
              })
            })
          };
        }
        // Default behavior for other calls
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: jest.fn().mockResolvedValue({ 
                  data: mockAnnualBudget, 
                  error: null 
                })
              }),
              in: jest.fn().mockResolvedValue({ 
                data: mockExistingProjects, 
                error: null 
              })
            })
          })
        };
      });

      const reserveResponse = await request(app)
        .post('/api/budget-allocation/reserve')
        .send({
          projekt_id: 'project-123',
          geplantes_budget: 100000
        })
        .expect(200);

      expect(reserveResponse.body.success).toBe(true);
      expect(reserveResponse.body.project.geplantes_budget).toBe(100000);
      expect(reserveResponse.body.message).toContain('erfolgreich');
    });

    it('sollte Budget-Statistiken korrekt berechnen', async () => {
      const mockAnnualBudget = {
        id: 'budget-2025',
        jahr: 2025,
        gesamtbudget: 500000,
        reserve_allokation: 10
      };

      const mockProjects = [
        { geplantes_budget: 100000, status: 'aktiv' },
        { geplantes_budget: 50000, status: 'geplant' },
        { geplantes_budget: 75000, status: 'aktiv' }
      ];

      const mockTopProjects = [
        { name: 'Projekt A', geplantes_budget: 100000, status: 'aktiv' },
        { name: 'Projekt B', geplantes_budget: 75000, status: 'aktiv' },
        { name: 'Projekt C', geplantes_budget: 50000, status: 'geplant' }
      ];

      // Mock for statistics
      mockSupabaseAdmin.from.mockImplementation((table) => {
        if (table === 'annual_budgets') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: jest.fn().mockResolvedValue({ 
                    data: mockAnnualBudget, 
                    error: null 
                  })
                })
              })
            })
          };
        } else if (table === 'projects') {
          const callCount = mockSupabaseAdmin.from.mock.calls.filter(call => call[0] === 'projects').length;
          
          if (callCount === 1) {
            // First call for available budget calculation
            return {
              select: () => ({
                eq: () => ({
                  in: jest.fn().mockResolvedValue({ 
                    data: mockProjects, 
                    error: null 
                  })
                })
              })
            };
          } else if (callCount === 2) {
            // Second call for top projects
            return {
              select: () => ({
                eq: () => ({
                  order: () => ({
                    limit: jest.fn().mockResolvedValue({ 
                      data: mockTopProjects, 
                      error: null 
                    })
                  })
                })
              })
            };
          } else {
            // Third call for status distribution
            return {
              select: () => ({
                eq: jest.fn().mockResolvedValue({ 
                  data: mockProjects, 
                  error: null 
                })
              })
            };
          }
        }
        return {};
      });

      const statisticsResponse = await request(app)
        .get('/api/budget-allocation/statistics/2025')
        .expect(200);

      expect(statisticsResponse.body.success).toBe(true);
      expect(statisticsResponse.body.statistics.jahr).toBe(2025);
      expect(statisticsResponse.body.statistics.gesamtbudget).toBe(500000);
      expect(statisticsResponse.body.statistics.zugewiesenes_budget).toBe(225000);
      expect(statisticsResponse.body.statistics.topProjects).toHaveLength(3);
      expect(statisticsResponse.body.statistics.statusDistribution).toHaveLength(2);
      
      // Check status distribution
      const statusDist = statisticsResponse.body.statistics.statusDistribution;
      const aktivStatus = statusDist.find(s => s.status === 'aktiv');
      const geplantStatus = statusDist.find(s => s.status === 'geplant');
      
      expect(aktivStatus.count).toBe(2);
      expect(aktivStatus.budget).toBe(175000);
      expect(geplantStatus.count).toBe(1);
      expect(geplantStatus.budget).toBe(50000);
    });

    it('sollte Budget-Freigabe-Workflow durchführen', async () => {
      const mockProject = {
        id: 'project-123',
        geplantes_budget: 75000,
        name: 'Test Projekt',
        jahr: 2025,
        status: 'storniert'
      };

      const mockAnnualBudget = {
        id: 'budget-2025',
        jahr: 2025,
        gesamtbudget: 500000,
        reserve_allokation: 10
      };

      // Mock for release operation
      mockSupabaseAdmin.from.mockImplementation((table) => {
        if (table === 'projects') {
          const callCount = mockSupabaseAdmin.from.mock.calls.filter(call => call[0] === 'projects').length;
          
          if (callCount === 1) {
            // First call to get project details
            return {
              select: () => ({
                eq: () => ({
                  single: jest.fn().mockResolvedValue({ 
                    data: mockProject, 
                    error: null 
                  })
                })
              })
            };
          } else if (callCount === 2) {
            // Second call to update project
            return {
              update: () => ({
                eq: jest.fn().mockResolvedValue({ error: null })
              })
            };
          } else {
            // Subsequent calls for getAvailableBudget
            return {
              select: () => ({
                eq: () => ({
                  in: jest.fn().mockResolvedValue({ 
                    data: [], 
                    error: null 
                  })
                })
              })
            };
          }
        } else if (table === 'annual_budgets') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: jest.fn().mockResolvedValue({ 
                    data: mockAnnualBudget, 
                    error: null 
                  })
                })
              })
            })
          };
        }
        return {};
      });

      const releaseResponse = await request(app)
        .post('/api/budget-allocation/release')
        .send({
          projekt_id: 'project-123'
        })
        .expect(200);

      expect(releaseResponse.body.success).toBe(true);
      expect(releaseResponse.body.releasedBudget).toBe(75000);
      expect(releaseResponse.body.releasedBudget_formatted).toBe('75.000 €');
      expect(releaseResponse.body.message).toContain('erfolgreich freigegeben');
    });

    it('sollte Fehlerbehandlung bei fehlenden Budgets testen', async () => {
      // Mock no budget found
      mockSupabaseAdmin.from.mockImplementation((table) => {
        if (table === 'annual_budgets') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: jest.fn().mockResolvedValue({ 
                    data: null, 
                    error: { message: 'Not found' } 
                  })
                })
              })
            })
          };
        }
        return {};
      });

      const response = await request(app)
        .get('/api/budget-allocation/available/2030')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('NO_ACTIVE_BUDGET');
      expect(response.body.code).toBe('NO_ACTIVE_BUDGET_FOUND');
    });

    it('sollte Validierungsfehler korrekt behandeln', async () => {
      // Test invalid year
      const invalidYearResponse = await request(app)
        .get('/api/budget-allocation/available/1999')
        .expect(400);

      expect(invalidYearResponse.body.error).toBe('Validierungsfehler');

      // Test invalid budget amount
      const invalidBudgetResponse = await request(app)
        .post('/api/budget-allocation/validate')
        .send({
          jahr: 2025,
          geplantes_budget: -1000
        })
        .expect(400);

      expect(invalidBudgetResponse.body.error).toBe('Validierungsfehler');

      // Test invalid UUID
      const invalidUuidResponse = await request(app)
        .post('/api/budget-allocation/reserve')
        .send({
          projekt_id: 'invalid-uuid',
          geplantes_budget: 50000
        })
        .expect(400);

      expect(invalidUuidResponse.body.error).toBe('Validierungsfehler');
    });
  });

  describe('Performance Tests', () => {
    it('sollte Budget-Abfrage unter 500ms durchführen', async () => {
      const mockAnnualBudget = {
        id: 'budget-2025',
        jahr: 2025,
        gesamtbudget: 500000,
        reserve_allokation: 10
      };

      mockSupabaseAdmin.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: jest.fn().mockResolvedValue({ 
                data: mockAnnualBudget, 
                error: null 
              })
            }),
            in: jest.fn().mockResolvedValue({ 
              data: [], 
              error: null 
            })
          })
        })
      }));

      const startTime = Date.now();
      
      await request(app)
        .get('/api/budget-allocation/available/2025')
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500);
    });

    it('sollte mehrere parallele Anfragen verarbeiten', async () => {
      const mockAnnualBudget = {
        id: 'budget-2025',
        jahr: 2025,
        gesamtbudget: 500000,
        reserve_allokation: 10
      };

      mockSupabaseAdmin.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: jest.fn().mockResolvedValue({ 
                data: mockAnnualBudget, 
                error: null 
              })
            }),
            in: jest.fn().mockResolvedValue({ 
              data: [], 
              error: null 
            })
          })
        })
      }));

      // 10 parallele Anfragen
      const promises = Array.from({ length: 10 }, () =>
        request(app)
          .get('/api/budget-allocation/available/2025')
          .expect(200)
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
        expect(response.body.availableBudget.jahr).toBe(2025);
      });
    });
  });
});
