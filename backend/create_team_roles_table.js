/**
 * Erstelle rollen_stammdaten Tabelle für Team-Rollen mit Stundensätzen
 * Epic 8 - Story 8.7: Korrekte Team-Rollen für Projektkalkulationen
 */

import { supabaseAdmin } from './src/config/database.js';

async function createTeamRolesTable() {
  try {
    console.log('🔧 Erstelle rollen_stammdaten Tabelle...');

    // 1. Tabelle erstellen
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.rollen_stammdaten (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        kategorie VARCHAR(50) NOT NULL,
        standard_stundensatz DECIMAL(8,2),
        min_stundensatz DECIMAL(8,2),
        max_stundensatz DECIMAL(8,2),
        beschreibung TEXT,
        farbe VARCHAR(7) DEFAULT '#6B7280',
        ist_aktiv BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const { error: createError } = await supabaseAdmin.rpc('exec_sql', { 
      sql: createTableSQL 
    });

    if (createError) {
      console.error('❌ Fehler beim Erstellen der Tabelle:', createError);
      return;
    }

    console.log('✅ Tabelle rollen_stammdaten erstellt');

    // 2. Beispiel-Daten einfügen
    const teamRoles = [
      {
        name: 'Senior Developer',
        kategorie: 'Development',
        standard_stundensatz: 85.00,
        min_stundensatz: 50.00,
        max_stundensatz: 120.00,
        beschreibung: 'Erfahrener Softwareentwickler',
        farbe: '#3B82F6'
      },
      {
        name: 'Junior Developer',
        kategorie: 'Development',
        standard_stundensatz: 55.00,
        min_stundensatz: 30.00,
        max_stundensatz: 80.00,
        beschreibung: 'Nachwuchs-Entwickler',
        farbe: '#60A5FA'
      },
      {
        name: 'UI/UX Designer',
        kategorie: 'Design',
        standard_stundensatz: 75.00,
        min_stundensatz: 45.00,
        max_stundensatz: 100.00,
        beschreibung: 'User Interface und Experience Design',
        farbe: '#8B5CF6'
      },
      {
        name: 'Project Manager',
        kategorie: 'Management',
        standard_stundensatz: 80.00,
        min_stundensatz: 50.00,
        max_stundensatz: 110.00,
        beschreibung: 'Projektleitung und Koordination',
        farbe: '#F59E0B'
      },
      {
        name: 'DevOps Engineer',
        kategorie: 'Operations',
        standard_stundensatz: 90.00,
        min_stundensatz: 60.00,
        max_stundensatz: 130.00,
        beschreibung: 'Deployment und Infrastruktur',
        farbe: '#1F2937'
      },
      {
        name: 'Quality Assurance',
        kategorie: 'Testing',
        standard_stundensatz: 55.00,
        min_stundensatz: 35.00,
        max_stundensatz: 75.00,
        beschreibung: 'Qualitätssicherung und Testing',
        farbe: '#6366F1'
      },
      {
        name: 'Business Analyst',
        kategorie: 'Analysis',
        standard_stundensatz: 70.00,
        min_stundensatz: 45.00,
        max_stundensatz: 95.00,
        beschreibung: 'Geschäftsanalyse und Requirements',
        farbe: '#059669'
      },
      {
        name: 'Content Manager',
        kategorie: 'Content',
        standard_stundensatz: 50.00,
        min_stundensatz: 30.00,
        max_stundensatz: 70.00,
        beschreibung: 'Inhalte-Erstellung und -Pflege',
        farbe: '#10B981'
      },
      {
        name: 'SEO Specialist',
        kategorie: 'Marketing',
        standard_stundensatz: 60.00,
        min_stundensatz: 35.00,
        max_stundensatz: 85.00,
        beschreibung: 'Suchmaschinenoptimierung',
        farbe: '#EF4444'
      },
      {
        name: 'Grafik Designer',
        kategorie: 'Design',
        standard_stundensatz: 65.00,
        min_stundensatz: 40.00,
        max_stundensatz: 90.00,
        beschreibung: 'Grafische Gestaltung und Layout',
        farbe: '#A78BFA'
      }
    ];

    console.log('📝 Füge Team-Rollen-Daten ein...');

    const { data: insertedRoles, error: insertError } = await supabaseAdmin
      .from('rollen_stammdaten')
      .insert(teamRoles)
      .select();

    if (insertError) {
      console.error('❌ Fehler beim Einfügen der Daten:', insertError);
      return;
    }

    console.log(`✅ ${insertedRoles.length} Team-Rollen erfolgreich eingefügt`);

    // 3. RLS Policy erstellen (optional)
    const rlsPolicySQL = `
      ALTER TABLE public.rollen_stammdaten ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Alle können Team-Rollen lesen" ON public.rollen_stammdaten
        FOR SELECT USING (true);
        
      CREATE POLICY "Nur SuperAdmins können Team-Rollen verwalten" ON public.rollen_stammdaten
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'SUPERADMIN' AND is_active = true
          )
        );
    `;

    const { error: rlsError } = await supabaseAdmin.rpc('exec_sql', { 
      sql: rlsPolicySQL 
    });

    if (rlsError) {
      console.log('⚠️ RLS Policy konnte nicht erstellt werden (möglicherweise bereits vorhanden):', rlsError.message);
    } else {
      console.log('✅ RLS Policies erstellt');
    }

    console.log('🎉 Team-Rollen-Tabelle erfolgreich eingerichtet!');

  } catch (error) {
    console.error('❌ Unerwarteter Fehler:', error);
  }
}

// Skript ausführen
createTeamRolesTable();





