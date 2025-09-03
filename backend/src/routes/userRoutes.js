// =====================================================
// Budget Manager 2025 - User Management Routes
// Epic 8 - Benutzerverwaltung CRUD
// =====================================================

import express from 'express';
import { supabaseAdmin } from '../config/database.js';
import { requireAuth, requireSuperAdmin } from '../middleware/authMiddleware.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const router = express.Router();

// =====================================================
// GET /api/users - Alle Benutzer abrufen
// =====================================================
router.get('/', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    console.log('[Users] 📥 GET /api/users');

    // Benutzer aus user_profiles abrufen
    const { data: users, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Users] ❌ Fehler beim Abrufen der Benutzer:', error);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Abrufen der Benutzer',
        details: error.message
      });
    }

    console.log(`[Users] ✅ ${users?.length || 0} Benutzer abgerufen`);
    res.json({
      success: true,
      data: users || []
    });

  } catch (error) {
    console.error('[Users] ❌ Server-Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Server-Fehler beim Abrufen der Benutzer',
      details: error.message
    });
  }
});

// =====================================================
// POST /api/users - Neuen Benutzer erstellen
// =====================================================
router.post('/', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { email, password, firstName, lastName, first_name, last_name, role = 'USER' } = req.body;
    // Support both naming conventions
    const finalFirstName = firstName || first_name;
    const finalLastName = lastName || last_name;
    console.log(`[Users] 📥 POST /api/users - Erstelle Benutzer: ${email}`);

    // Validierung
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'E-Mail und Passwort sind erforderlich'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Passwort muss mindestens 8 Zeichen lang sein'
      });
    }

    if (!['SUPERADMIN', 'USER'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Ungültige Rolle. Erlaubt: SUPERADMIN, USER'
      });
    }

    // 1. Benutzer in auth.users erstellen
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name: finalFirstName || '',
        last_name: finalLastName || '',
        role: role
      }
    });

    if (authError) {
      console.error('[Users] ❌ Fehler beim Erstellen des Auth-Users:', authError);
      return res.status(400).json({
        success: false,
        error: 'Fehler beim Erstellen des Benutzers',
        details: authError.message
      });
    }

    // 2. Profil in user_profiles erstellen
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authUser.user.id,
        email: email,
        first_name: finalFirstName || null,
        last_name: finalLastName || null,
        role: role,
        is_active: true,
        mfa_enabled: false
      })
      .select()
      .single();

    if (profileError) {
      console.error('[Users] ❌ Fehler beim Erstellen des Profils:', profileError);
      
      // Rollback: Auth-User löschen
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Erstellen des Benutzer-Profils',
        details: profileError.message
      });
    }

    console.log(`[Users] ✅ Benutzer '${email}' erfolgreich erstellt`);
    res.status(201).json({
      success: true,
      message: `Benutzer '${email}' erfolgreich erstellt`,
      data: userProfile
    });

  } catch (error) {
    console.error('[Users] ❌ Server-Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Server-Fehler beim Erstellen des Benutzers',
      details: error.message
    });
  }
});

// =====================================================
// PUT /api/users/:id - Benutzer aktualisieren
// =====================================================
router.put('/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, first_name, last_name, role, is_active, isActive, mfa_enabled } = req.body;
    // Support both naming conventions
    const finalFirstName = firstName || first_name;
    const finalLastName = lastName || last_name;
    const finalIsActive = isActive !== undefined ? isActive : is_active;
    console.log(`[Users] 📥 PUT /api/users/${id}`);

    // Validierung
    if (role && !['SUPERADMIN', 'USER'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Ungültige Rolle. Erlaubt: SUPERADMIN, USER'
      });
    }

    // Prüfe ob Benutzer existiert
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existingUser) {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }

    // Verhindere Selbst-Deaktivierung des letzten SuperAdmins
    if (existingUser.role === 'SUPERADMIN' && (role === 'USER' || finalIsActive === false)) {
      const { data: superAdmins, error: countError } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('role', 'SUPERADMIN')
        .eq('is_active', true);

      if (!countError && superAdmins && superAdmins.length <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Mindestens ein aktiver SuperAdmin muss vorhanden bleiben'
        });
      }
    }

    // Benutzer-Profil aktualisieren
    const updateData = {};
    if (finalFirstName !== undefined) updateData.first_name = finalFirstName;
    if (finalLastName !== undefined) updateData.last_name = finalLastName;
    if (role !== undefined) updateData.role = role;
    if (finalIsActive !== undefined) updateData.is_active = finalIsActive;
    if (mfa_enabled !== undefined) updateData.mfa_enabled = mfa_enabled;
    updateData.updated_at = new Date().toISOString();

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error('[Users] ❌ Fehler beim Aktualisieren des Benutzers:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Aktualisieren des Benutzers',
        details: updateError.message
      });
    }

    // Rollen-Änderung protokollieren
    if (role && role !== existingUser.role) {
      await supabaseAdmin
        .from('role_change_log')
        .insert({
          user_id: id,
          old_role: existingUser.role,
          new_role: role,
          changed_by: req.user.id,
          reason: 'Admin-Update via API'
        });
    }

    console.log(`[Users] ✅ Benutzer '${existingUser.email}' erfolgreich aktualisiert`);
    res.json({
      success: true,
      message: `Benutzer '${existingUser.email}' erfolgreich aktualisiert`,
      data: updatedUser
    });

  } catch (error) {
    console.error('[Users] ❌ Server-Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Server-Fehler beim Aktualisieren des Benutzers',
      details: error.message
    });
  }
});

// =====================================================
// DELETE /api/users/:id - Benutzer löschen
// =====================================================
router.delete('/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Users] 📥 DELETE /api/users/${id}`);

    // Prüfe ob Benutzer existiert
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existingUser) {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }

    // Verhindere Löschung des letzten SuperAdmins
    if (existingUser.role === 'SUPERADMIN') {
      const { data: superAdmins, error: countError } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('role', 'SUPERADMIN')
        .eq('is_active', true);

      if (!countError && superAdmins && superAdmins.length <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Der letzte SuperAdmin kann nicht gelöscht werden'
        });
      }
    }

    // Verhindere Selbstlöschung
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Sie können sich nicht selbst löschen'
      });
    }

    // 1. Profil löschen (CASCADE löscht auch role_change_log)
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', id);

    if (profileError) {
      console.error('[Users] ❌ Fehler beim Löschen des Profils:', profileError);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Löschen des Benutzer-Profils',
        details: profileError.message
      });
    }

    // 2. Auth-User löschen
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (authError) {
      console.error('[Users] ❌ Fehler beim Löschen des Auth-Users:', authError);
      // Profil ist bereits gelöscht, aber Auth-User noch da - das ist ein Problem
      // In Produktion sollte hier ein Cleanup-Job laufen
    }

    console.log(`[Users] ✅ Benutzer '${existingUser.email}' erfolgreich gelöscht`);
    res.json({
      success: true,
      message: `Benutzer '${existingUser.email}' erfolgreich gelöscht`
    });

  } catch (error) {
    console.error('[Users] ❌ Server-Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Server-Fehler beim Löschen des Benutzers',
      details: error.message
    });
  }
});

// =====================================================
// POST /api/users/:id/reset-password - Passwort zurücksetzen
// =====================================================
router.post('/:id/reset-password', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;
    console.log(`[Users] 📥 POST /api/users/${id}/reset-password`);

    if (!new_password || new_password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Neues Passwort muss mindestens 8 Zeichen lang sein'
      });
    }

    // Prüfe ob Benutzer existiert
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('user_profiles')
      .select('email')
      .eq('id', id)
      .single();

    if (checkError || !existingUser) {
      return res.status(404).json({
        success: false,
        error: 'Benutzer nicht gefunden'
      });
    }

    // Passwort über Supabase Admin API zurücksetzen
    const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password: new_password
    });

    if (passwordError) {
      console.error('[Users] ❌ Fehler beim Zurücksetzen des Passworts:', passwordError);
      return res.status(500).json({
        success: false,
        error: 'Fehler beim Zurücksetzen des Passworts',
        details: passwordError.message
      });
    }

    console.log(`[Users] ✅ Passwort für '${existingUser.email}' erfolgreich zurückgesetzt`);
    res.json({
      success: true,
      message: `Passwort für '${existingUser.email}' erfolgreich zurückgesetzt`
    });

  } catch (error) {
    console.error('[Users] ❌ Server-Fehler:', error);
    res.status(500).json({
      success: false,
      error: 'Server-Fehler beim Zurücksetzen des Passworts',
      details: error.message
    });
  }
});

export default router;
