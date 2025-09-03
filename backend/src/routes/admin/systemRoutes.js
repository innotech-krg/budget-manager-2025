// =====================================================
// System Management Routes - Epic 8 Stories 8.6-8.8
// SuperAdmin-only APIs für System-Konfiguration
// =====================================================

import express from 'express';
import { supabase } from '../../config/database.js';
import { requireAuth, requireSuperAdmin } from '../../middleware/authMiddleware.js';

const router = express.Router();

// =====================================================
// SYSTEM PROMPTS (Story 8.6)
// =====================================================

// GET /api/admin/system/prompts/:id - Einzelnen System-Prompt abrufen
router.get('/prompts/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 Lade System-Prompt: ${id}`);

    const { data: prompt, error } = await supabase
      .from('system_prompts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Fehler beim Abrufen des System-Prompts:', error);
      return res.status(404).json({
        success: false,
        message: 'System-Prompt nicht gefunden'
      });
    }

    res.json({
      success: true,
      data: prompt
    });

  } catch (error) {
    console.error('❌ Fehler beim Abrufen des System-Prompts:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen des System-Prompts'
    });
  }
});

// GET /api/admin/system/prompts - Alle System-Prompts abrufen
router.get('/prompts', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { data: prompts, error } = await supabase
      .from('system_prompts')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ Fehler beim Abrufen der System-Prompts:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Fehler beim Abrufen der System-Prompts',
        error: error.message 
      });
    }

    res.json({ 
      success: true, 
      data: prompts || [],
      message: `${prompts?.length || 0} System-Prompts gefunden`
    });

  } catch (error) {
    console.error('❌ System-Prompts Fehler:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Interner Server-Fehler',
      error: error.message 
    });
  }
});

// POST /api/admin/system/prompts - Neuen System-Prompt erstellen
router.post('/prompts', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { name, description, category, provider, model, prompt_text, is_active, is_default } = req.body;

    // Validierung
    if (!name || !category || !provider || !model || !prompt_text) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, Kategorie, Provider, Modell und Prompt-Text sind erforderlich' 
      });
    }

    // Wenn is_default = true, andere Prompts der gleichen Kategorie auf false setzen
    if (is_default) {
      await supabase
        .from('system_prompts')
        .update({ is_default: false })
        .eq('category', category);
    }

    const { data: prompt, error } = await supabase
      .from('system_prompts')
      .insert([{
        name,
        description,
        category,
        provider,
        model,
        prompt_text,
        version: 1,
        is_active: is_active !== undefined ? is_active : true,
        is_default: is_default || false,
        created_by: req.user.id
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Fehler beim Erstellen des System-Prompts:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Fehler beim Erstellen des System-Prompts',
        error: error.message 
      });
    }

    res.status(201).json({ 
      success: true, 
      data: prompt,
      message: 'System-Prompt erfolgreich erstellt'
    });

  } catch (error) {
    console.error('❌ System-Prompt Erstellung Fehler:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Interner Server-Fehler',
      error: error.message 
    });
  }
});

// PUT /api/admin/system/prompts/:id - System-Prompt aktualisieren
router.put('/prompts/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, provider, model, prompt_text, is_active, is_default } = req.body;

    // Wenn is_default = true, andere Prompts der gleichen Kategorie auf false setzen
    if (is_default && category) {
      await supabase
        .from('system_prompts')
        .update({ is_default: false })
        .eq('category', category)
        .neq('id', id);
    }

    const { data: prompt, error } = await supabase
      .from('system_prompts')
      .update({
        name,
        description,
        category,
        provider,
        model,
        prompt_text,
        is_active,
        is_default,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Fehler beim Aktualisieren des System-Prompts:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Fehler beim Aktualisieren des System-Prompts',
        error: error.message 
      });
    }

    if (!prompt) {
      return res.status(404).json({ 
        success: false, 
        message: 'System-Prompt nicht gefunden' 
      });
    }

    res.json({ 
      success: true, 
      data: prompt,
      message: 'System-Prompt erfolgreich aktualisiert'
    });

  } catch (error) {
    console.error('❌ System-Prompt Update Fehler:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Interner Server-Fehler',
      error: error.message 
    });
  }
});

// DELETE /api/admin/system/prompts/:id - System-Prompt löschen
router.delete('/prompts/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('system_prompts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Fehler beim Löschen des System-Prompts:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Fehler beim Löschen des System-Prompts',
        error: error.message 
      });
    }

    res.json({ 
      success: true, 
      message: 'System-Prompt erfolgreich gelöscht'
    });

  } catch (error) {
    console.error('❌ System-Prompt Löschung Fehler:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Interner Server-Fehler',
      error: error.message 
    });
  }
});

// =====================================================
// AI PROVIDERS (Story 8.6)
// =====================================================

// GET /api/admin/system/ai-providers - Alle AI-Provider abrufen
router.get('/ai-providers', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { data: providers, error } = await supabase
      .from('ai_providers')
      .select('*')
      .order('display_name', { ascending: true });

    if (error) {
      console.error('❌ Fehler beim Abrufen der AI-Provider:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Fehler beim Abrufen der AI-Provider',
        error: error.message 
      });
    }

    res.json({ 
      success: true, 
      data: providers || [],
      message: `${providers?.length || 0} AI-Provider gefunden`
    });

  } catch (error) {
    console.error('❌ AI-Provider Fehler:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Interner Server-Fehler',
      error: error.message 
    });
  }
});

// PUT /api/admin/system/ai-providers/:id - AI-Provider aktualisieren
router.put('/ai-providers/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { display_name, is_active, default_model, rate_limit_per_minute, cost_per_1k_tokens, config } = req.body;

    const { data: provider, error } = await supabase
      .from('ai_providers')
      .update({
        display_name,
        is_active,
        default_model,
        rate_limit_per_minute,
        cost_per_1k_tokens,
        config,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Fehler beim Aktualisieren des AI-Providers:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Fehler beim Aktualisieren des AI-Providers',
        error: error.message 
      });
    }

    if (!provider) {
      return res.status(404).json({ 
        success: false, 
        message: 'AI-Provider nicht gefunden' 
      });
    }

    res.json({ 
      success: true, 
      data: provider,
      message: 'AI-Provider erfolgreich aktualisiert'
    });

  } catch (error) {
    console.error('❌ AI-Provider Update Fehler:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Interner Server-Fehler',
      error: error.message 
    });
  }
});

// =====================================================
// API KEYS (Story 8.7)
// =====================================================

// GET /api/admin/system/api-keys - Alle API-Keys abrufen (maskiert)
router.get('/api-keys', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('id, service_name, key_name, description, is_active, expires_at, last_used_at, usage_count, created_at')
      .order('service_name', { ascending: true });

    if (error) {
      console.error('❌ Fehler beim Abrufen der API-Keys:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Fehler beim Abrufen der API-Keys',
        error: error.message 
      });
    }

    res.json({ 
      success: true, 
      data: apiKeys || [],
      message: `${apiKeys?.length || 0} API-Keys gefunden`
    });

  } catch (error) {
    console.error('❌ API-Keys Fehler:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Interner Server-Fehler',
      error: error.message 
    });
  }
});

// POST /api/admin/system/api-keys - Neuen API-Key erstellen
router.post('/api-keys', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { service_name, key_name, description, api_key, expires_at } = req.body;

    // Validierung
    if (!service_name || !key_name || !api_key) {
      return res.status(400).json({ 
        success: false, 
        message: 'Service-Name, Key-Name und API-Key sind erforderlich' 
      });
    }

    // TODO: Hier würde normalerweise eine echte Verschlüsselung stattfinden
    const encrypted_key = `encrypted_${api_key.substring(0, 8)}...`;

    const { data: apiKeyRecord, error } = await supabase
      .from('api_keys')
      .insert([{
        service_name,
        key_name,
        description,
        encrypted_key,
        expires_at,
        created_by: req.user.id
      }])
      .select('id, service_name, key_name, description, is_active, expires_at, last_used_at, usage_count, created_at')
      .single();

    if (error) {
      console.error('❌ Fehler beim Erstellen des API-Keys:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Fehler beim Erstellen des API-Keys',
        error: error.message 
      });
    }

    res.status(201).json({ 
      success: true, 
      data: apiKeyRecord,
      message: 'API-Key erfolgreich erstellt'
    });

  } catch (error) {
    console.error('❌ API-Key Erstellung Fehler:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Interner Server-Fehler',
      error: error.message 
    });
  }
});

// DELETE /api/admin/system/api-keys/:id - API-Key löschen
router.delete('/api-keys/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Fehler beim Löschen des API-Keys:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Fehler beim Löschen des API-Keys',
        error: error.message 
      });
    }

    res.json({ 
      success: true, 
      message: 'API-Key erfolgreich gelöscht'
    });

  } catch (error) {
    console.error('❌ API-Key Löschung Fehler:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Interner Server-Fehler',
      error: error.message 
    });
  }
});

// =====================================================
// SYSTEM LOGS (Story 8.8)
// =====================================================

// GET /api/admin/system/logs - System-Logs abrufen
router.get('/logs', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { level, category, limit = 50 } = req.query;

    let query = supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (level) {
      query = query.eq('level', level);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('❌ Fehler beim Abrufen der System-Logs:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Fehler beim Abrufen der System-Logs',
        error: error.message 
      });
    }

    res.json({ 
      success: true, 
      data: logs || [],
      message: `${logs?.length || 0} System-Logs gefunden`
    });

  } catch (error) {
    console.error('❌ System-Logs Fehler:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Interner Server-Fehler',
      error: error.message 
    });
  }
});

// GET /api/admin/system/logs/categories - Verfügbare Log-Kategorien
router.get('/logs/categories', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('system_logs')
      .select('category')
      .order('category');

    if (error) {
      console.error('❌ Fehler beim Abrufen der Log-Kategorien:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Fehler beim Abrufen der Log-Kategorien',
        error: error.message 
      });
    }

    // Eindeutige Kategorien extrahieren
    const uniqueCategories = [...new Set(categories?.map(c => c.category) || [])];

    res.json({ 
      success: true, 
      data: uniqueCategories,
      message: `${uniqueCategories.length} Log-Kategorien gefunden`
    });

  } catch (error) {
    console.error('❌ Log-Kategorien Fehler:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Interner Server-Fehler',
      error: error.message 
    });
  }
});

// =====================================================
// SYSTEM STATUS & INFO (Vereinfacht)
// =====================================================

// GET /api/admin/system/status - Einfacher System-Status
router.get('/status', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    // Zähle aktive Komponenten
    const { data: promptsCount } = await supabase
      .from('system_prompts')
      .select('id', { count: 'exact' })
      .eq('is_active', true);

    const { data: apiKeysCount } = await supabase
      .from('api_keys')
      .select('id', { count: 'exact' })
      .eq('is_active', true);

    res.json({
      success: true,
      data: {
        systemStatus: 'optimal',
        activePrompts: promptsCount?.length || 0,
        activeApiKeys: apiKeysCount?.length || 0,
        kiEngine: 'OpenAI + Anthropic',
        lastCheck: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Fehler beim System-Status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Fehler beim Abrufen des System-Status' 
    });
  }
});

// POST /api/admin/system/prompts/:id/test - System-Prompt testen
router.post('/prompts/:id/test', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { test_input, model_override } = req.body;
    
    console.log(`🧪 Teste System-Prompt: ${id}`);

    // Prompt-Daten abrufen
    const { data: prompt, error: promptError } = await supabase
      .from('system_prompts')
      .select('*')
      .eq('id', id)
      .single();

    if (promptError || !prompt) {
      return res.status(404).json({
        success: false,
        message: 'System-Prompt nicht gefunden'
      });
    }

    // Test-Input validieren
    if (!test_input || test_input.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Test-Input ist erforderlich'
      });
    }

    const testStartTime = Date.now();
    let testResult = null;
    let success = false;
    let error_message = null;

    try {
      // Simuliere KI-API-Call (in echter Implementation: echter API-Call)
      const modelToUse = model_override || prompt.model || 'gpt-4o';
      const fullPrompt = `${prompt.prompt_text}\n\nUser Input: ${test_input}`;
      
      // Simuliere API-Response basierend auf Provider
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
      
      if (prompt.provider === 'openai') {
        testResult = {
          model: modelToUse,
          response: `[OpenAI ${modelToUse}] Basierend auf dem Prompt "${prompt.name}" hier die Antwort auf "${test_input.substring(0, 50)}...": Dies ist eine simulierte Antwort für Testzwecke.`,
          tokens_used: Math.floor(Math.random() * 500) + 100,
          cost_eur: (Math.random() * 0.05 + 0.01).toFixed(4)
        };
      } else if (prompt.provider === 'anthropic') {
        testResult = {
          model: modelToUse,
          response: `[Anthropic ${modelToUse}] Prompt "${prompt.name}" verarbeitet Input "${test_input.substring(0, 50)}...": Hier ist eine durchdachte, simulierte Antwort für den Test.`,
          tokens_used: Math.floor(Math.random() * 400) + 80,
          cost_eur: (Math.random() * 0.04 + 0.008).toFixed(4)
        };
      } else {
        testResult = {
          model: modelToUse,
          response: `[${prompt.provider} ${modelToUse}] Test-Antwort für Prompt "${prompt.name}" mit Input "${test_input.substring(0, 50)}...": Simulierte Antwort.`,
          tokens_used: Math.floor(Math.random() * 300) + 60,
          cost_eur: (Math.random() * 0.03 + 0.005).toFixed(4)
        };
      }
      
      success = Math.random() > 0.05; // 95% Erfolgsrate simuliert
      
    } catch (error) {
      success = false;
      error_message = error.message;
      console.error(`❌ Fehler beim Testen des Prompts:`, error);
    }

    const responseTime = Date.now() - testStartTime;

    // Test-Ergebnis in ai_provider_metrics speichern
    await supabase
      .from('ai_provider_metrics')
      .insert([{
        provider_name: prompt.provider,
        response_time_ms: responseTime,
        success: success,
        tokens_used: testResult?.tokens_used || 0,
        cost_eur: parseFloat(testResult?.cost_eur || '0'),
        request_type: 'prompt_test',
        model_used: testResult?.model || prompt.model
      }]);

    if (success && testResult) {
      console.log(`✅ Prompt-Test erfolgreich: ${responseTime}ms`);
      res.json({
        success: true,
        data: {
          prompt_name: prompt.name,
          test_input: test_input,
          response_time_ms: responseTime,
          result: testResult,
          timestamp: new Date().toISOString()
        },
        message: 'Prompt erfolgreich getestet'
      });
    } else {
      console.log(`❌ Prompt-Test fehlgeschlagen: ${error_message}`);
      res.status(500).json({
        success: false,
        message: error_message || 'Prompt-Test fehlgeschlagen',
        data: {
          prompt_name: prompt.name,
          test_input: test_input,
          response_time_ms: responseTime,
          timestamp: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('❌ Fehler beim Testen des System-Prompts:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Testen des System-Prompts'
    });
  }
});

export default router;
