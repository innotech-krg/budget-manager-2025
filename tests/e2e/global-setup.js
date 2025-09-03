// =====================================================
// Budget Manager 2025 - Playwright Global Setup
// Globale Vorbereitung für E2E Tests
// =====================================================

import { chromium } from '@playwright/test';

async function globalSetup() {
  console.log('🎭 Playwright Global Setup gestartet...');
  
  // Browser für Setup starten
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Warten bis Backend verfügbar ist
    console.log('⏳ Warte auf Backend...');
    let backendReady = false;
    let attempts = 0;
    const maxAttempts = 30;
    
    while (!backendReady && attempts < maxAttempts) {
      try {
        const response = await page.goto('http://localhost:3001/health', { 
          waitUntil: 'networkidle',
          timeout: 5000 
        });
        
        if (response && response.ok()) {
          backendReady = true;
          console.log('✅ Backend ist bereit');
        }
      } catch (error) {
        attempts++;
        if (attempts < maxAttempts) {
          console.log(`⏳ Backend noch nicht bereit (Versuch ${attempts}/${maxAttempts})`);
          await page.waitForTimeout(2000);
        }
      }
    }
    
    if (!backendReady) {
      throw new Error('Backend konnte nicht erreicht werden');
    }
    
    // Warten bis Frontend verfügbar ist
    console.log('⏳ Warte auf Frontend...');
    let frontendReady = false;
    attempts = 0;
    
    while (!frontendReady && attempts < maxAttempts) {
      try {
        const response = await page.goto('http://localhost:3000', { 
          waitUntil: 'networkidle',
          timeout: 5000 
        });
        
        if (response && response.ok()) {
          frontendReady = true;
          console.log('✅ Frontend ist bereit');
        }
      } catch (error) {
        attempts++;
        if (attempts < maxAttempts) {
          console.log(`⏳ Frontend noch nicht bereit (Versuch ${attempts}/${maxAttempts})`);
          await page.waitForTimeout(2000);
        }
      }
    }
    
    if (!frontendReady) {
      throw new Error('Frontend konnte nicht erreicht werden');
    }
    
    // Test-Daten vorbereiten (falls nötig)
    console.log('📊 Bereite Test-Daten vor...');
    
    try {
      // Importiere Test-Daten-Manager
      const { TestDataManager } = await import('./test-data/setup-test-data.js');
      const testDataManager = new TestDataManager();
      
      // Richte Test-Daten ein
      await testDataManager.setupTestData();
      
      // Speichere Test-Daten-Info für Tests
      global.testDataSummary = await testDataManager.getTestDataSummary();
      
    } catch (error) {
      console.warn('⚠️ Test-Daten-Setup fehlgeschlagen, verwende Mock-Daten:', error.message);
      global.testDataSummary = {
        status: 'mock',
        testBudgets: 0,
        testProjects: 0,
        timestamp: new Date().toISOString()
      };
    }
    
    console.log('✅ Global Setup abgeschlossen');
    
  } catch (error) {
    console.error('❌ Global Setup fehlgeschlagen:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
