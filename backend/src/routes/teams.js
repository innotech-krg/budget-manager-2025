// =====================================================
// Budget Manager 2025 - Teams Routes
// Story 1.2.2 Enhancement: Team-Dropdown und Team-Management
// =====================================================

import express from 'express'
import { supabase } from '../config/database.js'
import { validateRequest } from '../middleware/validateRequest.js'

const router = express.Router()

// =====================================================
// TEAMS MANAGEMENT
// =====================================================

/**
 * @route   GET /api/teams
 * @desc    Alle aktiven Teams abrufen
 * @access  Public (für Dropdown-Auswahl)
 */
router.get('/', async (req, res) => {
  try {
    console.log('[Teams] 📥 GET /api/teams')
    
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('[Teams] ❌ Fehler beim Laden der Teams:', error)
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Teams',
        details: error.message
      })
    }

    console.log(`[Teams] ✅ ${data.length} Teams geladen`)
    res.json(data)

  } catch (error) {
    console.error('[Teams] ❌ Server-Fehler:', error)
    res.status(500).json({
      success: false,
      error: 'Server-Fehler beim Laden der Teams',
      details: error.message
    })
  }
})

/**
 * @route   GET /api/teams/:id/rollen
 * @desc    Verfügbare Rollen für ein Team abrufen
 * @access  Public
 */
router.get('/:id/rollen', async (req, res) => {
  try {
    const { id } = req.params
    console.log(`[Teams] 📥 GET /api/teams/${id}/rollen`)
    
    // Hole Team-Info
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single()

    if (teamError || !team) {
      return res.status(404).json({
        success: false,
        error: 'Team nicht gefunden'
      })
    }

    // Hole alle verfügbaren Rollen (später team-spezifisch)
    const { data: rollen, error: rollenError } = await supabase
      .from('rollen_stammdaten')
      .select('*')
      .eq('ist_aktiv', true)
      .order('kategorie, name')

    if (rollenError) {
      console.error('[Teams] ❌ Fehler beim Laden der Rollen:', rollenError)
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Rollen',
        details: rollenError.message
      })
    }

    console.log(`[Teams] ✅ ${rollen.length} Rollen für Team ${team.name} geladen`)
    res.json({
      team,
      rollen
    })

  } catch (error) {
    console.error('[Teams] ❌ Server-Fehler:', error)
    res.status(500).json({
      success: false,
      error: 'Server-Fehler beim Laden der Team-Rollen',
      details: error.message
    })
  }
})

/**
 * @route   POST /api/teams
 * @desc    Neues Team erstellen
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    console.log('[Teams] 📥 POST /api/teams')
    
    const {
      name,
      description,
      is_active = true,
      selectedRoles = []
    } = req.body

    // Validierung
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Team-Name ist erforderlich'
      })
    }

    // Prüfe ob Team bereits existiert
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('id')
      .eq('name', name.trim())
      .single()

    if (existingTeam) {
      return res.status(409).json({
        success: false,
        error: 'Ein Team mit diesem Namen existiert bereits'
      })
    }

    // Team erstellen
    const { data, error } = await supabase
      .from('teams')
      .insert({
        name: name.trim(),
        description: description?.trim(),
        is_active
      })
      .select()
      .single()

    if (error) {
      console.error('[Teams] ❌ Fehler beim Erstellen des Teams:', error)
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Erstellen des Teams',
        details: error.message
      })
    }

    console.log(`[Teams] ✅ Team "${data.name}" erstellt`)
    
    // Rollen-Zuordnungen erstellen, falls vorhanden
    if (selectedRoles && selectedRoles.length > 0) {
      console.log(`[Teams] 📋 Erstelle ${selectedRoles.length} Rollen-Zuordnungen für Team ${data.id}`)
      
      // Erst die Rollen-Details aus rollen_stammdaten laden
      const { data: roleDetails, error: roleDetailsError } = await supabase
        .from('rollen_stammdaten')
        .select('*')
        .in('id', selectedRoles);
      
      if (roleDetailsError) {
        console.error('[Teams] ❌ Fehler beim Laden der Rollen-Details:', roleDetailsError);
        return res.status(500).json({
          success: false,
          error: 'Fehler beim Laden der Rollen-Details',
          details: roleDetailsError.message
        });
      }
      
              // Team-Rollen-Zuordnungen mit vollständigen Daten erstellen
        const roleAssignments = roleDetails.map(role => ({
          team_id: data.id,
          rolle_id: role.id,
          name: role.name,
          description: role.beschreibung,
          standard_hourly_rate: role.standard_stundensatz,
          permissions: JSON.stringify([]),
          is_active: true
        }));
      
      const { error: roleError } = await supabase
        .from('team_rollen')
        .insert(roleAssignments);
      
      if (roleError) {
        console.error('[Teams] ❌ Fehler beim Erstellen der Rollen-Zuordnungen:', roleError);
        // Team wurde bereits erstellt, aber Rollen-Zuordnung fehlgeschlagen
        // Wir geben trotzdem Erfolg zurück, aber mit Warnung
        return res.status(201).json({
          ...data,
          warning: 'Team erstellt, aber Rollen-Zuordnung fehlgeschlagen',
          roleError: roleError.message
        });
      }
      
      console.log(`[Teams] ✅ ${selectedRoles.length} Rollen erfolgreich zugeordnet`)
    }
    
    res.status(201).json(data)

  } catch (error) {
    console.error('[Teams] ❌ Server-Fehler:', error)
    res.status(500).json({
      success: false,
      error: 'Server-Fehler beim Erstellen des Teams',
      details: error.message
    })
  }
})

/**
 * @route   PUT /api/teams/:id/roles
 * @desc    Team-Rollen aktualisieren
 * @access  Private (SuperAdmin)
 */
router.put('/:id/roles', async (req, res) => {
  try {
    const { id } = req.params
    const { selectedRoles } = req.body
    
    console.log(`[Teams] 📥 PUT /api/teams/${id}/roles`)
    console.log(`[Teams] 📋 Rollen-Update:`, { selectedRoles, length: selectedRoles?.length })

    // Prüfe ob Team existiert
    const { data: existingTeam, error: checkError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single()

    if (checkError || !existingTeam) {
      return res.status(404).json({
        success: false,
        error: 'Team nicht gefunden'
      })
    }

    // Erst alle bestehenden Zuordnungen für dieses Team löschen
    const { error: deleteError } = await supabase
      .from('team_rollen')
      .delete()
      .eq('team_id', id);
    
    if (deleteError) {
      console.error('[Teams] ❌ Fehler beim Löschen alter Rollen-Zuordnungen:', deleteError);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Löschen der Rollen-Zuordnungen',
        details: deleteError.message
      });
    }
    
    console.log(`[Teams] ✅ Alte Rollen-Zuordnungen gelöscht`)
    
    // Neue Zuordnungen erstellen, falls Rollen ausgewählt wurden
    if (selectedRoles && selectedRoles.length > 0) {
      // Erst die Rollen-Details aus rollen_stammdaten laden
      const { data: roleDetails, error: roleDetailsError } = await supabase
        .from('rollen_stammdaten')
        .select('*')
        .in('id', selectedRoles);
      
      if (roleDetailsError) {
        console.error('[Teams] ❌ Fehler beim Laden der Rollen-Details:', roleDetailsError);
        return res.status(500).json({
          success: false,
          error: 'Fehler beim Laden der Rollen-Details',
          details: roleDetailsError.message
        });
      }
      
      // Team-Rollen-Zuordnungen mit vollständigen Daten erstellen
      const roleAssignments = roleDetails.map(role => ({
        team_id: id,
        rolle_id: role.id,
        name: role.name,
        description: role.beschreibung,
        standard_hourly_rate: role.standard_stundensatz,
        permissions: JSON.stringify([]),
        is_active: true
      }));
      
      const { error: roleError } = await supabase
        .from('team_rollen')
        .insert(roleAssignments);
      
      if (roleError) {
        console.error('[Teams] ❌ Fehler beim Erstellen neuer Rollen-Zuordnungen:', roleError);
        return res.status(500).json({
          success: false,
          error: 'Fehler beim Erstellen der Rollen-Zuordnungen',
          details: roleError.message
        });
      }
      
      console.log(`[Teams] ✅ ${selectedRoles.length} Rollen erfolgreich zugeordnet`)
    }
    
    res.json({
      success: true,
      message: 'Team-Rollen erfolgreich aktualisiert',
      rolesCount: selectedRoles?.length || 0
    })

  } catch (error) {
    console.error('[Teams] ❌ Server-Fehler:', error)
    res.status(500).json({
      success: false,
      error: 'Server-Fehler beim Aktualisieren der Team-Rollen',
      details: error.message
    })
  }
})

/**
 * @route   PUT /api/teams/:id
 * @desc    Team aktualisieren
 * @access  Private (SuperAdmin)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    console.log(`[Teams] 📥 PUT /api/teams/${id}`)
    
    const {
      name,
      description,
      is_active,
      selectedRoles
    } = req.body
    
    console.log(`[Teams] 📋 Update-Request Body:`, {
      name,
      description,
      is_active,
      selectedRoles: selectedRoles ? `Array(${selectedRoles.length})` : 'undefined'
    })

    // Validierung
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Team-Name ist erforderlich'
      })
    }

    // Prüfe ob Team existiert
    const { data: existingTeam, error: checkError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single()

    if (checkError || !existingTeam) {
      return res.status(404).json({
        success: false,
        error: 'Team nicht gefunden'
      })
    }

    // Prüfe ob anderes Team mit gleichem Namen existiert
    const { data: duplicateTeam } = await supabase
      .from('teams')
      .select('id')
      .eq('name', name.trim())
      .neq('id', id)
      .single()

    if (duplicateTeam) {
      return res.status(409).json({
        success: false,
        error: 'Ein anderes Team mit diesem Namen existiert bereits'
      })
    }

    // Team aktualisieren
    const { data, error } = await supabase
      .from('teams')
      .update({
        name: name.trim(),
        description: description?.trim(),
        is_active: is_active ?? existingTeam.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Teams] ❌ Fehler beim Aktualisieren des Teams:', error)
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Aktualisieren des Teams',
        details: error.message
      })
    }

    console.log(`[Teams] ✅ Team "${data.name}" aktualisiert`)
    
    // Rollen-Zuordnungen aktualisieren - VEREINFACHTE LOGIK
    console.log(`[Teams] 🔍 Request Body Keys:`, Object.keys(req.body));
    console.log(`[Teams] 🔍 selectedRoles Value:`, selectedRoles);
    
    // Prüfe explizit auf selectedRoles
    const hasSelectedRoles = 'selectedRoles' in req.body;
    console.log(`[Teams] 🔍 Has selectedRoles:`, hasSelectedRoles);
    
    if (hasSelectedRoles) {
      console.log(`[Teams] 📋 Aktualisiere Rollen-Zuordnungen für Team ${id}`)
      
      // Erst alle bestehenden Zuordnungen für dieses Team löschen
      const { error: deleteError } = await supabase
        .from('team_rollen')
        .delete()
        .eq('team_id', id);
      
      if (deleteError) {
        console.error('[Teams] ❌ Fehler beim Löschen alter Rollen-Zuordnungen:', deleteError);
        return res.status(500).json({
          success: false,
          error: 'Fehler beim Aktualisieren der Rollen-Zuordnungen',
          details: deleteError.message
        });
      } else {
        console.log(`[Teams] ✅ Alte Rollen-Zuordnungen gelöscht`)
      }
      
      // Neue Zuordnungen erstellen, falls Rollen ausgewählt wurden
      if (selectedRoles && selectedRoles.length > 0) {
        // Erst die Rollen-Details aus rollen_stammdaten laden
        const { data: roleDetails, error: roleDetailsError } = await supabase
          .from('rollen_stammdaten')
          .select('*')
          .in('id', selectedRoles);
        
        if (roleDetailsError) {
          console.error('[Teams] ❌ Fehler beim Laden der Rollen-Details:', roleDetailsError);
          return res.status(500).json({
            success: false,
            error: 'Fehler beim Laden der Rollen-Details',
            details: roleDetailsError.message
          });
        }
        
        // Team-Rollen-Zuordnungen mit vollständigen Daten erstellen
        const roleAssignments = roleDetails.map(role => ({
          team_id: id,
          rolle_id: role.id,
          name: role.name,
          description: role.beschreibung,
          standard_hourly_rate: role.standard_stundensatz,
          permissions: JSON.stringify([]),
          is_active: true
        }));
        
        const { error: roleError } = await supabase
          .from('team_rollen')
          .insert(roleAssignments);
        
        if (roleError) {
          console.error('[Teams] ❌ Fehler beim Erstellen neuer Rollen-Zuordnungen:', roleError);
          return res.status(500).json({
            success: false,
            error: 'Fehler beim Aktualisieren der Rollen-Zuordnungen',
            details: roleError.message
          });
        }
        
        console.log(`[Teams] ✅ ${selectedRoles.length} Rollen erfolgreich zugeordnet`)
      } else {
        console.log(`[Teams] ✅ Alle Rollen-Zuordnungen entfernt`)
      }
    }
    
    res.json(data)

  } catch (error) {
    console.error('[Teams] ❌ Server-Fehler:', error)
    res.status(500).json({
      success: false,
      error: 'Server-Fehler beim Aktualisieren des Teams',
      details: error.message
    })
  }
})


/**
 * @route   DELETE /api/teams/:id
 * @desc    Team deaktivieren (soft delete)
 * @access  Private (SuperAdmin)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    console.log(`[Teams] 📥 DELETE /api/teams/${id}`)

    // Prüfe ob Team existiert
    const { data: existingTeam, error: checkError } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single()

    if (checkError || !existingTeam) {
      return res.status(404).json({
        success: false,
        error: 'Team nicht gefunden'
      })
    }

    // Prüfe ob Team in Verwendung ist (z.B. in Projekten)
    const { data: projectsUsingTeam, error: projectError } = await supabase
      .from('projekte')
      .select('id, projektnummer')
      .eq('team_id', id)
      .limit(5)

    if (projectError) {
      console.error('[Teams] ❌ Fehler beim Prüfen der Team-Verwendung:', projectError)
    }

    if (projectsUsingTeam && projectsUsingTeam.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Team kann nicht gelöscht werden, da es in Projekten verwendet wird',
        details: `Verwendet in ${projectsUsingTeam.length} Projekt(en): ${projectsUsingTeam.map(p => p.projektnummer).join(', ')}`
      })
    }

    // Team deaktivieren (soft delete)
    const { data, error } = await supabase
      .from('teams')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Teams] ❌ Fehler beim Deaktivieren des Teams:', error)
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Deaktivieren des Teams',
        details: error.message
      })
    }

    console.log(`[Teams] ✅ Team "${data.name}" deaktiviert`)
    res.json({
      success: true,
      message: 'Team erfolgreich deaktiviert',
      data
    })

  } catch (error) {
    console.error('[Teams] ❌ Server-Fehler:', error)
    res.status(500).json({
      success: false,
      error: 'Server-Fehler beim Deaktivieren des Teams',
      details: error.message
    })
  }
})

/**
 * @route   GET /api/teams/:id
 * @desc    Einzelnes Team abrufen
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    console.log(`[Teams] 📥 GET /api/teams/${id}`)

    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: 'Team nicht gefunden'
      })
    }

    console.log(`[Teams] ✅ Team "${data.name}" geladen`)
    res.json(data)

  } catch (error) {
    console.error('[Teams] ❌ Server-Fehler:', error)
    res.status(500).json({
      success: false,
      error: 'Server-Fehler beim Laden des Teams',
      details: error.message
    })
  }
})

export default router

