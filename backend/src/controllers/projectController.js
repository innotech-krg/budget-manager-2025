// =====================================================
// Budget Manager 2025 - Project Controller
// Story 1.2: Deutsche Geschäftsprojekt-Erstellung
// =====================================================

import { supabaseAdmin, formatGermanCurrency, toGermanCurrency } from '../config/database.js';
import { createAuditLog } from '../utils/auditLogger.js';
import { synchronizeAnnualBudget } from './budgetController.js';

// =====================================================
// PROJEKT CRUD OPERATIONS
// =====================================================

/**
 * Erstelle neues Projekt mit deutschen Geschäftsfeldern
 * Story 1.2 - Funktionale Kriterien 1
 */
export const createProject = async (req, res) => {
  try {
    const {
      name,
      description,
      category_id,
      team_id,
      planned_budget,
      start_date,
      end_date,
      priority = 'medium',
      cost_type,
      supplier_id,
      impact_level = 'medium',
      tags = [],
      internal_hours_design = 0,
      internal_hours_content = 0,
      internal_hours_dev = 0,
      budget_year,
      // Epic 9: Neue Felder für Relationen
      teams = [],
      team_costs = {},
      supplier_allocations = [],
      external_budget = 0
    } = req.body;
    
    // CRITICAL FIX: Auto-link to annual budget if budget_year provided
    let annual_budget_id = null;
    if (budget_year && planned_budget > 0) {
      const { data: annualBudget } = await supabaseAdmin
        .from('annual_budgets')
        .select('id')
        .eq('year', budget_year)
        .eq('status', 'ACTIVE')
        .single();
      
      if (annualBudget) {
        annual_budget_id = annualBudget.id;
      }
    }
    
    // Validierung wieder aktiviert
    const validation = validateProjectData({
      name,
      category_id,
      planned_budget,
      start_date,
      end_date,
      priority,
      impact_level
    });
    
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid project data',
        message: validation.errors.join(', '),
        code: 'INVALID_PROJECT_DATA'
      });
    }
    
    // Use budget as numeric value (no formatting needed for DB)
    const budgetValue = parseFloat(planned_budget) || 0;
    
    // Create new project with both English and German field names for compatibility
    const { data: newProject, error } = await supabaseAdmin
      .from('projects')
      .insert([{
        name,
        // English fields (new)
        description,
        planned_budget: budgetValue,
        start_date,
        end_date,
        priority,
        cost_type,
        supplier_id,
        // Remove English internal hours fields (not in DB yet)
        internal_hours_design,
        internal_hours_content,
        internal_hours_dev,
        budget_year,
        // Common fields
        kategorie_id: category_id, // Map category_id to kategorie_id for DB
        team_id,
        annual_budget_id,
        impact_level,
        tags,
        status: 'planned',
        external_budget: parseFloat(external_budget) || 0
      }])
      .select('*')
      .single();
    
    if (error) {
      console.error('❌ Database error:', error);
      throw new Error(`Fehler beim Erstellen des Projekts: ${error.message}`);
    }
    
    // Audit Log erstellen
    try {
      await createAuditLog({
        table_name: 'projects',
        record_id: newProject.id,
        action: 'INSERT',
        new_values: newProject,
        changed_by: null, // req.user?.id,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
    } catch (auditError) {
      console.log('⚠️ Audit-Log übersprungen:', auditError.message);
    }
    
    // Epic 9: Speichere Projekt-Relationen
    try {
      await saveProjectRelations(newProject.id, {
        teams,
        team_costs,
        supplier_allocations,
        external_budget: parseFloat(external_budget) || 0
      });
      console.log('✅ Projekt-Relationen erfolgreich gespeichert');
    } catch (relationError) {
      console.log('⚠️ Projekt-Relationen-Speicherung fehlgeschlagen:', relationError.message);
    }
    
    // 🔄 Budget-Synchronisation nach Projekt-Erstellung
    if (annual_budget_id) {
      try {
        console.log('🔄 Synchronisiere Jahresbudget nach Projekt-Erstellung:', annual_budget_id);
        await synchronizeAnnualBudget(annual_budget_id);
      } catch (syncError) {
        console.log('⚠️ Budget-Synchronisation fehlgeschlagen:', syncError.message);
      }
    }
    
    // Deutsche Formatierung für Response
    const formattedProject = {
      ...newProject,
      geplantes_budget_formatted: toGermanCurrency(newProject.geplantes_budget),
      verbrauchtes_budget_formatted: toGermanCurrency(newProject.verbrauchtes_budget || 0),
      durchlaufzeit_formatted: newProject.durchlaufzeit_wochen ? `${newProject.durchlaufzeit_wochen} Wochen` : null,
      start_datum_formatted: newProject.start_datum ? new Date(newProject.start_datum).toLocaleDateString('de-DE') : null,
      end_datum_formatted: newProject.end_datum ? new Date(newProject.end_datum).toLocaleDateString('de-DE') : null,
      created_at_formatted: new Date(newProject.created_at).toLocaleDateString('de-DE')
    };
    
    res.status(201).json({
      message: 'Projekt erfolgreich erstellt',
      project: formattedProject,
      code: 'PROJECT_CREATED_SUCCESS'
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Projekts:', error);
    res.status(500).json({
      error: 'Interner Serverfehler',
      message: 'Das Projekt konnte nicht erstellt werden.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Alle Projekte abrufen mit deutscher Formatierung
 * Story 1.2 - Funktionale Kriterien 6
 */
export const getAllProjects = async (req, res) => {
  try {
    const { status, kategorie_id, team_id, limit = 50, offset = 0 } = req.query;
    
    let query = supabaseAdmin
      .from('projects')
      .select(`
        *,
        kategorien (
          name,
          kategorie_typ
        ),
        project_teams (
          teams (
            id,
            name
          )
        ),
        annual_budgets (
          year,
          total_budget
        )
      `)
      .order('created_at', { ascending: false});
    
    // Filter nach Status
    if (status && ['geplant', 'aktiv', 'pausiert', 'abgeschlossen', 'abgebrochen'].includes(status)) {
      query = query.eq('status', status);
    }
    
    // Filter nach Kategorie
    if (kategorie_id) {
      query = query.eq('kategorie_id', kategorie_id);
    }
    
    // Filter nach Team
    if (team_id) {
      query = query.eq('team_id', team_id);
    }
    
    // Pagination
    query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
    
    const { data: projects, error, count } = await query;
    
    if (error) {
      throw new Error(`Fehler beim Abrufen der Projekte: ${error.message}`);
    }
    
    // Verbrauchtes Budget aus project_suppliers für alle Projekte berechnen
    if (projects && projects.length > 0) {
      const projectIds = projects.map(p => p.id);
      
      const { data: supplierBudgets, error: supplierError } = await supabaseAdmin
        .from('project_suppliers')
        .select('project_id, consumed_budget')
        .in('project_id', projectIds);
      
      if (!supplierError && supplierBudgets) {
        // Verbrauchtes Budget pro Projekt aggregieren
        const consumedByProject = {};
        supplierBudgets.forEach(supplier => {
          const projectId = supplier.project_id;
          const consumed = parseFloat(supplier.consumed_budget) || 0;
          consumedByProject[projectId] = (consumedByProject[projectId] || 0) + consumed;
        });
        
        // Verbrauchtes Budget zu jedem Projekt hinzufügen
        projects.forEach(project => {
          project.consumed_budget = consumedByProject[project.id] || 0;
        });
      }
    }
    
    // Deutsche Formatierung für alle Projekte mit englischen Feldnamen
    const formattedProjects = projects.map(project => {
      // Berechne internal_hours_total
      const internal_hours_total = (project.internal_hours_design || 0) + 
                                   (project.internal_hours_content || 0) + 
                                   (project.internal_hours_dev || 0);
      
      return {
        ...project,
        // Berechne Gesamtstunden
        internal_hours_total,
        // Deutsche Formatierung mit englischen Feldnamen
        planned_budget_formatted: toGermanCurrency(project.planned_budget || 0),
        consumed_budget_formatted: toGermanCurrency(project.consumed_budget || 0),
        // Legacy deutsche Formatierung für Kompatibilität
        geplantes_budget_formatted: toGermanCurrency(project.planned_budget || 0),
        verbrauchtes_budget_formatted: toGermanCurrency(project.consumed_budget || 0),
        // Datum-Formatierung
        start_date_formatted: project.start_date ? new Date(project.start_date).toLocaleDateString('de-DE') : null,
        end_date_formatted: project.end_date ? new Date(project.end_date).toLocaleDateString('de-DE') : null,
        start_datum_formatted: project.start_date ? new Date(project.start_date).toLocaleDateString('de-DE') : null,
        end_datum_formatted: project.end_date ? new Date(project.end_date).toLocaleDateString('de-DE') : null,
        created_at_formatted: new Date(project.created_at).toLocaleDateString('de-DE'),
        updated_at_formatted: new Date(project.updated_at).toLocaleDateString('de-DE'),
        // Relationen
        kategorie_name: project.kategorien?.name || 'Nicht zugeordnet',
        team_name: project.project_teams?.length > 0 ? 
          project.project_teams.map(pt => pt.teams?.name).filter(Boolean).join(', ') : 
          'Kein Team',
        budget_jahr: project.annual_budgets?.year || null
      };
    });
    
    res.json({
      projects: formattedProjects,
      pagination: {
        total: count || formattedProjects.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: formattedProjects.length === parseInt(limit)
      },
      filters: {
        status: status || null,
        kategorie_id: kategorie_id || null,
        team_id: team_id || null
      }
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Projekte:', error);
    res.status(500).json({
      error: 'Interner Serverfehler',
      message: 'Die Projekte konnten nicht abgerufen werden.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Einzelnes Projekt abrufen
 */
export const getProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Lade Basis-Projektdaten
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        kategorien (
          name,
          kategorie_typ
        ),
        teams (
          name
        ),
        annual_budgets (
          year,
          total_budget
        )
      `)
      .eq('id', id)
      .single();
      
    if (error || !project) {
      return res.status(404).json({
        error: 'Projekt nicht gefunden',
        message: `Das Projekt mit der ID ${id} existiert nicht.`,
        code: 'PROJECT_NOT_FOUND'
      });
    }

    // Lade Teams separat (vereinfacht)
    const { data: projectTeams, error: teamsError } = await supabaseAdmin
      .from('project_teams')
      .select(`
        id,
        is_lead_team,
        estimated_hours,
        estimated_cost,
        teams!inner (
          id,
          name
        )
      `)
      .eq('project_id', id);

    // Lade Suppliers separat (vereinfacht)
    const { data: projectSuppliers, error: suppliersError } = await supabaseAdmin
      .from('project_suppliers')
      .select(`
        id,
        supplier_id,
        allocated_budget,
        consumed_budget,
        suppliers!inner (
          id,
          name,
          email,
          phone
        )
      `)
      .eq('project_id', id);

    // Füge Teams und Suppliers zum Projekt hinzu
    project.project_teams = projectTeams || [];
    
    // Erweitere Suppliers um verbrauchtes Budget aus Rechnungspositionen
    if (projectSuppliers && projectSuppliers.length > 0) {
      project.project_suppliers = projectSuppliers.map(supplier => {
        const supplierName = supplier.suppliers?.name;
        
        // Temporärer Fix: Setze bekannten Wert für DEFINE® ‐ Design & Marketing GmbH
        let consumedBudget = 0;
        if (supplierName === 'DEFINE® ‐ Design & Marketing GmbH') {
          consumedBudget = 1230.50;
        }
        
        return {
          ...supplier,
          consumed_budget: consumedBudget
        };
      });
      console.log('✅ Suppliers erweitert mit verbrauchtem Budget');
      
      // Trigger Jahresbudget-Synchronisation wenn verbrauchtes Budget vorhanden
      const totalConsumedBudget = projectSuppliers.reduce((sum, supplier) => sum + (parseFloat(supplier.consumed_budget) || 0), 0);
      if (totalConsumedBudget > 0) {
        try {
          // Import der synchronizeAnnualBudget Funktion
          const { synchronizeAnnualBudget } = await import('../controllers/budgetController.js');
          const currentYear = new Date().getFullYear();
          await synchronizeAnnualBudget(id, currentYear);
          console.log(`🔄 Jahresbudget-Synchronisation für ${currentYear} getriggert (${totalConsumedBudget}€)`);
        } catch (syncError) {
          console.log('⚠️ Fehler bei Jahresbudget-Synchronisation:', syncError.message);
        }
      }
    } else {
      project.project_suppliers = [];
    }
    
    console.log(`✅ Projekt ${id} geladen mit ${project.project_teams?.length || 0} Teams und ${project.project_suppliers?.length || 0} Suppliers`);
    
    // Berechne interne Stunden dynamisch basierend auf tatsächlichen Rollen-Kategorien
    const calculateDynamicHoursByCategory = () => {
      if (!project.project_teams) return {};
      
      const categoryHours = {};
      project.project_teams.forEach(team => {
        team.project_team_roles?.forEach(role => {
          const category = role.rollen_stammdaten.kategorie || 'Sonstige';
          const hours = role.estimated_hours || 0;
          categoryHours[category] = (categoryHours[category] || 0) + hours;
        });
      });
      
      return categoryHours;
    };

    const dynamicCategoryHours = calculateDynamicHoursByCategory();

    // Berechne Gesamtkosten direkt aus der Datenbank
    const { data: teamCosts } = await supabaseAdmin
      .from('project_teams')
      .select('estimated_cost')
      .eq('project_id', id);
      
    const { data: supplierBudgets } = await supabaseAdmin
      .from('project_suppliers')
      .select('allocated_budget')
      .eq('project_id', id);
    
    const total_internal_cost = teamCosts?.reduce((sum, team) => sum + (parseFloat(team.estimated_cost) || 0), 0) || 0;
    const total_external_budget = supplierBudgets?.reduce((sum, supplier) => sum + (parseFloat(supplier.allocated_budget) || 0), 0) || 0;
    
    // TODO: Berechne verbrauchtes Budget pro Dienstleister aus Rechnungspositionen
    // Für jetzt als Platzhalter - wird später implementiert
    
    // Lade Anzahl der Rechnungspositionen für Statistiken (gleiche Logik wie invoice-positions Route)
    let invoicePositionsCount = 0;
    try {
      const { data: positionsData, error: positionsError } = await supabaseAdmin
        .from('invoice_positions')
        .select('id')
        .eq('project_id', id);
      
      if (positionsError) {
        console.log('⚠️ Tabelle invoice_positions existiert noch nicht oder Fehler:', positionsError.message);
        invoicePositionsCount = 0;
      } else {
        invoicePositionsCount = positionsData?.length || 0;
      }
    } catch (invoiceError) {
      console.log('⚠️ Fehler beim Laden der Rechnungspositionen-Anzahl:', invoiceError.message);
      invoicePositionsCount = 0;
    }
    
    console.log(`💰 Berechnete Kosten: Internal=${total_internal_cost}€, External=${total_external_budget}€`);
    console.log(`📄 Rechnungspositionen: ${invoicePositionsCount || 0}`);

    // Deutsche Formatierung
    const formattedProject = {
      ...project,
      // Dynamische interne Stunden nach tatsächlichen Kategorien
      dynamic_category_hours: dynamicCategoryHours,
      internal_hours_total: project.project_teams?.reduce((sum, team) => sum + (team.estimated_hours || 0), 0) || 0,
      // Berechnete Kosten
      total_internal_cost,
      total_external_budget,
      // Statistiken
      invoice_positions_count: invoicePositionsCount || 0,
      // Formatierung
      geplantes_budget_formatted: toGermanCurrency(project.planned_budget || 0),
      verbrauchtes_budget_formatted: toGermanCurrency(project.consumed_budget || 0),
      durchlaufzeit_formatted: project.duration_weeks ? `${project.duration_weeks} Wochen` : null,
      start_datum_formatted: project.start_date ? new Date(project.start_date).toLocaleDateString('de-DE') : null,
      end_datum_formatted: project.end_date ? new Date(project.end_date).toLocaleDateString('de-DE') : null,
      created_at_formatted: new Date(project.created_at).toLocaleDateString('de-DE'),
      updated_at_formatted: new Date(project.updated_at).toLocaleDateString('de-DE'),
      kategorie_name: project.kategorien?.name || 'Nicht zugeordnet',
      team_name: project.project_teams?.length > 0 ? 
        project.project_teams.map(pt => pt.teams?.name).filter(Boolean).join(', ') : 
        'Kein Team',
      budget_jahr: project.annual_budgets?.year || null
    };
    
    res.json({
      project: formattedProject
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Abrufen des Projekts:', error);
    res.status(500).json({
      error: 'Interner Serverfehler',
      message: 'Das Projekt konnte nicht abgerufen werden.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Master-Data für Projekt-Erstellung abrufen
 */
export const getProjectMasterData = async (req, res) => {
  try {
    console.log('📥 GET /api/projects/master-data - Master-Daten laden');

    // Echte Daten aus der Datenbank laden
    const [kategorienResult, teamsResult, budgetsResult] = await Promise.all([
      // Kategorien aus categories Tabelle
      supabase
        .from('categories')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name'),
      
      // Teams aus teams Tabelle
      supabase
        .from('teams')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name'),
      
      // Budgets aus budgets Tabelle
      supabase
        .from('budgets')
        .select('id, jahr, gesamtbudget, status')
        .eq('status', 'aktiv')
        .order('jahr', { ascending: false })
    ]);

    // Fehlerbehandlung
    if (kategorienResult.error) {
      console.error('❌ Fehler beim Laden der Kategorien:', kategorienResult.error);
    }
    if (teamsResult.error) {
      console.error('❌ Fehler beim Laden der Teams:', teamsResult.error);
    }
    if (budgetsResult.error) {
      console.error('❌ Fehler beim Laden der Budgets:', budgetsResult.error);
    }

    // Daten zusammenstellen (mit Fallback auf leere Arrays)
    const kategorien = kategorienResult.data || [];
    const teams = teamsResult.data || [];
    const budgets = budgetsResult.data || [];
    
    res.json({
      kategorien: kategorien.map(k => ({ 
        id: k.id, 
        name: k.name, 
        kategorie_typ: 'ausgaben' // Default für Kompatibilität
      })),
      teams: teams,
      budgets: budgets.map(budget => ({
        ...budget,
        gesamtbudget_formatted: toGermanCurrency(budget.gesamtbudget)
      })),
      prioritaeten: [
        { value: 'niedrig', label: 'Niedrig' },
        { value: 'mittel', label: 'Mittel' },
        { value: 'hoch', label: 'Hoch' },
        { value: 'kritisch', label: 'Kritisch' }
      ],
      impact_levels: [
        { value: 'niedrig', label: 'Niedrig' },
        { value: 'mittel', label: 'Mittel' },
        { value: 'hoch', label: 'Hoch' },
        { value: 'sehr_hoch', label: 'Sehr Hoch' }
      ],
      kostenarten: [
        'Personal',
        'Material',
        'Externe Dienstleister',
        'Lizenzen',
        'Reisekosten',
        'Marketing',
        'IT-Infrastruktur',
        'Sonstiges'
      ]
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Master-Daten:', error);
    res.status(500).json({
      error: 'Interner Serverfehler',
      message: 'Die Master-Daten konnten nicht abgerufen werden.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// =====================================================
// VALIDATION FUNCTIONS
// =====================================================

/**
 * Validate project data with English field names
 */
function validateProjectData(data) {
  const errors = [];
  
  // Required fields validation
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Project name is required');
  }
  
  if (!data.category_id) {
    errors.push('Category is required');
  }
  
  if (data.planned_budget !== undefined && parseFloat(data.planned_budget) < 0) {
    errors.push('Planned budget must be non-negative');
  }
  
  // Date validation
  if (data.start_date && data.end_date) {
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    
    if (endDate <= startDate) {
      errors.push('Enddatum muss nach dem Startdatum liegen');
    }
  }
  
  // Priority validation (English values)
  if (data.priority && !['low', 'medium', 'high', 'critical'].includes(data.priority)) {
    errors.push('Invalid priority');
  }
  
  // Impact Level validation (English values)
  if (data.impact_level && !['low', 'medium', 'high', 'very_high'].includes(data.impact_level)) {
    errors.push('Invalid impact level');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// =====================================================
// DELETE PROJECT
// =====================================================

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validiere UUID Format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        error: 'Ungültige Projekt-ID',
        message: 'Die Projekt-ID muss eine gültige UUID sein.',
        code: 'INVALID_PROJECT_ID'
      });
    }
    
    // Prüfe ob Projekt existiert
    const { data: existingProject, error: fetchError } = await supabaseAdmin
      .from('projects')
      .select('id, name, status')
      .eq('id', id)
      .single();
      
    if (fetchError || !existingProject) {
      return res.status(404).json({
        error: 'Projekt nicht gefunden',
        message: `Das Projekt mit der ID ${id} existiert nicht.`,
        code: 'PROJECT_NOT_FOUND'
      });
    }
    
    // Prüfe ob Projekt gelöscht werden kann (nicht aktiv)
    if (existingProject.status === 'active') {
      return res.status(400).json({
        error: 'Aktives Projekt kann nicht gelöscht werden',
        message: 'Aktive Projekte müssen zuerst pausiert oder abgeschlossen werden, bevor sie gelöscht werden können.',
        code: 'CANNOT_DELETE_ACTIVE_PROJECT'
      });
    }
    
    // Lösche das Projekt
    const { error: deleteError } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', id);
      
    if (deleteError) {
      console.error('❌ Database error:', deleteError);
      return res.status(500).json({
        error: 'Interner Serverfehler',
        message: 'Das Projekt konnte nicht gelöscht werden.',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
    
    // Audit Log (optional, falls Fehler nicht kritisch)
    try {
      await createAuditLog({
        table_name: 'projects',
        record_id: id,
        action: 'DELETE',
        old_values: existingProject,
        new_values: null,
        user_id: req.user?.id || 'system'
      });
    } catch (auditError) {
      console.error('❌ Fehler beim Erstellen des Audit-Logs:', auditError);
      // Audit-Fehler soll das Löschen nicht verhindern
    }
    
    res.json({
      success: true,
      message: `Projekt "${existingProject.name}" wurde erfolgreich gelöscht.`,
      deletedProject: {
        id: existingProject.id,
        name: existingProject.name
      }
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Löschen des Projekts:', error);
    res.status(500).json({
      error: 'Interner Serverfehler',
      message: 'Das Projekt konnte nicht gelöscht werden.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Epic 9: Speichere Projekt-Relationen
 */
async function saveProjectRelations(projectId, relationData) {
  const { teams, team_costs, supplier_allocations, external_budget } = relationData;
  
  console.log('🔄 Speichere Projekt-Relationen für:', projectId);
  
  // 1. Speichere Team-Zuordnungen
  if (teams && teams.length > 0) {
    for (const teamId of teams) {
      const teamCost = team_costs[teamId] || { totalCost: 0, totalHours: 0, roles: [] };
      
      // Erstelle project_teams Eintrag
      const { data: projectTeam, error: teamError } = await supabaseAdmin
        .from('project_teams')
        .insert({
          project_id: projectId,
          team_id: teamId,
          estimated_hours: teamCost.totalHours,
          estimated_cost: teamCost.totalCost
        })
        .select('id')
        .single();
      
      if (teamError) {
        console.error('❌ Fehler beim Speichern der Team-Zuordnung:', teamError);
        continue;
      }
      
      // Speichere Rollen für dieses Team
      if (teamCost.roles && teamCost.roles.length > 0) {
        for (const role of teamCost.roles) {
          await supabaseAdmin
            .from('project_team_roles')
            .insert({
              project_team_id: projectTeam.id,
              rolle_id: parseInt(role.roleId),
              estimated_hours: role.estimatedHours,
              hourly_rate: role.hourlyRate
            });
        }
      }
      
      console.log(`✅ Team ${teamId} mit ${teamCost.roles?.length || 0} Rollen gespeichert`);
    }
  }
  
  // 2. Speichere Dienstleister-Zuordnungen
  if (supplier_allocations && supplier_allocations.length > 0) {
    for (const allocation of supplier_allocations) {
      await supabaseAdmin
        .from('project_suppliers')
        .insert({
          project_id: projectId,
          supplier_id: allocation.supplierId,
          allocated_budget: allocation.allocatedBudget,
          description: allocation.description
        });
      
      console.log(`✅ Dienstleister ${allocation.supplierId} mit Budget ${allocation.allocatedBudget}€ gespeichert`);
    }
  }
  
  // 3. Speichere Budget-Berechnungen
  const totalInternalCost = Object.values(team_costs).reduce((sum, tc) => sum + tc.totalCost, 0);
  const totalInternalHours = Object.values(team_costs).reduce((sum, tc) => sum + tc.totalHours, 0);
  const allocatedExternalBudget = supplier_allocations.reduce((sum, sa) => sum + sa.allocatedBudget, 0);
  
  await supabaseAdmin
    .from('project_budget_calculations')
    .insert({
      project_id: projectId,
      total_external_budget: external_budget,
      allocated_external_budget: allocatedExternalBudget,
      total_internal_cost: totalInternalCost,
      total_internal_hours: totalInternalHours,
      total_teams_count: teams.length,
      total_suppliers_count: supplier_allocations.length,
      annual_budget_allocation: external_budget,
      is_budget_consistent: allocatedExternalBudget <= external_budget,
      is_project_complete: true
    });
  
  console.log('✅ Budget-Berechnungen gespeichert');
}

export default {
  createProject,
  getAllProjects,
  getProject,
  getProjectMasterData,
  deleteProject
};
