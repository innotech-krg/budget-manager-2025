// =====================================================
// Budget Manager 2025 - Project Controller Tests
// Story 1.2: Deutsche Geschäftsprojekt-Erstellung
// =====================================================

import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../server.js';

// Mock Supabase Admin
const mockSupabaseAdmin = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => ({ data: null, error: { message: 'No rows found' } })),
        order: jest.fn(() => ({ data: [], error: null })),
        data: [],
        error: null
      })),
      order: jest.fn(() => ({
        range: jest.fn(() => ({ data: [], error: null, count: 0 })),
        data: [],
        error: null
      })),
      data: [],
      error: null
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => ({
          data: {
            id: 'test-project-id',
            name: 'Test Projekt',
            projektnummer: 'WD-2025-001',
            geplantes_budget: 250000,
            durchlaufzeit_wochen: 17,
            created_at: new Date().toISOString()
          },
          error: null
        })),
        data: [],
        error: null
      })),
      data: [],
      error: null
    }))
  }))
};

jest.mock('../../config/database.js', () => ({
  supabaseAdmin: mockSupabaseAdmin,
  formatGermanCurrency: jest.fn((amount) => parseFloat(amount) || 0),
  toGermanCurrency: jest.fn((amount) => `${(amount || 0).toLocaleString('de-DE')} €`)
}));

jest.mock('../../utils/auditLogger.js', () => ({
  createAuditLog: jest.fn(() => Promise.resolve())
}));

describe('Project Controller Tests - Story 1.2', () => {
  
  describe('GET /api/projects/master-data', () => {
    test('sollte Master-Data für deutsche Geschäftsfelder zurückgeben', async () => {
      const response = await request(app)
        .get('/api/projects/master-data')
        .expect(200);
      
      expect(response.body).toHaveProperty('kategorien');
      expect(response.body).toHaveProperty('teams');
      expect(response.body).toHaveProperty('budgets');
      expect(response.body).toHaveProperty('prioritaeten');
      expect(response.body).toHaveProperty('impact_levels');
      expect(response.body).toHaveProperty('kostenarten');
      
      // Deutsche Prioritäten prüfen
      expect(response.body.prioritaeten).toEqual([
        { value: 'niedrig', label: 'Niedrig' },
        { value: 'mittel', label: 'Mittel' },
        { value: 'hoch', label: 'Hoch' },
        { value: 'kritisch', label: 'Kritisch' }
      ]);
      
      // Deutsche Impact Levels prüfen
      expect(response.body.impact_levels).toEqual([
        { value: 'niedrig', label: 'Niedrig' },
        { value: 'mittel', label: 'Mittel' },
        { value: 'hoch', label: 'Hoch' },
        { value: 'sehr_hoch', label: 'Sehr Hoch' }
      ]);
      
      // Deutsche Kostenarten prüfen
      expect(response.body.kostenarten).toContain('Personal');
      expect(response.body.kostenarten).toContain('IT-Infrastruktur');
      expect(response.body.kostenarten).toContain('Externe Dienstleister');
    });
  });

  describe('GET /api/projects', () => {
    test('sollte leere Projektliste zurückgeben', async () => {
      const response = await request(app)
        .get('/api/projects')
        .expect(200);
      
      expect(response.body).toHaveProperty('projects');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body).toHaveProperty('filters');
      expect(Array.isArray(response.body.projects)).toBe(true);
    });
  });

  describe('POST /api/projects - Deutsche Geschäftsprojekt-Erstellung', () => {
    const validProjectData = {
      name: 'Test Projekt Deutsche Geschäftslogik',
      beschreibung: 'Test-Beschreibung für deutsches Geschäftsprojekt',
      kategorie_id: '1',
      team_id: '1',
      annual_budget_id: '1',
      geplantes_budget: '250000.00',
      start_datum: '2025-09-01',
      end_datum: '2025-12-31',
      prioritaet: 'hoch',
      kostenart: 'IT-Infrastruktur',
      dienstleister: 'InnoTech Solutions GmbH',
      impact_level: 'hoch',
      tags: ['budget-management', 'test'],
      interne_stunden_design: 120,
      interne_stunden_content: 80,
      interne_stunden_dev: 200
    };

    test('sollte Projekt mit deutschen Geschäftsfeldern erstellen', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send(validProjectData)
        .expect(201);
      
      expect(response.body).toHaveProperty('message', 'Projekt erfolgreich erstellt');
      expect(response.body).toHaveProperty('project');
      expect(response.body).toHaveProperty('code', 'PROJECT_CREATED_SUCCESS');
      
      const project = response.body.project;
      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('name', validProjectData.name);
      expect(project).toHaveProperty('projektnummer', 'WD-2025-001');
      expect(project).toHaveProperty('durchlaufzeit_wochen', 17);
    });

    test('sollte Validierungsfehler für ungültige Daten zurückgeben', async () => {
      const invalidData = {
        name: '', // Leerer Name
        kategorie_id: 'invalid-uuid',
        geplantes_budget: -1000 // Negatives Budget
      };

      const response = await request(app)
        .post('/api/projects')
        .send(invalidData)
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Ungültige Projekt-Daten');
    });

    test('sollte deutsche Geschäftsregeln validieren', async () => {
      const invalidDateData = {
        ...validProjectData,
        start_datum: '2025-12-31',
        end_datum: '2025-09-01' // Enddatum vor Startdatum
      };

      const response = await request(app)
        .post('/api/projects')
        .send(invalidDateData)
        .expect(400);
      
      expect(response.body.message).toContain('Enddatum muss nach dem Startdatum liegen');
    });

    test('sollte deutsche Prioritäten validieren', async () => {
      const invalidPriorityData = {
        ...validProjectData,
        prioritaet: 'invalid-priority'
      };

      const response = await request(app)
        .post('/api/projects')
        .send(invalidPriorityData)
        .expect(400);
      
      expect(response.body.message).toContain('Ungültige Priorität');
    });
  });

  describe('Deutsche Geschäftslogik Validierung', () => {
    test('sollte Projektnummer-Format WD-YYYY-NNN validieren', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({
          name: 'Projektnummer Test',
          kategorie_id: '1',
          geplantes_budget: '100000',
          prioritaet: 'mittel'
        })
        .expect(201);
      
      const projektnummer = response.body.project.projektnummer;
      expect(projektnummer).toMatch(/^WD-\d{4}-\d{3}$/);
      expect(projektnummer).toMatch(/^WD-2025-\d{3}$/);
    });

    test('sollte deutsche Währungsformatierung verwenden', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({
          name: 'Währungsformat Test',
          kategorie_id: '1',
          geplantes_budget: '1500000.50'
        })
        .expect(201);
      
      // Prüfe deutsche Währungsformatierung
      expect(response.body.project.geplantes_budget).toBe(1500000.5);
    });

    test('sollte interne Stunden nach Teams erfassen', async () => {
      const stundenData = {
        name: 'Interne Stunden Test',
        kategorie_id: '1',
        geplantes_budget: '100000',
        interne_stunden_design: 120,
        interne_stunden_content: 80,
        interne_stunden_dev: 200
      };

      const response = await request(app)
        .post('/api/projects')
        .send(stundenData)
        .expect(201);
      
      const project = response.body.project;
      expect(project.interne_stunden_design).toBe(120);
      expect(project.interne_stunden_content).toBe(80);
      expect(project.interne_stunden_dev).toBe(200);
    });

    test('sollte flexible Tags unterstützen', async () => {
      const tagsData = {
        name: 'Tags Test',
        kategorie_id: '1',
        geplantes_budget: '100000',
        tags: ['budget-management', 'full-stack', 'demo', 'deutsch']
      };

      const response = await request(app)
        .post('/api/projects')
        .send(tagsData)
        .expect(201);
      
      expect(response.body.project.tags).toEqual(['budget-management', 'full-stack', 'demo', 'deutsch']);
    });
  });
});
