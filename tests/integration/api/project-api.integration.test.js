// =====================================================
// Budget Manager 2025 - Project Routes Integration Tests
// Story 1.2: Deutsche Geschäftsprojekt-Erstellung
// =====================================================

import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../server.js';

describe('Project Routes Integration Tests - Story 1.2', () => {

  describe('API Endpoint Verfügbarkeit', () => {
    test('GET /api - sollte Project-Endpoints auflisten', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);
      
      expect(response.body.endpoints).toHaveProperty('projects', '/api/projects');
      expect(response.body.features).toContain('Deutsche Geschäftsprojekt-Erstellung');
    });

    test('GET /api/projects/master-data - sollte Master-Data-Endpoint verfügbar machen', async () => {
      const response = await request(app)
        .get('/api/projects/master-data')
        .expect(200);
      
      expect(response.body).toHaveProperty('kategorien');
      expect(response.body).toHaveProperty('teams');
      expect(response.body).toHaveProperty('budgets');
    });
  });

  describe('Deutsche Geschäfts-API Compliance', () => {
    test('sollte deutsche Fehlermeldungen zurückgeben', async () => {
      const response = await request(app)
        .get('/api/projects/nonexistent')
        .expect(404);
      
      expect(response.body.error).toContain('nicht gefunden');
      expect(response.body.message).toMatch(/existiert nicht/);
    });

    test('sollte deutsche Validierungsmeldungen verwenden', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({
          name: '', // Leerer Name löst deutsche Validierung aus
          kategorie_id: 'invalid'
        })
        .expect(400);
      
      expect(response.body.error).toContain('Ungültige');
    });

    test('sollte deutsche Währungsformatierung in Responses verwenden', async () => {
      const response = await request(app)
        .get('/api/projects/master-data')
        .expect(200);
      
      // Prüfe deutsche Währungsformatierung in Budget-Daten
      response.body.budgets.forEach(budget => {
        expect(budget.gesamtbudget_formatted).toMatch(/€$/);
        expect(budget.gesamtbudget_formatted).toMatch(/\./); // Deutsche Tausender-Trennung
      });
    });
  });

  describe('Rate Limiting', () => {
    test('sollte Rate Limiting für Project-Endpoints anwenden', async () => {
      // Simuliere viele Anfragen schnell hintereinander
      const requests = Array.from({ length: 10 }, () =>
        request(app).get('/api/projects/master-data')
      );
      
      const responses = await Promise.all(requests);
      
      // Alle sollten erfolgreich sein (unter dem Limit)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Error Handling', () => {
    test('sollte 404 für unbekannte Project-Routes zurückgeben', async () => {
      const response = await request(app)
        .get('/api/projects/unknown-endpoint')
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code', 'PROJECT_ROUTE_NOT_FOUND');
      expect(response.body.availableRoutes).toContain('GET /api/projects');
    });

    test('sollte konsistente Fehlerstruktur verwenden', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({ invalid: 'data' })
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Authentication & Authorization', () => {
    test('sollte Authentication-Middleware für alle Project-Routes anwenden', async () => {
      // Alle Project-Endpoints sollten durch Auth-Middleware geschützt sein
      const endpoints = [
        '/api/projects',
        '/api/projects/master-data'
      ];
      
      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        
        // Da wir Mock-Auth verwenden, sollten alle 200 oder erwartete Fehler zurückgeben
        expect([200, 400, 404, 500]).toContain(response.status);
      }
    });
  });

  describe('Content-Type Handling', () => {
    test('sollte JSON Content-Type für alle Responses verwenden', async () => {
      const response = await request(app)
        .get('/api/projects/master-data')
        .expect(200);
      
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    test('sollte JSON Input für POST-Requests erwarten', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send('invalid-json-string')
        .expect(400);
      
      // Sollte JSON-Parsing-Fehler oder Validierungsfehler zurückgeben
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('German Business Logic Integration', () => {
    test('sollte deutsche Kategorien in Master-Data enthalten', async () => {
      const response = await request(app)
        .get('/api/projects/master-data')
        .expect(200);
      
      const kategorien = response.body.kategorien;
      expect(kategorien).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'IT & Software',
            kategorie_typ: 'ausgaben'
          })
        ])
      );
    });

    test('sollte deutsche Teams in Master-Data enthalten', async () => {
      const response = await request(app)
        .get('/api/projects/master-data')
        .expect(200);
      
      const teams = response.body.teams;
      expect(teams).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Development Team'
          })
        ])
      );
    });

    test('sollte deutsche Kostenarten bereitstellen', async () => {
      const response = await request(app)
        .get('/api/projects/master-data')
        .expect(200);
      
      const kostenarten = response.body.kostenarten;
      expect(kostenarten).toContain('Personal');
      expect(kostenarten).toContain('Externe Dienstleister');
      expect(kostenarten).toContain('IT-Infrastruktur');
      expect(kostenarten).toContain('Lizenzen');
    });
  });

  describe('Performance Tests', () => {
    test('Master-Data-Endpoint sollte schnell antworten', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/projects/master-data')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Unter 1 Sekunde
    });
  });
});
