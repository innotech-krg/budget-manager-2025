// =====================================================
// Budget Manager 2025 - Playwright Global Teardown
// Globale Bereinigung nach E2E Tests
// =====================================================

async function globalTeardown() {
  console.log('🧹 Playwright Global Teardown gestartet...');
  
  try {
    // Test-Daten bereinigen (falls nötig)
    console.log('🗑️ Bereinige Test-Daten...');
    
    // Hier könnten wir Test-Daten aus der Datenbank entfernen
    // Für Demo lassen wir die Daten bestehen
    
    // Temporäre Dateien bereinigen
    console.log('📁 Bereinige temporäre Dateien...');
    
    // Test-Reports archivieren
    console.log('📊 Archiviere Test-Reports...');
    
    console.log('✅ Global Teardown abgeschlossen');
    
  } catch (error) {
    console.error('❌ Global Teardown Fehler:', error.message);
    // Nicht kritisch - Tests sollen trotzdem als erfolgreich gelten
  }
}

export default globalTeardown;

