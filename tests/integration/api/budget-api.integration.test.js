// =====================================================
// Budget Manager 2025 - Budget Routes Integration Tests
// Story 1.1: API-Endpunkte Integration Tests
// =====================================================

import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../server.js';

// Mock Supabase for integration tests
jest.mock('../../config/database.js', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      range: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis()
    }))
  },
  supabase: {
    from: jest.fn()
  }
}));

jest.mock('../../utils/auditLogger.js', () => ({
  createAuditLog: jest.fn().mockResolvedValue({ success: true })
}));

describe('Budget API Integration Tests - Story 1.1', () => {
  
  // =====================================================
  // POST /api/budgets - CREATE BUDGET
  // =====================================================

  describe('POST /api/budgets', () => {
    test('sollte neues Budget erfolgreich erstellen', async () => {
      // Mock successful budget creation
      const mockBudget = {
        id: 'budget-123',
        jahr: 2025,
        gesamtbudget: 1000000.00,
        reserve_allokation: 10.0,
        verfuegbares_budget: 900000.00,
        status: 'DRAFT',
        created_at: new Date().toISOString()
      };

      const { supabaseAdmin } = await import('../../config/database.js');
      
      // Mock existing budget check (no existing budget)
      supabaseAdmin.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: null
      });
      
      // Mock budget creation
      supabaseAdmin.from().insert().select().single.mockResolvedValueOnce({
        data: mockBudget,
        error: null
      });

      const budgetData = {
        jahr: 2025,
        gesamtbudget: 1000000.00,
        reserve_allokation: 10.0,
        beschreibung: 'Test Budget 2025'
      };

      const response = await request(app)
        .post('/api/budgets')
        .send(budgetData)
        .expect(201);

      expect(response.body).toEqual({
        message: 'Jahresbudget erfolgreich erstellt',
        budget: expect.objectContaining({
          id: 'budget-123',
          jahr: 2025,
          gesamtbudget_formatted: expect.stringContaining('€'),
          verfuegbares_budget_formatted: expect.stringContaining('€'),
          reserve_allokation_formatted: '10%'
        }),
        code: 'BUDGET_CREATED_SUCCESS'
      });
    });

    test('sollte Validierungsfehler bei ungültigen Daten zurückgeben', async () => {
      const invalidBudgetData = {
        jahr: 2050, // Invalid year
        gesamtbudget: -1000, // Negative amount
        reserve_allokation: 60 // Too high
      };

      const response = await request(app)
        .post('/api/budgets')
        .send(invalidBudgetData)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Ungültige Budget-Daten',
        message: expect.any(String),
        code: 'INVALID_BUDGET_DATA'
      });
    });

    test('sollte Konflikt bei bereits existierendem Jahr zurückgeben', async () => {
      const existingBudget = {
        id: 'existing-budget',
        jahr: 2025
      };

      const { supabaseAdmin } = await import('../../config/database.js');
      supabaseAdmin.from().select().eq().single.mockResolvedValueOnce({
        data: existingBudget,
        error: null
      });

      const budgetData = {
        jahr: 2025,
        gesamtbudget: 1000000.00
      };

      const response = await request(app)
        .post('/api/budgets')
        .send(budgetData)
        .expect(409);

      expect(response.body).toEqual({
        error: 'Jahresbudget bereits vorhanden',
        message: 'Ein Budget für das Jahr 2025 existiert bereits.',
        code: 'BUDGET_YEAR_EXISTS',
        existingBudgetId: 'existing-budget'
      });
    });
  });

  // Test Health Check
  describe('GET /health', () => {
    test('sollte Server-Status zurückgeben', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'OK',
        message: 'Budget Manager 2025 API ist betriebsbereit',
        timestamp: expect.any(String),
        version: '1.0.0',
        environment: expect.any(String)
      });
    });
  });

  // Test API Info
  describe('GET /api', () => {
    test('sollte API-Informationen zurückgeben', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body).toEqual({
        name: 'Budget Manager 2025 API',
        version: '1.0.0',
        description: 'Deutsche Geschäfts-Budget-Management-System',
        endpoints: expect.objectContaining({
          budgets: '/api/budgets',
          projects: '/api/projects',
          teams: '/api/teams'
        }),
        features: expect.arrayContaining([
          'Jahresbudget-Verwaltung',
          'Deutsche Geschäftsprojekt-Erstellung'
        ]),
        germanBusinessCompliance: true,
        currency: 'EUR',
        locale: 'de-DE'
      });
    });
  });
});