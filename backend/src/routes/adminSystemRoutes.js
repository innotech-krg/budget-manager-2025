// =====================================================
// Budget Manager 2025 - Admin System Management Routes
// Epic 8 - Story 8.6: System-Prompt-Editor + API Keys + Logs
// =====================================================

import express from 'express';
import { requireAuth, requireSuperAdmin } from '../middleware/authMiddleware.js';
import { supabaseAdmin } from '../config/database.js';
import crypto from 'crypto';

const router = express.Router();

// =====================================================
// MIDDLEWARE - Alle Routen erfordern SuperAdmin
// =====================================================
router.use(requireAuth);
router.use(requireSuperAdmin);

// =====================================================
// SYSTEM PROMPTS MANAGEMENT
// =====================================================

/**
 * GET /api/admin/system/prompts
 * Alle System-Prompts auflisten
 */
router.get('/prompts', async (req, res) => {
  try {
    console.log('📥 [Admin] GET /api/admin/system/prompts - System-Prompts auflisten');

    const { data: prompts, error } = await supabaseAdmin
      .from('system_prompts')
      .select(`
        id,
        name,
        description,
        category,
        provider,
        model,
        version,
        is_active,
        is_default,
        created_at,
        updated_at
      `)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ [Admin] Fehler beim Laden der System-Prompts:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der System-Prompts',
        code: 'DATABASE_ERROR'
      });
    }

    console.log(`✅ [Admin] ${prompts.length} System-Prompts geladen`);

    res.json({
      success: true,
      data: prompts,
      count: prompts.length
    });

  } catch (error) {
    console.error('❌ [Admin] Fehler beim Laden der System-Prompts:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Server-Fehler',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/admin/system/prompts/:id
 * Einzelnen System-Prompt mit vollständigem Text laden
 */
router.get('/prompts/:id', async (req, res) => {
  try {
    console.log(`📥 [Admin] GET /api/admin/system/prompts/${req.params.id} - System-Prompt laden`);

    const { data: prompt, error } = await supabaseAdmin
      .from('system_prompts')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !prompt) {
      return res.status(404).json({
        success: false,
        error: 'System-Prompt nicht gefunden',
        code: 'PROMPT_NOT_FOUND'
      });
    }

    // Versionshistorie laden
    const { data: versions, error: versionsError } = await supabaseAdmin
      .from('system_prompt_versions')
      .select('*')
      .eq('prompt_id', req.params.id)
      .order('version_number', { ascending: false });

    if (versionsError) {
      console.error('❌ [Admin] Fehler beim Laden der Versionshistorie:', versionsError);
    }

    console.log(`✅ [Admin] System-Prompt geladen: ${prompt.name}`);

    res.json({
      success: true,
      data: {
        ...prompt,
        versions: versions || []
      }
    });

  } catch (error) {
    console.error('❌ [Admin] Fehler beim Laden des System-Prompts:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Server-Fehler',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * PUT /api/admin/system/prompts/:id
 * System-Prompt aktualisieren
 */
router.put('/prompts/:id', async (req, res) => {
  try {
    console.log(`📥 [Admin] PUT /api/admin/system/prompts/${req.params.id} - System-Prompt aktualisieren`);

    const { prompt_text, description, parameters, change_description } = req.body;

    if (!prompt_text) {
      return res.status(400).json({
        success: false,
        error: 'Prompt-Text ist erforderlich',
        code: 'VALIDATION_ERROR'
      });
    }

    // Neue Version erstellen (über Stored Function)
    const { data: versionResult, error: versionError } = await supabaseAdmin
      .rpc('create_prompt_version', {
        p_prompt_id: req.params.id,
        p_prompt_text: prompt_text,
        p_parameters: parameters || {},
        p_change_description: change_description,
        p_user_id: req.user.id
      });

    if (versionError) {
      console.error('❌ [Admin] Fehler beim Erstellen der Prompt-Version:', versionError);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Aktualisieren des System-Prompts',
        code: 'UPDATE_ERROR'
      });
    }

    // Optional: Beschreibung aktualisieren
    if (description !== undefined) {
      await supabaseAdmin
        .from('system_prompts')
        .update({ description })
        .eq('id', req.params.id);
    }

    console.log(`✅ [Admin] System-Prompt aktualisiert: ${req.params.id}`);

    res.json({
      success: true,
      message: 'System-Prompt erfolgreich aktualisiert',
      data: { version_id: versionResult }
    });

  } catch (error) {
    console.error('❌ [Admin] Fehler beim Aktualisieren des System-Prompts:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Server-Fehler',
      code: 'INTERNAL_ERROR'
    });
  }
});

// =====================================================
// AI PROVIDERS MANAGEMENT
// =====================================================

/**
 * GET /api/admin/system/ai-providers
 * AI-Provider auflisten
 */
router.get('/ai-providers', async (req, res) => {
  try {
    console.log('📥 [Admin] GET /api/admin/system/ai-providers - AI-Provider auflisten');

    const { data: providers, error } = await supabaseAdmin
      .from('ai_providers')
      .select(`
        id,
        name,
        display_name,
        is_active,
        base_url,
        default_model,
        rate_limit_per_minute,
        cost_per_1k_tokens,
        last_used_at,
        created_at,
        updated_at
      `)
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ [Admin] Fehler beim Laden der AI-Provider:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der AI-Provider',
        code: 'DATABASE_ERROR'
      });
    }

    console.log(`✅ [Admin] ${providers.length} AI-Provider geladen`);

    res.json({
      success: true,
      data: providers,
      count: providers.length
    });

  } catch (error) {
    console.error('❌ [Admin] Fehler beim Laden der AI-Provider:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Server-Fehler',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * PUT /api/admin/system/ai-providers/:id
 * AI-Provider konfigurieren
 */
router.put('/ai-providers/:id', async (req, res) => {
  try {
    console.log(`📥 [Admin] PUT /api/admin/system/ai-providers/${req.params.id} - AI-Provider konfigurieren`);

    const { is_active, default_model, rate_limit_per_minute, cost_per_1k_tokens, configuration } = req.body;

    const updateData = {};
    if (is_active !== undefined) updateData.is_active = is_active;
    if (default_model !== undefined) updateData.default_model = default_model;
    if (rate_limit_per_minute !== undefined) updateData.rate_limit_per_minute = rate_limit_per_minute;
    if (cost_per_1k_tokens !== undefined) updateData.cost_per_1k_tokens = cost_per_1k_tokens;
    if (configuration !== undefined) updateData.configuration = configuration;
    updateData.updated_at = new Date().toISOString();

    const { data: provider, error } = await supabaseAdmin
      .from('ai_providers')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('❌ [Admin] Fehler beim Aktualisieren des AI-Providers:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Aktualisieren des AI-Providers',
        code: 'UPDATE_ERROR'
      });
    }

    console.log(`✅ [Admin] AI-Provider aktualisiert: ${provider.name}`);

    res.json({
      success: true,
      message: 'AI-Provider erfolgreich aktualisiert',
      data: provider
    });

  } catch (error) {
    console.error('❌ [Admin] Fehler beim Aktualisieren des AI-Providers:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Server-Fehler',
      code: 'INTERNAL_ERROR'
    });
  }
});

// =====================================================
// API KEYS MANAGEMENT
// =====================================================

/**
 * GET /api/admin/system/api-keys
 * API-Keys auflisten (ohne Werte)
 */
router.get('/api-keys', async (req, res) => {
  try {
    console.log('📥 [Admin] GET /api/admin/system/api-keys - API-Keys auflisten');

    const { data: apiKeys, error } = await supabaseAdmin
      .from('api_keys')
      .select(`
        id,
        service_name,
        key_name,
        description,
        is_active,
        expires_at,
        last_used_at,
        usage_count,
        created_at
      `)
      .order('service_name', { ascending: true })
      .order('key_name', { ascending: true });

    if (error) {
      console.error('❌ [Admin] Fehler beim Laden der API-Keys:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der API-Keys',
        code: 'DATABASE_ERROR'
      });
    }

    console.log(`✅ [Admin] ${apiKeys.length} API-Keys geladen`);

    res.json({
      success: true,
      data: apiKeys,
      count: apiKeys.length
    });

  } catch (error) {
    console.error('❌ [Admin] Fehler beim Laden der API-Keys:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Server-Fehler',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/admin/system/api-keys
 * Neuen API-Key erstellen
 */
router.post('/api-keys', async (req, res) => {
  try {
    console.log('📥 [Admin] POST /api/admin/system/api-keys - Neuen API-Key erstellen');

    const { service_name, key_name, key_value, description, expires_at } = req.body;

    if (!service_name || !key_name || !key_value) {
      return res.status(400).json({
        success: false,
        error: 'Service-Name, Key-Name und Key-Wert sind erforderlich',
        code: 'VALIDATION_ERROR'
      });
    }

    // Einfache Verschlüsselung (in Produktion sollte robustere Verschlüsselung verwendet werden)
    const encryptedKey = Buffer.from(key_value).toString('base64');

    const { data: apiKey, error } = await supabaseAdmin
      .from('api_keys')
      .insert({
        service_name,
        key_name,
        key_value_encrypted: encryptedKey,
        description,
        expires_at,
        created_by: req.user.id
      })
      .select(`
        id,
        service_name,
        key_name,
        description,
        is_active,
        expires_at,
        created_at
      `)
      .single();

    if (error) {
      console.error('❌ [Admin] Fehler beim Erstellen des API-Keys:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Erstellen des API-Keys',
        code: 'CREATION_ERROR'
      });
    }

    console.log(`✅ [Admin] API-Key erstellt: ${service_name}/${key_name}`);

    res.status(201).json({
      success: true,
      message: 'API-Key erfolgreich erstellt',
      data: apiKey
    });

  } catch (error) {
    console.error('❌ [Admin] Fehler beim Erstellen des API-Keys:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Server-Fehler',
      code: 'INTERNAL_ERROR'
    });
  }
});

// =====================================================
// SYSTEM LOGS VIEWER
// =====================================================

/**
 * GET /api/admin/system/logs
 * System-Logs auflisten mit Filterung
 */
router.get('/logs', async (req, res) => {
  try {
    console.log('📥 [Admin] GET /api/admin/system/logs - System-Logs auflisten');

    const { 
      level, 
      category, 
      limit = 100, 
      offset = 0,
      start_date,
      end_date 
    } = req.query;

    let query = supabaseAdmin
      .from('system_logs')
      .select(`
        id,
        level,
        category,
        message,
        details,
        user_id,
        ip_address,
        created_at
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter anwenden
    if (level) {
      query = query.eq('level', level);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('❌ [Admin] Fehler beim Laden der System-Logs:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der System-Logs',
        code: 'DATABASE_ERROR'
      });
    }

    // Gesamtanzahl für Pagination
    let countQuery = supabaseAdmin
      .from('system_logs')
      .select('id', { count: 'exact', head: true });

    if (level) countQuery = countQuery.eq('level', level);
    if (category) countQuery = countQuery.eq('category', category);
    if (start_date) countQuery = countQuery.gte('created_at', start_date);
    if (end_date) countQuery = countQuery.lte('created_at', end_date);

    const { count, error: countError } = await countQuery;

    console.log(`✅ [Admin] ${logs.length} System-Logs geladen (${count} gesamt)`);

    res.json({
      success: true,
      data: logs,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: count || 0,
        hasMore: (parseInt(offset) + logs.length) < (count || 0)
      }
    });

  } catch (error) {
    console.error('❌ [Admin] Fehler beim Laden der System-Logs:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Server-Fehler',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/admin/system/logs/categories
 * Verfügbare Log-Kategorien auflisten
 */
router.get('/logs/categories', async (req, res) => {
  try {
    console.log('📥 [Admin] GET /api/admin/system/logs/categories - Log-Kategorien auflisten');

    const { data: categories, error } = await supabaseAdmin
      .from('system_logs')
      .select('category')
      .order('category', { ascending: true });

    if (error) {
      console.error('❌ [Admin] Fehler beim Laden der Log-Kategorien:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Log-Kategorien',
        code: 'DATABASE_ERROR'
      });
    }

    // Unique Kategorien extrahieren
    const uniqueCategories = [...new Set(categories.map(c => c.category))];

    console.log(`✅ [Admin] ${uniqueCategories.length} Log-Kategorien geladen`);

    res.json({
      success: true,
      data: uniqueCategories
    });

  } catch (error) {
    console.error('❌ [Admin] Fehler beim Laden der Log-Kategorien:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Server-Fehler',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;






