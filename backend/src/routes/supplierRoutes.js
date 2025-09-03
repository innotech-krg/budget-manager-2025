// =====================================================
// Supplier Routes - API für österreichische Lieferanten
// Ersetzt dienstleister für Projekt-Anlage
// =====================================================

import express from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';
import { supabaseAdmin } from '../config/database.js';
import { createAuditLog } from '../utils/auditLogger.js';

const router = express.Router();

// =====================================================
// VALIDATION RULES
// =====================================================

const supplierValidation = [
  body('name')
    .notEmpty()
    .withMessage('Lieferantenname ist erforderlich')
    .isLength({ min: 2, max: 255 })
    .withMessage('Lieferantenname muss zwischen 2 und 255 Zeichen lang sein'),
  body('uid_number')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('UID-Nummer muss zwischen 3 und 20 Zeichen lang sein'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Ungültige E-Mail-Adresse'),
  body('iban')
    .optional()
    .matches(/^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/)
    .withMessage('IBAN muss gültiges internationales Format haben (z.B. AT61... oder DE89...)'),
  body('status')
    .optional()
    .isIn(['ACTIVE', 'INACTIVE'])
    .withMessage('Status muss ACTIVE oder INACTIVE sein')
];

// =====================================================
// ROUTES
// =====================================================

/**
 * @route   GET /api/suppliers
 * @desc    Liste aller aktiven Lieferanten für Projekt-Anlage
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const { status = 'ACTIVE', limit = 100, search } = req.query;

    let query = supabaseAdmin
      .from('suppliers')
      .select(`
        id,
        name,
        business_sector,
        legal_form,
        uid_number,
        email,
        status,
        country,
        ocr_recognized,
        created_at
      `)
      .eq('status', status)
      .order('name');

    // Suchfilter
    if (search) {
      query = query.or(`name.ilike.%${search}%,business_sector.ilike.%${search}%`);
    }

    // Limit
    if (limit && limit !== 'all') {
      query = query.limit(parseInt(limit));
    }

    const { data: suppliers, error } = await query;

    if (error) {
      console.error('❌ Fehler beim Abrufen der Lieferanten:', error);
      return res.status(500).json({
        success: false,
        error: 'Interner Serverfehler',
        message: 'Fehler beim Abrufen der Lieferanten.',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }

    // Frontend-Kompatibilität: is_active aus status ableiten
    const suppliersWithIsActive = suppliers.map(supplier => ({
      ...supplier,
      is_active: supplier.status === 'ACTIVE'
    }));

    res.status(200).json({
      success: true,
      data: suppliersWithIsActive,
      count: suppliersWithIsActive.length
    });

  } catch (error) {
    console.error('❌ Unerwarteter Fehler beim Abrufen der Lieferanten:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler',
      message: 'Ein unerwarteter Fehler ist aufgetreten.',
      code: 'UNEXPECTED_ERROR'
    });
  }
});

/**
 * @route   GET /api/suppliers/:id
 * @desc    Einzelnen Lieferanten abrufen
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: supplier, error } = await supabaseAdmin
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: 'Lieferant nicht gefunden',
        message: `Kein Lieferant mit der ID ${id} gefunden.`,
        code: 'SUPPLIER_NOT_FOUND'
      });
    } else if (error) {
      console.error('❌ Fehler beim Abrufen des Lieferanten:', error);
      return res.status(500).json({
        success: false,
        error: 'Interner Serverfehler',
        message: 'Fehler beim Abrufen des Lieferanten.',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }

    res.status(200).json({
      success: true,
      data: supplier
    });

  } catch (error) {
    console.error('❌ Unerwarteter Fehler beim Abrufen des Lieferanten:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler',
      message: 'Ein unerwarteter Fehler ist aufgetreten.',
      code: 'UNEXPECTED_ERROR'
    });
  }
});

/**
 * @route   POST /api/suppliers
 * @desc    Neuen Lieferanten anlegen
 * @access  Private
 */
router.post('/', supplierValidation, validateRequest, async (req, res) => {
  try {
    const {
      name,
      business_sector,
      legal_form,
      uid_number,
      tax_number,
      fb_number,
      address,
      postal_code,
      city,
      email,
      phone,
      website,
      iban,
      bic,
      bank_name
    } = req.body;

    // Normalisierter Name für Duplikat-Prüfung
    const normalizedName = name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\säöüß]/g, '');

    // Prüfe auf Duplikate
    const { data: existingSupplier } = await supabaseAdmin
      .from('suppliers')
      .select('id, name')
      .eq('normalized_name', normalizedName)
      .single();

    if (existingSupplier) {
      return res.status(409).json({
        success: false,
        error: 'Lieferant bereits vorhanden',
        message: `Ein Lieferant mit dem Namen "${existingSupplier.name}" existiert bereits.`,
        code: 'SUPPLIER_ALREADY_EXISTS',
        existing_supplier: existingSupplier
      });
    }

    // Neuen Lieferanten anlegen
    const supplierData = {
      name: name.trim(),
      normalized_name: normalizedName,
      business_sector,
      legal_form,
      uid_number,
      tax_number,
      fb_number,
      address,
      postal_code,
      city,
      country: 'AT', // Standard, kann später angepasst werden
      email,
      phone,
      website,
      iban,
      bic,
      bank_name,
      status: 'ACTIVE',
      ocr_recognized: false,
      created_by: 'manual'
    };

    const { data: newSupplier, error } = await supabaseAdmin
      .from('suppliers')
      .insert([supplierData])
      .select()
      .single();

    if (error) {
      console.error('❌ Fehler beim Anlegen des Lieferanten:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Anlegen',
        message: 'Der Lieferant konnte nicht angelegt werden.',
        code: 'CREATE_FAILED'
      });
    }

    // Audit Log
    await createAuditLog({
      table_name: 'suppliers',
      record_id: newSupplier.id,
      action: 'MANUAL_CREATE',
      new_data: supplierData,
      user_id: 'manual'
    });

    res.status(201).json({
      success: true,
      message: 'Lieferant erfolgreich angelegt.',
      data: newSupplier
    });

  } catch (error) {
    console.error('❌ Fehler beim Anlegen des Lieferanten:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler',
      message: 'Ein unerwarteter Fehler ist aufgetreten.',
      code: 'UNEXPECTED_ERROR'
    });
  }
});

/**
 * @route   PUT /api/suppliers/:id
 * @desc    Lieferanten aktualisieren
 * @access  Private
 */
router.put('/:id', supplierValidation, validateRequest, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Normalisierter Name aktualisieren
    if (updateData.name) {
      updateData.normalized_name = updateData.name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\säöüß]/g, '');
    }

    updateData.updated_at = new Date().toISOString();

    const { data: updatedSupplier, error } = await supabaseAdmin
      .from('suppliers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error && error.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: 'Lieferant nicht gefunden',
        code: 'SUPPLIER_NOT_FOUND'
      });
    } else if (error) {
      console.error('❌ Fehler beim Update des Lieferanten:', error);
      return res.status(500).json({
        success: false,
        error: 'Update fehlgeschlagen',
        code: 'UPDATE_FAILED'
      });
    }

    // Audit Log
    await createAuditLog({
      table_name: 'suppliers',
      record_id: id,
      action: 'MANUAL_UPDATE',
      new_data: updateData,
      user_id: 'manual'
    });

    res.status(200).json({
      success: true,
      message: 'Lieferant erfolgreich aktualisiert.',
      data: updatedSupplier
    });

  } catch (error) {
    console.error('❌ Fehler beim Update des Lieferanten:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler',
      code: 'UNEXPECTED_ERROR'
    });
  }
});

/**
 * @route   DELETE /api/suppliers/:id
 * @desc    Lieferanten deaktivieren (Soft Delete)
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Prüfe ob Lieferant in Projekten verwendet wird
    const { data: projectsUsing, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, name')
      .eq('supplier_id', id)
      .limit(5);

    if (projectError) {
      console.error('❌ Fehler beim Prüfen der Projekt-Verwendung:', projectError);
      return res.status(500).json({
        success: false,
        error: 'Prüfung fehlgeschlagen',
        code: 'CHECK_FAILED'
      });
    }

    if (projectsUsing && projectsUsing.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Lieferant wird verwendet',
        message: `Der Lieferant wird in ${projectsUsing.length} Projekt(en) verwendet und kann nicht gelöscht werden.`,
        code: 'SUPPLIER_IN_USE',
        projects: projectsUsing
      });
    }

    // Soft Delete (Status auf INACTIVE setzen)
    const { data: deactivatedSupplier, error } = await supabaseAdmin
      .from('suppliers')
      .update({ 
        status: 'INACTIVE',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error && error.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: 'Lieferant nicht gefunden',
        code: 'SUPPLIER_NOT_FOUND'
      });
    } else if (error) {
      console.error('❌ Fehler beim Deaktivieren des Lieferanten:', error);
      return res.status(500).json({
        success: false,
        error: 'Deaktivierung fehlgeschlagen',
        code: 'DEACTIVATION_FAILED'
      });
    }

    // Audit Log
    await createAuditLog({
      table_name: 'suppliers',
      record_id: id,
      action: 'MANUAL_DEACTIVATE',
      new_data: { status: 'INACTIVE' },
      user_id: 'manual'
    });

    res.status(200).json({
      success: true,
      message: 'Lieferant erfolgreich deaktiviert.',
      data: deactivatedSupplier
    });

  } catch (error) {
    console.error('❌ Fehler beim Deaktivieren des Lieferanten:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler',
      code: 'UNEXPECTED_ERROR'
    });
  }
});

/**
 * @route   GET /api/suppliers/stats
 * @desc    Lieferanten-Statistiken
 * @access  Private
 */
router.get('/stats', async (req, res) => {
  try {
    const { data: stats, error } = await supabaseAdmin
      .from('suppliers')
      .select('status, ocr_recognized, country, legal_form');

    if (error) {
      console.error('❌ Fehler beim Abrufen der Statistiken:', error);
      return res.status(500).json({
        success: false,
        error: 'Statistik-Fehler',
        code: 'STATS_ERROR'
      });
    }

    const supplierStats = {
      total: stats.length,
      active: stats.filter(s => s.status === 'ACTIVE').length,
      inactive: stats.filter(s => s.status === 'INACTIVE').length,
      ocrRecognized: stats.filter(s => s.ocr_recognized).length,
      manuallyCreated: stats.filter(s => !s.ocr_recognized).length,
      austrian: stats.filter(s => s.country === 'AT').length,
      byLegalForm: stats.reduce((acc, s) => {
        if (s.legal_form) {
          acc[s.legal_form] = (acc[s.legal_form] || 0) + 1;
        }
        return acc;
      }, {})
    };

    res.status(200).json({
      success: true,
      data: supplierStats
    });

  } catch (error) {
    console.error('❌ Fehler bei Lieferanten-Statistiken:', error);
    res.status(500).json({
      success: false,
      error: 'Interner Serverfehler',
      code: 'UNEXPECTED_ERROR'
    });
  }
});

// =====================================================
// API INFO ROUTE
// =====================================================

router.get('/api', (req, res) => {
  res.json({
    service: 'Suppliers API',
    version: '1.0.0',
    description: 'Österreichische Lieferanten-Verwaltung für Projekt-Anlage',
    endpoints: {
      list: 'GET /api/suppliers',
      get: 'GET /api/suppliers/:id',
      create: 'POST /api/suppliers',
      update: 'PUT /api/suppliers/:id',
      deactivate: 'DELETE /api/suppliers/:id',
      stats: 'GET /api/suppliers/stats'
    },
    features: [
      'Österreich-spezifische Validierung (UID, IBAN)',
      'Duplikat-Erkennung über normalisierten Namen',
      'OCR-Integration für automatische Erkennung',
      'Soft Delete (Deaktivierung statt Löschung)',
      'Vollständige Audit-Logs',
      'Projekt-Verwendung-Prüfung vor Löschung'
    ],
    internationalFeatures: [
      'Internationale UID-Nummer Validierung (3-20 Zeichen)',
      'Internationale IBAN Validierung (alle EU-Länder)',
      'Flexible Rechtsformen (GmbH, AG, KG, Ltd, etc.)',
      'Firmenbuchnummer Support',
      'Deutsche Umlaute Support',
      'Multi-Country Support'
    ]
  });
});

export default router;
