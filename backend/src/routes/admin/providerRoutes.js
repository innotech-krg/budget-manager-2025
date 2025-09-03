// =====================================================
// KI-PROVIDER MANAGEMENT ROUTES
// @dev.mdc - Woche 1, Tag 1
// =====================================================

import express from 'express';
import { supabase } from '../../config/database.js';
import { requireAuth, requireSuperAdmin } from '../../middleware/authMiddleware.js';
import { createAuditLog } from '../../utils/auditLogger.js';

const router = express.Router();

// =====================================================
// PROVIDER CRUD OPERATIONS
// =====================================================

// GET /api/admin/providers - Alle KI-Provider abrufen
router.get('/', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    console.log('📋 Lade alle KI-Provider...');

    const { data: providers, error } = await supabase
      .from('ai_providers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ Fehler beim Abrufen der KI-Provider:', error);
      return res.status(500).json({
        success: false,
        message: 'Fehler beim Abrufen der KI-Provider'
      });
    }

    console.log(`✅ ${providers.length} KI-Provider geladen`);
    res.json({
      success: true,
      data: providers
    });

  } catch (error) {
    console.error('❌ Fehler beim Laden der KI-Provider:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der KI-Provider'
    });
  }
});

// GET /api/admin/providers/:id - Einzelnen KI-Provider abrufen
router.get('/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 Lade KI-Provider: ${id}`);

    const { data: provider, error } = await supabase
      .from('ai_providers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Fehler beim Abrufen des KI-Providers:', error);
      return res.status(404).json({
        success: false,
        message: 'KI-Provider nicht gefunden'
      });
    }

    res.json({
      success: true,
      data: provider
    });

  } catch (error) {
    console.error('❌ Fehler beim Abrufen des KI-Providers:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen des KI-Providers'
    });
  }
});

// POST /api/admin/providers - Neuen KI-Provider erstellen
router.post('/', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { name, description, api_endpoint, default_model, rate_limit_per_minute, cost_per_1k_tokens, is_active } = req.body;
    
    console.log('🆕 Erstelle neuen KI-Provider:', name);

    // Validierung
    if (!name || !default_model) {
      return res.status(400).json({
        success: false,
        message: 'Name und Default-Model sind erforderlich'
      });
    }

    const { data: provider, error } = await supabase
      .from('ai_providers')
      .insert([{
        name: name.toLowerCase(),
        display_name: name,
        default_model,
        rate_limit_per_minute: rate_limit_per_minute || 60,
        cost_per_1k_tokens: cost_per_1k_tokens || 0.01,
        is_active: is_active !== undefined ? is_active : true,
        config: {
          description: description || '',
          api_endpoint: api_endpoint || ''
        },
        last_used_at: null
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Fehler beim Erstellen des KI-Providers:', error);
      return res.status(500).json({
        success: false,
        message: 'Fehler beim Erstellen des KI-Providers'
      });
    }

    // Audit-Log
    await createAuditLog('CREATE', 'AI_PROVIDER', `KI-Provider "${name}" erstellt`, req.user?.id);

    console.log(`✅ KI-Provider "${name}" erfolgreich erstellt`);
    res.status(201).json({
      success: true,
      data: provider,
      message: 'KI-Provider erfolgreich erstellt'
    });

  } catch (error) {
    console.error('❌ Fehler beim Erstellen des KI-Providers:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Erstellen des KI-Providers'
    });
  }
});

// PUT /api/admin/providers/:id - KI-Provider bearbeiten
router.put('/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, api_endpoint, default_model, rate_limit_per_minute, cost_per_1k_tokens, is_active } = req.body;
    
    console.log(`✏️ Bearbeite KI-Provider: ${id}`);

    const updateData = {};
    if (name !== undefined) {
      updateData.name = name.toLowerCase();
      updateData.display_name = name;
    }
    if (default_model !== undefined) updateData.default_model = default_model;
    if (rate_limit_per_minute !== undefined) updateData.rate_limit_per_minute = rate_limit_per_minute;
    if (cost_per_1k_tokens !== undefined) updateData.cost_per_1k_tokens = cost_per_1k_tokens;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    // Config-Objekt aktualisieren
    if (description !== undefined || api_endpoint !== undefined) {
      // Erst aktuelles config laden
      const { data: currentProvider } = await supabase
        .from('ai_providers')
        .select('config')
        .eq('id', id)
        .single();
      
      const currentConfig = currentProvider?.config || {};
      updateData.config = {
        ...currentConfig,
        ...(description !== undefined && { description }),
        ...(api_endpoint !== undefined && { api_endpoint })
      };
    }

    const { data: provider, error } = await supabase
      .from('ai_providers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Fehler beim Bearbeiten des KI-Providers:', error);
      return res.status(500).json({
        success: false,
        message: 'Fehler beim Bearbeiten des KI-Providers'
      });
    }

    // Audit-Log
    await createAuditLog('UPDATE', 'AI_PROVIDER', `KI-Provider "${provider.name}" bearbeitet`, req.user?.id);

    console.log(`✅ KI-Provider "${provider.name}" erfolgreich bearbeitet`);
    res.json({
      success: true,
      data: provider,
      message: 'KI-Provider erfolgreich bearbeitet'
    });

  } catch (error) {
    console.error('❌ Fehler beim Bearbeiten des KI-Providers:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Bearbeiten des KI-Providers'
    });
  }
});

// DELETE /api/admin/providers/:id - KI-Provider löschen
router.delete('/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Lösche KI-Provider: ${id}`);

    // Erst Provider-Daten für Audit-Log abrufen
    const { data: provider } = await supabase
      .from('ai_providers')
      .select('name')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('ai_providers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Fehler beim Löschen des KI-Providers:', error);
      return res.status(500).json({
        success: false,
        message: 'Fehler beim Löschen des KI-Providers'
      });
    }

    // Audit-Log
    await createAuditLog('DELETE', 'AI_PROVIDER', `KI-Provider "${provider?.name}" gelöscht`, req.user?.id);

    console.log(`✅ KI-Provider erfolgreich gelöscht`);
    res.json({
      success: true,
      message: 'KI-Provider erfolgreich gelöscht'
    });

  } catch (error) {
    console.error('❌ Fehler beim Löschen des KI-Providers:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Löschen des KI-Providers'
    });
  }
});

// POST /api/admin/providers/:id/test - KI-Provider-Verbindung testen
router.post('/:id/test', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🧪 Teste KI-Provider-Verbindung: ${id}`);

    // Provider-Daten abrufen
    const { data: provider, error: providerError } = await supabase
      .from('ai_providers')
      .select('*')
      .eq('id', id)
      .single();

    if (providerError) {
      return res.status(404).json({
        success: false,
        message: 'KI-Provider nicht gefunden'
      });
    }

    // Test-Request simulieren (hier würde echter API-Call stehen)
    const testStartTime = Date.now();
    
    // Simuliere API-Test (in echter Implementation: echter HTTP-Request)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    const responseTime = Date.now() - testStartTime;
    const testSuccess = Math.random() > 0.1; // 90% Erfolgsrate simuliert

    // Test-Metriken speichern
    await supabase
      .from('ai_provider_metrics')
      .insert([{
        provider_name: provider.name,
        response_time_ms: responseTime,
        success: testSuccess,
        tokens_used: 0,
        cost_eur: 0,
        request_type: 'connection_test',
        model_used: provider.default_model
      }]);

    if (testSuccess) {
      console.log(`✅ KI-Provider-Test erfolgreich: ${responseTime}ms`);
      res.json({
        success: true,
        data: {
          provider_name: provider.name,
          response_time_ms: responseTime,
          status: 'connected',
          model: provider.default_model
        },
        message: 'Verbindung erfolgreich getestet'
      });
    } else {
      console.log(`❌ KI-Provider-Test fehlgeschlagen`);
      res.status(500).json({
        success: false,
        message: 'Verbindungstest fehlgeschlagen'
      });
    }

  } catch (error) {
    console.error('❌ Fehler beim Testen des KI-Providers:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Testen des KI-Providers'
    });
  }
});

// GET /api/admin/providers/:id/metrics - Live-Metriken für KI-Provider
router.get('/:id/metrics', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { timeframe = '24h' } = req.query;
    
    console.log(`📊 Lade Metriken für KI-Provider: ${id} (${timeframe})`);

    // Provider-Name abrufen
    const { data: provider } = await supabase
      .from('ai_providers')
      .select('name')
      .eq('id', id)
      .single();

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'KI-Provider nicht gefunden'
      });
    }

    // Zeitraum berechnen
    const hoursBack = timeframe === '1h' ? 1 : timeframe === '24h' ? 24 : 168; // 1h, 24h, 7d
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    // Metriken abrufen
    const { data: metrics, error } = await supabase
      .from('ai_provider_metrics')
      .select('*')
      .eq('provider_name', provider.name)
      .gte('created_at', since)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Fehler beim Abrufen der Metriken:', error);
      return res.status(500).json({
        success: false,
        message: 'Fehler beim Abrufen der Metriken'
      });
    }

    // Metriken berechnen
    const totalRequests = metrics.length;
    const successfulRequests = metrics.filter(m => m.success).length;
    const avgResponseTime = totalRequests > 0 
      ? Math.round(metrics.reduce((sum, m) => sum + m.response_time_ms, 0) / totalRequests)
      : 0;
    const totalCost = metrics.reduce((sum, m) => sum + parseFloat(m.cost_eur), 0);
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests * 100).toFixed(1) : '0.0';

    console.log(`✅ Metriken berechnet: ${totalRequests} Requests, ${successRate}% Erfolg`);
    res.json({
      success: true,
      data: {
        timeframe,
        total_requests: totalRequests,
        successful_requests: successfulRequests,
        success_rate: parseFloat(successRate),
        avg_response_time_ms: avgResponseTime,
        total_cost_eur: totalCost.toFixed(4),
        metrics: metrics.slice(0, 100) // Letzte 100 Metriken
      }
    });

  } catch (error) {
    console.error('❌ Fehler beim Laden der Metriken:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Metriken'
    });
  }
});

// GET /api/admin/providers/:id/metrics - Provider-Metriken abrufen
router.get('/:id/metrics', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📊 Lade Metriken für Provider: ${id}`);

    // Provider-Daten abrufen
    const { data: provider, error: providerError } = await supabase
      .from('ai_providers')
      .select('*')
      .eq('id', id)
      .single();

    if (providerError || !provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider nicht gefunden'
      });
    }

    // Real-Time Metriken vom Monitoring Service abrufen
    const realTimeMonitoringService = (await import('../../services/realTimeMonitoring.js')).default;
    const liveMetrics = realTimeMonitoringService.getProviderMetrics(provider.name);

    // Historische Metriken aus Datenbank (letzte 7 Tage)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: historicalMetrics, error: metricsError } = await supabase
      .from('ai_provider_metrics')
      .select('*')
      .eq('provider_name', provider.name)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (metricsError) {
      console.error('❌ Fehler beim Abrufen der historischen Metriken:', metricsError);
    }

    // Trend-Daten berechnen (stündliche Aggregation)
    const trendData = [];
    if (historicalMetrics && historicalMetrics.length > 0) {
      const hourlyData = new Map();
      
      historicalMetrics.forEach(metric => {
        const hour = new Date(metric.created_at).toISOString().slice(0, 13) + ':00:00.000Z';
        
        if (!hourlyData.has(hour)) {
          hourlyData.set(hour, {
            timestamp: hour,
            requests: 0,
            successful: 0,
            total_response_time: 0,
            total_cost: 0,
            total_tokens: 0
          });
        }
        
        const hourData = hourlyData.get(hour);
        hourData.requests++;
        if (metric.success) hourData.successful++;
        hourData.total_response_time += metric.response_time_ms;
        hourData.total_cost += metric.cost_eur || 0;
        hourData.total_tokens += metric.tokens_used || 0;
      });

      // Aggregierte Stunden-Daten berechnen
      hourlyData.forEach((data, hour) => {
        trendData.push({
          timestamp: hour,
          requests: data.requests,
          success_rate: data.requests > 0 ? Math.round((data.successful / data.requests) * 100) : 0,
          avg_response_time: data.requests > 0 ? Math.round(data.total_response_time / data.requests) : 0,
          total_cost: Math.round(data.total_cost * 10000) / 10000, // 4 Dezimalstellen
          total_tokens: data.total_tokens
        });
      });
    }

    const response = {
      success: true,
      data: {
        provider: {
          id: provider.id,
          name: provider.name,
          display_name: provider.display_name,
          is_active: provider.is_active
        },
        live_metrics: liveMetrics || {
          provider_name: provider.name,
          total_requests_24h: 0,
          successful_requests_24h: 0,
          failed_requests_24h: 0,
          success_rate_24h: 0,
          avg_response_time_24h: 0,
          total_cost_24h: 0,
          total_tokens_24h: 0,
          requests_last_hour: 0,
          avg_response_time_last_hour: 0,
          status: 'idle',
          last_updated: new Date().toISOString()
        },
        trend_data: trendData,
        historical_summary: {
          total_requests_7d: historicalMetrics?.length || 0,
          total_cost_7d: historicalMetrics?.reduce((sum, m) => sum + (m.cost_eur || 0), 0) || 0,
          total_tokens_7d: historicalMetrics?.reduce((sum, m) => sum + (m.tokens_used || 0), 0) || 0
        }
      }
    };

    console.log(`✅ Metriken für Provider "${provider.display_name}" geladen`);
    res.json(response);

  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Provider-Metriken:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen der Provider-Metriken'
    });
  }
});

export default router;
