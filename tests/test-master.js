#!/usr/bin/env node

// =====================================================
// Budget Manager 2025 - Master Test Runner
// Interaktive Test-Auswahl und -Ausführung
// =====================================================

import { spawn } from 'child_process';
import { createInterface } from 'readline';
import fs from 'fs/promises';
import path from 'path';
import { loadTestConfig, TestLogger, validateTestEnvironment, formatTestResults } from './test-utils/test-helpers.js';

class MasterTestRunner {
  constructor() {
    this.config = null;
    this.logger = new TestLogger('MASTER', true);
    this.results = [];
    this.rl = null;
  }

  /**
   * Haupteinstiegspunkt
   */
  async run() {
    try {
      await this.initialize();
      await this.showWelcome();
      
      const args = process.argv.slice(2);
      
      if (args.length > 0) {
        // Kommandozeilen-Modus
        await this.runCommandLine(args);
      } else {
        // Interaktiver Modus
        await this.runInteractive();
      }
      
    } catch (error) {
      this.logger.error(`Master Test Runner Fehler: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Initialisierung
   */
  async initialize() {
    this.logger.info('Initialisiere Master Test Runner...');
    
    // Konfiguration laden
    this.config = await loadTestConfig();
    
    // Test-Umgebung validieren
    const validation = await validateTestEnvironment();
    if (!validation.valid) {
      this.logger.warning('Test-Umgebung hat Probleme:');
      validation.issues.forEach(issue => this.logger.warning(`  • ${issue}`));
    }
    
    // Readline Interface erstellen
    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Willkommensnachricht
   */
  async showWelcome() {
    console.log(`
🚀 ====================================
   Budget Manager 2025 - Test Master
   Zentrale Test-Ausführung
====================================

📊 Verfügbare Test-Kategorien:
   1️⃣  Unit Tests        (${await this.countTests('unit')} Tests)
   2️⃣  Integration Tests (${await this.countTests('integration')} Tests)
   3️⃣  End-to-End Tests  (${await this.countTests('e2e')} Tests)
   4️⃣  Story Tests       (${await this.countTests('stories')} Tests)
   5️⃣  System Tests      (${await this.countTests('system')} Tests)

🎯 Spezielle Optionen:
   🔄 Alle Tests
   📊 Coverage Report
   🧹 Cleanup & Reset
   ⚙️  Konfiguration

====================================
`);
  }

  /**
   * Anzahl Tests in Kategorie zählen
   */
  async countTests(category) {
    try {
      const categoryConfig = this.config.categories[category];
      if (!categoryConfig) return 0;
      
      const files = await this.findTestFiles(categoryConfig.directory);
      return files.length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Test-Dateien finden
   */
  async findTestFiles(directory) {
    try {
      const files = await fs.readdir(directory, { recursive: true });
      return files.filter(file => 
        file.endsWith('.test.js') || 
        file.endsWith('.test.ts') || 
        file.endsWith('.test.tsx')
      );
    } catch (error) {
      return [];
    }
  }

  /**
   * Kommandozeilen-Modus
   */
  async runCommandLine(args) {
    const command = args[0];
    
    const commandMap = {
      'unit': () => this.runTestCategory('unit'),
      'integration': () => this.runTestCategory('integration'),
      'e2e': () => this.runTestCategory('e2e'),
      'stories': () => this.runTestCategory('stories'),
      'system': () => this.runTestCategory('system'),
      'all': () => this.runAllTests(),
      'coverage': () => this.runWithCoverage(),
      'cleanup': () => this.runCleanup(),
      'config': () => this.showConfig(),
      'help': () => this.showHelp()
    };

    const handler = commandMap[command];
    if (handler) {
      await handler();
    } else {
      this.logger.error(`Unbekannter Befehl: ${command}`);
      this.showHelp();
    }
  }

  /**
   * Interaktiver Modus
   */
  async runInteractive() {
    while (true) {
      const choice = await this.askQuestion(`
Wählen Sie eine Option:
[1] Unit Tests
[2] Integration Tests  
[3] End-to-End Tests
[4] Story Tests
[5] System Tests
[a] Alle Tests
[c] Coverage Report
[r] Cleanup & Reset
[s] Konfiguration anzeigen
[q] Beenden

Ihre Wahl: `);

      switch (choice.toLowerCase()) {
        case '1':
          await this.runTestCategory('unit');
          break;
        case '2':
          await this.runTestCategory('integration');
          break;
        case '3':
          await this.runTestCategory('e2e');
          break;
        case '4':
          await this.runTestCategory('stories');
          break;
        case '5':
          await this.runTestCategory('system');
          break;
        case 'a':
          await this.runAllTests();
          break;
        case 'c':
          await this.runWithCoverage();
          break;
        case 'r':
          await this.runCleanup();
          break;
        case 's':
          await this.showConfig();
          break;
        case 'q':
          this.logger.info('Test Master beendet.');
          this.rl.close();
          return;
        default:
          this.logger.warning('Ungültige Auswahl. Bitte versuchen Sie es erneut.');
      }

      // Kurze Pause zwischen Tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * Test-Kategorie ausführen
   */
  async runTestCategory(category) {
    const categoryConfig = this.config.categories[category];
    if (!categoryConfig) {
      this.logger.error(`Unbekannte Test-Kategorie: ${category}`);
      return;
    }

    this.logger.info(`Starte ${categoryConfig.description}...`);
    
    const testFiles = await this.findTestFiles(categoryConfig.directory);
    if (testFiles.length === 0) {
      this.logger.warning(`Keine Tests in ${categoryConfig.directory} gefunden`);
      return;
    }

    this.logger.info(`Gefunden: ${testFiles.length} Test-Dateien`);

    // Framework-spezifische Ausführung
    const frameworks = categoryConfig.frameworks;
    
    for (const framework of frameworks) {
      await this.runFrameworkTests(framework, category, categoryConfig);
    }
  }

  /**
   * Framework-spezifische Tests ausführen
   */
  async runFrameworkTests(framework, category, config) {
    this.logger.info(`Führe ${framework}-Tests aus...`);

    let command, args;

    switch (framework) {
      case 'jest':
        command = 'npm';
        args = ['run', 'test:backend', '--', `--testPathPattern=${config.directory}`];
        break;
      case 'vitest':
        command = 'npm';
        args = ['run', 'test:frontend'];
        break;
      case 'playwright':
        command = 'npx';
        args = ['playwright', 'test', config.directory];
        break;
      case 'custom':
        // Für Story und System Tests
        return await this.runCustomTests(category, config);
      default:
        this.logger.error(`Unbekanntes Framework: ${framework}`);
        return;
    }

    return await this.executeCommand(command, args, config.timeout);
  }

  /**
   * Custom Tests (Stories, System)
   */
  async runCustomTests(category, config) {
    const testFiles = await this.findTestFiles(config.directory);
    const results = [];

    for (const testFile of testFiles) {
      this.logger.info(`Führe aus: ${testFile}`);
      
      try {
        const fullPath = path.join(config.directory, testFile);
        const result = await this.executeCommand('node', [fullPath], config.timeout);
        
        results.push({
          file: testFile,
          status: result.success ? 'passed' : 'failed',
          output: result.output,
          error: result.error
        });
      } catch (error) {
        results.push({
          file: testFile,
          status: 'failed',
          error: error.message
        });
      }
    }

    this.displayResults(results);
    return results;
  }

  /**
   * Befehl ausführen
   */
  async executeCommand(command, args, timeout = 30000) {
    return new Promise((resolve) => {
      const process = spawn(command, args, {
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true
      });

      let output = '';
      let error = '';

      process.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.log(text.trim());
      });

      process.stderr.on('data', (data) => {
        const text = data.toString();
        error += text;
        console.error(text.trim());
      });

      const timeoutId = setTimeout(() => {
        process.kill('SIGTERM');
        resolve({
          success: false,
          output,
          error: error + '\nTimeout erreicht',
          code: -1
        });
      }, timeout);

      process.on('close', (code) => {
        clearTimeout(timeoutId);
        resolve({
          success: code === 0,
          output,
          error,
          code
        });
      });
    });
  }

  /**
   * Alle Tests ausführen
   */
  async runAllTests() {
    this.logger.info('Starte alle Test-Kategorien...');
    
    const categories = Object.keys(this.config.categories);
    const allResults = [];

    for (const category of categories) {
      this.logger.info(`\n🔄 Kategorie: ${category.toUpperCase()}`);
      const results = await this.runTestCategory(category);
      if (results) {
        allResults.push(...results);
      }
    }

    this.displayFinalSummary(allResults);
  }

  /**
   * Tests mit Coverage ausführen
   */
  async runWithCoverage() {
    this.logger.info('Starte Tests mit Coverage-Report...');
    
    // Backend Coverage
    await this.executeCommand('npm', ['run', 'test:backend', '--', '--coverage']);
    
    // Frontend Coverage
    await this.executeCommand('npm', ['run', 'test:frontend', '--', '--coverage']);
    
    this.logger.success('Coverage-Reports generiert in tests/reports/coverage/');
  }

  /**
   * Cleanup ausführen
   */
  async runCleanup() {
    this.logger.info('Führe Test-Cleanup durch...');
    
    // Test-Reports löschen
    try {
      await fs.rm('./tests/reports', { recursive: true, force: true });
      await fs.mkdir('./tests/reports', { recursive: true });
      this.logger.success('Test-Reports bereinigt');
    } catch (error) {
      this.logger.warning(`Report-Cleanup fehlgeschlagen: ${error.message}`);
    }

    // Temporäre Test-Dateien
    try {
      const tempFiles = await fs.readdir('./');
      const testTempFiles = tempFiles.filter(f => f.startsWith('test-') && f.endsWith('.tmp'));
      
      for (const file of testTempFiles) {
        await fs.unlink(file);
      }
      
      if (testTempFiles.length > 0) {
        this.logger.success(`${testTempFiles.length} temporäre Dateien entfernt`);
      }
    } catch (error) {
      this.logger.warning(`Temp-Cleanup fehlgeschlagen: ${error.message}`);
    }

    this.logger.success('Cleanup abgeschlossen');
  }

  /**
   * Konfiguration anzeigen
   */
  async showConfig() {
    console.log('\n📋 Aktuelle Test-Konfiguration:\n');
    console.log(JSON.stringify(this.config, null, 2));
  }

  /**
   * Hilfe anzeigen
   */
  showHelp() {
    console.log(`
🚀 Budget Manager 2025 - Test Master

Verwendung:
  node tests/test-master.js [command]

Befehle:
  unit          Unit Tests ausführen
  integration   Integration Tests ausführen  
  e2e          End-to-End Tests ausführen
  stories      Story Tests ausführen
  system       System Tests ausführen
  all          Alle Tests ausführen
  coverage     Tests mit Coverage ausführen
  cleanup      Test-Dateien bereinigen
  config       Konfiguration anzeigen
  help         Diese Hilfe anzeigen

Interaktiver Modus:
  node tests/test-master.js
  (ohne Parameter für interaktive Auswahl)

Beispiele:
  node tests/test-master.js unit
  node tests/test-master.js all
  node tests/test-master.js coverage
`);
  }

  /**
   * Ergebnisse anzeigen
   */
  displayResults(results) {
    const formatted = formatTestResults(results);
    console.log('\n' + formatted.formatted.console);
  }

  /**
   * Finale Zusammenfassung
   */
  displayFinalSummary(allResults) {
    console.log('\n🎯 ====================================');
    console.log('   FINALE TEST-ZUSAMMENFASSUNG');
    console.log('====================================\n');
    
    const formatted = formatTestResults(allResults);
    console.log(formatted.formatted.console);
    
    if (formatted.summary.passRate === 100) {
      console.log('\n🎉 Alle Tests bestanden! System ist bereit für Deployment.');
    } else if (formatted.summary.passRate >= 90) {
      console.log('\n✅ Sehr gute Test-Abdeckung. Kleinere Probleme beheben.');
    } else if (formatted.summary.passRate >= 70) {
      console.log('\n⚠️  Akzeptable Test-Abdeckung. Verbesserungen empfohlen.');
    } else {
      console.log('\n❌ Kritische Test-Probleme. Sofortige Aufmerksamkeit erforderlich.');
    }
  }

  /**
   * Benutzer-Eingabe abfragen
   */
  askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }
}

// CLI Ausführung
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new MasterTestRunner();
  runner.run().catch(console.error);
}

export { MasterTestRunner };

