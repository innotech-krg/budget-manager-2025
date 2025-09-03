// =====================================================
// Budget Manager 2025 - Dienstleister API Routes
// Story 1.2.1: Dienstleister-Stammdaten-Management
// =====================================================

import express from 'express'
import { supabase } from '../config/database.js'
import { validateRequest } from '../middleware/validateRequest.js'

const router = express.Router()

// =====================================================
// GET /api/dienstleister - Alle aktiven Dienstleister
// =====================================================
router.get('/', async (req, res) => {
  try {
    console.log('[Dienstleister] 📥 GET /api/dienstleister')
    
    const { data, error } = await supabase
      .from('dienstleister')
      .select('*')
      .eq('status', 'AKTIV')
      .order('name')

    if (error) {
      console.error('[Dienstleister] ❌ Fehler beim Laden:', error)
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Dienstleister',
        details: error.message
      })
    }

    console.log(`[Dienstleister] ✅ ${data.length} Dienstleister geladen`)
    res.json(data)

  } catch (error) {
    console.error('[Dienstleister] ❌ Server-Fehler:', error)
    res.status(500).json({
      success: false,
      error: 'Server-Fehler beim Laden der Dienstleister',
      details: error.message
    })
  }
})

// =====================================================
// GET /api/dienstleister/kategorien - Alle Kategorien
// =====================================================
router.get('/kategorien', async (req, res) => {
  try {
    console.log('[Dienstleister] 📥 GET /api/dienstleister/kategorien')
    
    const { data, error } = await supabase
      .from('dienstleister_kategorien')
      .select('*')
      .order('name')

    if (error) {
      console.error('[Dienstleister] ❌ Fehler beim Laden der Kategorien:', error)
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Dienstleister-Kategorien',
        details: error.message
      })
    }

    console.log(`[Dienstleister] ✅ ${data.length} Kategorien geladen`)
    res.json(data)

  } catch (error) {
    console.error('[Dienstleister] ❌ Server-Fehler:', error)
    res.status(500).json({
      success: false,
      error: 'Server-Fehler beim Laden der Kategorien',
      details: error.message
    })
  }
})

// =====================================================
// POST /api/dienstleister - Neuen Dienstleister erstellen
// =====================================================
router.post('/', validateRequest, async (req, res) => {
  try {
    console.log('[Dienstleister] 📥 POST /api/dienstleister')
    console.log('[Dienstleister] 📋 Daten:', req.body)
    
    const {
      name,
      kurzbeschreibung,
      kategorie,
      kontakt_email,
      kontakt_telefon,
      adresse,
      website,
      steuernummer,
      ustid
    } = req.body

    // Validierung
    if (!name || !kategorie) {
      return res.status(400).json({
        success: false,
        error: 'Name und Kategorie sind erforderlich'
      })
    }

    // Eindeutigkeit prüfen
    const { data: existing } = await supabase
      .from('dienstleister')
      .select('id')
      .eq('name', name)
      .single()

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Ein Dienstleister mit diesem Namen existiert bereits'
      })
    }

    // Dienstleister erstellen
    const { data, error } = await supabase
      .from('dienstleister')
      .insert([{
        name,
        kurzbeschreibung,
        kategorie,
        kontakt_email,
        kontakt_telefon,
        adresse,
        website,
        steuernummer,
        ustid,
        status: 'AKTIV'
      }])
      .select()
      .single()

    if (error) {
      console.error('[Dienstleister] ❌ Fehler beim Erstellen:', error)
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Erstellen des Dienstleisters',
        details: error.message
      })
    }

    console.log('[Dienstleister] ✅ Dienstleister erstellt:', data.id)
    res.status(201).json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('[Dienstleister] ❌ Server-Fehler:', error)
    res.status(500).json({
      success: false,
      error: 'Server-Fehler beim Erstellen des Dienstleisters',
      details: error.message
    })
  }
})

// =====================================================
// PUT /api/dienstleister/:id - Dienstleister aktualisieren
// =====================================================
router.put('/:id', validateRequest, async (req, res) => {
  try {
    const { id } = req.params
    console.log(`[Dienstleister] 📥 PUT /api/dienstleister/${id}`)
    
    const {
      name,
      kurzbeschreibung,
      kategorie,
      kontakt_email,
      kontakt_telefon,
      adresse,
      website,
      steuernummer,
      ustid,
      status
    } = req.body

    // Validierung
    if (!name || !kategorie) {
      return res.status(400).json({
        success: false,
        error: 'Name und Kategorie sind erforderlich'
      })
    }

    // Dienstleister aktualisieren
    const { data, error } = await supabase
      .from('dienstleister')
      .update({
        name,
        kurzbeschreibung,
        kategorie,
        kontakt_email,
        kontakt_telefon,
        adresse,
        website,
        steuernummer,
        ustid,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Dienstleister] ❌ Fehler beim Aktualisieren:', error)
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Aktualisieren des Dienstleisters',
        details: error.message
      })
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Dienstleister nicht gefunden'
      })
    }

    console.log('[Dienstleister] ✅ Dienstleister aktualisiert:', id)
    res.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('[Dienstleister] ❌ Server-Fehler:', error)
    res.status(500).json({
      success: false,
      error: 'Server-Fehler beim Aktualisieren des Dienstleisters',
      details: error.message
    })
  }
})

// =====================================================
// DELETE /api/dienstleister/:id - Dienstleister deaktivieren
// =====================================================
router.delete('/:id', validateRequest, async (req, res) => {
  try {
    const { id } = req.params
    console.log(`[Dienstleister] 📥 DELETE /api/dienstleister/${id}`)
    
    // Soft Delete - Status auf INAKTIV setzen
    const { data, error } = await supabase
      .from('dienstleister')
      .update({
        status: 'INAKTIV',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Dienstleister] ❌ Fehler beim Deaktivieren:', error)
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Deaktivieren des Dienstleisters',
        details: error.message
      })
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Dienstleister nicht gefunden'
      })
    }

    console.log('[Dienstleister] ✅ Dienstleister deaktiviert:', id)
    res.json({
      success: true,
      message: 'Dienstleister erfolgreich deaktiviert',
      data: data
    })

  } catch (error) {
    console.error('[Dienstleister] ❌ Server-Fehler:', error)
    res.status(500).json({
      success: false,
      error: 'Server-Fehler beim Deaktivieren des Dienstleisters',
      details: error.message
    })
  }
})

export default router
