// =====================================================
// Budget Manager 2025 - Dashboard Service
// Story 1.5: Echtzeit-Budget-Dashboard - Daten-Aggregation
// =====================================================

import { supabaseAdmin, toGermanCurrency } from '../config/database.js';
import { broadcastDashboardRefresh } from './websocketService.js';

// Helper function for relative time formatting
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffHours < 1) return 'vor wenigen Minuten';
  if (diffHours < 24) return `vor ${diffHours} Stunde${diffHours > 1 ? 'n' : ''}`;
  if (diffDays < 7) return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;
  return date.toLocaleDateString('de-DE');
};

// =====================================================
// DASHBOARD DATA AGGREGATION
// =====================================================

/**
 * Hole vollständige Dashboard-Daten
 * Story 1.5 - Echtzeit-Dashboard
 */
export const getDashboardData = async () => {
  try {
    console.log('📊 Lade Dashboard-Daten...');
    
    // Parallel alle Dashboard-Komponenten laden
    const [
      budgetOverview,
      projectPortfolio,
      criticalAlerts,
      burnRateData,
      recentTransfers
    ] = await Promise.all([
      getBudgetOverview(),
      getProjectPortfolio(),
      getCriticalAlerts(),
      getBurnRateAnalysis(),
      getRecentTransfers()
    ]);

    const dashboardData = {
      budgetOverview,
      projectPortfolio,
      criticalAlerts,
      burnRateData,
      recentTransfers,
      lastUpdated: new Date().toISOString(),
      performance: {
        loadTime: Date.now() // Wird vom Controller berechnet
      }
    };

    console.log('✅ Dashboard-Daten erfolgreich geladen');
    return dashboardData;

  } catch (error) {
    console.error('❌ Fehler beim Laden der Dashboard-Daten:', error);
    throw new Error(`Dashboard-Daten konnten nicht geladen werden: ${error.message}`);
  }
};

/**
 * Jahresbudget-Übersicht
 * Story 1.5 - Budget-Overview
 */
export const getBudgetOverview = async () => {
  try {
    // Jahresbudgets abrufen
    const { data: budgets, error: budgetError } = await supabaseAdmin
      .from('annual_budgets')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });

    if (budgetError) throw budgetError;

    // Projekte für Allokierung abrufen
    const { data: projects, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('planned_budget, consumed_budget, status')
      .in('status', ['planned', 'active']);

    if (projectError) throw projectError;

    // Verbrauchtes Budget aus project_suppliers berechnen
    const { data: supplierBudgets, error: supplierError } = await supabaseAdmin
      .from('project_suppliers')
      .select('consumed_budget');

    if (supplierError) throw supplierError;

    // Berechne Aggregationen
    const totalBudget = budgets.reduce((sum, budget) => sum + (budget.total_budget || 0), 0);
    const allocatedBudget = projects.reduce((sum, project) => sum + (project.planned_budget || 0), 0);
    const consumedBudget = supplierBudgets.reduce((sum, supplier) => sum + (parseFloat(supplier.consumed_budget) || 0), 0);
    const availableBudget = totalBudget - allocatedBudget;
    const remainingBudget = allocatedBudget - consumedBudget;

    // Berechne Prozentsätze
    const allocationPercentage = totalBudget > 0 ? (allocatedBudget / totalBudget) * 100 : 0;
    const consumptionPercentage = allocatedBudget > 0 ? (consumedBudget / allocatedBudget) * 100 : 0;
    const utilizationPercentage = totalBudget > 0 ? (consumedBudget / totalBudget) * 100 : 0;

    // Budget-Status bestimmen
    let budgetStatus = 'HEALTHY';
    if (utilizationPercentage >= 90) budgetStatus = 'CRITICAL';
    else if (utilizationPercentage >= 75) budgetStatus = 'WARNING';

    return {
      totalBudget: {
        amount: totalBudget,
        formatted: toGermanCurrency(totalBudget)
      },
      allocatedBudget: {
        amount: allocatedBudget,
        formatted: toGermanCurrency(allocatedBudget),
        percentage: allocationPercentage
      },
      consumedBudget: {
        amount: consumedBudget,
        formatted: toGermanCurrency(consumedBudget),
        percentage: consumptionPercentage
      },
      availableBudget: {
        amount: availableBudget,
        formatted: toGermanCurrency(availableBudget)
      },
      remainingBudget: {
        amount: remainingBudget,
        formatted: toGermanCurrency(remainingBudget)
      },
      budgetStatus,
      budgetStatusLabel: getBudgetStatusLabel(budgetStatus),
      utilizationPercentage: parseFloat(utilizationPercentage.toFixed(1)),
      budgetCount: budgets.length,
      activeProjects: projects.filter(p => p.status === 'active').length
    };

  } catch (error) {
    console.error('❌ Fehler beim Laden der Budget-Übersicht:', error);
    return {
      totalBudget: { amount: 0, formatted: '0,00 €' },
      allocatedBudget: { amount: 0, formatted: '0,00 €', percentage: 0 },
      consumedBudget: { amount: 0, formatted: '0,00 €', percentage: 0 },
      availableBudget: { amount: 0, formatted: '0,00 €' },
      remainingBudget: { amount: 0, formatted: '0,00 €' },
      budgetStatus: 'ERROR',
      budgetStatusLabel: 'Fehler beim Laden',
      utilizationPercentage: 0,
      budgetCount: 0,
      activeProjects: 0,
      error: error.message
    };
  }
};

/**
 * Projekt-Portfolio mit Budget-Ampeln
 * Story 1.5 - Projekt-Portfolio
 */
export const getProjectPortfolio = async () => {
  try {
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select(`
        id, name, projektnummer, 
        veranschlagtes_budget, zugewiesenes_budget, verbrauchtes_budget,
        budget_status, budget_verbrauch_prozent,
        status, prioritaet, start_datum, end_datum
      `)
      .in('status', ['geplant', 'aktiv'])
      .order('budget_verbrauch_prozent', { ascending: false });

    if (error) throw error;

    // Projekte nach Budget-Status kategorisieren
    const portfolioStats = {
      total: projects.length,
      healthy: 0,
      warning: 0,
      critical: 0,
      exceeded: 0
    };

    const projectsByStatus = {
      HEALTHY: [],
      WARNING: [],
      CRITICAL: [],
      EXCEEDED: []
    };

    projects.forEach(project => {
      const status = project.budget_status || 'HEALTHY';
      portfolioStats[status.toLowerCase()]++;
      
      if (projectsByStatus[status]) {
        projectsByStatus[status].push({
          ...project,
          veranschlagtes_budget_formatted: toGermanCurrency(project.veranschlagtes_budget || 0),
          zugewiesenes_budget_formatted: toGermanCurrency(project.zugewiesenes_budget || 0),
          verbrauchtes_budget_formatted: toGermanCurrency(project.verbrauchtes_budget || 0),
          budget_status_label: getBudgetStatusLabel(status)
        });
      }
    });

    // Top-Risiko-Projekte (kritisch oder überschritten)
    const riskProjects = projects
      .filter(p => ['CRITICAL', 'EXCEEDED'].includes(p.budget_status))
      .slice(0, 5)
      .map(project => ({
        ...project,
        verbrauchtes_budget_formatted: toGermanCurrency(project.verbrauchtes_budget || 0),
        zugewiesenes_budget_formatted: toGermanCurrency(project.zugewiesenes_budget || 0),
        budget_status_label: getBudgetStatusLabel(project.budget_status)
      }));

    return {
      portfolioStats,
      projectsByStatus,
      riskProjects,
      totalBudgetAllocated: projects.reduce((sum, p) => sum + (p.zugewiesenes_budget || 0), 0),
      totalBudgetConsumed: projects.reduce((sum, p) => sum + (p.verbrauchtes_budget || 0), 0)
    };

  } catch (error) {
    console.error('❌ Fehler beim Laden des Projekt-Portfolios:', error);
    return {
      portfolioStats: { total: 0, healthy: 0, warning: 0, critical: 0, exceeded: 0 },
      projectsByStatus: { HEALTHY: [], WARNING: [], CRITICAL: [], EXCEEDED: [] },
      riskProjects: [],
      totalBudgetAllocated: 0,
      totalBudgetConsumed: 0,
      error: error.message
    };
  }
};

/**
 * Kritische Warnungen und Alerts
 * Story 1.5 - Budget-Warnungen
 */
export const getCriticalAlerts = async () => {
  try {
    const alerts = [];

    // Projekte mit Budget-Überschreitungen
    const { data: exceededProjects, error: exceededError } = await supabaseAdmin
      .from('projects')
      .select('id, name, projektnummer, zugewiesenes_budget, verbrauchtes_budget, budget_verbrauch_prozent')
      .eq('budget_status', 'EXCEEDED')
      .order('budget_verbrauch_prozent', { ascending: false });

    if (exceededError) throw exceededError;

    exceededProjects.forEach(project => {
      const overspend = (project.verbrauchtes_budget || 0) - (project.zugewiesenes_budget || 0);
      alerts.push({
        type: 'BUDGET_EXCEEDED',
        severity: 'CRITICAL',
        title: 'Budget überschritten',
        message: `Projekt "${project.name}" hat das Budget um ${toGermanCurrency(overspend)} überschritten`,
        projectId: project.id,
        projectName: project.name,
        data: {
          overspend: overspend,
          overspendFormatted: toGermanCurrency(overspend),
          percentage: project.budget_verbrauch_prozent
        },
        timestamp: new Date().toISOString()
      });
    });

    // Projekte kurz vor Budget-Überschreitung
    const { data: criticalProjects, error: criticalError } = await supabaseAdmin
      .from('projects')
      .select('id, name, projektnummer, zugewiesenes_budget, verbrauchtes_budget, budget_verbrauch_prozent')
      .eq('budget_status', 'CRITICAL')
      .order('budget_verbrauch_prozent', { ascending: false });

    if (criticalError) throw criticalError;

    criticalProjects.forEach(project => {
      const remaining = (project.zugewiesenes_budget || 0) - (project.verbrauchtes_budget || 0);
      alerts.push({
        type: 'BUDGET_CRITICAL',
        severity: 'HIGH',
        title: 'Budget kritisch',
        message: `Projekt "${project.name}" hat nur noch ${toGermanCurrency(remaining)} Budget übrig`,
        projectId: project.id,
        projectName: project.name,
        data: {
          remaining: remaining,
          remainingFormatted: toGermanCurrency(remaining),
          percentage: project.budget_verbrauch_prozent
        },
        timestamp: new Date().toISOString()
      });
    });

    // Ausstehende Transfers (echte DB-Abfrage)
    const { data: pendingTransfers, error: transferError } = await supabaseAdmin
      .from('budget_transfers')
      .select('id')
      .eq('status', 'PENDING');
    
    const pendingTransfersCount = pendingTransfers?.length || 0;
    if (pendingTransfersCount > 0) {
      alerts.push({
        type: 'PENDING_TRANSFERS',
        severity: 'MEDIUM',
        title: 'Ausstehende Transfers',
        message: `${pendingTransfersCount} Budget-Transfers warten auf Genehmigung`,
        data: {
          count: pendingTransfersCount
        },
        timestamp: new Date().toISOString()
      });
    }

    // Sortiere Alerts nach Schweregrad
    const severityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return {
      alerts: alerts.slice(0, 10), // Maximal 10 Alerts
      totalAlerts: alerts.length,
      criticalCount: alerts.filter(a => a.severity === 'CRITICAL').length,
      highCount: alerts.filter(a => a.severity === 'HIGH').length,
      mediumCount: alerts.filter(a => a.severity === 'MEDIUM').length
    };

  } catch (error) {
    console.error('❌ Fehler beim Laden der kritischen Alerts:', error);
    return {
      alerts: [],
      totalAlerts: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      error: error.message
    };
  }
};

/**
 * Burn-Rate-Analyse mit Trend-Daten
 * Story 1.5 - Burn-Rate-Visualisierung
 */
export const getBurnRateAnalysis = async () => {
  try {
    console.log('📊 Dashboard: Loading burn rate analysis from database');

    // Echte Daten aus der Datenbank laden - letzte 12 Monate
    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 11, 1);
    
    // Lade historische Budget-Verbrauchsdaten
    const { data: consumptionData, error } = await supabaseAdmin
      .from('projects')
      .select('consumed_budget, created_at, updated_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at');

    if (error) {
      console.error('❌ Fehler beim Laden der Burn-Rate-Daten:', error);
      return {
        success: false,
        error: 'Fehler beim Laden der Burn-Rate-Daten',
        data: { monthlyData: [], trends: {} }
      };
    }

    // Gruppiere Daten nach Monaten
    const monthlyData = [];
    const monthlyConsumption = {};

    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
      
      // Berechne tatsächlichen Verbrauch für diesen Monat
      const monthConsumption = (consumptionData || [])
        .filter(project => {
          const projectDate = new Date(project.updated_at || project.created_at);
          return projectDate.getFullYear() === date.getFullYear() && 
                 projectDate.getMonth() === date.getMonth();
        })
        .reduce((sum, project) => sum + (project.consumed_budget || 0), 0);

      monthlyConsumption[monthKey] = monthConsumption;
      
      monthlyData.push({
        month: monthName,
        date: date.toISOString().split('T')[0],
        budgetConsumed: monthConsumption,
        budgetConsumedFormatted: toGermanCurrency(monthConsumption),
        budgetAllocated: monthConsumption * 1.2, // Annahme: 20% Puffer
        budgetAllocatedFormatted: toGermanCurrency(monthConsumption * 1.2),
        utilizationRate: monthConsumption > 0 ? Math.round((monthConsumption / (monthConsumption * 1.2)) * 100) : 0
      });
    }

    // Berechne Trends
    const lastThreeMonths = monthlyData.slice(-3);
    const avgConsumption = lastThreeMonths.reduce((sum, month) => sum + month.budgetConsumed, 0) / 3;
    const currentMonthConsumption = monthlyData[monthlyData.length - 1].budgetConsumed;
    const trend = currentMonthConsumption > avgConsumption ? 'INCREASING' : 'DECREASING';
    const trendPercentage = Math.abs(((currentMonthConsumption - avgConsumption) / avgConsumption) * 100);

    // Projektion für nächste 3 Monate
    const projectedData = [];
    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthName = futureDate.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
      
      const projectedConsumption = avgConsumption * (trend === 'INCREASING' ? 1.05 : 0.95);
      projectedData.push({
        month: monthName,
        date: futureDate.toISOString().split('T')[0],
        budgetConsumed: Math.round(projectedConsumption),
        budgetConsumedFormatted: toGermanCurrency(projectedConsumption),
        isProjected: true
      });
    }

    return {
      monthlyData,
      projectedData,
      trend: {
        direction: trend,
        percentage: parseFloat(trendPercentage.toFixed(1)),
        label: trend === 'INCREASING' ? 'Steigend' : 'Fallend'
      },
      averageMonthlyBurn: {
        amount: Math.round(avgConsumption),
        formatted: toGermanCurrency(avgConsumption)
      },
      currentMonthBurn: {
        amount: Math.round(currentMonthConsumption),
        formatted: toGermanCurrency(currentMonthConsumption)
      }
    };

  } catch (error) {
    console.error('❌ Fehler beim Laden der Burn-Rate-Analyse:', error);
    return {
      monthlyData: [],
      projectedData: [],
      trend: { direction: 'STABLE', percentage: 0, label: 'Stabil' },
      averageMonthlyBurn: { amount: 0, formatted: '0,00 €' },
      currentMonthBurn: { amount: 0, formatted: '0,00 €' },
      error: error.message
    };
  }
};

/**
 * Aktuelle Transfer-Aktivitäten
 * Story 1.5 - Transfer-Übersicht
 */
export const getRecentTransfers = async () => {
  try {
    console.log('📊 Dashboard: Loading recent transfers from database');

    // Echte Daten aus budget_transfers Tabelle laden
    const { data: transfers, error } = await supabase
      .from('budget_transfers')
      .select(`
        id,
        transfer_amount,
        status,
        requested_at,
        executed_at,
        from_project:from_project_id(name),
        to_project:to_project_id(name)
      `)
      .order('requested_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Fehler beim Laden der Transfers:', error);
      return {
        success: false,
        error: 'Fehler beim Laden der Transfer-Daten',
        data: []
      };
    }

    // Daten formatieren
    const recentTransfers = (transfers || []).map(transfer => {
      const statusLabels = {
        'PENDING': 'Ausstehend',
        'APPROVED': 'Genehmigt',
        'REJECTED': 'Abgelehnt',
        'CANCELLED': 'Storniert'
      };

      return {
        id: transfer.id,
        from_project_name: transfer.from_project?.name || 'Unbekanntes Projekt',
        to_project_name: transfer.to_project?.name || 'Unbekanntes Projekt',
        transfer_amount: transfer.transfer_amount,
        transfer_amount_formatted: toGermanCurrency(transfer.transfer_amount),
        status: transfer.status,
        status_label: statusLabels[transfer.status] || transfer.status,
        requested_at: transfer.requested_at,
        requested_at_formatted: formatRelativeTime(transfer.requested_at),
        executed_at: transfer.executed_at,
        executed_at_formatted: transfer.executed_at ? formatRelativeTime(transfer.executed_at) : null
      };
    });

    const transferStats = {
      total: recentTransfers.length,
      pending: recentTransfers.filter(t => t.status === 'PENDING').length,
      approved: recentTransfers.filter(t => t.status === 'APPROVED').length,
      totalAmount: recentTransfers.reduce((sum, t) => sum + t.transfer_amount, 0)
    };

    return {
      recentTransfers: recentTransfers.slice(0, 5), // Letzte 5 Transfers
      transferStats: {
        ...transferStats,
        totalAmountFormatted: toGermanCurrency(transferStats.totalAmount)
      }
    };

  } catch (error) {
    console.error('❌ Fehler beim Laden der aktuellen Transfers:', error);
    return {
      recentTransfers: [],
      transferStats: {
        total: 0,
        pending: 0,
        approved: 0,
        totalAmount: 0,
        totalAmountFormatted: '0,00 €'
      },
      error: error.message
    };
  }
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Deutsche Budget-Status-Labels
 */
function getBudgetStatusLabel(status) {
  const labels = {
    'HEALTHY': 'Gesund',
    'WARNING': 'Warnung',
    'CRITICAL': 'Kritisch',
    'EXCEEDED': 'Überschritten',
    'ERROR': 'Fehler'
  };
  return labels[status] || 'Unbekannt';
}

/**
 * Dashboard-Cache invalidieren und Refresh senden
 */
export const invalidateDashboardCache = async (reason = 'DATA_UPDATED') => {
  try {
    // WebSocket-Update senden
    broadcastDashboardRefresh(reason);
    
    console.log(`🔄 Dashboard-Cache invalidiert: ${reason}`);
  } catch (error) {
    console.error('❌ Fehler beim Invalidieren des Dashboard-Cache:', error);
  }
};

export default {
  getDashboardData,
  getBudgetOverview,
  getProjectPortfolio,
  getCriticalAlerts,
  getBurnRateAnalysis,
  getRecentTransfers,
  invalidateDashboardCache
};

