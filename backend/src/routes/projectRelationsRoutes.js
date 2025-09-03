// =====================================================
// Budget Manager 2025 - Project Relations Routes
// Epic 9: APIs für Projekt-Team und Projekt-Supplier Relationen
// =====================================================

import express from 'express';
import { supabaseAdmin } from '../config/database.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Middleware für Authentifizierung - TEMPORÄR DEAKTIVIERT FÜR TESTS
// router.use(authMiddleware.requireAuth);

/**
 * GET /api/projects/:projectId/teams
 * Lade alle Team-Relationen für ein Projekt
 */
router.get('/:projectId/teams', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const { data: projectTeams, error } = await supabaseAdmin
      .from('project_teams')
      .select(`
        *,
        teams:team_id(id, name),
        project_team_roles(
          *,
          rollen_stammdaten:rolle_id(id, name, kategorie, standard_stundensatz)
        )
      `)
      .eq('project_id', projectId);
    
    if (error) {
      console.error('Fehler beim Laden der Projekt-Teams:', error);
      return res.status(500).json({ error: 'Fehler beim Laden der Team-Relationen' });
    }
    
    res.json(projectTeams || []);
  } catch (err) {
    console.error('Projekt-Teams API Fehler:', err);
    res.status(500).json({ error: 'Interner Server-Fehler' });
  }
});

/**
 * POST /api/projects/:projectId/teams
 * Team zu einem Projekt zuordnen
 */
router.post('/:projectId/teams', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { team_id, is_lead_team, estimated_hours, estimated_cost } = req.body;
    
    // Validierung
    if (!team_id) {
      return res.status(400).json({ error: 'team_id ist erforderlich' });
    }
    
    const { data: newProjectTeam, error } = await supabaseAdmin
      .from('project_teams')
      .insert({
        project_id: projectId,
        team_id: team_id,
        is_lead_team: is_lead_team || false,
        estimated_hours: estimated_hours || 0,
        estimated_cost: estimated_cost || 0
      })
      .select(`
        *,
        teams:team_id(id, name)
      `)
      .single();
    
    if (error) {
      console.error('Fehler beim Zuordnen des Teams:', error);
      return res.status(500).json({ error: 'Fehler beim Zuordnen des Teams' });
    }
    
    console.log(`✅ Team ${team_id} zu Projekt ${projectId} zugeordnet`);
    res.status(201).json(newProjectTeam);
  } catch (err) {
    console.error('Team-Zuordnung API Fehler:', err);
    res.status(500).json({ error: 'Interner Server-Fehler' });
  }
});

/**
 * GET /api/projects/:projectId/suppliers
 * Lade alle Supplier-Relationen für ein Projekt
 */
router.get('/:projectId/suppliers', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const { data: projectSuppliers, error } = await supabaseAdmin
      .from('project_suppliers')
      .select(`
        *,
        suppliers:supplier_id(id, name, email, phone)
      `)
      .eq('project_id', projectId);
    
    if (error) {
      console.error('Fehler beim Laden der Projekt-Suppliers:', error);
      return res.status(500).json({ error: 'Fehler beim Laden der Supplier-Relationen' });
    }
    
    res.json(projectSuppliers || []);
  } catch (err) {
    console.error('Projekt-Suppliers API Fehler:', err);
    res.status(500).json({ error: 'Interner Server-Fehler' });
  }
});

/**
 * POST /api/projects/:projectId/suppliers
 * Supplier zu einem Projekt zuordnen
 */
router.post('/:projectId/suppliers', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { supplier_id, allocated_budget, description } = req.body;
    
    // Validierung
    if (!supplier_id) {
      return res.status(400).json({ error: 'supplier_id ist erforderlich' });
    }
    
    const { data: newProjectSupplier, error } = await supabaseAdmin
      .from('project_suppliers')
      .insert({
        project_id: projectId,
        supplier_id: supplier_id,
        allocated_budget: allocated_budget || 0,
        consumed_budget: 0,
        is_active: true
      })
      .select(`
        *,
        suppliers:supplier_id(id, name, email, phone)
      `)
      .single();
    
    if (error) {
      console.error('Fehler beim Zuordnen des Suppliers:', error);
      return res.status(500).json({ error: 'Fehler beim Zuordnen des Suppliers' });
    }
    
    console.log(`✅ Supplier ${supplier_id} zu Projekt ${projectId} zugeordnet`);
    res.status(201).json(newProjectSupplier);
  } catch (err) {
    console.error('Supplier-Zuordnung API Fehler:', err);
    res.status(500).json({ error: 'Interner Server-Fehler' });
  }
});

/**
 * GET /api/projects/:projectId/budget-calculations
 * Lade Budget-Berechnungen für ein Projekt
 */
router.get('/:projectId/budget-calculations', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const { data: budgetCalc, error } = await supabaseAdmin
      .from('project_budget_calculations')
      .select('*')
      .eq('project_id', projectId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Fehler beim Laden der Budget-Berechnungen:', error);
      return res.status(500).json({ error: 'Fehler beim Laden der Budget-Berechnungen' });
    }
    
    res.json(budgetCalc || null);
  } catch (err) {
    console.error('Budget-Berechnungen API Fehler:', err);
    res.status(500).json({ error: 'Interner Server-Fehler' });
  }
});

export default router;


