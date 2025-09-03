import express from 'express'
import { supabase } from '../config/database.js'

const router = express.Router()

// GET /api/team-rollen - Alle verfügbaren Rollen für Teams
router.get('/', async (req, res) => {
  try {
    console.log('[TeamRollen] 📥 GET /api/team-rollen')
    
    const { data: rollen, error } = await supabase
      .from('rollen_stammdaten')
      .select('*')
      .eq('ist_aktiv', true)
      .order('kategorie', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('[TeamRollen] ❌ Fehler beim Laden der Rollen:', error)
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Rollen',
        details: error.message
      })
    }

    console.log(`[TeamRollen] ✅ ${rollen.length} Rollen geladen`)
    res.json(rollen)

  } catch (error) {
    console.error('[TeamRollen] ❌ Server-Fehler:', error)
    res.status(500).json({
      success: false,
      error: 'Server-Fehler beim Laden der Rollen',
      details: error.message
    })
  }
})

// GET /api/team-rollen/:teamId - Rollen eines bestimmten Teams
router.get('/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params
    console.log(`[TeamRollen] 📥 GET /api/team-rollen/${teamId}`)
    
    const { data: teamRollen, error } = await supabase
      .from('team_rollen')
      .select(`
        *,
        rolle:rollen_stammdaten(*)
      `)
      .eq('team_id', teamId)
      .eq('ist_aktiv', true)

    if (error) {
      console.error('[TeamRollen] ❌ Fehler beim Laden der Team-Rollen:', error)
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Team-Rollen',
        details: error.message
      })
    }

    console.log(`[TeamRollen] ✅ ${teamRollen.length} Team-Rollen geladen`)
    res.json(teamRollen)

  } catch (error) {
    console.error('[TeamRollen] ❌ Server-Fehler:', error)
    res.status(500).json({
      success: false,
      error: 'Server-Fehler beim Laden der Team-Rollen',
      details: error.message
    })
  }
})



// PUT /api/team-rollen/:id - Team-Rolle aktualisieren
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, kategorie, standard_stundensatz, min_stundensatz, max_stundensatz, beschreibung, farbe, ist_aktiv } = req.body
    console.log(`[TeamRollen] 📥 PUT /api/team-rollen/${id}`)

    // Validierung
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Rollen-Name ist erforderlich'
      })
    }

    // Prüfe ob Rolle existiert
    const { data: existingRole, error: checkError } = await supabase
      .from('rollen_stammdaten')
      .select('*')
      .eq('id', id)
      .single()

    if (checkError || !existingRole) {
      return res.status(404).json({
        success: false,
        error: 'Rolle nicht gefunden'
      })
    }

    // Prüfe ob anderer Name bereits existiert
    const { data: duplicateRole } = await supabase
      .from('rollen_stammdaten')
      .select('id')
      .eq('name', name.trim())
      .neq('id', id)
      .single()

    if (duplicateRole) {
      return res.status(409).json({
        success: false,
        error: 'Eine andere Rolle mit diesem Namen existiert bereits'
      })
    }

    // Rolle aktualisieren
    const { data, error } = await supabase
      .from('rollen_stammdaten')
      .update({
        name: name.trim(),
        kategorie: kategorie || existingRole.kategorie,
        standard_stundensatz: standard_stundensatz ?? existingRole.standard_stundensatz,
        min_stundensatz: min_stundensatz ?? existingRole.min_stundensatz,
        max_stundensatz: max_stundensatz ?? existingRole.max_stundensatz,
        beschreibung: beschreibung?.trim() ?? existingRole.beschreibung,
        farbe: farbe || existingRole.farbe,
        ist_aktiv: ist_aktiv ?? existingRole.ist_aktiv,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[TeamRollen] ❌ Fehler beim Aktualisieren der Rolle:', error)
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Aktualisieren der Rolle',
        details: error.message
      })
    }

    console.log(`[TeamRollen] ✅ Rolle "${data.name}" aktualisiert`)
    res.json(data)

  } catch (error) {
    console.error('[TeamRollen] ❌ Server-Fehler:', error)
    res.status(500).json({
      success: false,
      error: 'Server-Fehler beim Aktualisieren der Rolle',
      details: error.message
    })
  }
})

// POST /api/team-rollen - Neue Team-Rolle erstellen
router.post('/', async (req, res) => {
  try {
    const { name, kategorie, standard_stundensatz, min_stundensatz, max_stundensatz, beschreibung, farbe } = req.body
    console.log('[TeamRollen] 📥 POST /api/team-rollen', { name, kategorie })

    // Validierung
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Rollen-Name ist erforderlich'
      })
    }

    if (!kategorie || kategorie.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Kategorie ist erforderlich'
      })
    }

    // Prüfe ob Rolle bereits existiert
    const { data: existingRole } = await supabase
      .from('rollen_stammdaten')
      .select('id')
      .eq('name', name.trim())
      .single()

    if (existingRole) {
      return res.status(409).json({
        success: false,
        error: 'Eine Rolle mit diesem Namen existiert bereits'
      })
    }

    // Rolle erstellen
    const { data, error } = await supabase
      .from('rollen_stammdaten')
      .insert({
        name: name.trim(),
        kategorie: kategorie.trim(),
        standard_stundensatz: standard_stundensatz || 50.00,
        min_stundensatz: min_stundensatz || null,
        max_stundensatz: max_stundensatz || null,
        beschreibung: beschreibung?.trim() || null,
        farbe: farbe || '#6B7280',
        ist_aktiv: true
      })
      .select()
      .single()

    if (error) {
      console.error('[TeamRollen] ❌ Fehler beim Erstellen der Rolle:', error)
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Erstellen der Rolle',
        details: error.message
      })
    }

    console.log(`[TeamRollen] ✅ Rolle "${data.name}" erstellt`)
    res.status(201).json(data)

  } catch (error) {
    console.error('[TeamRollen] ❌ Server-Fehler:', error)
    res.status(500).json({
      success: false,
      error: 'Server-Fehler beim Erstellen der Rolle',
      details: error.message
    })
  }
})

// DELETE /api/team-rollen/:id - Team-Rolle löschen
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    console.log(`[TeamRollen] 📥 DELETE /api/team-rollen/${id}`)

    // Prüfe ob Rolle existiert
    const { data: existingRole, error: checkError } = await supabase
      .from('rollen_stammdaten')
      .select('*')
      .eq('id', id)
      .single()

    if (checkError || !existingRole) {
      return res.status(404).json({
        success: false,
        error: 'Rolle nicht gefunden'
      })
    }

    // Rolle löschen
    const { error } = await supabase
      .from('rollen_stammdaten')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[TeamRollen] ❌ Fehler beim Löschen der Rolle:', error)
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Löschen der Rolle',
        details: error.message
      })
    }

    console.log(`[TeamRollen] ✅ Rolle "${existingRole.name}" erfolgreich gelöscht`)
    res.json({
      success: true,
      message: 'Rolle erfolgreich gelöscht'
    })

  } catch (error) {
    console.error('[TeamRollen] ❌ Server-Fehler:', error)
    res.status(500).json({
      success: false,
      error: 'Server-Fehler beim Löschen der Rolle',
      details: error.message
    })
  }
})

export default router

