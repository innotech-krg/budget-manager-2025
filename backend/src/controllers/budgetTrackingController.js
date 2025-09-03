// =====================================================
// Budget Manager 2025 - Budget Tracking Controller
// Story 1.3: Dreidimensionales Budget-Tracking
// =====================================================

import { supabaseAdmin, formatGermanCurrency, toGermanCurrency } from '../config/database.js';
import { createAuditLog } from '../utils/auditLogger.js';

// =====================================================
// 3D BUDGET TRACKING OPERATIONS
// =====================================================

/**
 * Update Budget-Dimensionen für ein Projekt
 * Story 1.3 - Dreidimensionales Budget-Tracking
 */
export const updateProjectBudget = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      veranschlagtes_budget,
      zugewiesenes_budget,
      verbrauchtes_budget
    } = req.body;
    
    // Validierung der Budget-Daten
    const validation = validateBudgetUpdate({
      veranschlagtes_budget,
      zugewiesenes_budget,
      verbrauchtes_budget
    });
    
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Ungültige Budget-Daten',
        message: validation.errors.join(', '),
        code: 'INVALID_BUDGET_DATA'
      });
    }
    
    // Formatiere Budget-Werte für deutsche Geschäftslogik
    const updateData = {};
    if (veranschlagtes_budget !== undefined) {
      updateData.veranschlagtes_budget = formatGermanCurrency(veranschlagtes_budget);
    }
    if (zugewiesenes_budget !== undefined) {
      updateData.zugewiesenes_budget = formatGermanCurrency(zugewiesenes_budget);
    }
    if (verbrauchtes_budget !== undefined) {
      updateData.verbrauchtes_budget = formatGermanCurrency(verbrauchtes_budget);
    }
    
    // Update Projekt mit automatischer Status-Berechnung (Trigger)
    const { data: updatedProject, error } = await supabaseAdmin
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select(`
        *,
        kategorien (name, kategorie_typ),
        teams (name),
        annual_budgets (jahr, gesamtbudget)
      `)
      .single();
    
    if (error || !updatedProject) {
      return res.status(404).json({
        error: 'Projekt nicht gefunden',
        message: `Das Projekt mit der ID ${projectId} existiert nicht.`,
        code: 'PROJECT_NOT_FOUND'
      });
    }
    
    // Audit Log erstellen
    try {
      await createAuditLog({
        table_name: 'projects',
        record_id: updatedProject.id,
        action: 'UPDATE_BUDGET',
        new_values: updateData,
        changed_by: null, // req.user?.id,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
    } catch (auditError) {
      console.log('⚠️ Audit-Log übersprungen:', auditError.message);
    }
    
    // Deutsche Formatierung für Response
    const formattedProject = formatProjectBudgetResponse(updatedProject);
    
    res.json({
      message: 'Budget erfolgreich aktualisiert',
      project: formattedProject,
      code: 'BUDGET_UPDATED_SUCCESS'
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Budget-Update:', error);
    res.status(500).json({
      error: 'Interner Serverfehler',
      message: 'Das Budget konnte nicht aktualisiert werden.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Budget-Status für alle Projekte abrufen
 * Story 1.3 - Budget-Übersicht
 */
export const getAllProjectBudgets = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    let query = supabaseAdmin
      .from('projects')
      .select(`
        id,
        name,
        projektnummer,
        veranschlagtes_budget,
        zugewiesenes_budget,
        verbrauchtes_budget,
        budget_status,
        budget_verbrauch_prozent,
        last_budget_update,
        kategorien (name),
        teams (name)
      `)
      .order('last_budget_update', { ascending: false });
    
    // Filter nach Budget-Status
    if (status && ['HEALTHY', 'WARNING', 'CRITICAL', 'EXCEEDED'].includes(status)) {
      query = query.eq('budget_status', status);
    }
    
    // Pagination
    query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    
    const { data: projects, error, count } = await query;
    
    if (error) {
      throw new Error(`Fehler beim Abrufen der Budget-Daten: ${error.message}`);
    }
    
    // Deutsche Formatierung für alle Projekte
    const formattedProjects = projects.map(formatProjectBudgetResponse);
    
    // Budget-Zusammenfassung berechnen
    const budgetSummary = calculateBudgetSummary(projects);
    
    res.json({
      projects: formattedProjects,
      summary: budgetSummary,
      pagination: {
        total: count || formattedProjects.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: formattedProjects.length === parseInt(limit)
      },
      filters: {
        status: status || null
      }
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Budget-Übersicht:', error);
    res.status(500).json({
      error: 'Interner Serverfehler',
      message: 'Die Budget-Übersicht konnte nicht abgerufen werden.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Budget-Status für einzelnes Projekt abrufen
 * Story 1.3 - Projekt-Budget-Details
 */
export const getProjectBudget = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        kategorien (name, kategorie_typ),
        teams (name),
        annual_budgets (jahr, gesamtbudget)
      `)
      .eq('id', projectId)
      .single();
    
    if (error || !project) {
      return res.status(404).json({
        error: 'Projekt nicht gefunden',
        message: `Das Projekt mit der ID ${projectId} existiert nicht.`,
        code: 'PROJECT_NOT_FOUND'
      });
    }
    
    // Deutsche Formatierung und Budget-Analyse
    const formattedProject = formatProjectBudgetResponse(project);
    const budgetAnalysis = analyzeBudgetHealth(project);
    
    res.json({
      project: formattedProject,
      analysis: budgetAnalysis
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Abrufen des Projekt-Budgets:', error);
    res.status(500).json({
      error: 'Interner Serverfehler',
      message: 'Das Projekt-Budget konnte nicht abgerufen werden.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Budget-Verbrauch für Projekt hinzufügen
 * Story 1.3 - Budget-Ausgaben erfassen
 */
export const addBudgetExpense = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { amount, description, category } = req.body;
    
    // Validierung
    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: 'Ungültiger Betrag',
        message: 'Der Ausgabenbetrag muss größer als 0 sein.',
        code: 'INVALID_AMOUNT'
      });
    }
    
    // Aktuelles Projekt abrufen
    const { data: currentProject, error: fetchError } = await supabaseAdmin
      .from('projects')
      .select('verbrauchtes_budget')
      .eq('id', projectId)
      .single();
    
    if (fetchError || !currentProject) {
      return res.status(404).json({
        error: 'Projekt nicht gefunden',
        code: 'PROJECT_NOT_FOUND'
      });
    }
    
    // Neues verbrauchtes Budget berechnen
    const newVerbraucht = (currentProject.verbrauchtes_budget || 0) + formatGermanCurrency(amount);
    
    // Update Projekt (Trigger berechnet automatisch Status)
    const { data: updatedProject, error: updateError } = await supabaseAdmin
      .from('projects')
      .update({ 
        verbrauchtes_budget: newVerbraucht 
      })
      .eq('id', projectId)
      .select('*')
      .single();
    
    if (updateError) {
      throw new Error(`Fehler beim Budget-Update: ${updateError.message}`);
    }
    
    // Audit Log für Ausgabe
    try {
      await createAuditLog({
        table_name: 'projects',
        record_id: projectId,
        action: 'ADD_EXPENSE',
        new_values: { 
          amount: formatGermanCurrency(amount), 
          description, 
          category,
          new_total: newVerbraucht
        },
        changed_by: null, // req.user?.id,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
    } catch (auditError) {
      console.log('⚠️ Audit-Log übersprungen:', auditError.message);
    }
    
    const formattedProject = formatProjectBudgetResponse(updatedProject);
    
    res.json({
      message: 'Ausgabe erfolgreich hinzugefügt',
      project: formattedProject,
      expense: {
        amount: toGermanCurrency(amount),
        description,
        category,
        timestamp: new Date().toISOString()
      },
      code: 'EXPENSE_ADDED_SUCCESS'
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Hinzufügen der Ausgabe:', error);
    res.status(500).json({
      error: 'Interner Serverfehler',
      message: 'Die Ausgabe konnte nicht hinzugefügt werden.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Formatiere Projekt für Budget-Response
 */
function formatProjectBudgetResponse(project) {
  return {
    ...project,
    veranschlagtes_budget_formatted: toGermanCurrency(project.veranschlagtes_budget || 0),
    zugewiesenes_budget_formatted: toGermanCurrency(project.zugewiesenes_budget || 0),
    verbrauchtes_budget_formatted: toGermanCurrency(project.verbrauchtes_budget || 0),
    budget_verbrauch_prozent_formatted: `${project.budget_verbrauch_prozent || 0}%`,
    budget_status_label: getBudgetStatusLabel(project.budget_status),
    budget_status_color: getBudgetStatusColor(project.budget_status),
    last_budget_update_formatted: project.last_budget_update ? 
      new Date(project.last_budget_update).toLocaleDateString('de-DE') : null,
    kategorie_name: project.kategorien?.name || 'Nicht zugeordnet',
    team_name: project.teams?.name || 'Kein Team'
  };
}

/**
 * Deutsche Budget-Status-Labels
 */
function getBudgetStatusLabel(status) {
  const labels = {
    'HEALTHY': 'Gesund',
    'WARNING': 'Warnung',
    'CRITICAL': 'Kritisch',
    'EXCEEDED': 'Überschritten'
  };
  return labels[status] || 'Unbekannt';
}

/**
 * Budget-Status-Farben für UI
 */
function getBudgetStatusColor(status) {
  const colors = {
    'HEALTHY': 'green',
    'WARNING': 'yellow',
    'CRITICAL': 'orange',
    'EXCEEDED': 'red'
  };
  return colors[status] || 'gray';
}

/**
 * Berechne Budget-Zusammenfassung
 */
function calculateBudgetSummary(projects) {
  const summary = {
    total_projects: projects.length,
    healthy: 0,
    warning: 0,
    critical: 0,
    exceeded: 0,
    total_veranschlagt: 0,
    total_zugewiesen: 0,
    total_verbraucht: 0
  };
  
  projects.forEach(project => {
    // Status-Zählung
    switch (project.budget_status) {
      case 'HEALTHY': summary.healthy++; break;
      case 'WARNING': summary.warning++; break;
      case 'CRITICAL': summary.critical++; break;
      case 'EXCEEDED': summary.exceeded++; break;
    }
    
    // Budget-Summen
    summary.total_veranschlagt += project.veranschlagtes_budget || 0;
    summary.total_zugewiesen += project.zugewiesenes_budget || 0;
    summary.total_verbraucht += project.verbrauchtes_budget || 0;
  });
  
  // Deutsche Formatierung
  summary.total_veranschlagt_formatted = toGermanCurrency(summary.total_veranschlagt);
  summary.total_zugewiesen_formatted = toGermanCurrency(summary.total_zugewiesen);
  summary.total_verbraucht_formatted = toGermanCurrency(summary.total_verbraucht);
  
  return summary;
}

/**
 * Analysiere Budget-Gesundheit
 */
function analyzeBudgetHealth(project) {
  const analysis = {
    status: project.budget_status,
    verbrauch_prozent: project.budget_verbrauch_prozent || 0,
    verbleibendes_budget: (project.zugewiesenes_budget || 0) - (project.verbrauchtes_budget || 0),
    empfehlungen: []
  };
  
  // Deutsche Empfehlungen basierend auf Status
  if (analysis.status === 'WARNING') {
    analysis.empfehlungen.push('Budget-Überwachung verstärken');
    analysis.empfehlungen.push('Ausgaben-Genehmigungen einführen');
  } else if (analysis.status === 'CRITICAL') {
    analysis.empfehlungen.push('Sofortige Budget-Überprüfung erforderlich');
    analysis.empfehlungen.push('Ausgaben-Stopp erwägen');
  } else if (analysis.status === 'EXCEEDED') {
    analysis.empfehlungen.push('Budget-Nachzuweisung beantragen');
    analysis.empfehlungen.push('Projekt-Scope überprüfen');
  }
  
  analysis.verbleibendes_budget_formatted = toGermanCurrency(analysis.verbleibendes_budget);
  
  return analysis;
}

/**
 * Validiere Budget-Update-Daten
 */
function validateBudgetUpdate(data) {
  const errors = [];
  
  // Prüfe ob mindestens ein Budget-Wert gesetzt ist
  const hasAnyBudget = data.veranschlagtes_budget !== undefined || 
                       data.zugewiesenes_budget !== undefined || 
                       data.verbrauchtes_budget !== undefined;
  
  if (!hasAnyBudget) {
    errors.push('Mindestens ein Budget-Wert muss angegeben werden');
  }
  
  // Prüfe Budget-Werte
  ['veranschlagtes_budget', 'zugewiesenes_budget', 'verbrauchtes_budget'].forEach(field => {
    if (data[field] !== undefined && (isNaN(data[field]) || data[field] < 0)) {
      errors.push(`${field} muss eine positive Zahl sein`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export default {
  updateProjectBudget,
  getAllProjectBudgets,
  getProjectBudget,
  addBudgetExpense
};

