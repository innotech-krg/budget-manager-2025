// =====================================================
// Budget Manager 2025 - Budget Allocation Service
// Story 1.2.3: Intelligente Budget-Zuordnung
// =====================================================

import { supabaseAdmin, formatGermanCurrency, toGermanCurrency } from '../config/database.js';

/**
 * Service für intelligente Budget-Zuordnung und Real-time Validierung
 * Implementiert die Geschäftslogik für Story 1.2.3
 */
class BudgetAllocationService {
  
  /**
   * Berechnet verfügbares Budget für ein Jahr
   * @param {number} jahr - Das Jahr für das Budget
   * @returns {Object} Verfügbares Budget mit Details
   */
  async getAvailableBudget(jahr) {
    try {
      console.log(`🔍 Suche Budget für Jahr: ${jahr}`);
      
      // Jahresbudget abrufen (Hauptbudget ohne team_id)
      const { data: annualBudget, error: budgetError } = await supabaseAdmin
        .from('annual_budgets')
        .select('*')
        .eq('year', jahr)
        .eq('status', 'ACTIVE')
        .is('team_id', null)
        .single();
      
      console.log('📊 Budget-Abfrage Ergebnis:', { annualBudget, budgetError });
      
      if (budgetError || !annualBudget) {
        console.log(`❌ Kein aktives Budget für Jahr ${jahr} gefunden`);
        throw new Error(`Kein aktives Budget für Jahr ${jahr} gefunden`);
      }
      
      console.log(`✅ Budget gefunden: ${annualBudget.id} für Jahr ${jahr}`);
      
      // Bereits zugewiesene Budgets berechnen (English fields only)
      const { data: projects, error: projectsError } = await supabaseAdmin
        .from('projects')
        .select('planned_budget, status')
        .eq('annual_budget_id', annualBudget.id)
        .in('status', ['planned', 'active', 'completed']); // Nur aktive Projekte
      
      console.log('📋 Projekte-Abfrage Ergebnis:', { projects, projectsError });
      
      if (projectsError) {
        console.log(`❌ Fehler beim Abrufen der Projekte: ${projectsError.message}`);
        throw new Error(`Fehler beim Abrufen der Projekte: ${projectsError.message}`);
      }
      
      // Summe der zugewiesenen Budgets berechnen (English fields only)
      const zugewiesenesBudget = projects?.reduce((sum, project) => {
        const budget = parseFloat(project.planned_budget) || 0;
        return sum + budget;
      }, 0) || 0;
      
      console.log(`💰 Zugewiesenes Budget berechnet: ${zugewiesenesBudget}`);
      
      // Verfügbares Budget berechnen
      const verfuegbaresBudget = annualBudget.total_budget - zugewiesenesBudget;
      
      // Reserve-Budget berechnen
      const reserveBudget = (annualBudget.total_budget * annualBudget.reserve_allocation) / 100;
      const verfuegbarOhneReserve = verfuegbaresBudget - reserveBudget;
      
      const result = {
        jahr: annualBudget.year,
        gesamtbudget: annualBudget.total_budget,
        zugewiesenes_budget: zugewiesenesBudget,
        verfuegbares_budget: verfuegbaresBudget,
        reserve_budget: reserveBudget,
        verfuegbar_ohne_reserve: Math.max(0, verfuegbarOhneReserve),
        reserve_allokation: annualBudget.reserve_allocation,
        anzahl_projekte: projects?.length || 0,
        auslastung_prozent: annualBudget.total_budget > 0 
          ? Math.round((zugewiesenesBudget / annualBudget.total_budget) * 100)
          : 0,
        // Ampel-System für Budget-Status
        budget_status: this.calculateBudgetStatus(verfuegbaresBudget, annualBudget.total_budget),
        annual_budget_id: annualBudget.id
      };
      
      console.log('✅ Budget-Berechnung abgeschlossen:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Fehler beim Berechnen des verfügbaren Budgets:', error);
      throw error;
    }
  }
  
  /**
   * Validiert ob ein Projekt-Budget zugeordnet werden kann
   * @param {number} jahr - Das Jahr
   * @param {number} geplantesBudget - Das geplante Budget für das Projekt
   * @param {string} projektId - Optional: ID des zu aktualisierenden Projekts
   * @returns {Object} Validierungsergebnis
   */
  async validateBudgetAllocation(jahr, geplantesbudget, projektId = null) {
    try {
      const formattedBudget = formatGermanCurrency(geplantesbudget);
      
      if (formattedBudget <= 0) {
        return {
          isValid: false,
          error: 'INVALID_BUDGET_AMOUNT',
          message: 'Das geplante Budget muss größer als 0 sein.',
          maxAllowedBudget: 0
        };
      }
      
      // Verfügbares Budget abrufen
      const availableBudget = await this.getAvailableBudget(jahr);
      
      // Bei Update: Aktuelles Projekt-Budget abziehen
      let currentProjectBudget = 0;
      if (projektId) {
        const { data: currentProject } = await supabaseAdmin
          .from('projects')
          .select('geplantes_budget')
          .eq('id', projektId)
          .single();
        
        currentProjectBudget = parseFloat(currentProject?.geplantes_budget) || 0;
      }
      
      // Verfügbares Budget für diese Zuordnung berechnen
      const verfuegbarFuerZuordnung = availableBudget.verfuegbares_budget + currentProjectBudget;
      
      // Validierung: Budget darf verfügbares Budget nicht überschreiten
      if (formattedBudget > verfuegbarFuerZuordnung) {
        return {
          isValid: false,
          error: 'BUDGET_EXCEEDED',
          message: `Das geplante Budget (${toGermanCurrency(formattedBudget)}) überschreitet das verfügbare Budget (${toGermanCurrency(verfuegbarFuerZuordnung)}).`,
          maxAllowedBudget: verfuegbarFuerZuordnung,
          availableBudget: availableBudget
        };
      }
      
      // Warnung bei hoher Budget-Auslastung (>80%)
      const neueAuslastung = ((availableBudget.zugewiesenes_budget - currentProjectBudget + formattedBudget) / availableBudget.gesamtbudget) * 100;
      
      let warning = null;
      if (neueAuslastung > 90) {
        warning = {
          level: 'CRITICAL',
          message: `Warnung: Budget-Auslastung wird ${Math.round(neueAuslastung)}% erreichen (>90% kritisch).`
        };
      } else if (neueAuslastung > 80) {
        warning = {
          level: 'WARNING',
          message: `Hinweis: Budget-Auslastung wird ${Math.round(neueAuslastung)}% erreichen (>80% hoch).`
        };
      }
      
      return {
        isValid: true,
        availableBudget: availableBudget,
        newUtilization: neueAuslastung,
        warning: warning
      };
      
    } catch (error) {
      console.error('❌ Fehler bei Budget-Validierung:', error);
      return {
        isValid: false,
        error: 'VALIDATION_ERROR',
        message: 'Fehler bei der Budget-Validierung. Bitte versuchen Sie es erneut.',
        details: error.message
      };
    }
  }
  
  /**
   * Reserviert Budget für ein Projekt (atomare Operation)
   * @param {string} projektId - Die Projekt-ID
   * @param {number} geplantesbudget - Das zu reservierende Budget
   * @returns {Object} Reservierungsergebnis
   */
  async reserveBudget(projektId, geplantesbudget) {
    try {
      const formattedBudget = formatGermanCurrency(geplantesbudget);
      
      // Projekt-Details abrufen
      const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('annual_budget_id, name, jahr')
        .eq('id', projektId)
        .single();
      
      if (projectError || !project) {
        throw new Error(`Projekt nicht gefunden: ${projektId}`);
      }
      
      // Budget-Validierung vor Reservierung
      const validation = await this.validateBudgetAllocation(project.jahr, formattedBudget, projektId);
      
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
          message: validation.message
        };
      }
      
      // Atomare Budget-Reservierung (Transaction)
      const { data: updatedProject, error: updateError } = await supabaseAdmin
        .from('projects')
        .update({
          geplantes_budget: formattedBudget,
          budget_reserviert_am: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', projektId)
        .select('*')
        .single();
      
      if (updateError) {
        throw new Error(`Fehler bei Budget-Reservierung: ${updateError.message}`);
      }
      
      // Aktualisiertes verfügbares Budget berechnen
      const updatedAvailableBudget = await this.getAvailableBudget(project.jahr);
      
      return {
        success: true,
        project: updatedProject,
        availableBudget: updatedAvailableBudget,
        message: `Budget von ${toGermanCurrency(formattedBudget)} erfolgreich für Projekt "${project.name}" reserviert.`
      };
      
    } catch (error) {
      console.error('❌ Fehler bei Budget-Reservierung:', error);
      return {
        success: false,
        error: 'RESERVATION_ERROR',
        message: 'Fehler bei der Budget-Reservierung. Bitte versuchen Sie es erneut.',
        details: error.message
      };
    }
  }
  
  /**
   * Gibt reserviertes Budget frei (bei Projekt-Löschung/Stornierung)
   * @param {string} projektId - Die Projekt-ID
   * @returns {Object} Freigabe-Ergebnis
   */
  async releaseBudget(projektId) {
    try {
      // Projekt-Details abrufen
      const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('geplantes_budget, name, jahr, status')
        .eq('id', projektId)
        .single();
      
      if (projectError || !project) {
        throw new Error(`Projekt nicht gefunden: ${projektId}`);
      }
      
      // Nur bei bestimmten Status freigeben
      const releasableStatuses = ['storniert', 'abgebrochen', 'geloescht'];
      if (!releasableStatuses.includes(project.status)) {
        return {
          success: false,
          error: 'INVALID_STATUS',
          message: `Budget kann nur bei Status 'storniert', 'abgebrochen' oder 'gelöscht' freigegeben werden. Aktueller Status: ${project.status}`
        };
      }
      
      const freigegebenesBudget = parseFloat(project.geplantes_budget) || 0;
      
      // Budget freigeben (auf 0 setzen)
      const { error: updateError } = await supabaseAdmin
        .from('projects')
        .update({
          geplantes_budget: 0,
          budget_freigegeben_am: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', projektId);
      
      if (updateError) {
        throw new Error(`Fehler bei Budget-Freigabe: ${updateError.message}`);
      }
      
      // Aktualisiertes verfügbares Budget berechnen
      const updatedAvailableBudget = await this.getAvailableBudget(project.jahr);
      
      return {
        success: true,
        releasedBudget: freigegebenesBudget,
        availableBudget: updatedAvailableBudget,
        message: `Budget von ${toGermanCurrency(freigegebenesBudget)} erfolgreich freigegeben für Projekt "${project.name}".`
      };
      
    } catch (error) {
      console.error('❌ Fehler bei Budget-Freigabe:', error);
      return {
        success: false,
        error: 'RELEASE_ERROR',
        message: 'Fehler bei der Budget-Freigabe. Bitte versuchen Sie es erneut.',
        details: error.message
      };
    }
  }
  
  /**
   * Berechnet Budget-Status basierend auf Ampel-System
   * @param {number} verfuegbaresBudget - Verfügbares Budget
   * @param {number} gesamtbudget - Gesamtbudget
   * @returns {string} Status: GRUEN, GELB, ORANGE, ROT
   */
  calculateBudgetStatus(verfuegbaresBudget, gesamtbudget) {
    const auslastungProzent = ((gesamtbudget - verfuegbaresBudget) / gesamtbudget) * 100;
    
    if (auslastungProzent >= 95) return 'ROT';      // >95% = Kritisch
    if (auslastungProzent >= 85) return 'ORANGE';   // >85% = Hoch
    if (auslastungProzent >= 70) return 'GELB';     // >70% = Mittel
    return 'GRUEN';                                  // <70% = Niedrig
  }
  
  /**
   * Holt Budget-Statistiken für Dashboard
   * @param {number} jahr - Das Jahr
   * @returns {Object} Budget-Statistiken
   */
  async getBudgetStatistics(jahr) {
    try {
      const availableBudget = await this.getAvailableBudget(jahr);
      
      // Top 5 Projekte nach Budget
      const { data: topProjects } = await supabaseAdmin
        .from('projects')
        .select('name, geplantes_budget, status')
        .eq('jahr', jahr)
        .order('geplantes_budget', { ascending: false })
        .limit(5);
      
      // Budget-Verteilung nach Status
      const { data: statusDistribution } = await supabaseAdmin
        .from('projects')
        .select('status, geplantes_budget')
        .eq('jahr', jahr);
      
      const statusStats = statusDistribution?.reduce((acc, project) => {
        const status = project.status || 'unbekannt';
        if (!acc[status]) {
          acc[status] = { count: 0, budget: 0 };
        }
        acc[status].count++;
        acc[status].budget += parseFloat(project.geplantes_budget) || 0;
        return acc;
      }, {}) || {};
      
      return {
        ...availableBudget,
        topProjects: topProjects?.map(p => ({
          ...p,
          geplantes_budget_formatted: toGermanCurrency(p.geplantes_budget)
        })) || [],
        statusDistribution: Object.entries(statusStats).map(([status, stats]) => ({
          status,
          count: stats.count,
          budget: stats.budget,
          budget_formatted: toGermanCurrency(stats.budget)
        })),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Fehler beim Abrufen der Budget-Statistiken:', error);
      throw error;
    }
  }

  /**
   * Get all available years with budgets
   * @returns {Array} List of years with budget information
   */
  async getAvailableYears() {
    try {
      console.log('🔍 Loading available budget years');
      
      const { data: budgets, error } = await supabaseAdmin
        .from('annual_budgets')
        .select('jahr, gesamtbudget, verfuegbares_budget, status')
        .order('jahr', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      const result = budgets.map(budget => ({
        jahr: budget.jahr,
        hasbudget: true,
        gesamtbudget: budget.gesamtbudget,
        verfuegbares_budget: budget.verfuegbares_budget,
        status: budget.status,
        isActive: budget.status === 'ACTIVE'
      }));
      
      console.log(`✅ ${result.length} budget years loaded`);
      return result;
      
    } catch (error) {
      console.error('❌ Error loading available years:', error);
      throw error;
    }
  }
}

// Singleton-Instanz exportieren
export const budgetAllocationService = new BudgetAllocationService();
export default budgetAllocationService;

