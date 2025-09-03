// =====================================================
// Budget Manager 2025 - Test Helper Functions
// Gemeinsame Utilities für alle Test-Kategorien
// =====================================================

import fs from 'fs/promises';
import path from 'path';

/**
 * Test-Konfiguration laden
 */
export const loadTestConfig = async () => {
  try {
    const configPath = path.join(process.cwd(), 'tests', 'test-config.json');
    const configContent = await fs.readFile(configPath, 'utf8');
    return JSON.parse(configContent);
  } catch (error) {
    throw new Error(`Test-Konfiguration konnte nicht geladen werden: ${error.message}`);
  }
};

/**
 * Test-ID generieren nach Convention
 * Format: {EPIC}.{STORY}-{TYPE}-{SEQ}
 */
export const generateTestId = (epic, story, type, sequence) => {
  const typeMap = {
    'unit': 'UNIT',
    'integration': 'INT',
    'e2e': 'E2E',
    'story': 'STORY',
    'system': 'SYS'
  };
  
  const typeCode = typeMap[type] || type.toUpperCase();
  const seq = String(sequence).padStart(3, '0');
  
  return `${epic}.${story}-${typeCode}-${seq}`;
};

/**
 * Test-Beschreibung formatieren
 */
export const formatTestDescription = (component, testType, description) => {
  return `${component}.${testType}: ${description}`;
};

/**
 * Deutsche Währung formatieren für Tests
 */
export const formatGermanCurrency = (amount) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Deutsches Datum formatieren für Tests
 */
export const formatGermanDate = (date) => {
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

/**
 * Test-Timer für Performance-Messungen
 */
export class TestTimer {
  constructor() {
    this.startTime = null;
    this.endTime = null;
  }

  start() {
    this.startTime = performance.now();
    return this;
  }

  stop() {
    this.endTime = performance.now();
    return this;
  }

  getDuration() {
    if (!this.startTime || !this.endTime) {
      throw new Error('Timer wurde nicht korrekt gestartet/gestoppt');
    }
    return this.endTime - this.startTime;
  }

  getDurationFormatted() {
    const duration = this.getDuration();
    if (duration < 1000) {
      return `${Math.round(duration)}ms`;
    }
    return `${(duration / 1000).toFixed(2)}s`;
  }
}

/**
 * Test-Logger mit Kategorien
 */
export class TestLogger {
  constructor(category = 'TEST', verbose = true) {
    this.category = category;
    this.verbose = verbose;
    this.results = [];
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      category: this.category,
      type,
      message
    };

    this.results.push(logEntry);

    if (this.verbose) {
      const emoji = this.getEmoji(type);
      console.log(`${emoji} [${this.category}] ${message}`);
    }
  }

  success(message) {
    this.log(message, 'SUCCESS');
  }

  error(message) {
    this.log(message, 'ERROR');
  }

  warning(message) {
    this.log(message, 'WARNING');
  }

  info(message) {
    this.log(message, 'INFO');
  }

  getEmoji(type) {
    const emojiMap = {
      'SUCCESS': '✅',
      'ERROR': '❌',
      'WARNING': '⚠️',
      'INFO': 'ℹ️'
    };
    return emojiMap[type] || '📝';
  }

  getSummary() {
    const summary = {
      total: this.results.length,
      success: this.results.filter(r => r.type === 'SUCCESS').length,
      error: this.results.filter(r => r.type === 'ERROR').length,
      warning: this.results.filter(r => r.type === 'WARNING').length,
      info: this.results.filter(r => r.type === 'INFO').length
    };

    summary.successRate = summary.total > 0 ? 
      Math.round((summary.success / summary.total) * 100) : 0;

    return summary;
  }
}

/**
 * HTTP-Request Helper für API-Tests
 */
export const makeRequest = async (url, options = {}) => {
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    timeout: 10000
  };

  const requestOptions = { ...defaultOptions, ...options };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestOptions.timeout);

    const response = await fetch(url, {
      ...requestOptions,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const result = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      ok: response.ok
    };

    // Body nur parsen wenn vorhanden
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        result.data = await response.json();
      } catch (error) {
        result.data = null;
        result.parseError = error.message;
      }
    } else {
      result.text = await response.text();
    }

    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout nach ${requestOptions.timeout}ms`);
    }
    throw error;
  }
};

/**
 * Warten auf Bedingung (für async Tests)
 */
export const waitFor = async (condition, timeout = 5000, interval = 100) => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Bedingung nicht erfüllt nach ${timeout}ms`);
};

/**
 * Test-Daten-Cleaner
 */
export const cleanupTestData = async (patterns = []) => {
  // Implementierung für Test-Daten-Cleanup
  // z.B. temporäre Dateien, Test-DB-Einträge, etc.
  console.log('🧹 Test-Daten werden bereinigt...');
  
  for (const pattern of patterns) {
    try {
      // Hier würde die spezifische Cleanup-Logik stehen
      console.log(`   ✅ Pattern bereinigt: ${pattern}`);
    } catch (error) {
      console.log(`   ⚠️  Pattern-Cleanup fehlgeschlagen: ${pattern} - ${error.message}`);
    }
  }
};

/**
 * Test-Umgebung validieren
 */
export const validateTestEnvironment = async () => {
  const config = await loadTestConfig();
  const issues = [];

  // Port-Verfügbarkeit prüfen
  const ports = Object.values(config.environment.ports);
  for (const port of ports) {
    try {
      const response = await makeRequest(`http://localhost:${port}/health`);
      if (!response.ok && port !== config.environment.ports.testServer) {
        issues.push(`Port ${port} nicht erreichbar`);
      }
    } catch (error) {
      if (port !== config.environment.ports.testServer) {
        issues.push(`Port ${port} nicht verfügbar: ${error.message}`);
      }
    }
  }

  // Test-Verzeichnisse prüfen
  const testDirs = [
    config.categories.unit.directory,
    config.categories.integration.directory,
    config.categories.stories.directory,
    config.categories.system.directory
  ];

  for (const dir of testDirs) {
    try {
      await fs.access(dir);
    } catch (error) {
      issues.push(`Test-Verzeichnis fehlt: ${dir}`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    config
  };
};

/**
 * Test-Ergebnis-Formatter
 */
export const formatTestResults = (results) => {
  const summary = {
    total: results.length,
    passed: results.filter(r => r.status === 'passed').length,
    failed: results.filter(r => r.status === 'failed').length,
    skipped: results.filter(r => r.status === 'skipped').length
  };

  summary.passRate = summary.total > 0 ? 
    Math.round((summary.passed / summary.total) * 100) : 0;

  return {
    summary,
    results,
    formatted: {
      console: formatConsoleResults(summary, results),
      json: JSON.stringify({ summary, results }, null, 2)
    }
  };
};

const formatConsoleResults = (summary, results) => {
  const lines = [];
  lines.push('📊 Test-Ergebnisse:');
  lines.push(`   Gesamt: ${summary.total}`);
  lines.push(`   ✅ Bestanden: ${summary.passed}`);
  lines.push(`   ❌ Fehlgeschlagen: ${summary.failed}`);
  lines.push(`   ⏭️  Übersprungen: ${summary.skipped}`);
  lines.push(`   📈 Erfolgsrate: ${summary.passRate}%`);
  
  if (summary.failed > 0) {
    lines.push('\n❌ Fehlgeschlagene Tests:');
    results
      .filter(r => r.status === 'failed')
      .forEach(r => {
        lines.push(`   • ${r.name}: ${r.error || 'Unbekannter Fehler'}`);
      });
  }

  return lines.join('\n');
};

// Default Export für einfache Verwendung
export default {
  loadTestConfig,
  generateTestId,
  formatTestDescription,
  formatGermanCurrency,
  formatGermanDate,
  TestTimer,
  TestLogger,
  makeRequest,
  waitFor,
  cleanupTestData,
  validateTestEnvironment,
  formatTestResults
};

