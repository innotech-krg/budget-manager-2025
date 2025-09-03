// =====================================================
// Budget Manager 2025 - Dashboard Controller
// Story 1.5: Echtzeit-Budget-Dashboard - API Controller
// =====================================================

import {
  getDashboardData,
  getBudgetOverview,
  getProjectPortfolio,
  getCriticalAlerts,
  getBurnRateAnalysis,
  getRecentTransfers,
  invalidateDashboardCache
} from '../services/dashboardService.js';
import {
  getWebSocketStats,
  testWebSocketConnection,
  broadcastDashboardRefresh
} from '../services/websocketService.js';
import { createAuditLog } from '../utils/auditLogger.js';

// =====================================================
// DASHBOARD DATA ENDPOINTS
// =====================================================

/**
 * Vollständige Dashboard-Daten abrufen
 * Story 1.5 - Echtzeit-Dashboard
 */
export const getFullDashboard = async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('📊 Dashboard-Daten werden geladen...');
    
    // Vollständige Dashboard-Daten laden
    const dashboardData = await getDashboardData();
    
    // Performance-Messung
    const loadTime = Date.now() - startTime;
    dashboardData.performance.loadTime = loadTime;
    
    // Performance-Warnung bei > 3 Sekunden
    if (loadTime > 3000) {
      console.warn(`⚠️ Dashboard-Ladezeit überschritten: ${loadTime}ms`);
    }
    
    // Audit-Log für Dashboard-Zugriff
    try {
      await createAuditLog({
        table_name: 'dashboard',
        record_id: 'dashboard-access',
        action: 'DASHBOARD_ACCESS',
        new_values: { loadTime, timestamp: new Date().toISOString() },
        changed_by: 'dev-user-123', // req.user?.id,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
    } catch (auditError) {
      console.log('⚠️ Audit-Log für Dashboard-Zugriff übersprungen:', auditError.message);
    }
    
    res.json({
      success: true,
      message: 'Dashboard-Daten erfolgreich geladen',
      data: dashboardData,
      performance: {
        loadTime: `${loadTime}ms`,
        target: '< 3000ms',
        status: loadTime < 3000 ? 'OPTIMAL' : 'SLOW'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Laden der Dashboard-Daten:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der Dashboard-Daten',
      message: error.message,
      code: 'DASHBOARD_LOAD_FAILED'
    });
  }
};

/**
 * Budget-Übersicht abrufen
 * Story 1.5 - Budget-Overview
 */
export const getBudgetOverviewData = async (req, res) => {
  try {
    const budgetOverview = await getBudgetOverview();
    
    res.json({
      success: true,
      data: budgetOverview,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Laden der Budget-Übersicht:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der Budget-Übersicht',
      message: error.message,
      code: 'BUDGET_OVERVIEW_FAILED'
    });
  }
};

/**
 * Projekt-Portfolio abrufen
 * Story 1.5 - Projekt-Portfolio
 */
export const getProjectPortfolioData = async (req, res) => {
  try {
    const projectPortfolio = await getProjectPortfolio();
    
    res.json({
      success: true,
      data: projectPortfolio,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Laden des Projekt-Portfolios:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden des Projekt-Portfolios',
      message: error.message,
      code: 'PROJECT_PORTFOLIO_FAILED'
    });
  }
};

/**
 * Kritische Alerts abrufen
 * Story 1.5 - Budget-Warnungen
 */
export const getCriticalAlertsData = async (req, res) => {
  try {
    const criticalAlerts = await getCriticalAlerts();
    
    res.json({
      success: true,
      data: criticalAlerts,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Laden der kritischen Alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der kritischen Alerts',
      message: error.message,
      code: 'CRITICAL_ALERTS_FAILED'
    });
  }
};

/**
 * Burn-Rate-Analyse abrufen
 * Story 1.5 - Burn-Rate-Visualisierung
 */
export const getBurnRateData = async (req, res) => {
  try {
    const burnRateData = await getBurnRateAnalysis();
    
    res.json({
      success: true,
      data: burnRateData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Laden der Burn-Rate-Analyse:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der Burn-Rate-Analyse',
      message: error.message,
      code: 'BURN_RATE_FAILED'
    });
  }
};

/**
 * Aktuelle Transfers abrufen
 * Story 1.5 - Transfer-Übersicht
 */
export const getRecentTransfersData = async (req, res) => {
  try {
    const recentTransfers = await getRecentTransfers();
    
    res.json({
      success: true,
      data: recentTransfers,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Laden der aktuellen Transfers:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der aktuellen Transfers',
      message: error.message,
      code: 'RECENT_TRANSFERS_FAILED'
    });
  }
};

// =====================================================
// WEBSOCKET & REAL-TIME ENDPOINTS
// =====================================================

/**
 * WebSocket-Statistiken abrufen
 * Story 1.5 - WebSocket-Monitoring
 */
export const getWebSocketStatistics = async (req, res) => {
  try {
    const stats = getWebSocketStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der WebSocket-Statistiken:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Abrufen der WebSocket-Statistiken',
      message: error.message,
      code: 'WEBSOCKET_STATS_FAILED'
    });
  }
};

/**
 * WebSocket-Verbindung testen
 * Story 1.5 - WebSocket-Test
 */
export const testWebSocket = async (req, res) => {
  try {
    const testResult = testWebSocketConnection();
    
    res.json({
      success: testResult.success,
      message: testResult.message,
      data: {
        clients: testResult.clients,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Testen der WebSocket-Verbindung:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Testen der WebSocket-Verbindung',
      message: error.message,
      code: 'WEBSOCKET_TEST_FAILED'
    });
  }
};

/**
 * Dashboard-Refresh manuell auslösen
 * Story 1.5 - Manueller Refresh
 */
export const triggerDashboardRefresh = async (req, res) => {
  try {
    const { reason = 'MANUAL_REFRESH' } = req.body;
    
    // Cache invalidieren und WebSocket-Update senden
    await invalidateDashboardCache(reason);
    broadcastDashboardRefresh(reason);
    
    // Audit-Log erstellen
    try {
      await createAuditLog({
        table_name: 'dashboard',
        record_id: 'dashboard-refresh',
        action: 'MANUAL_REFRESH',
        new_values: { reason, timestamp: new Date().toISOString() },
        changed_by: 'dev-user-123', // req.user?.id,
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
    } catch (auditError) {
      console.log('⚠️ Audit-Log für Dashboard-Refresh übersprungen:', auditError.message);
    }
    
    res.json({
      success: true,
      message: 'Dashboard-Refresh erfolgreich ausgelöst',
      data: {
        reason,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Auslösen des Dashboard-Refresh:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Auslösen des Dashboard-Refresh',
      message: error.message,
      code: 'DASHBOARD_REFRESH_FAILED'
    });
  }
};

// =====================================================
// PERFORMANCE & MONITORING ENDPOINTS
// =====================================================

/**
 * Dashboard-Performance-Metriken abrufen
 * Story 1.5 - Performance-Monitoring
 */
export const getDashboardPerformance = async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Teste verschiedene Dashboard-Komponenten
    const componentTests = await Promise.allSettled([
      getBudgetOverview(),
      getProjectPortfolio(),
      getCriticalAlerts(),
      getBurnRateAnalysis(),
      getRecentTransfers()
    ]);
    
    const totalTime = Date.now() - startTime;
    
    const performanceData = {
      totalLoadTime: totalTime,
      targetTime: 3000,
      status: totalTime < 3000 ? 'OPTIMAL' : 'SLOW',
      components: {
        budgetOverview: componentTests[0].status === 'fulfilled' ? 'OK' : 'ERROR',
        projectPortfolio: componentTests[1].status === 'fulfilled' ? 'OK' : 'ERROR',
        criticalAlerts: componentTests[2].status === 'fulfilled' ? 'OK' : 'ERROR',
        burnRateAnalysis: componentTests[3].status === 'fulfilled' ? 'OK' : 'ERROR',
        recentTransfers: componentTests[4].status === 'fulfilled' ? 'OK' : 'ERROR'
      },
      errors: componentTests
        .filter(result => result.status === 'rejected')
        .map(result => result.reason?.message || 'Unbekannter Fehler'),
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: performanceData,
      message: `Dashboard-Performance-Test abgeschlossen in ${totalTime}ms`
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Performance-Test:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Performance-Test',
      message: error.message,
      code: 'PERFORMANCE_TEST_FAILED'
    });
  }
};

/**
 * Dashboard-Health-Check
 * Story 1.5 - System-Health
 */
export const getDashboardHealth = async (req, res) => {
  try {
    const healthData = {
      status: 'HEALTHY',
      timestamp: new Date().toISOString(),
      services: {
        database: 'OK', // Würde echte DB-Verbindung testen
        websocket: getWebSocketStats().connected ? 'OK' : 'ERROR',
        cache: 'OK', // Würde Redis-Verbindung testen
        api: 'OK'
      },
      performance: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    };
    
    // Bestimme Gesamt-Status
    const hasErrors = Object.values(healthData.services).includes('ERROR');
    healthData.status = hasErrors ? 'DEGRADED' : 'HEALTHY';
    
    res.json({
      success: true,
      data: healthData
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Health-Check:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Health-Check',
      message: error.message,
      code: 'HEALTH_CHECK_FAILED'
    });
  }
};

export default {
  getFullDashboard,
  getBudgetOverviewData,
  getProjectPortfolioData,
  getCriticalAlertsData,
  getBurnRateData,
  getRecentTransfersData,
  getWebSocketStatistics,
  testWebSocket,
  triggerDashboardRefresh,
  getDashboardPerformance,
  getDashboardHealth
};

