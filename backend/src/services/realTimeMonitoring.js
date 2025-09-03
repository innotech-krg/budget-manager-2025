// =====================================================
// REAL-TIME MONITORING SERVICE
// @dev.mdc - Woche 1, Tag 3
// =====================================================

import { supabase } from '../config/database.js';

class RealTimeMonitoringService {
  constructor() {
    this.metrics = new Map();
    this.subscribers = new Set();
    this.monitoringInterval = null;
    this.isRunning = false;
  }

  // Monitoring starten
  start() {
    if (this.isRunning) return;
    
    console.log('🔄 Real-Time Monitoring Service gestartet');
    this.isRunning = true;
    
    // Initiale Metriken laden
    this.loadInitialMetrics();
    
    // Monitoring-Intervall starten (alle 30 Sekunden)
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
    }, 30000);
  }

  // Monitoring stoppen
  stop() {
    if (!this.isRunning) return;
    
    console.log('🛑 Real-Time Monitoring Service gestoppt');
    this.isRunning = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  // Initiale Metriken aus Datenbank laden
  async loadInitialMetrics() {
    try {
      console.log('📊 Lade initiale Provider-Metriken...');
      
      // Alle Provider abrufen
      const { data: providers, error: providersError } = await supabase
        .from('ai_providers')
        .select('*');

      if (providersError) {
        console.error('❌ Fehler beim Laden der Provider:', providersError);
        return;
      }

      // Für jeden Provider Metriken berechnen
      for (const provider of providers) {
        await this.calculateProviderMetrics(provider.name);
      }

      console.log(`✅ Initiale Metriken für ${providers.length} Provider geladen`);
      
    } catch (error) {
      console.error('❌ Fehler beim Laden der initialen Metriken:', error);
    }
  }

  // Provider-Metriken berechnen
  async calculateProviderMetrics(providerName) {
    try {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

      // Metriken aus ai_provider_metrics abrufen
      const { data: metrics, error } = await supabase
        .from('ai_provider_metrics')
        .select('*')
        .eq('provider_name', providerName)
        .gte('created_at', last24h.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`❌ Fehler beim Abrufen der Metriken für ${providerName}:`, error);
        return null;
      }

      const metricsLastHour = metrics.filter(m => 
        new Date(m.created_at) >= lastHour
      );

      // Berechnungen
      const totalRequests = metrics.length;
      const successfulRequests = metrics.filter(m => m.success).length;
      const failedRequests = totalRequests - successfulRequests;
      
      const avgResponseTime = totalRequests > 0 
        ? Math.round(metrics.reduce((sum, m) => sum + m.response_time_ms, 0) / totalRequests)
        : 0;
      
      const successRate = totalRequests > 0 
        ? Math.round((successfulRequests / totalRequests) * 100)
        : 0;
      
      const totalCost = metrics.reduce((sum, m) => sum + (m.cost_eur || 0), 0);
      const totalTokens = metrics.reduce((sum, m) => sum + (m.tokens_used || 0), 0);
      
      const requestsLastHour = metricsLastHour.length;
      const avgResponseTimeLastHour = requestsLastHour > 0
        ? Math.round(metricsLastHour.reduce((sum, m) => sum + m.response_time_ms, 0) / requestsLastHour)
        : 0;

      const providerMetrics = {
        provider_name: providerName,
        total_requests_24h: totalRequests,
        successful_requests_24h: successfulRequests,
        failed_requests_24h: failedRequests,
        success_rate_24h: successRate,
        avg_response_time_24h: avgResponseTime,
        total_cost_24h: totalCost,
        total_tokens_24h: totalTokens,
        requests_last_hour: requestsLastHour,
        avg_response_time_last_hour: avgResponseTimeLastHour,
        last_updated: now.toISOString(),
        status: this.determineProviderStatus(successRate, avgResponseTime, requestsLastHour)
      };

      // In Memory-Cache speichern
      this.metrics.set(providerName, providerMetrics);

      // An alle Subscribers senden
      this.broadcastMetrics(providerName, providerMetrics);

      return providerMetrics;

    } catch (error) {
      console.error(`❌ Fehler beim Berechnen der Metriken für ${providerName}:`, error);
      return null;
    }
  }

  // Provider-Status bestimmen
  determineProviderStatus(successRate, avgResponseTime, requestsLastHour) {
    if (successRate < 80 || avgResponseTime > 5000) {
      return 'critical';
    } else if (successRate < 95 || avgResponseTime > 2000) {
      return 'warning';
    } else if (requestsLastHour > 0) {
      return 'active';
    } else {
      return 'idle';
    }
  }

  // Metriken aktualisieren (wird alle 30 Sekunden aufgerufen)
  async updateMetrics() {
    try {
      console.log('🔄 Aktualisiere Real-Time Metriken...');
      
      const { data: providers } = await supabase
        .from('ai_providers')
        .select('name');

      if (providers) {
        for (const provider of providers) {
          await this.calculateProviderMetrics(provider.name);
        }
      }

    } catch (error) {
      console.error('❌ Fehler beim Aktualisieren der Metriken:', error);
    }
  }

  // WebSocket-Subscriber hinzufügen
  addSubscriber(ws) {
    this.subscribers.add(ws);
    console.log(`📡 Neuer Monitoring-Subscriber hinzugefügt (${this.subscribers.size} aktiv)`);
    
    // Aktuelle Metriken an neuen Subscriber senden
    this.sendCurrentMetrics(ws);
  }

  // WebSocket-Subscriber entfernen
  removeSubscriber(ws) {
    this.subscribers.delete(ws);
    console.log(`📡 Monitoring-Subscriber entfernt (${this.subscribers.size} aktiv)`);
  }

  // Aktuelle Metriken an Subscriber senden
  sendCurrentMetrics(ws) {
    const allMetrics = Array.from(this.metrics.values());
    const message = {
      type: 'provider_metrics_update',
      data: allMetrics,
      timestamp: new Date().toISOString()
    };
    
    try {
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(JSON.stringify(message));
      }
    } catch (error) {
      console.error('❌ Fehler beim Senden der Metriken:', error);
    }
  }

  // Metriken an alle Subscriber broadcasten
  broadcastMetrics(providerName, metrics) {
    const message = {
      type: 'provider_metrics_update',
      provider: providerName,
      data: metrics,
      timestamp: new Date().toISOString()
    };

    this.subscribers.forEach(ws => {
      try {
        if (ws.readyState === 1) { // WebSocket.OPEN
          ws.send(JSON.stringify(message));
        }
      } catch (error) {
        console.error('❌ Fehler beim Broadcasting der Metriken:', error);
        this.removeSubscriber(ws);
      }
    });
  }

  // Metriken für spezifischen Provider abrufen
  getProviderMetrics(providerName) {
    return this.metrics.get(providerName) || null;
  }

  // Alle Metriken abrufen
  getAllMetrics() {
    return Array.from(this.metrics.values());
  }

  // System-Health-Status berechnen
  getSystemHealth() {
    const allMetrics = this.getAllMetrics();
    
    if (allMetrics.length === 0) {
      return { status: 'unknown', message: 'Keine Metriken verfügbar' };
    }

    const criticalProviders = allMetrics.filter(m => m.status === 'critical').length;
    const warningProviders = allMetrics.filter(m => m.status === 'warning').length;
    const activeProviders = allMetrics.filter(m => m.status === 'active').length;

    if (criticalProviders > 0) {
      return { 
        status: 'critical', 
        message: `${criticalProviders} Provider kritisch`,
        details: { critical: criticalProviders, warning: warningProviders, active: activeProviders }
      };
    } else if (warningProviders > 0) {
      return { 
        status: 'warning', 
        message: `${warningProviders} Provider mit Warnungen`,
        details: { critical: criticalProviders, warning: warningProviders, active: activeProviders }
      };
    } else {
      return { 
        status: 'healthy', 
        message: `${activeProviders} Provider aktiv`,
        details: { critical: criticalProviders, warning: warningProviders, active: activeProviders }
      };
    }
  }
}

// Singleton-Instanz
const realTimeMonitoringService = new RealTimeMonitoringService();

export default realTimeMonitoringService;
