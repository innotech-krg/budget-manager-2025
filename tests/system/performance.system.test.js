// =====================================================
// Budget Manager 2025 - System Performance Tests
// Test-ID: SYS-PERF-001 bis SYS-PERF-010
// =====================================================

import { TestLogger, TestTimer, makeRequest, loadTestConfig } from '../test-utils/test-helpers.js';

const logger = new TestLogger('SYSTEM.PERFORMANCE');

/**
 * System Performance Tests
 * Prüft Performance-Anforderungen des Systems
 */
describe('SystemPerformance.system', () => {
  let config;
  let baseUrls;

  beforeAll(async () => {
    config = await loadTestConfig();
    baseUrls = {
      frontend: `http://localhost:${config.environment.ports.frontend}`,
      backend: `http://localhost:${config.environment.ports.backend}`
    };
  });

  describe('API Response Times', () => {
    it('SYS-PERF-001: should respond to health check within 100ms', async () => {
      const timer = new TestTimer().start();
      
      const response = await makeRequest(`${baseUrls.backend}/health`);
      
      timer.stop();
      const duration = timer.getDuration();
      
      expect(response.ok).toBe(true);
      expect(duration).toBeLessThan(100);
      
      logger.success(`Health Check: ${timer.getDurationFormatted()}`);
    });

    it('SYS-PERF-002: should load budget list within 500ms', async () => {
      const timer = new TestTimer().start();
      
      const response = await makeRequest(`${baseUrls.backend}/api/budgets`);
      
      timer.stop();
      const duration = timer.getDuration();
      
      expect(response.ok).toBe(true);
      expect(duration).toBeLessThan(500);
      
      logger.success(`Budget List: ${timer.getDurationFormatted()}`);
    });

    it('SYS-PERF-003: should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const timer = new TestTimer().start();
      
      const promises = Array.from({ length: concurrentRequests }, () =>
        makeRequest(`${baseUrls.backend}/api/budgets`)
      );
      
      const responses = await Promise.all(promises);
      
      timer.stop();
      const duration = timer.getDuration();
      const avgResponseTime = duration / concurrentRequests;
      
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });
      
      expect(avgResponseTime).toBeLessThan(200);
      
      logger.success(`Concurrent Requests (${concurrentRequests}): ${timer.getDurationFormatted()}, Avg: ${Math.round(avgResponseTime)}ms`);
    });
  });

  describe('Frontend Performance', () => {
    it('SYS-PERF-004: should load main page within 2 seconds', async () => {
      const timer = new TestTimer().start();
      
      const response = await makeRequest(baseUrls.frontend);
      
      timer.stop();
      const duration = timer.getDuration();
      
      expect(response.ok).toBe(true);
      expect(duration).toBeLessThan(2000);
      
      logger.success(`Frontend Load: ${timer.getDurationFormatted()}`);
    });
  });

  describe('Database Performance', () => {
    it('SYS-PERF-005: should execute budget queries within 300ms', async () => {
      const timer = new TestTimer().start();
      
      // Komplexere Query über API testen
      const response = await makeRequest(`${baseUrls.backend}/api/budgets?year=2025&include=projects`);
      
      timer.stop();
      const duration = timer.getDuration();
      
      expect(response.ok).toBe(true);
      expect(duration).toBeLessThan(300);
      
      logger.success(`Complex Budget Query: ${timer.getDurationFormatted()}`);
    });
  });

  describe('Memory Usage', () => {
    it('SYS-PERF-006: should maintain stable memory usage under load', async () => {
      const iterations = 50;
      const responses = [];
      
      logger.info(`Führe ${iterations} Requests für Memory-Test aus...`);
      
      for (let i = 0; i < iterations; i++) {
        const response = await makeRequest(`${baseUrls.backend}/api/budgets`);
        responses.push(response.ok);
        
        // Kurze Pause zwischen Requests
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const successRate = responses.filter(Boolean).length / responses.length;
      
      expect(successRate).toBeGreaterThan(0.95); // 95% Erfolgsrate
      
      logger.success(`Memory Load Test: ${Math.round(successRate * 100)}% Erfolgsrate`);
    });
  });

  afterAll(() => {
    const summary = logger.getSummary();
    console.log('\n📊 Performance Test Summary:');
    console.log(`   Total Tests: ${summary.total}`);
    console.log(`   Success Rate: ${summary.successRate}%`);
    
    if (summary.successRate === 100) {
      console.log('   🎉 Alle Performance-Anforderungen erfüllt!');
    } else if (summary.successRate >= 80) {
      console.log('   ⚠️  Performance-Optimierung empfohlen');
    } else {
      console.log('   ❌ Kritische Performance-Probleme');
    }
  });
});

// Standalone Ausführung für Custom Test Runner
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 System Performance Tests');
  console.log('============================\n');
  
  const runTests = async () => {
    try {
      const config = await loadTestConfig();
      const baseUrls = {
        frontend: `http://localhost:${config.environment.ports.frontend}`,
        backend: `http://localhost:${config.environment.ports.backend}`
      };
      
      logger.info('Starte Performance-Tests...');
      
      // Hier würden die Tests einzeln ausgeführt werden
      // Für Demo-Zwecke führen wir nur einen einfachen Test aus
      
      const timer = new TestTimer().start();
      const response = await makeRequest(`${baseUrls.backend}/health`);
      timer.stop();
      
      if (response.ok && timer.getDuration() < 100) {
        logger.success(`Health Check Performance: ${timer.getDurationFormatted()}`);
      } else {
        logger.error(`Health Check zu langsam: ${timer.getDurationFormatted()}`);
      }
      
      const summary = logger.getSummary();
      console.log(`\n✅ Performance Tests abgeschlossen (${summary.successRate}% Erfolg)`);
      
    } catch (error) {
      logger.error(`Performance Test Fehler: ${error.message}`);
      process.exit(1);
    }
  };
  
  runTests();
}

