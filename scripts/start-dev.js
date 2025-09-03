#!/usr/bin/env node

// =====================================================
// Budget Manager 2025 - Intelligenter Development Start
// Automatische Port-Konfiguration und Server-Start
// =====================================================

import { spawn } from 'child_process';
import { PortManager } from './port-manager.js';

class DevStarter {
  constructor() {
    this.portManager = new PortManager();
    this.processes = [];
  }

  /**
   * Startet die Entwicklungsserver mit automatischer Port-Konfiguration
   */
  async startDevelopment() {
    console.log('🚀 Budget Manager 2025 - Development Start\n');
    
    try {
      // 1. Port-Konfiguration
      console.log('🔧 Konfiguriere Ports automatisch...');
      const { frontendPort, backendPort } = await this.portManager.configurePorts();
      
      // 2. Kurze Pause für Dateisystem-Synchronisation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 3. Backend starten
      console.log('\n🔄 Starte Backend-Server...');
      const backendProcess = spawn('npm', ['run', 'dev:backend'], {
        cwd: process.cwd(),
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true
      });
      
      backendProcess.stdout.on('data', (data) => {
        console.log(`[Backend] ${data.toString().trim()}`);
      });
      
      backendProcess.stderr.on('data', (data) => {
        console.error(`[Backend] ${data.toString().trim()}`);
      });
      
      this.processes.push(backendProcess);
      
      // 4. Warten bis Backend bereit ist
      await this.waitForBackend(backendPort);
      
      // 5. Frontend starten
      console.log('\n🔄 Starte Frontend-Server...');
      const frontendProcess = spawn('npm', ['run', 'dev:frontend'], {
        cwd: process.cwd(),
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true
      });
      
      frontendProcess.stdout.on('data', (data) => {
        console.log(`[Frontend] ${data.toString().trim()}`);
      });
      
      frontendProcess.stderr.on('data', (data) => {
        console.error(`[Frontend] ${data.toString().trim()}`);
      });
      
      this.processes.push(frontendProcess);
      
      // 6. Erfolg anzeigen
      setTimeout(() => {
        console.log('\n✅ Development Server erfolgreich gestartet!');
        console.log('\n📊 Verfügbare URLs:');
        console.log(`   🌐 Frontend: http://localhost:${frontendPort}`);
        console.log(`   🔧 Backend:  http://localhost:${backendPort}`);
        console.log(`   📡 API:      http://localhost:${backendPort}/api`);
        console.log(`   💚 Health:   http://localhost:${backendPort}/health`);
        console.log('\n⚡ Bereit für Entwicklung! Drücke Ctrl+C zum Beenden.');
      }, 3000);
      
      // 7. Graceful Shutdown
      this.setupGracefulShutdown();
      
    } catch (error) {
      console.error(`\n❌ Fehler beim Starten: ${error.message}`);
      await this.cleanup();
      process.exit(1);
    }
  }

  /**
   * Wartet bis Backend verfügbar ist
   */
  async waitForBackend(port, maxAttempts = 30) {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await execAsync(`curl -s http://localhost:${port}/health`);
        console.log('   ✅ Backend ist bereit!');
        return;
      } catch (error) {
        console.log(`   ⏳ Warte auf Backend... (${i + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw new Error('Backend konnte nicht gestartet werden');
  }

  /**
   * Graceful Shutdown Setup
   */
  setupGracefulShutdown() {
    const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    
    signals.forEach(signal => {
      process.on(signal, async () => {
        console.log(`\n\n🛑 ${signal} empfangen - Stoppe Server...`);
        await this.cleanup();
        process.exit(0);
      });
    });
  }

  /**
   * Cleanup aller Prozesse
   */
  async cleanup() {
    console.log('🧹 Cleanup läuft...');
    
    for (const proc of this.processes) {
      try {
        proc.kill('SIGTERM');
        console.log('   ✅ Prozess gestoppt');
      } catch (error) {
        console.log('   ⚠️  Prozess bereits beendet');
      }
    }
    
    // Zusätzliche Port-Bereinigung
    await this.portManager.killProcessesOnPorts([3000, 3001, 3002, 3003, 3004, 3005]);
    console.log('   ✅ Ports freigegeben');
  }
}

// Export für andere Module
export { DevStarter };

// CLI Ausführung
if (import.meta.url === `file://${process.argv[1]}`) {
  const starter = new DevStarter();
  starter.startDevelopment().catch(console.error);
}

