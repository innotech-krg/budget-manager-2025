// =====================================================
// Budget Manager 2025 - Team Roles Routes
// Epic 9 - Team-Rollen-Management für Projekte
// =====================================================

import express from 'express';
import { supabase } from '../config/database.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Middleware für Authentifizierung
router.use(authMiddleware.requireAuth);

// GET /api/team-roles/:teamId - Rollen für ein Team abrufen
router.get('/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    
    console.log(`[Team-Roles] 📥 GET /api/team-roles/${teamId}`);

    // Team-Rollen mit Details abrufen
    const { data: teamRoles, error } = await supabase
      .from('team_rollen')
      .select(`
        rolle_id,
        rollen_stammdaten (
          id,
          name,
          kategorie,
          standard_stundensatz,
          min_stundensatz,
          max_stundensatz,
          beschreibung,
          farbe
        )
      `)
      .eq('team_id', teamId);

    if (error) {
      console.error(`[Team-Roles] ❌ Fehler beim Laden der Team-Rollen:`, error);
      return res.status(500).json({
        success: false,
        message: 'Fehler beim Laden der Team-Rollen',
        error: error.message
      });
    }

    // Daten transformieren
    const roles = teamRoles.map(tr => ({
      id: tr.rollen_stammdaten.id,
      name: tr.rollen_stammdaten.name,
      kategorie: tr.rollen_stammdaten.kategorie,
      standard_stundensatz: parseFloat(tr.rollen_stammdaten.standard_stundensatz),
      min_stundensatz: parseFloat(tr.rollen_stammdaten.min_stundensatz),
      max_stundensatz: parseFloat(tr.rollen_stammdaten.max_stundensatz),
      beschreibung: tr.rollen_stammdaten.beschreibung,
      farbe: tr.rollen_stammdaten.farbe
    }));

    console.log(`[Team-Roles] ✅ ${roles.length} Rollen für Team ${teamId} geladen`);

    res.json({
      success: true,
      data: roles
    });

  } catch (error) {
    console.error(`[Team-Roles] ❌ Server-Fehler:`, error);
    res.status(500).json({
      success: false,
      message: 'Interner Server-Fehler',
      error: error.message
    });
  }
});

// GET /api/team-roles/all/roles - Alle verfügbaren Rollen abrufen
router.get('/all/roles', async (req, res) => {
  try {
    console.log(`[Team-Roles] 📥 GET /api/team-roles/all/roles`);

    const { data: roles, error } = await supabase
      .from('rollen_stammdaten')
      .select('*')
      .eq('ist_aktiv', true)
      .order('kategorie', { ascending: true })
      .order('standard_stundensatz', { ascending: false });

    if (error) {
      console.error(`[Team-Roles] ❌ Fehler beim Laden aller Rollen:`, error);
      return res.status(500).json({
        success: false,
        message: 'Fehler beim Laden der Rollen',
        error: error.message
      });
    }

    // Stundensätze zu Zahlen konvertieren
    const processedRoles = roles.map(role => ({
      ...role,
      standard_stundensatz: parseFloat(role.standard_stundensatz),
      min_stundensatz: parseFloat(role.min_stundensatz),
      max_stundensatz: parseFloat(role.max_stundensatz)
    }));

    console.log(`[Team-Roles] ✅ ${processedRoles.length} Rollen geladen`);

    res.json({
      success: true,
      data: processedRoles
    });

  } catch (error) {
    console.error(`[Team-Roles] ❌ Server-Fehler:`, error);
    res.status(500).json({
      success: false,
      message: 'Interner Server-Fehler',
      error: error.message
    });
  }
});

export default router;



