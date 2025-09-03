#!/usr/bin/env node

// =====================================================
// Budget Manager 2025 - E2E Test Runner
// Ausführung aller Epic 1 E2E Tests
// =====================================================

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { TestLogger, loadTestConfig } from '../test-utils/test-helpers.js';

const logger = new TestLogger('E2E.RUNNER');

class E2ETestRunner {
  constructor() {
    this.config = null;
    this.testResults = [];
    this.playwrightInstalled = false;
  }

  async initialize() {
    logger.info('Initialisiere E2E Test Runner...');
    
    try {
      this.config = await loadTestConfig();
      await this.checkPlaywrightInstallation();
      await this.checkTestEnvironment();
    } catch (error) {
      logger.error(`Initialisierung fehlgeschlagen: ${error.message}`);
      throw error;
    }
  }

  async checkPlaywrightInstallation() {
    try {
      // Prüfe ob Playwright installiert ist
      const { stdout } = await this.executeCommand('npx', ['playwright', '--version'], { timeout: 5000 });
      
      if (stdout.includes('Version')) {
        this.playwrightInstalled = true;
        logger.success('Playwright ist installiert');
      }
    } catch (error) {
      logger.warning('Playwright ist nicht installiert');
      this.playwrightInstalled = false;
    }
  }

  async checkTestEnvironment() {
    // Prüfe ob Frontend und Backend laufen
    const frontendUrl = `http://localhost:${this.config.environment.ports.frontend}`;
    const backendUrl = `http://localhost:${this.config.environment.ports.backend}`;
    
    try {
      const frontendResponse = await fetch(frontendUrl);
      if (frontendResponse.ok) {
        logger.success(`Frontend erreichbar: ${frontendUrl}`);
      }
    } catch (error) {
      logger.error(`Frontend nicht erreichbar: ${frontendUrl}`);
    }
    
    try {
      const backendResponse = await fetch(`${backendUrl}/health`);
      if (backendResponse.ok) {
        logger.success(`Backend erreichbar: ${backendUrl}`);
      }
    } catch (error) {
      logger.error(`Backend nicht erreichbar: ${backendUrl}`);
    }
  }

  async runAllE2ETests() {
    logger.info('Starte alle E2E Tests für Epic 1...');
    
    const testFiles = [
      'story-1-1-annual-budget-management.e2e.test.js',
      'story-1-2-project-creation.e2e.test.js', 
      'story-1-3-budget-tracking.e2e.test.js',
      'story-1-4-budget-transfer.e2e.test.js',
      'story-1-5-dashboard.e2e.test.js'
    ];
    
    if (!this.playwrightInstalled) {
      logger.warning('Playwright nicht installiert - führe Simulation aus');
      return await this.simulateE2ETests(testFiles);
    }
    
    // Echte Playwright-Tests ausführen
    for (const testFile of testFiles) {
      await this.runSingleE2ETest(testFile);
    }
    
    return this.generateReport();
  }

  async simulateE2ETests(testFiles) {
    logger.info('Simuliere E2E Tests (Playwright nicht verfügbar)...');
    
    const simulatedResults = [];
    
    for (const testFile of testFiles) {
      const storyNumber = testFile.match(/story-1-(\d)/)?.[1];
      const storyName = this.getStoryName(storyNumber);
      
      logger.info(`Simuliere Tests für ${storyName}...`);
      
      // Führe die Test-Datei als Node.js Script aus
      try {
        const testPath = path.join('tests/e2e/user-journeys', testFile);
        const result = await this.executeCommand('node', [testPath], { timeout: 30000 });
        
        simulatedResults.push({
          story: storyName,
          file: testFile,
          status: 'simulated',
          output: result.output,
          issues: this.analyzeTestOutput(result.output)
        });
        
        logger.success(`${storyName} Simulation abgeschlossen`);
        
      } catch (error) {
        simulatedResults.push({
          story: storyName,
          file: testFile,
          status: 'error',
          error: error.message,
          issues: ['Simulation fehlgeschlagen']
        });
        
        logger.error(`${storyName} Simulation fehlgeschlagen: ${error.message}`);
      }
    }
    
    return simulatedResults;
  }

  async runSingleE2ETest(testFile) {
    logger.info(`Führe E2E Test aus: ${testFile}`);
    
    try {
      const result = await this.executeCommand('npx', [
        'playwright', 'test', 
        `tests/e2e/user-journeys/${testFile}`,
        '--reporter=json'
      ], { timeout: 120000 });
      
      this.testResults.push({
        file: testFile,
        status: 'completed',
        result: JSON.parse(result.output)
      });
      
    } catch (error) {
      this.testResults.push({
        file: testFile,
        status: 'failed',
        error: error.message
      });
    }
  }

  analyzeTestOutput(output) {
    const issues = [];
    
    // Analysiere Output nach bekannten Problemen
    if (output.includes('Playwright Setup erforderlich')) {
      issues.push('Playwright Installation erforderlich');
    }
    
    if (output.includes('nicht erreichbar')) {
      issues.push('Server-Verbindungsprobleme');
    }
    
    if (output.includes('nicht gefunden')) {
      issues.push('UI-Elemente fehlen oder haben andere Selektoren');
    }
    
    return issues;
  }

  getStoryName(storyNumber) {
    const storyNames = {
      '1': 'Story 1.1: Jahresbudget-Verwaltung',
      '2': 'Story 1.2: Deutsche Geschäftsprojekt-Erstellung',
      '3': 'Story 1.3: 3D Budget-Tracking',
      '4': 'Story 1.4: Budget-Transfer-System',
      '5': 'Story 1.5: Echtzeit-Budget-Dashboard'
    };
    
    return storyNames[storyNumber] || `Story 1.${storyNumber}`;
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.testResults.length,
        passed: this.testResults.filter(r => r.status === 'completed').length,
        failed: this.testResults.filter(r => r.status === 'failed').length,
        simulated: this.testResults.filter(r => r.status === 'simulated').length
      },
      results: this.testResults,
      recommendations: this.generateRecommendations(),
      nextSteps: this.generateNextSteps()
    };
    
    // Report speichern
    const reportPath = 'tests/reports/e2e-epic1-report.json';
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    logger.success(`E2E Report gespeichert: ${reportPath}`);
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (!this.playwrightInstalled) {
      recommendations.push({
        priority: 'high',
        category: 'setup',
        title: 'Playwright Installation',
        description: 'Installiere Playwright für echte E2E Tests',
        command: 'npm install -D @playwright/test && npx playwright install'
      });
    }
    
    // Analysiere häufige Probleme
    const allIssues = this.testResults.flatMap(r => r.issues || []);
    const issueFrequency = {};
    
    allIssues.forEach(issue => {
      issueFrequency[issue] = (issueFrequency[issue] || 0) + 1;
    });
    
    Object.entries(issueFrequency).forEach(([issue, count]) => {
      if (count >= 2) {
        recommendations.push({
          priority: 'medium',
          category: 'ui',
          title: `Häufiges Problem: ${issue}`,
          description: `Tritt in ${count} Tests auf`,
          action: 'UI-Selektoren und Element-IDs überprüfen'
        });
      }
    });
    
    return recommendations;
  }

  generateNextSteps() {
    return [
      {
        step: 1,
        title: 'Playwright Setup',
        description: 'Installiere und konfiguriere Playwright für E2E Tests',
        estimated: '30 Minuten'
      },
      {
        step: 2,
        title: 'UI-Selektoren optimieren',
        description: 'Füge data-testid Attribute zu kritischen UI-Elementen hinzu',
        estimated: '2 Stunden'
      },
      {
        step: 3,
        title: 'Test-Daten Setup',
        description: 'Erstelle konsistente Test-Daten für E2E Tests',
        estimated: '1 Stunde'
      },
      {
        step: 4,
        title: 'CI/CD Integration',
        description: 'Integriere E2E Tests in die Deployment-Pipeline',
        estimated: '3 Stunden'
      }
    ];
  }

  async executeCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true
      });

      let output = '';
      let error = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        error += data.toString();
      });

      const timeout = options.timeout || 30000;
      const timeoutId = setTimeout(() => {
        process.kill('SIGTERM');
        reject(new Error(`Command timeout nach ${timeout}ms`));
      }, timeout);

      process.on('close', (code) => {
        clearTimeout(timeoutId);
        
        if (code === 0) {
          resolve({ output, error, code });
        } else {
          reject(new Error(`Command failed with code ${code}: ${error}`));
        }
      });
    });
  }

  displayReport(report) {
    console.log('\n🎭 ====================================');
    console.log('   E2E TEST REPORT - EPIC 1');
    console.log('====================================\n');
    
    console.log('📊 Zusammenfassung:');
    console.log(`   Gesamt Tests: ${report.summary.totalTests}`);
    console.log(`   ✅ Bestanden: ${report.summary.passed}`);
    console.log(`   ❌ Fehlgeschlagen: ${report.summary.failed}`);
    console.log(`   🔄 Simuliert: ${report.summary.simulated}`);
    
    console.log('\n📋 Test-Ergebnisse:');
    report.results.forEach(result => {
      const emoji = result.status === 'completed' ? '✅' : 
                   result.status === 'simulated' ? '🔄' : '❌';
      console.log(`   ${emoji} ${result.story || result.file}`);
      
      if (result.issues && result.issues.length > 0) {
        result.issues.forEach(issue => {
          console.log(`      ⚠️  ${issue}`);
        });
      }
    });
    
    console.log('\n💡 Empfehlungen:');
    report.recommendations.forEach(rec => {
      const priorityEmoji = rec.priority === 'high' ? '🔴' : 
                           rec.priority === 'medium' ? '🟡' : '🟢';
      console.log(`   ${priorityEmoji} ${rec.title}`);
      console.log(`      ${rec.description}`);
      if (rec.command) {
        console.log(`      💻 ${rec.command}`);
      }
    });
    
    console.log('\n🚀 Nächste Schritte:');
    report.nextSteps.forEach(step => {
      console.log(`   ${step.step}. ${step.title} (${step.estimated})`);
      console.log(`      ${step.description}`);
    });
  }
}

// CLI Ausführung
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new E2ETestRunner();
  
  const runE2ETests = async () => {
    try {
      await runner.initialize();
      const report = await runner.runAllE2ETests();
      runner.displayReport(report);
      
      console.log('\n✅ E2E Test-Analyse abgeschlossen!');
      console.log('📄 Detaillierter Report: tests/reports/e2e-epic1-report.json');
      
    } catch (error) {
      logger.error(`E2E Test Runner Fehler: ${error.message}`);
      process.exit(1);
    }
  };
  
  runE2ETests();
}

export { E2ETestRunner };

