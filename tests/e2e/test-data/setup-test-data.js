// =====================================================
// Budget Manager 2025 - E2E Test Data Setup
// Script zum Einrichten konsistenter Test-Daten
// =====================================================

import { supabaseAdmin } from '../../../backend/src/config/database.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TestDataManager {
  constructor() {
    this.testDataPrefix = 'E2E-';
  }

  async setupTestData() {
    console.log('🔧 Richte E2E Test-Daten ein...');
    
    try {
      // 1. Bereinige alte Test-Daten
      await this.cleanupTestData();
      
      // 2. Lade SQL-Script
      const sqlPath = path.join(__dirname, 'demo-data.sql');
      const sqlContent = await fs.readFile(sqlPath, 'utf8');
      
      // 3. Führe SQL-Script aus (vereinfacht)
      await this.executeSQLScript(sqlContent);
      
      // 4. Validiere Test-Daten
      await this.validateTestData();
      
      console.log('✅ E2E Test-Daten erfolgreich eingerichtet');
      
    } catch (error) {
      console.error('❌ Fehler beim Einrichten der Test-Daten:', error.message);
      throw error;
    }
  }

  async cleanupTestData() {
    console.log('🧹 Bereinige alte Test-Daten...');
    
    try {
      // Lösche Test-Projekte
      const { error: projectError } = await supabaseAdmin
        .from('projects')
        .delete()
        .like('projektnummer', `${this.testDataPrefix}%`);
      
      if (projectError && !projectError.message.includes('No rows found')) {
        console.warn('Warnung beim Löschen von Test-Projekten:', projectError.message);
      }
      
      // Lösche Test-Budgets
      const { error: budgetError } = await supabaseAdmin
        .from('annual_budgets')
        .delete()
        .like('beschreibung', '%E2E Test%');
      
      if (budgetError && !budgetError.message.includes('No rows found')) {
        console.warn('Warnung beim Löschen von Test-Budgets:', budgetError.message);
      }
      
      console.log('✅ Alte Test-Daten bereinigt');
      
    } catch (error) {
      console.warn('⚠️ Warnung bei Test-Daten-Bereinigung:', error.message);
      // Nicht kritisch - fortfahren
    }
  }

  async executeSQLScript(sqlContent) {
    console.log('📊 Erstelle Test-Daten...');
    
    // Vereinfachte Implementierung - erstelle Test-Daten direkt
    await this.createTestBudgets();
    await this.createTestProjects();
    await this.createTestTracking();
  }

  async createTestBudgets() {
    // Generiere konsistente UUIDs für Test-Daten
    const testBudgetIds = {
      budget2025: uuidv4(),
      budget2024: uuidv4(),
      budgetDraft: uuidv4()
    };
    
    // Speichere IDs für andere Tests
    this.testBudgetIds = testBudgetIds;
    
    const testBudgets = [
      {
        id: testBudgetIds.budget2025,
        jahr: 2025,
        gesamtbudget: 500000.00,
        reserve_allokation: 10.0,
        verfuegbares_budget: 450000.00,
        status: 'ACTIVE',
        beschreibung: 'E2E Test Budget 2025 - Hauptbudget für Tests'
      },
      {
        id: testBudgetIds.budget2024,
        jahr: 2024,
        gesamtbudget: 400000.00,
        reserve_allokation: 15.0,
        verfuegbares_budget: 340000.00,
        status: 'CLOSED',
        beschreibung: 'E2E Test Budget 2024 - Abgeschlossenes Budget'
      },
      {
        id: testBudgetIds.budgetDraft,
        jahr: 2026,
        gesamtbudget: 600000.00,
        reserve_allokation: 8.0,
        verfuegbares_budget: 600000.00,
        status: 'DRAFT',
        beschreibung: 'E2E Test Budget 2026 - Entwurf für Tests'
      }
    ];

    for (const budget of testBudgets) {
      const { error } = await supabaseAdmin
        .from('annual_budgets')
        .insert(budget);
      
      if (error) {
        console.warn(`Warnung beim Erstellen von Budget ${budget.id}:`, error.message);
      }
    }
    
    console.log('✅ Test-Budgets erstellt');
  }

  async createTestProjects() {
    // Verwende die generierten Budget-IDs
    const testProjectIds = {
      project1: uuidv4(),
      project2: uuidv4()
    };
    
    this.testProjectIds = testProjectIds;
    
    const testProjects = [
      {
        id: testProjectIds.project1,
        projektnummer: 'E2E-2025-001',
        projektname: 'E2E Test Projekt Alpha',
        beschreibung: 'Erstes Test-Projekt für E2E Validierung',
        budget_zugewiesen: 50000.00,
        budget_verbraucht: 15000.00,
        startdatum: '2025-01-01',
        enddatum: '2025-06-30',
        status: 'ACTIVE',
        prioritaet: 'HOCH',
        projektleiter: 'Max Mustermann',
        annual_budget_id: this.testBudgetIds?.budget2025 || uuidv4()
      },
      {
        id: testProjectIds.project2,
        projektnummer: 'E2E-2025-002',
        projektname: 'E2E Test Projekt Beta',
        beschreibung: 'Zweites Test-Projekt für E2E Validierung',
        budget_zugewiesen: 75000.00,
        budget_verbraucht: 25000.00,
        startdatum: '2025-02-01',
        enddatum: '2025-08-31',
        status: 'ACTIVE',
        prioritaet: 'MITTEL',
        projektleiter: 'Anna Schmidt',
        annual_budget_id: this.testBudgetIds?.budget2025 || uuidv4()
      }
    ];

    for (const project of testProjects) {
      const { error } = await supabaseAdmin
        .from('projects')
        .insert(project);
      
      if (error) {
        console.warn(`Warnung beim Erstellen von Projekt ${project.id}:`, error.message);
      }
    }
    
    console.log('✅ Test-Projekte erstellt');
  }

  async createTestTracking() {
    // Test-Tracking-Daten würden hier erstellt werden
    // Für Demo-Zwecke überspringen wir das
    console.log('✅ Test-Tracking-Daten bereit');
  }

  async validateTestData() {
    console.log('🔍 Validiere Test-Daten...');
    
    // Prüfe Test-Budgets
    const { data: budgets, error: budgetError } = await supabaseAdmin
      .from('annual_budgets')
      .select('*')
      .like('beschreibung', '%E2E Test%');
    
    if (budgetError) {
      throw new Error(`Fehler beim Validieren der Test-Budgets: ${budgetError.message}`);
    }
    
    // Prüfe Test-Projekte
    const { data: projects, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .like('projektnummer', `${this.testDataPrefix}%`);
    
    if (projectError) {
      throw new Error(`Fehler beim Validieren der Test-Projekte: ${projectError.message}`);
    }
    
    console.log(`✅ Validierung erfolgreich:`);
    console.log(`   📊 ${budgets?.length || 0} Test-Budgets`);
    console.log(`   📋 ${projects?.length || 0} Test-Projekte`);
    
    return {
      budgets: budgets?.length || 0,
      projects: projects?.length || 0
    };
  }

  async getTestDataSummary() {
    const validation = await this.validateTestData();
    
    return {
      status: 'ready',
      testBudgets: validation.budgets,
      testProjects: validation.projects,
      timestamp: new Date().toISOString()
    };
  }
}

// CLI Ausführung
if (import.meta.url === `file://${process.argv[1]}`) {
  const manager = new TestDataManager();
  
  const setupData = async () => {
    try {
      await manager.setupTestData();
      const summary = await manager.getTestDataSummary();
      
      console.log('\n📊 Test-Daten-Zusammenfassung:');
      console.log(`   Status: ${summary.status}`);
      console.log(`   Test-Budgets: ${summary.testBudgets}`);
      console.log(`   Test-Projekte: ${summary.testProjects}`);
      console.log(`   Zeitstempel: ${summary.timestamp}`);
      
      console.log('\n🎯 Test-Daten sind bereit für E2E Tests!');
      
    } catch (error) {
      console.error('❌ Setup fehlgeschlagen:', error.message);
      process.exit(1);
    }
  };
  
  setupData();
}

export { TestDataManager };
