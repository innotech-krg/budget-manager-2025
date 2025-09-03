/**
 * Budget Synchronization Service
 * Hört auf PostgreSQL NOTIFY Events und führt Jahresbudget-Synchronisation durch
 */

import { supabaseAdmin } from '../config/supabase.js';
import { synchronizeAnnualBudget } from '../controllers/budgetController.js';

class BudgetSyncService {
  constructor() {
    this.isListening = false;
    this.client = null;
  }

  /**
   * Startet den Budget-Sync-Service
   */
  async start() {
    if (this.isListening) {
      console.log('⚠️ Budget-Sync-Service läuft bereits');
      return;
    }

    try {
      // Erstelle eine dedizierte Verbindung für LISTEN/NOTIFY
      this.client = supabaseAdmin.realtime.channel('budget_sync');
      
      // Alternative: Direkte PostgreSQL Verbindung für LISTEN/NOTIFY
      // Da Supabase Realtime möglicherweise nicht alle NOTIFY Events unterstützt,
      // implementieren wir einen Polling-Mechanismus als Fallback
      
      console.log('🔄 Budget-Sync-Service gestartet');
      this.isListening = true;
      
      // Starte Polling für Budget-Updates (alle 30 Sekunden)
      this.startPolling();
      
    } catch (error) {
      console.error('❌ Fehler beim Starten des Budget-Sync-Service:', error);
    }
  }

  /**
   * Stoppt den Budget-Sync-Service
   */
  async stop() {
    if (!this.isListening) return;

    try {
      if (this.client) {
        await this.client.unsubscribe();
      }
      
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
      }
      
      this.isListening = false;
      console.log('🛑 Budget-Sync-Service gestoppt');
    } catch (error) {
      console.error('❌ Fehler beim Stoppen des Budget-Sync-Service:', error);
    }
  }

  /**
   * Startet Polling für Budget-Updates
   */
  startPolling() {
    // Polling alle 30 Sekunden
    this.pollingInterval = setInterval(async () => {
      await this.checkForBudgetUpdates();
    }, 30000);
  }

  /**
   * Prüft auf Budget-Updates und führt Synchronisation durch
   */
  async checkForBudgetUpdates() {
    try {
      // Hole alle Projekte mit kürzlich aktualisierten Rechnungspositionen
      const { data: recentUpdates, error } = await supabaseAdmin
        .from('invoice_positions')
        .select(`
          project_id,
          updated_at,
          invoices (
            supplier_name
          )
        `)
        .gte('updated_at', new Date(Date.now() - 60000).toISOString()) // Letzte Minute
        .limit(10);

      if (error) {
        console.log('⚠️ Fehler beim Prüfen auf Budget-Updates:', error.message);
        return;
      }

      if (recentUpdates && recentUpdates.length > 0) {
        console.log(`🔄 ${recentUpdates.length} kürzliche Budget-Updates gefunden`);
        
        // Gruppiere nach project_id
        const projectUpdates = {};
        recentUpdates.forEach(update => {
          if (!projectUpdates[update.project_id]) {
            projectUpdates[update.project_id] = [];
          }
          projectUpdates[update.project_id].push(update);
        });

        // Führe Synchronisation für jedes Projekt durch
        for (const [projectId, updates] of Object.entries(projectUpdates)) {
          await this.syncProjectBudget(projectId, updates);
        }
      }
    } catch (error) {
      console.log('⚠️ Fehler beim Budget-Update-Check:', error.message);
    }
  }

  /**
   * Synchronisiert das Budget für ein spezifisches Projekt
   */
  async syncProjectBudget(projectId, updates) {
    try {
      const currentYear = new Date().getFullYear();
      await synchronizeAnnualBudget(projectId, currentYear);
      
      const supplierNames = updates
        .map(u => u.invoices?.supplier_name)
        .filter(Boolean)
        .join(', ');
      
      console.log(`✅ Budget-Synchronisation für Projekt ${projectId} (${supplierNames}) abgeschlossen`);
    } catch (error) {
      console.log(`⚠️ Fehler bei Budget-Synchronisation für Projekt ${projectId}:`, error.message);
    }
  }
}

// Singleton-Instanz
const budgetSyncService = new BudgetSyncService();

export default budgetSyncService;

