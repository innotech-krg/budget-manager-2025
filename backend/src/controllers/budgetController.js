// =====================================================
// Budget Manager 2025 - Budget Controller (Modernized)
// Story 1.1: Jahresbudget-Verwaltung - English Schema
// =====================================================

import { supabaseAdmin, formatGermanCurrency, toGermanCurrency, isValidGermanBusinessYear } from '../config/database.js';
import { validateBudgetData, validateBudgetStatus } from '../utils/budgetValidation.js';
import { createAuditLog } from '../utils/auditLogger.js';

/**
 * Normalisiert Status-Werte für Frontend-Kompatibilität
 */
const normalizeStatus = (status) => {
  const statusMap = {
    'aktiv': 'ACTIVE',
    'active': 'ACTIVE',
    'ACTIVE': 'ACTIVE',
    'entwurf': 'DRAFT',
    'draft': 'DRAFT',
    'DRAFT': 'DRAFT',
    'geschlossen': 'CLOSED',
    'abgeschlossen': 'CLOSED',
    'closed': 'CLOSED',
    'CLOSED': 'CLOSED'
  };
  
  return statusMap[status] || 'DRAFT';
};

// =====================================================
// JAHRESBUDGET CRUD OPERATIONS
// =====================================================

/**
 * Alle Jahresbudgets abrufen
 * Story 1.1 - Funktionale Kriterien 2
 */
export const getAllAnnualBudgets = async (req, res) => {
  try {
    console.log('📥 [Budget] GET /api/budgets');
    
    // 🔄 Schritt 1: Jahresbudgets laden
    const { data: budgets, error } = await supabaseAdmin
      .from('annual_budgets')
      .select('*')
      .order('year', { ascending: false }); // Use English field name
    
    if (error) {
      console.error('❌ Fehler beim Abrufen der Jahresbudgets:', error);
      throw new Error(`Fehler beim Abrufen der Budgets: ${error.message}`);
    }
    
    console.log(`✅ ${budgets?.length || 0} Jahresbudgets geladen`);
    
    // 🔄 Schritt 2: Budget-Synchronisation für jedes Jahresbudget
    const synchronizedBudgets = await Promise.all(budgets.map(async (budget) => {
      return await synchronizeAnnualBudget(budget.id);
    }));
    
    // Format for German frontend compatibility
    const formattedBudgets = synchronizedBudgets?.map(budget => ({
      ...budget,
      jahr: budget.year, // Map English to German for frontend
      gesamtbudget: budget.total_budget,
      allokiertes_budget: budget.allocated_budget,
      verbrauchtes_budget: budget.consumed_budget,
      verfuegbares_budget: budget.available_budget,
      reserve_allokation: budget.reserve_allocation,
      beschreibung: budget.description,
      gesamtbudget_formatted: toGermanCurrency(budget.total_budget),
      allokiertes_budget_formatted: toGermanCurrency(budget.allocated_budget),
      verbrauchtes_budget_formatted: toGermanCurrency(budget.consumed_budget),
      verfuegbares_budget_formatted: toGermanCurrency(budget.available_budget)
    })) || [];
    
    // 🔄 Schritt 3: Aktuelles Jahr identifizieren
    const currentYear = new Date().getFullYear();
    const currentYearBudget = synchronizedBudgets.find(budget => budget.year === currentYear);
    
    res.json({
      budgets: formattedBudgets,
      count: formattedBudgets.length,
      currentYear: currentYear,
      currentYearBudget: currentYearBudget ? {
        ...currentYearBudget,
        allokiertes_budget: currentYearBudget.allocated_budget,
        gesamtbudget_formatted: toGermanCurrency(currentYearBudget.total_budget),
        allokiertes_budget_formatted: toGermanCurrency(currentYearBudget.allocated_budget),
        verbrauchtes_budget_formatted: toGermanCurrency(currentYearBudget.consumed_budget),
        verfuegbares_budget_formatted: toGermanCurrency(currentYearBudget.available_budget)
      } : null,
      message: `${formattedBudgets.length} Jahresbudgets erfolgreich geladen`,
      code: 'BUDGETS_LOADED_SUCCESS'
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Jahresbudgets:', error);
    res.status(500).json({
      error: 'Interner Serverfehler',
      message: 'Die Jahresbudgets konnten nicht geladen werden.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Einzelnes Jahresbudget abrufen
 * Story 1.1 - Funktionale Kriterien 3
 */
export const getAnnualBudgetById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📥 [Budget] GET /api/budgets/${id}`);
    
    // Schritt 1: Budget-Synchronisation durchführen
    const synchronizedBudget = await synchronizeAnnualBudget(id);
    
    if (!synchronizedBudget) {
      console.error('❌ Budget nicht gefunden oder Synchronisation fehlgeschlagen');
      return res.status(404).json({
        error: 'Budget nicht gefunden',
        message: `Das Budget mit der ID ${id} konnte nicht gefunden werden.`,
        code: 'BUDGET_NOT_FOUND'
      });
    }
    
    // Schritt 2: Projekt-Allokationen laden
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('id, name, planned_budget, consumed_budget, status, created_at')
      .eq('annual_budget_id', id)
      .order('created_at', { ascending: false });
    
    if (projectsError) {
      console.error('❌ Fehler beim Laden der Projekte:', projectsError);
    }
    
    console.log(`✅ Budget gefunden: ${synchronizedBudget.id} für Jahr ${synchronizedBudget.year} mit ${projects?.length || 0} Projekten`);
    
    // Schritt 3: Budget-Berechnungen
    const totalAllocated = projects?.reduce((sum, project) => 
      sum + parseFloat(project.planned_budget || 0), 0) || 0;
    const totalConsumed = projects?.reduce((sum, project) => 
      sum + parseFloat(project.consumed_budget || 0), 0) || 0;
    
    // Format for German frontend compatibility
    const formattedBudget = {
      ...synchronizedBudget,
      jahr: synchronizedBudget.year,
      gesamtbudget: synchronizedBudget.total_budget,
      allokiertes_budget: totalAllocated,
      verbrauchtes_budget: synchronizedBudget.consumed_budget,
      verfuegbares_budget: synchronizedBudget.available_budget,
      reserve_allokation: synchronizedBudget.reserve_allocation,
      beschreibung: synchronizedBudget.description,
      gesamtbudget_formatted: toGermanCurrency(synchronizedBudget.total_budget),
      allokiertes_budget_formatted: toGermanCurrency(totalAllocated),
      verbrauchtes_budget_formatted: toGermanCurrency(synchronizedBudget.consumed_budget),
      verfuegbares_budget_formatted: toGermanCurrency(synchronizedBudget.available_budget)
    };
    
    // Schritt 4: Projekte formatieren
    const formattedProjects = projects?.map(project => ({
      ...project,
      geplantes_budget: project.planned_budget,
      verbrauchtes_budget: project.consumed_budget,
      verfuegbares_budget: parseFloat(project.planned_budget || 0) - parseFloat(project.consumed_budget || 0),
      geplantes_budget_formatted: toGermanCurrency(project.planned_budget),
      verbrauchtes_budget_formatted: toGermanCurrency(project.consumed_budget),
      verfuegbares_budget_formatted: toGermanCurrency(
        parseFloat(project.planned_budget || 0) - parseFloat(project.consumed_budget || 0)
      ),
      budget_auslastung: project.planned_budget > 0 
        ? Math.round((parseFloat(project.consumed_budget || 0) / parseFloat(project.planned_budget)) * 100)
        : 0
    })) || [];
    
    res.json({
      budget: formattedBudget,
      projects: formattedProjects,
      allocations: {
        total_allocated: totalAllocated,
        total_consumed: totalConsumed,
        total_available: parseFloat(synchronizedBudget.total_budget) - totalConsumed,
        allocation_percentage: synchronizedBudget.total_budget > 0 
          ? Math.round((totalAllocated / parseFloat(synchronizedBudget.total_budget)) * 100)
          : 0,
        consumption_percentage: totalAllocated > 0 
          ? Math.round((totalConsumed / totalAllocated) * 100)
          : 0
      },
      message: `Budget für Jahr ${synchronizedBudget.year} mit ${formattedProjects.length} Projekten erfolgreich geladen`,
      code: 'BUDGET_LOADED_SUCCESS'
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Abrufen des Budgets:', error);
    res.status(500).json({
      error: 'Interner Serverfehler',
      message: 'Das Budget konnte nicht geladen werden.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Erstelle neues Jahresbudget
 * Story 1.1 - Funktionale Kriterien 1
 */
export const createAnnualBudget = async (req, res) => {
  try {
    const { jahr, year, gesamtbudget, total_budget, reserve_allocation = 10.0, description, status } = req.body;
    
    // Support both German and English field names for compatibility
    const budgetYear = jahr || year;
    const budgetAmount = gesamtbudget || total_budget;
    const budgetStatus = normalizeStatus(status || 'DRAFT');
    
    console.log(`📥 [Budget] POST /api/budgets - Jahr: ${budgetYear}, Budget: ${budgetAmount}, Status: ${budgetStatus}`);
    
    // Validierung: Jahr und Budget-Betrag erforderlich
    if (!budgetYear || !budgetAmount) {
      return res.status(400).json({
        error: 'Fehlende Pflichtfelder',
        message: 'Jahr und Budget-Betrag sind erforderlich',
        code: 'MISSING_REQUIRED_FIELDS',
        missing: {
          year: !budgetYear,
          budget: !budgetAmount
        }
      });
    }

    // Deutsche Geschäftsregeln: Nur zukünftige Jahre erlaubt
    const currentYear = new Date().getFullYear();
    if (budgetYear < currentYear) {
      return res.status(400).json({
        error: 'Ungültiges Jahr',
        message: `Budgets können nur für das aktuelle Jahr (${currentYear}) oder zukünftige Jahre erstellt werden. Jahr ${budgetYear} liegt in der Vergangenheit.`,
        code: 'BUDGET_YEAR_PAST',
        currentYear,
        requestedYear: budgetYear
      });
    }
    
    // Prüfe ob Jahr bereits existiert
    const { data: existingBudget } = await supabaseAdmin
      .from('annual_budgets')
      .select('id, year')
      .eq('year', budgetYear)
      .single();
    
    if (existingBudget) {
      return res.status(409).json({
        error: 'Jahresbudget bereits vorhanden',
        message: `Ein Budget für das Jahr ${budgetYear} existiert bereits. Pro Jahr ist nur ein Budget erlaubt.`,
        code: 'BUDGET_YEAR_EXISTS',
        existingBudgetId: existingBudget.id
      });
    }
    
    // Deutsche Geschäftslogik: Intelligente Status-Bestimmung
    let finalBudgetStatus = budgetStatus;
    if (!status) {
      if (budgetYear < currentYear) {
        finalBudgetStatus = 'CLOSED'; // Vergangene Jahre sind geschlossen
      } else if (budgetYear === currentYear) {
        // Aktuelles Jahr: Prüfe ob bereits ein aktives Budget existiert
        const { data: activeCurrentBudget } = await supabaseAdmin
          .from('annual_budgets')
          .select('id')
          .eq('year', currentYear)
          .eq('status', 'ACTIVE')
          .single();
        
        finalBudgetStatus = activeCurrentBudget ? 'DRAFT' : 'ACTIVE';
      } else {
        finalBudgetStatus = 'DRAFT'; // Zukünftige Jahre sind Entwürfe
      }
    }
    
    console.log(`📋 Budget-Status für Jahr ${budgetYear}: ${finalBudgetStatus} (Aktuelles Jahr: ${currentYear})`);
    
    // Erstelle neues Jahresbudget mit englischen Feldnamen
    const { data: newBudget, error } = await supabaseAdmin
      .from('annual_budgets')
      .insert([{
        year: budgetYear,
        total_budget: parseFloat(budgetAmount),
        reserve_allocation: parseFloat(reserve_allocation),
        description: description || `Jahresbudget ${budgetYear}`,
        status: finalBudgetStatus,
        consumed_budget: 0,
        available_budget: parseFloat(budgetAmount)
      }])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Fehler beim Erstellen des Budgets:', error);
      throw error;
    }
    
    console.log(`✅ Budget erstellt: ${newBudget.id} für Jahr ${newBudget.year}`);
    
    // Audit Log
    await createAuditLog({
      table_name: 'annual_budgets',
      record_id: newBudget.id,
      action: 'INSERT',
      old_values: null,
      new_values: newBudget,
      user_id: 'system'
    });
    
    // Format for German frontend compatibility
    const formattedBudget = {
      ...newBudget,
      jahr: newBudget.year,
      gesamtbudget: newBudget.total_budget,
      verbrauchtes_budget: newBudget.consumed_budget,
      verfuegbares_budget: newBudget.available_budget,
      reserve_allokation: newBudget.reserve_allocation,
      beschreibung: newBudget.description,
      gesamtbudget_formatted: toGermanCurrency(newBudget.total_budget)
    };
    
    res.status(201).json({
      message: `Jahresbudget für ${jahr} erfolgreich erstellt`,
      budget: formattedBudget,
      code: 'BUDGET_CREATED_SUCCESS'
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Budgets:', error);
    res.status(500).json({
      error: 'Interner Serverfehler',
      message: 'Das Budget konnte nicht erstellt werden.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Jahresbudget aktualisieren
 * Story 1.1 - Funktionale Kriterien 4
 */
export const updateAnnualBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { total_budget, reserve_allocation, description } = req.body;
    
    console.log(`📥 [Budget] PUT /api/budgets/${id}`);
    
    // Hole aktuelles Budget
    const { data: currentBudget, error: fetchError } = await supabaseAdmin
      .from('annual_budgets')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !currentBudget) {
      return res.status(404).json({
        error: 'Budget nicht gefunden',
        message: `Das Budget mit der ID ${id} konnte nicht gefunden werden.`,
        code: 'BUDGET_NOT_FOUND'
      });
    }
    
    // Baue Update-Daten
    const updateData = {};
    
    if (total_budget !== undefined) {
      updateData.total_budget = parseFloat(total_budget);
      updateData.available_budget = parseFloat(total_budget) - (currentBudget.consumed_budget || 0);
    }
    
    if (reserve_allocation !== undefined) {
      updateData.reserve_allocation = parseFloat(reserve_allocation);
    }
    
    if (description !== undefined) {
      updateData.description = description;
    }
    
    updateData.updated_at = new Date().toISOString();
    
    // Aktualisiere Budget
    const { data: updatedBudget, error } = await supabaseAdmin
      .from('annual_budgets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Fehler beim Aktualisieren des Budgets:', error);
      throw error;
    }
    
    console.log(`✅ Budget aktualisiert: ${updatedBudget.id}`);
    
    // Audit Log
    await createAuditLog({
      table_name: 'annual_budgets',
      record_id: updatedBudget.id,
      action: 'UPDATE',
      old_values: currentBudget,
      new_values: updatedBudget,
      user_id: 'system'
    });
    
    // Format for German frontend compatibility
    const formattedBudget = {
      ...updatedBudget,
      jahr: updatedBudget.year,
      gesamtbudget: updatedBudget.total_budget,
      verbrauchtes_budget: updatedBudget.consumed_budget,
      verfuegbares_budget: updatedBudget.available_budget,
      reserve_allokation: updatedBudget.reserve_allocation,
      beschreibung: updatedBudget.description,
      gesamtbudget_formatted: toGermanCurrency(updatedBudget.total_budget)
    };
    
    res.json({
      message: `Budget für Jahr ${updatedBudget.year} erfolgreich aktualisiert`,
      budget: formattedBudget,
      code: 'BUDGET_UPDATED_SUCCESS'
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren des Budgets:', error);
    res.status(500).json({
      error: 'Interner Serverfehler',
      message: 'Das Budget konnte nicht aktualisiert werden.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Budget-Status ändern
 * Story 1.1 - Funktionale Kriterien 5
 */
export const updateBudgetStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`📥 [Budget] PATCH /api/budgets/${id}/status - Status: ${status}`);
    
    // Validiere Status
    const normalizedStatus = normalizeStatus(status);
    if (!validateBudgetStatus(normalizedStatus)) {
      return res.status(400).json({
        error: 'Ungültiger Status',
        message: `Der Status '${status}' ist ungültig. Erlaubte Werte: ACTIVE, DRAFT, CLOSED`,
        code: 'INVALID_BUDGET_STATUS'
      });
    }
    
    // Deutsche Geschäftslogik: Nur ein aktives Budget erlaubt
    if (normalizedStatus === 'ACTIVE') {
      // Hole das zu aktualisierende Budget
      const { data: targetBudget } = await supabaseAdmin
        .from('annual_budgets')
        .select('year')
        .eq('id', id)
        .single();
      
      if (!targetBudget) {
        return res.status(404).json({
          error: 'Budget nicht gefunden',
          message: `Kein Budget mit der ID ${id} gefunden.`,
          code: 'BUDGET_NOT_FOUND'
        });
      }
      
      // Prüfe ob bereits ein aktives Budget für dieses Jahr existiert
      const { data: existingActiveBudget } = await supabaseAdmin
        .from('annual_budgets')
        .select('id')
        .eq('year', targetBudget.year)
        .eq('status', 'ACTIVE')
        .neq('id', id) // Ausschließen des aktuellen Budgets
        .single();
      
      if (existingActiveBudget) {
        return res.status(409).json({
          error: 'Aktives Budget bereits vorhanden',
          message: `Für das Jahr ${targetBudget.year} existiert bereits ein aktives Budget. Pro Jahr ist nur ein aktives Budget erlaubt.`,
          code: 'ACTIVE_BUDGET_EXISTS',
          year: targetBudget.year,
          existingActiveBudgetId: existingActiveBudget.id
        });
      }
    }
    
    // Aktualisiere Status
    const { data: updatedBudget, error } = await supabaseAdmin
      .from('annual_budgets')
      .update({ 
        status: normalizedStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Fehler beim Aktualisieren des Budget-Status:', error);
      return res.status(404).json({
        error: 'Budget nicht gefunden',
        message: `Das Budget mit der ID ${id} konnte nicht gefunden werden.`,
        code: 'BUDGET_NOT_FOUND'
      });
    }
    
    console.log(`✅ Budget-Status aktualisiert: ${updatedBudget.id} -> ${normalizedStatus}`);
    
    res.json({
      message: `Budget-Status erfolgreich zu '${normalizedStatus}' geändert`,
      budget: {
        id: updatedBudget.id,
        jahr: updatedBudget.year,
        status: updatedBudget.status,
        updated_at: updatedBudget.updated_at
      },
      code: 'BUDGET_STATUS_UPDATED_SUCCESS'
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren des Budget-Status:', error);
    res.status(500).json({
      error: 'Interner Serverfehler',
      message: 'Der Budget-Status konnte nicht aktualisiert werden.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Jahresbudget löschen
 * Story 1.1 - Funktionale Kriterien 6
 */
export const deleteAnnualBudget = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📥 [Budget] DELETE /api/budgets/${id}`);
    
    // Prüfe ob Budget existiert und hole Daten für Audit
    const { data: budgetToDelete, error: fetchError } = await supabaseAdmin
      .from('annual_budgets')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !budgetToDelete) {
      return res.status(404).json({
        error: 'Budget nicht gefunden',
        message: `Das Budget mit der ID ${id} konnte nicht gefunden werden.`,
        code: 'BUDGET_NOT_FOUND'
      });
    }
    
    // Prüfe ob Budget noch verwendet wird (verknüpfte Projekte)
    const { data: linkedProjects, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, name')
      .eq('annual_budget_id', id)
      .limit(5);
    
    if (linkedProjects && linkedProjects.length > 0) {
      return res.status(409).json({
        error: 'Budget wird noch verwendet',
        message: `Das Budget kann nicht gelöscht werden, da es noch von ${linkedProjects.length} Projekt(en) verwendet wird.`,
        code: 'BUDGET_IN_USE',
        linkedProjects: linkedProjects.map(p => ({ id: p.id, name: p.name }))
      });
    }
    
    // Lösche Budget
    const { error: deleteError } = await supabaseAdmin
      .from('annual_budgets')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('❌ Fehler beim Löschen des Budgets:', deleteError);
      throw deleteError;
    }
    
    console.log(`✅ Budget gelöscht: ${id} (Jahr ${budgetToDelete.year})`);
    
    // Audit Log
    await createAuditLog({
      table_name: 'annual_budgets',
      record_id: id,
      action: 'DELETE',
      old_values: budgetToDelete,
      new_values: null,
      user_id: 'system'
    });
    
    res.json({
      message: `Budget für Jahr ${budgetToDelete.year} erfolgreich gelöscht`,
      deletedBudget: {
        id: budgetToDelete.id,
        jahr: budgetToDelete.year,
        gesamtbudget_formatted: toGermanCurrency(budgetToDelete.total_budget)
      },
      code: 'BUDGET_DELETED_SUCCESS'
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Löschen des Budgets:', error);
    res.status(500).json({
      error: 'Interner Serverfehler',
      message: 'Das Budget konnte nicht gelöscht werden.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// =====================================================
// BUDGET OVERVIEW & STATISTICS
// =====================================================

/**
 * Budget-Übersicht für Dashboard
 * Story 1.1 - Dashboard Integration
 */
export const getBudgetOverview = async (req, res) => {
  try {
    const { jahr = new Date().getFullYear() } = req.query;
    
    console.log(`📥 [Budget] GET /api/budgets/overview - Jahr: ${jahr}`);
    
    // Hole Budget-Übersicht aus der Datenbank
    const { data: overview, error } = await supabaseAdmin
      .from('annual_budgets')
      .select('*')
      .eq('year', parseInt(jahr))
      .eq('status', 'ACTIVE')
      .single();
    
    if (error || !overview) {
      return res.status(404).json({
        error: 'Budget nicht gefunden',
        message: `Kein aktives Budget für das Jahr ${jahr} gefunden.`,
        code: 'BUDGET_NOT_FOUND'
      });
    }
    
    // Deutsche Formatierung der Übersicht
    const formattedOverview = {
      jahr: overview.year,
      gesamtbudget: toGermanCurrency(overview.total_budget),
      reserve_allokation: `${overview.reserve_allocation}%`,
      verfuegbares_budget: toGermanCurrency(overview.available_budget),
      verbrauchtes_budget: toGermanCurrency(overview.consumed_budget),
      status: overview.status,
      budget_allokation: {
        verfuegbar: overview.available_budget,
        verbraucht: overview.consumed_budget,
        prozent_verbraucht: overview.total_budget > 0 
          ? Math.round((overview.consumed_budget / overview.total_budget) * 100)
          : 0
      }
    };
    
    console.log(`✅ Budget-Übersicht geladen für Jahr ${jahr}`);
    
    res.json({
      overview: formattedOverview,
      message: `Budget-Übersicht für ${jahr} erfolgreich geladen`,
      code: 'BUDGET_OVERVIEW_SUCCESS'
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Laden der Budget-Übersicht:', error);
    res.status(500).json({
      error: 'Interner Serverfehler',
      message: 'Die Budget-Übersicht konnte nicht geladen werden.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * 🔄 Budget-Synchronisation: Jahresbudget mit Projektbudgets synchronisieren
 * Berechnet automatisch: verplant, verbraucht, verfügbar
 */
export async function synchronizeAnnualBudget(annualBudgetId) {
  try {
    console.log(`🔄 Synchronisiere Jahresbudget: ${annualBudgetId}`);
    
    // Schritt 1: Jahresbudget laden
    const { data: annualBudget, error: budgetError } = await supabaseAdmin
      .from('annual_budgets')
      .select('*')
      .eq('id', annualBudgetId)
      .single();
    
    if (budgetError || !annualBudget) {
      console.error('❌ Jahresbudget nicht gefunden:', budgetError);
      return null;
    }
    
    // Schritt 2: Alle Projekte für dieses Jahresbudget laden
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('id, planned_budget, external_budget')
      .eq('annual_budget_id', annualBudgetId);
    
    if (projectsError) {
      console.error('❌ Fehler beim Laden der Projekte:', projectsError);
      return annualBudget;
    }
    
    // Schritt 2b: Verbrauchtes Budget aus project_suppliers berechnen
    const projectIds = projects?.map(p => p.id) || [];
    const { data: supplierBudgets, error: supplierError } = projectIds.length > 0 
      ? await supabaseAdmin
          .from('project_suppliers')
          .select('consumed_budget, project_id')
          .in('project_id', projectIds)
      : { data: [], error: null };
    
    if (supplierError) {
      console.error('❌ Fehler beim Laden der Lieferanten-Budgets:', supplierError);
    }
    
    // Schritt 3: Budget-Berechnungen
    const totalPlanned = projects.reduce((sum, project) => 
      sum + parseFloat(project.planned_budget || project.external_budget || 0), 0);
    const totalConsumed = supplierBudgets?.reduce((sum, supplier) => 
      sum + parseFloat(supplier.consumed_budget || 0), 0) || 0;
    const totalBudget = parseFloat(annualBudget.total_budget || 0);
    const availableBudget = totalBudget - totalPlanned;
    
    console.log(`📊 Budget-Berechnung für ${annualBudget.year}:`);
    console.log(`  💰 Gesamtbudget: ${totalBudget}€`);
    console.log(`  📋 Verplant: ${totalPlanned}€`);
    console.log(`  💸 Verbraucht: ${totalConsumed}€`);
    console.log(`  💚 Verfügbar: ${availableBudget}€`);
    
    // Schritt 4: Jahresbudget aktualisieren
    const { data: updatedBudget, error: updateError } = await supabaseAdmin
      .from('annual_budgets')
      .update({
        allocated_budget: totalPlanned,
        consumed_budget: totalConsumed,
        available_budget: availableBudget,
        updated_at: new Date().toISOString()
      })
      .eq('id', annualBudgetId)
      .select('*')
      .single();
    
    if (updateError) {
      console.error('❌ Fehler beim Aktualisieren des Jahresbudgets:', updateError);
      return annualBudget;
    }
    
    console.log(`✅ Jahresbudget ${annualBudget.year} erfolgreich synchronisiert`);
    return updatedBudget;
    
  } catch (error) {
    console.error('❌ Fehler bei Budget-Synchronisation:', error);
    return null;
  }
}

/**
 * Get available years for budget creation
 * Returns years that don't have budgets yet
 */
export const getAvailableYears = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const maxYear = currentYear + 5; // 5 Jahre in die Zukunft
    
    // Hole alle Jahre mit existierenden Budgets
    const { data: existingBudgets, error } = await supabaseAdmin
      .from('annual_budgets')
      .select('year')
      .order('year', { ascending: true });
    
    if (error) {
      console.error('❌ Fehler beim Laden existierender Budgets:', error);
      throw error;
    }
    
    // Erstelle Liste aller möglichen Jahre
    const allYears = [];
    for (let year = currentYear; year <= maxYear; year++) {
      allYears.push(year);
    }
    
    // Filtere Jahre mit existierenden Budgets heraus
    const existingYears = existingBudgets.map(budget => budget.year);
    const availableYears = allYears.filter(year => !existingYears.includes(year));
    
    console.log(`📅 Verfügbare Jahre: ${availableYears.join(', ')}`);
    console.log(`📅 Existierende Jahre: ${existingYears.join(', ')}`);
    
    res.json({
      availableYears,
      existingYears,
      currentYear,
      maxYear
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Laden verfügbarer Jahre:', error);
    res.status(500).json({
      error: 'Serverfehler',
      message: 'Verfügbare Jahre konnten nicht geladen werden',
      code: 'AVAILABLE_YEARS_ERROR'
    });
  }
};