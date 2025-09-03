#!/usr/bin/env node

// =====================================================
// Budget Manager 2025 - Intelligentes Port-Management
// Automatische Port-Erkennung und -Konfiguration
// =====================================================

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

class PortManager {
  constructor() {
    this.preferredPorts = {
      frontend: 3000,
      backend: 3001
    };
    this.portRange = { min: 3000, max: 3099 };
    this.configFiles = {
      backend: {
        env: './backend/.env',
        envExample: './backend/.env.example'
      },
      frontend: {
        viteConfig: './frontend/vite.config.ts',
        env: './frontend/.env'
      },
      tests: [
        './tests/system-connectivity-test.js',
        './story-1-1-comprehensive-tests.js',
        './story-1-2-comprehensive-tests.js',
        './story-1-3-integration-tests.js',
        './story-1-4-comprehensive-tests.js',
        './story-1-5-comprehensive-tests.js'
      ]
    };
  }

  /**
   * Prüft ob ein Port verfügbar ist
   */
  async isPortAvailable(port) {
    try {
      const { stdout } = await execAsync(`lsof -i :${port}`);
      return stdout.trim() === '';
    } catch (error) {
      // Wenn lsof einen Fehler wirft, ist der Port wahrscheinlich frei
      return true;
    }
  }

  /**
   * Findet den nächsten verfügbaren Port ab einem Startport
   */
  async findAvailablePort(startPort = 3000) {
    for (let port = startPort; port <= this.portRange.max; port++) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }
    throw new Error(`Keine verfügbaren Ports im Bereich ${startPort}-${this.portRange.max}`);
  }

  /**
   * Stoppt alle laufenden Prozesse auf bestimmten Ports
   */
  async killProcessesOnPorts(ports) {
    console.log('🔄 Stoppe laufende Prozesse...');
    
    for (const port of ports) {
      try {
        const { stdout } = await execAsync(`lsof -ti :${port}`);
        if (stdout.trim()) {
          const pids = stdout.trim().split('\n');
          for (const pid of pids) {
            await execAsync(`kill -9 ${pid}`);
            console.log(`   ✅ Prozess ${pid} auf Port ${port} gestoppt`);
          }
        }
      } catch (error) {
        // Port war bereits frei
      }
    }
  }

  /**
   * Aktualisiert Backend .env Datei
   */
  async updateBackendEnv(port) {
    const envPath = this.configFiles.backend.env;
    
    try {
      let envContent = await fs.readFile(envPath, 'utf8');
      
      // PORT-Zeile ersetzen oder hinzufügen
      const portRegex = /^PORT=.*$/m;
      if (portRegex.test(envContent)) {
        envContent = envContent.replace(portRegex, `PORT=${port}`);
      } else {
        envContent += `\n# Server Port\nPORT=${port}\n`;
      }
      
      await fs.writeFile(envPath, envContent);
      console.log(`   ✅ Backend .env aktualisiert: PORT=${port}`);
    } catch (error) {
      console.error(`   ❌ Fehler beim Aktualisieren der Backend .env: ${error.message}`);
    }
  }

  /**
   * Aktualisiert Frontend Vite-Konfiguration
   */
  async updateFrontendViteConfig(frontendPort, backendPort) {
    const viteConfigPath = this.configFiles.frontend.viteConfig;
    
    try {
      let viteContent = await fs.readFile(viteConfigPath, 'utf8');
      
      // Frontend Port aktualisieren
      const frontendPortRegex = /port:\s*\d+/;
      viteContent = viteContent.replace(frontendPortRegex, `port: ${frontendPort}`);
      
      // Backend Proxy Target aktualisieren
      const proxyTargetRegex = /target:\s*['"`]http:\/\/localhost:\d+['"`]/;
      viteContent = viteContent.replace(proxyTargetRegex, `target: 'http://localhost:${backendPort}'`);
      
      await fs.writeFile(viteConfigPath, viteContent);
      console.log(`   ✅ Frontend Vite-Config aktualisiert: Frontend=${frontendPort}, Backend-Proxy=${backendPort}`);
    } catch (error) {
      console.error(`   ❌ Fehler beim Aktualisieren der Vite-Config: ${error.message}`);
    }
  }

  /**
   * Aktualisiert Frontend .env Datei
   */
  async updateFrontendEnv(backendPort) {
    const envPath = this.configFiles.frontend.env;
    
    try {
      let envContent = await fs.readFile(envPath, 'utf8');
      
      // API_BASE_URL aktualisieren
      const apiUrlRegex = /^VITE_API_BASE_URL=.*$/m;
      if (apiUrlRegex.test(envContent)) {
        envContent = envContent.replace(apiUrlRegex, `VITE_API_BASE_URL=http://localhost:${backendPort}`);
      } else {
        envContent += `\n# Backend API URL\nVITE_API_BASE_URL=http://localhost:${backendPort}\n`;
      }
      
      await fs.writeFile(envPath, envContent);
      console.log(`   ✅ Frontend .env aktualisiert: API_BASE_URL=http://localhost:${backendPort}`);
    } catch (error) {
      console.error(`   ❌ Fehler beim Aktualisieren der Frontend .env: ${error.message}`);
    }
  }

  /**
   * Aktualisiert Test-Dateien mit neuen Ports
   */
  async updateTestFiles(frontendPort, backendPort) {
    console.log('🔄 Aktualisiere Test-Dateien...');
    
    for (const testFile of this.configFiles.tests) {
      try {
        const exists = await fs.access(testFile).then(() => true).catch(() => false);
        if (!exists) continue;
        
        let testContent = await fs.readFile(testFile, 'utf8');
        
        // Frontend URLs aktualisieren
        testContent = testContent.replace(
          /http:\/\/localhost:\d+(?!\/api)/g, 
          `http://localhost:${frontendPort}`
        );
        
        // Backend API URLs aktualisieren
        testContent = testContent.replace(
          /http:\/\/localhost:\d+\/api/g, 
          `http://localhost:${backendPort}/api`
        );
        
        // Backend Health URLs aktualisieren
        testContent = testContent.replace(
          /http:\/\/localhost:\d+\/health/g, 
          `http://localhost:${backendPort}/health`
        );
        
        await fs.writeFile(testFile, testContent);
        console.log(`   ✅ ${path.basename(testFile)} aktualisiert`);
      } catch (error) {
        console.error(`   ❌ Fehler beim Aktualisieren von ${testFile}: ${error.message}`);
      }
    }
  }

  /**
   * Erstellt Port-Konfigurationsdatei
   */
  async savePortConfig(frontendPort, backendPort) {
    const config = {
      timestamp: new Date().toISOString(),
      ports: {
        frontend: frontendPort,
        backend: backendPort
      },
      urls: {
        frontend: `http://localhost:${frontendPort}`,
        backend: `http://localhost:${backendPort}`,
        api: `http://localhost:${backendPort}/api`,
        health: `http://localhost:${backendPort}/health`
      }
    };
    
    await fs.writeFile('./scripts/port-config.json', JSON.stringify(config, null, 2));
    console.log('   ✅ Port-Konfiguration gespeichert in scripts/port-config.json');
  }

  /**
   * Hauptfunktion: Konfiguriert alle Ports automatisch
   */
  async configurePorts() {
    console.log('🚀 Budget Manager 2025 - Port-Management gestartet\n');
    
    try {
      // 1. Alle Ports im Bereich freigeben
      const portsToCheck = Array.from({length: 20}, (_, i) => 3000 + i);
      await this.killProcessesOnPorts(portsToCheck);
      
      // 2. Verfügbare Ports finden
      console.log('\n🔍 Suche verfügbare Ports...');
      const frontendPort = await this.findAvailablePort(this.preferredPorts.frontend);
      const backendPort = await this.findAvailablePort(frontendPort + 1);
      
      console.log(`   ✅ Frontend Port: ${frontendPort}`);
      console.log(`   ✅ Backend Port: ${backendPort}`);
      
      // 3. Konfigurationsdateien aktualisieren
      console.log('\n🔧 Aktualisiere Konfigurationsdateien...');
      await Promise.all([
        this.updateBackendEnv(backendPort),
        this.updateFrontendViteConfig(frontendPort, backendPort),
        this.updateFrontendEnv(backendPort),
        this.updateTestFiles(frontendPort, backendPort)
      ]);
      
      // 4. Port-Konfiguration speichern
      await this.savePortConfig(frontendPort, backendPort);
      
      console.log('\n✅ Port-Management erfolgreich abgeschlossen!');
      console.log('\n📊 Aktuelle Konfiguration:');
      console.log(`   Frontend: http://localhost:${frontendPort}`);
      console.log(`   Backend:  http://localhost:${backendPort}`);
      console.log(`   API:      http://localhost:${backendPort}/api`);
      console.log(`   Health:   http://localhost:${backendPort}/health`);
      
      console.log('\n🚀 Bereit zum Starten mit: npm run dev');
      
      return { frontendPort, backendPort };
      
    } catch (error) {
      console.error(`\n❌ Port-Management fehlgeschlagen: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lädt gespeicherte Port-Konfiguration
   */
  async loadPortConfig() {
    try {
      const configContent = await fs.readFile('./scripts/port-config.json', 'utf8');
      return JSON.parse(configContent);
    } catch (error) {
      return null;
    }
  }

  /**
   * Zeigt aktuelle Port-Status an
   */
  async showPortStatus() {
    console.log('📊 Budget Manager 2025 - Port-Status\n');
    
    const config = await this.loadPortConfig();
    if (config) {
      console.log('💾 Gespeicherte Konfiguration:');
      console.log(`   Frontend: ${config.ports.frontend}`);
      console.log(`   Backend:  ${config.ports.backend}`);
      console.log(`   Erstellt: ${new Date(config.timestamp).toLocaleString('de-DE')}\n`);
    }
    
    console.log('🔍 Aktuelle Port-Belegung:');
    for (let port = 3000; port <= 3010; port++) {
      const available = await this.isPortAvailable(port);
      const status = available ? '🟢 FREI' : '🔴 BELEGT';
      console.log(`   Port ${port}: ${status}`);
    }
  }
}

// Export für andere Module
export { PortManager };

// CLI Interface
const args = process.argv.slice(2);
const command = args[0] || 'configure';

const portManager = new PortManager();

switch (command) {
  case 'configure':
  case 'config':
    portManager.configurePorts().catch(console.error);
    break;
    
  case 'status':
    portManager.showPortStatus().catch(console.error);
    break;
    
  case 'kill':
    const portsToKill = Array.from({length: 20}, (_, i) => 3000 + i);
    portManager.killProcessesOnPorts(portsToKill)
      .then(() => console.log('✅ Alle Prozesse gestoppt'))
      .catch(console.error);
    break;
    
  default:
    console.log(`
🚀 Budget Manager 2025 - Port-Management

Verwendung:
  node scripts/port-manager.js [command]

Befehle:
  configure, config  Konfiguriert Ports automatisch (Standard)
  status            Zeigt Port-Status an
  kill              Stoppt alle Prozesse auf Ports 3000-3019

Beispiele:
  node scripts/port-manager.js configure
  node scripts/port-manager.js status
  node scripts/port-manager.js kill
`);
}
