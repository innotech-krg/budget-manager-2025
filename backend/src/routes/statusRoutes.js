// =====================================================
// Budget Manager 2025 - System Status Routes
// Zeigt Verbindungsstatus für alle Services
// =====================================================

import express from 'express';
import { supabase } from '../config/database.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// System Status Check
router.get('/system', async (req, res) => {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      services: {
        backend: {
          status: 'connected',
          message: 'Backend Server läuft',
          port: process.env.PORT || 3001
        },
        supabase: {
          status: 'unknown',
          message: 'Prüfe Verbindung...',
          url: process.env.SUPABASE_URL ? 'Konfiguriert' : 'Nicht konfiguriert'
        },
        openai: {
          status: process.env.OPENAI_API_KEY ? 'ready' : 'not_configured',
          message: process.env.OPENAI_API_KEY ? 'API-Key gültig (nicht getestet)' : 'API-Key fehlt',
          available: !!process.env.OPENAI_API_KEY
        },
        anthropic: {
          status: process.env.ANTHROPIC_API_KEY ? 'ready' : 'not_configured',
          message: process.env.ANTHROPIC_API_KEY ? 'API-Key gültig (nicht getestet)' : 'API-Key fehlt',
          available: !!process.env.ANTHROPIC_API_KEY
        }
      }
    };

    // Test Supabase connection - einfacher Verbindungstest
    try {
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        // Teste einfache Verbindung zur Supabase REST API
        const testUrl = `${process.env.SUPABASE_URL}/rest/v1/`;
        const testResponse = await fetch(testUrl, {
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          }
        });
        
        if (testResponse.ok || testResponse.status === 404) {
          // 404 ist OK - bedeutet API ist erreichbar, nur kein spezifischer Endpoint
          status.services.supabase.status = 'connected';
          status.services.supabase.message = 'Erfolgreich verbunden';
        } else {
          status.services.supabase.status = 'error';
          status.services.supabase.message = `API-Fehler: ${testResponse.status}`;
        }
      } else {
        status.services.supabase.status = 'not_configured';
        status.services.supabase.message = 'URL oder Service Key fehlt';
      }
    } catch (err) {
      // Fallback: Prüfe nur Konfiguration
      if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
        status.services.supabase.status = 'configured';
        status.services.supabase.message = 'Konfiguriert (Verbindung nicht getestet)';
      } else {
        status.services.supabase.status = 'error';
        status.services.supabase.message = 'Nicht konfiguriert';
      }
    }

    // Test OpenAI API (if configured)
    if (process.env.OPENAI_API_KEY) {
      try {
        // Simple test without actual API call to avoid costs
        const keyLength = process.env.OPENAI_API_KEY.length;
        const keyPrefix = process.env.OPENAI_API_KEY.substring(0, 7);
        
        if (keyLength > 20 && keyPrefix === 'sk-proj') {
          status.services.openai.status = 'ready';
          status.services.openai.message = 'API-Key gültig (nicht getestet)';
        } else {
          status.services.openai.status = 'invalid';
          status.services.openai.message = 'API-Key Format ungültig';
        }
      } catch (err) {
        status.services.openai.status = 'error';
        status.services.openai.message = `Fehler: ${err.message}`;
      }
    }

    // Test Anthropic API (if configured)
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const keyLength = process.env.ANTHROPIC_API_KEY.length;
        const keyPrefix = process.env.ANTHROPIC_API_KEY.substring(0, 11);
        
        if (keyLength > 20 && keyPrefix === 'sk-ant-api0') {
          status.services.anthropic.status = 'ready';
          status.services.anthropic.message = 'API-Key gültig (nicht getestet)';
        } else {
          status.services.anthropic.status = 'invalid';
          status.services.anthropic.message = 'API-Key Format ungültig';
        }
      } catch (err) {
        status.services.anthropic.status = 'error';
        status.services.anthropic.message = `Fehler: ${err.message}`;
      }
    }

    // Overall system health
    const allServicesOk = 
      status.services.backend.status === 'connected' &&
      status.services.supabase.status === 'connected' &&
      (status.services.openai.status === 'ready' || status.services.anthropic.status === 'ready');

    status.overall = {
      status: allServicesOk ? 'healthy' : 'degraded',
      message: allServicesOk ? 'Alle Services funktional' : 'Einige Services haben Probleme',
      aiEnabled: status.services.openai.available || status.services.anthropic.available
    };

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('❌ Status Check Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Fehler beim Status-Check',
      message: error.message
    });
  }
});

// Health Check (einfach)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Backend Server läuft'
  });
});

export default router;
