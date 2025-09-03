// =====================================================
// Budget Manager 2025 - Check Kategorien Table
// =====================================================

import { supabaseAdmin } from './src/config/database.js';

const checkKategorien = async () => {
  try {
    console.log('🔄 Checking kategorien table...');
    
    // Check all kategorien
    const { data: allKategorien, error: allError } = await supabaseAdmin
      .from('kategorien')
      .select('*');
    
    if (allError) {
      console.error('❌ Error loading all kategorien:', allError);
      return;
    }
    
    console.log(`📊 Total kategorien: ${allKategorien.length}`);
    allKategorien.forEach(kat => {
      console.log(`  - ${kat.name} (${kat.kategorie_typ})`);
    });
    
    // Check budget kategorien specifically
    const { data: budgetKategorien, error: budgetError } = await supabaseAdmin
      .from('kategorien')
      .select('*')
      .eq('kategorie_typ', 'BUDGET');
    
    if (budgetError) {
      console.error('❌ Error loading budget kategorien:', budgetError);
      return;
    }
    
    console.log(`💰 Budget kategorien: ${budgetKategorien.length}`);
    budgetKategorien.forEach(kat => {
      console.log(`  - ${kat.name} (${kat.kategorie_typ})`);
    });
    
  } catch (error) {
    console.error('❌ Failed to check kategorien:', error);
  }
};

checkKategorien();





