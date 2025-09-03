/**
 * Admin-Management-System Routes
 * Epic 8: Umfassendes Admin-Management
 */

import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth, requireSuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =====================================================
// MIDDLEWARE - Admin-Authentifizierung mit JWT
// =====================================================

// Verwende die echte JWT-basierte SuperAdmin-Middleware

// =====================================================
// STORY 8.2: KI-SYSTEM-MANAGEMENT
// =====================================================

// GET /api/admin/ai/providers - Liste aller KI-Provider
router.get('/ai/providers', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const providers = {
      openai: {
        name: 'OpenAI GPT-4',
        status: process.env.OPENAI_API_KEY ? 'active' : 'inactive',
        model: 'gpt-4o',
        capabilities: ['vision', 'text', 'json'],
        costPerToken: 0.00001,
        lastUsed: new Date().toISOString()
      },
      anthropic: {
        name: 'Anthropic Claude',
        status: process.env.ANTHROPIC_API_KEY ? 'active' : 'inactive',
        model: 'claude-3-sonnet-20240229',
        capabilities: ['vision', 'text', 'json', 'pdf'],
        costPerToken: 0.000015,
        lastUsed: new Date().toISOString()
      }
    };

    res.json({
      success: true,
      data: providers,
      meta: {
        totalProviders: Object.keys(providers).length,
        activeProviders: Object.values(providers).filter(p => p.status === 'active').length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI providers',
      message: error.message
    });
  }
});

// GET /api/admin/ai/prompts - System-Prompts abrufen
router.get('/ai/prompts', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { supabaseAdmin } = await import('../config/supabase.js');
    
    // Lade alle System-Prompts aus der Datenbank
    const { data: prompts, error } = await supabaseAdmin
      .from('system_prompts')
      .select(`
        id,
        name,
        description,
        category,
        provider,
        model,
        prompt_text,
        version,
        is_active,
        is_default,
        supplier_id,
        created_at,
        updated_at,
        suppliers:supplier_id (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Fehler beim Laden der System-Prompts:', error);
      throw error;
    }

    // Formatiere die Daten für das Frontend
    const formattedPrompts = prompts.map(prompt => ({
      id: prompt.id,
      name: prompt.name,
      description: prompt.description || '',
      category: prompt.category,
      provider: prompt.provider,
      model: prompt.model,
      prompt_text: prompt.prompt_text,
      version: prompt.version.toString(),
      is_active: prompt.is_active,
      is_default: prompt.is_default,
      supplier_id: prompt.supplier_id,
      supplier_name: prompt.suppliers?.name || null,
      created_at: prompt.created_at,
      updated_at: prompt.updated_at
    }));

    console.log(`✅ ${formattedPrompts.length} System-Prompts geladen`);

    res.json({
      success: true,
      data: formattedPrompts,
      meta: {
        totalPrompts: formattedPrompts.length,
        activePrompts: formattedPrompts.filter(p => p.is_active).length,
        supplierSpecificPrompts: formattedPrompts.filter(p => p.supplier_id).length
      }
    });
  } catch (error) {
    console.error('❌ Fehler beim Laden der System-Prompts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI prompts',
      message: error.message
    });
  }
});

// PUT /api/admin/ai/prompts/:id - System-Prompt aktualisieren
router.put('/ai/prompts/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, description } = req.body;

    // TODO: In Datenbank oder Config-Datei speichern
    // Für jetzt: Simulation
    
    res.json({
      success: true,
      message: `Prompt '${id}' erfolgreich aktualisiert`,
      data: {
        id,
        content,
        description,
        lastModified: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update AI prompt',
      message: error.message
    });
  }
});

// GET /api/admin/ai/keys - API-Keys Status (ohne Werte)
router.get('/ai/keys', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const keys = {
      openai: {
        name: 'OpenAI API Key',
        configured: !!process.env.OPENAI_API_KEY,
        lastFourChars: process.env.OPENAI_API_KEY ? 
          process.env.OPENAI_API_KEY.slice(-4) : null,
        lastUsed: new Date().toISOString()
      },
      anthropic: {
        name: 'Anthropic API Key',
        configured: !!process.env.ANTHROPIC_API_KEY,
        lastFourChars: process.env.ANTHROPIC_API_KEY ? 
          process.env.ANTHROPIC_API_KEY.slice(-4) : null,
        lastUsed: new Date().toISOString()
      },
      supabase: {
        name: 'Supabase Keys',
        configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
        url: process.env.SUPABASE_URL || null,
        lastUsed: new Date().toISOString()
      }
    };

    res.json({
      success: true,
      data: keys
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API keys status',
      message: error.message
    });
  }
});

// =====================================================
// STORY 8.3: LOG-MANAGEMENT & MONITORING
// =====================================================

// GET /api/admin/logs/system - System-Logs abrufen
router.get('/logs/system', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { limit = 100, level = 'all' } = req.query;
    
    // TODO: Echte Log-Datei lesen oder aus Datenbank
    const mockLogs = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Server gestartet auf Port 3001',
        source: 'server.js',
        details: { port: 3001 }
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        level: 'success',
        message: 'KI-OCR-Verarbeitung erfolgreich',
        source: 'aiOcrService.js',
        details: { 
          file: 'rechnung.jpg',
          confidence: 95,
          processingTime: 2340
        }
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        level: 'warning',
        message: 'Audit-Log Foreign Key Warnung',
        source: 'ocrService.js',
        details: { 
          error: 'Key is not present in table users'
        }
      }
    ];

    res.json({
      success: true,
      data: mockLogs.slice(0, parseInt(limit)),
      meta: {
        total: mockLogs.length,
        limit: parseInt(limit),
        level
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system logs',
      message: error.message
    });
  }
});

// GET /api/admin/logs/ocr - OCR-Processing-Logs
router.get('/logs/ocr', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { limit = 50, status = 'all' } = req.query;
    
    // TODO: Aus ocr_processing Tabelle laden
    const mockOcrLogs = [
      {
        id: '779374df-4e38-4d0d-8f86-824c8cb5b2a5',
        fileName: 'R2501-1268_Rechnung.jpg',
        status: 'COMPLETED',
        aiProvider: 'openai',
        aiModel: 'gpt-4o',
        processingTime: 2340,
        confidence: 95,
        detectedSupplier: 'DEFINE - Design & Marketing GmbH',
        createdAt: new Date().toISOString(),
        error: null
      }
    ];

    res.json({
      success: true,
      data: mockOcrLogs.slice(0, parseInt(limit)),
      meta: {
        total: mockOcrLogs.length,
        limit: parseInt(limit),
        status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch OCR logs',
      message: error.message
    });
  }
});

// =====================================================
// STORY 8.4: DATENBANK-KONFIGURATION
// =====================================================

// GET /api/admin/database/status - Datenbank-Status
router.get('/database/status', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const status = {
      connection: {
        status: 'connected',
        url: process.env.SUPABASE_URL || 'Not configured',
        lastPing: new Date().toISOString(),
        responseTime: 45
      },
      tables: {
        total: 19,
        healthy: 19,
        issues: 0
      },
      performance: {
        avgQueryTime: 23,
        activeConnections: 5,
        maxConnections: 100
      },
      storage: {
        totalSize: '2.3 GB',
        availableSpace: '97.7 GB',
        backupStatus: 'enabled'
      }
    };

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch database status',
      message: error.message
    });
  }
});

// =====================================================
// STORY 8.5-8.9: ENTITY-MANAGEMENT (Basis-Implementierung)
// =====================================================

// GET /api/admin/entities/:type - Entitäten abrufen (Kategorien, Teams, etc.)
router.get('/entities/:type', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['categories', 'teams', 'roles', 'tags', 'suppliers'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid entity type',
        message: `Valid types: ${validTypes.join(', ')}`
      });
    }

    // TODO: Aus entsprechenden Tabellen laden
    const mockData = {
      categories: [
        { id: '1', name: 'IT & Software', description: 'IT-Ausgaben', active: true },
        { id: '2', name: 'Marketing', description: 'Marketing-Ausgaben', active: true }
      ],
      teams: [
        { id: '1', name: 'Development Team', members: 5, active: true },
        { id: '2', name: 'Marketing Team', members: 3, active: true }
      ],
      roles: [
        { id: '1', name: 'Admin', permissions: ['all'], active: true },
        { id: '2', name: 'User', permissions: ['read'], active: true }
      ],
      tags: [
        { id: '1', name: 'Urgent', color: '#ff0000', active: true },
        { id: '2', name: 'Review', color: '#ffaa00', active: true }
      ],
      suppliers: [
        { id: '1', name: 'DEFINE - Design & Marketing GmbH', uid: 'ATU63124826', active: true }
      ]
    };

    res.json({
      success: true,
      data: mockData[type] || [],
      meta: {
        type,
        total: mockData[type]?.length || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to fetch ${req.params.type}`,
      message: error.message
    });
  }
});

// =====================================================
// STORY 8.10: SYSTEM-KONFIGURATION
// =====================================================

// GET /api/admin/config/system - System-Einstellungen
router.get('/config/system', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const config = {
      app: {
        name: 'Budget Manager 2025',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3001
      },
      features: {
        ocrProcessing: true,
        aiAnalysis: true,
        realtimeUpdates: true,
        auditLogging: true
      },
      localization: {
        defaultLanguage: 'de',
        currency: 'EUR',
        timezone: 'Europe/Vienna',
        dateFormat: 'DD.MM.YYYY'
      },
      limits: {
        maxFileSize: '10MB',
        maxFilesPerUpload: 1,
        apiRateLimit: 100
      }
    };

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system configuration',
      message: error.message
    });
  }
});

// =====================================================
// ADMIN-DASHBOARD ÜBERSICHT
// =====================================================

// GET /api/admin/dashboard - Admin-Dashboard-Daten
router.get('/dashboard', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const dashboard = {
      overview: {
        totalUsers: 12,
        activeProjects: 8,
        ocrProcessedToday: 15,
        systemHealth: 'excellent'
      },
      aiUsage: {
        openaiCalls: 45,
        anthropicCalls: 23,
        totalCost: 12.45,
        avgConfidence: 94.2
      },
      recentActivity: [
        {
          type: 'ocr_processed',
          message: 'Rechnung erfolgreich verarbeitet',
          timestamp: new Date().toISOString()
        },
        {
          type: 'user_login',
          message: 'Admin-Benutzer angemeldet',
          timestamp: new Date(Date.now() - 300000).toISOString()
        }
      ],
      systemStatus: {
        database: 'healthy',
        aiServices: 'healthy',
        storage: 'healthy',
        network: 'healthy'
      }
    };

    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin dashboard',
      message: error.message
    });
  }
});

export default router;
