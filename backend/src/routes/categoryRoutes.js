// =====================================================
// Budget Manager 2025 - Category Routes
// Epic 8 - Story 8.7: Entitäten-Verwaltung (Categories)
// =====================================================

import express from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';
import { requireAuth, requireSuperAdmin } from '../middleware/authMiddleware.js';
import { supabaseAdmin } from '../config/database.js';

const router = express.Router();

// =====================================================
// MIDDLEWARE - Authentifizierung erforderlich
// =====================================================
router.use(requireAuth);

// =====================================================
// VALIDATION RULES
// =====================================================

const categoryValidation = [
  body('name')
    .notEmpty()
    .withMessage('Kategorie-Name ist erforderlich')
    .isLength({ min: 2, max: 100 })
    .withMessage('Kategorie-Name muss zwischen 2 und 100 Zeichen lang sein'),
  // beschreibung field not available in current schema
  body('parent_kategorie_id')
    .optional()
    .isUUID()
    .withMessage('Parent-ID muss eine gültige UUID sein'),
  body('aktiv')
    .optional()
    .isBoolean()
    .withMessage('aktiv muss ein Boolean-Wert sein')
];

// =====================================================
// ROUTES
// =====================================================

/**
 * GET /api/kategorien
 * Alle Kategorien auflisten
 */
router.get('/', async (req, res) => {
  try {
    console.log('📥 [Categories] GET /api/categories');

    const { parent_id, active_only } = req.query;

    // Lade alle Projekt-Kategorien aus kategorien Tabelle
    let query = supabaseAdmin
      .from('kategorien')
      .select('*') // Alle Spalten laden
      .eq('kategorie_typ', 'PROJECT') // Nur Projekt-Kategorien
      .order('name', { ascending: true });

    // Filter nach Parent-Kategorie
    if (parent_id) {
      if (parent_id === 'null') {
        query = query.is('parent_kategorie_id', null);
      } else {
        query = query.eq('parent_kategorie_id', parent_id);
      }
    }

    // Filter nur aktive Kategorien
    if (active_only === 'true') {
      query = query.eq('is_active', true); // Korrekte Spaltenname
    }

    const { data: kategorien, error } = await query;

    if (error) {
      console.error('❌ [Categories] Fehler beim Laden der Kategorien:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Laden der Kategorien',
        code: 'DATABASE_ERROR'
      });
    }

    // Konvertiere zu Frontend-Format (nur verfügbare Felder verwenden)
    const categories = kategorien.map(kat => ({
      id: kat.id,
      name: kat.name,
      description: kat.description || null, // Verwende nur description, nicht beschreibung
      parent_id: kat.parent_id,
      kategorie_typ: kat.kategorie_typ,
      sortierung: kat.sortierung,
      is_active: kat.is_active,
      items_count: 0, // Placeholder
      created_at: kat.created_at
    }));

    console.log(`✅ [Categories] ${categories.length} Projekt-Kategorien geladen`);

    res.json({
      success: true,
      data: categories,
      count: categories.length
    });

  } catch (error) {
    console.error('❌ [Categories] Fehler beim Laden der Kategorien:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Server-Fehler',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/kategorien/:id
 * Einzelne Kategorie laden
 */
router.get('/:id', [
  param('id').isUUID().withMessage('Kategorie-ID muss eine gültige UUID sein'),
  validateRequest
], async (req, res) => {
  try {
    console.log(`📥 [Categories] GET /api/kategorien/${req.params.id}`);

    const { data: category, error } = await supabaseAdmin
      .from('kategorien')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !category) {
      return res.status(404).json({
        success: false,
        error: 'Kategorie nicht gefunden',
        code: 'CATEGORY_NOT_FOUND'
      });
    }

    // Unterkategorien laden
    const { data: children, error: childrenError } = await supabaseAdmin
      .from('kategorien')
      .select('id, name, aktiv')
      .eq('parent_kategorie_id', req.params.id)
      .order('name', { ascending: true });

    if (childrenError) {
      console.error('❌ [Categories] Fehler beim Laden der Unterkategorien:', childrenError);
    }

    category.children = children || [];

    console.log(`✅ [Categories] Kategorie geladen: ${category.name}`);

    res.json({
      success: true,
      data: category
    });

  } catch (error) {
    console.error('❌ [Categories] Fehler beim Laden der Kategorie:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Server-Fehler',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/kategorien
 * Neue Kategorie erstellen (nur SuperAdmin)
 */
router.post('/', [
  requireSuperAdmin,
  ...categoryValidation,
  validateRequest
], async (req, res) => {
  try {
    console.log('📥 [Categories] POST /api/kategorien - Neue Kategorie erstellen');

    const { name, kategorie_typ = 'PROJECT', sortierung = 0, is_active = true, parent_id } = req.body;

    // Level berechnen (falls parent_id vorhanden)
    let level = 0;
    if (parent_id) {
      const { data: parent, error: parentError } = await supabaseAdmin
        .from('kategorien')
        .select('level')
        .eq('id', parent_id)
        .single();

      if (parentError || !parent) {
        return res.status(400).json({
          success: false,
          error: 'Parent-Kategorie nicht gefunden',
          code: 'PARENT_NOT_FOUND'
        });
      }

      level = parent.level + 1;
    }

    // Kategorie erstellen
    const { data: category, error } = await supabaseAdmin
      .from('kategorien')
      .insert({
        name,
        kategorie_typ,
        parent_id: parent_id || null,
        sortierung,
        is_active
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [Categories] Fehler beim Erstellen der Kategorie:', error);
      
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({
          success: false,
          error: 'Eine Kategorie mit diesem Namen existiert bereits',
          code: 'DUPLICATE_NAME'
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Fehler beim Erstellen der Kategorie',
        code: 'CREATION_ERROR'
      });
    }

    console.log(`✅ [Categories] Kategorie erstellt: ${category.name}`);

    res.status(201).json({
      success: true,
      message: 'Kategorie erfolgreich erstellt',
      data: category
    });

  } catch (error) {
    console.error('❌ [Categories] Fehler beim Erstellen der Kategorie:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Server-Fehler',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * PUT /api/kategorien/:id
 * Kategorie aktualisieren (nur SuperAdmin)
 */
router.put('/:id', [
  requireSuperAdmin,
  param('id').isUUID().withMessage('Kategorie-ID muss eine gültige UUID sein'),
  ...categoryValidation,
  validateRequest
], async (req, res) => {
  try {
    console.log(`📥 [Categories] PUT /api/kategorien/${req.params.id} - Kategorie aktualisieren`);

    const { name,  parent_kategorie_id, aktiv } = req.body;

    // Prüfen ob Kategorie existiert
    const { data: existingCategory, error: existingError } = await supabaseAdmin
      .from('kategorien')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (existingError || !existingCategory) {
      return res.status(404).json({
        success: false,
        error: 'Kategorie nicht gefunden',
        code: 'CATEGORY_NOT_FOUND'
      });
    }

    // Zirkuläre Referenz verhindern
    if (parent_kategorie_id && parent_kategorie_id === req.params.id) {
      return res.status(400).json({
        success: false,
        error: 'Eine Kategorie kann nicht ihr eigenes Parent sein',
        code: 'CIRCULAR_REFERENCE'
      });
    }

    // Level neu berechnen falls Parent geändert wird
    let level = existingCategory.level;
    if (parent_kategorie_id !== existingCategory.parent_kategorie_id) {
      if (parent_kategorie_id) {
        const { data: parent, error: parentError } = await supabaseAdmin
          .from('kategorien')
          .select('level')
          .eq('id', parent_kategorie_id)
          .single();

        if (parentError || !parent) {
          return res.status(400).json({
            success: false,
            error: 'Parent-Kategorie nicht gefunden',
            code: 'PARENT_NOT_FOUND'
          });
        }

        level = parent.level + 1;
      } else {
        level = 0;
      }
    }

    // Kategorie aktualisieren
    const { data: category, error } = await supabaseAdmin
      .from('kategorien')
      .update({
        name,
        
        parent_kategorie_id: parent_kategorie_id || null,
        level,
        aktiv,
        updated_at: new Date().toISOString(),
        updated_by: req.user.id
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('❌ [Categories] Fehler beim Aktualisieren der Kategorie:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Aktualisieren der Kategorie',
        code: 'UPDATE_ERROR'
      });
    }

    console.log(`✅ [Categories] Kategorie aktualisiert: ${category.name}`);

    res.json({
      success: true,
      message: 'Kategorie erfolgreich aktualisiert',
      data: category
    });

  } catch (error) {
    console.error('❌ [Categories] Fehler beim Aktualisieren der Kategorie:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Server-Fehler',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * DELETE /api/kategorien/:id
 * Kategorie löschen (nur SuperAdmin)
 */
router.delete('/:id', [
  requireSuperAdmin,
  param('id').isUUID().withMessage('Kategorie-ID muss eine gültige UUID sein'),
  validateRequest
], async (req, res) => {
  try {
    console.log(`📥 [Categories] DELETE /api/kategorien/${req.params.id} - Kategorie löschen`);

    // Prüfen ob Kategorie existiert
    const { data: category, error: categoryError } = await supabaseAdmin
      .from('kategorien')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (categoryError || !category) {
      return res.status(404).json({
        success: false,
        error: 'Kategorie nicht gefunden',
        code: 'CATEGORY_NOT_FOUND'
      });
    }

    // Prüfen ob Unterkategorien existieren
    const { data: children, error: childrenError } = await supabaseAdmin
      .from('kategorien')
      .select('id')
      .eq('parent_kategorie_id', req.params.id);

    if (childrenError) {
      console.error('❌ [Categories] Fehler beim Prüfen der Unterkategorien:', childrenError);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Prüfen der Unterkategorien',
        code: 'CHECK_ERROR'
      });
    }

    if (children && children.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Kategorie kann nicht gelöscht werden, da Unterkategorien existieren',
        code: 'HAS_CHILDREN'
      });
    }

    // Kategorie löschen
    const { error: deleteError } = await supabaseAdmin
      .from('kategorien')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) {
      console.error('❌ [Categories] Fehler beim Löschen der Kategorie:', deleteError);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Löschen der Kategorie',
        code: 'DELETE_ERROR'
      });
    }

    console.log(`✅ [Categories] Kategorie gelöscht: ${category.name}`);

    res.json({
      success: true,
      message: 'Kategorie erfolgreich gelöscht'
    });

  } catch (error) {
    console.error('❌ [Categories] Fehler beim Löschen der Kategorie:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Server-Fehler',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;
