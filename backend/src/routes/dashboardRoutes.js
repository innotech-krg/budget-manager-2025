// =====================================================
// Budget Manager 2025 - Dashboard Routes
// Story 1.5: Echtzeit-Budget-Dashboard - API Routes
// =====================================================

import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticateUser } from '../middleware/auth.js';
import { rateLimitGeneral as rateLimiter } from '../middleware/rateLimiter.js';
import {
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
} from '../controllers/dashboardController.js';

const router = express.Router();

// Middleware für alle Routes
router.use(authenticateUser);
router.use(rateLimiter);

// =====================================================
// DASHBOARD DATA ROUTES
// =====================================================

/**
 * GET /api/dashboard
 * Vollständige Dashboard-Daten abrufen
 * Story 1.5 - Echtzeit-Dashboard
 */
router.get('/', validateRequest, getFullDashboard);

/**
 * GET /api/dashboard/budget-overview
 * Budget-Übersicht abrufen
 * Story 1.5 - Budget-Overview
 */
router.get('/budget-overview', validateRequest, getBudgetOverviewData);

/**
 * GET /api/dashboard/project-portfolio
 * Projekt-Portfolio mit Budget-Ampeln abrufen
 * Story 1.5 - Projekt-Portfolio
 */
router.get('/project-portfolio', validateRequest, getProjectPortfolioData);

/**
 * GET /api/dashboard/critical-alerts
 * Kritische Warnungen und Alerts abrufen
 * Story 1.5 - Budget-Warnungen
 */
router.get('/critical-alerts', validateRequest, getCriticalAlertsData);

/**
 * GET /api/dashboard/burn-rate
 * Burn-Rate-Analyse mit Trend-Visualisierung abrufen
 * Story 1.5 - Burn-Rate-Visualisierung
 */
router.get('/burn-rate', validateRequest, getBurnRateData);

/**
 * GET /api/dashboard/recent-transfers
 * Aktuelle Transfer-Aktivitäten abrufen
 * Story 1.5 - Transfer-Übersicht
 */
router.get('/recent-transfers', validateRequest, getRecentTransfersData);

// =====================================================
// WEBSOCKET & REAL-TIME ROUTES
// =====================================================

/**
 * GET /api/dashboard/websocket/stats
 * WebSocket-Statistiken abrufen
 * Story 1.5 - WebSocket-Monitoring
 */
router.get('/websocket/stats', validateRequest, getWebSocketStatistics);

/**
 * POST /api/dashboard/websocket/test
 * WebSocket-Verbindung testen
 * Story 1.5 - WebSocket-Test
 */
router.post('/websocket/test', validateRequest, testWebSocket);

/**
 * POST /api/dashboard/refresh
 * Dashboard-Refresh manuell auslösen
 * Story 1.5 - Manueller Refresh
 */
router.post(
  '/refresh',
  [
    body('reason')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Grund darf maximal 100 Zeichen lang sein'),
    // Validation error handler
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validierungsfehler',
          message: 'Die übermittelten Daten sind ungültig',
          code: 'VALIDATION_ERROR',
          details: errors.array().map(error => ({
            field: error.param,
            message: error.msg,
            value: error.value
          }))
        });
      }
      next();
    }
  ],
  triggerDashboardRefresh
);

// =====================================================
// PERFORMANCE & MONITORING ROUTES
// =====================================================

/**
 * GET /api/dashboard/performance
 * Dashboard-Performance-Metriken abrufen
 * Story 1.5 - Performance-Monitoring
 */
router.get('/performance', validateRequest, getDashboardPerformance);

/**
 * GET /api/dashboard/health
 * Dashboard-Health-Check
 * Story 1.5 - System-Health
 */
router.get('/health', validateRequest, getDashboardHealth);

// =====================================================
// UTILITY ROUTES
// =====================================================

/**
 * GET /api/dashboard/config
 * Dashboard-Konfiguration abrufen
 * Story 1.5 - Dashboard-Config
 */
router.get('/config', validateRequest, (req, res) => {
  try {
    const dashboardConfig = {
      refreshInterval: 30000, // 30 Sekunden
      performanceTarget: 3000, // 3 Sekunden
      maxAlerts: 10,
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        locale: 'de-DE',
        currency: 'EUR'
      },
      websocket: {
        enabled: true,
        url: process.env.WEBSOCKET_URL || 'ws://localhost:3001',
        reconnectInterval: 5000
      },
      features: {
        realTimeUpdates: true,
        burnRateAnalysis: true,
        criticalAlerts: true,
        projectPortfolio: true,
        budgetOverview: true
      },
      ui: {
        theme: 'light',
        language: 'de',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: 'HH:mm',
        numberFormat: 'de-DE'
      }
    };
    
    res.json({
      success: true,
      data: dashboardConfig,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Fehler beim Laden der Dashboard-Konfiguration',
      message: error.message,
      code: 'DASHBOARD_CONFIG_FAILED'
    });
  }
});

/**
 * GET /api/dashboard/export
 * Dashboard-Daten als CSV/JSON exportieren
 * Story 1.5 - Daten-Export
 */
router.get(
  '/export',
  [
    query('format')
      .optional()
      .isIn(['json', 'csv'])
      .withMessage('Format muss json oder csv sein'),
    
    query('components')
      .optional()
      .isString()
      .withMessage('Komponenten müssen als kommagetrennte Liste angegeben werden'),
    
    // Validation error handler
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validierungsfehler',
          message: 'Die übermittelten Daten sind ungültig',
          code: 'VALIDATION_ERROR',
          details: errors.array().map(error => ({
            field: error.param,
            message: error.msg,
            value: error.value
          }))
        });
      }
      next();
    }
  ],
  async (req, res) => {
    try {
      const { format = 'json', components = 'all' } = req.query;
      
      // Für Demo: Einfacher JSON-Export
      const exportData = {
        exportedAt: new Date().toISOString(),
        format,
        components: components.split(','),
        data: {
          message: 'Dashboard-Export noch nicht vollständig implementiert',
          note: 'Würde normalerweise alle Dashboard-Daten exportieren'
        }
      };
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=dashboard-export.csv');
        res.send('Export-Format,Zeitstempel\nCSV,2025-08-29T10:00:00Z\n');
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=dashboard-export.json');
        res.json(exportData);
      }
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Fehler beim Exportieren der Dashboard-Daten',
        message: error.message,
        code: 'DASHBOARD_EXPORT_FAILED'
      });
    }
  }
);

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 Handler für nicht existierende Dashboard-Routes
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Dashboard-Endpoint nicht gefunden',
    message: `Die Route ${req.method} ${req.originalUrl} existiert nicht.`,
    code: 'DASHBOARD_ROUTE_NOT_FOUND',
    availableRoutes: [
      'GET /api/dashboard',
      'GET /api/dashboard/budget-overview',
      'GET /api/dashboard/project-portfolio',
      'GET /api/dashboard/critical-alerts',
      'GET /api/dashboard/burn-rate',
      'GET /api/dashboard/recent-transfers',
      'GET /api/dashboard/websocket/stats',
      'POST /api/dashboard/websocket/test',
      'POST /api/dashboard/refresh',
      'GET /api/dashboard/performance',
      'GET /api/dashboard/health',
      'GET /api/dashboard/config',
      'GET /api/dashboard/export'
    ]
  });
});

export default router;
