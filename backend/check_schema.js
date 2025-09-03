// =====================================================
// Budget Manager 2025 - Check Schema
// =====================================================

import { supabaseAdmin } from './src/config/database.js';

const checkSchema = async () => {
  try {
    console.log('🔄 Checking kategorien schema...');
    
    // Get one record to see the schema
    const { data: sample, error } = await supabaseAdmin
      .from('kategorien')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    if (sample && sample.length > 0) {
      console.log('📊 Schema (columns):');
      Object.keys(sample[0]).forEach(key => {
        console.log(`  - ${key}: ${typeof sample[0][key]} = ${sample[0][key]}`);
      });
    } else {
      console.log('📊 No data found');
    }
    
  } catch (error) {
    console.error('❌ Failed to check schema:', error);
  }
};

checkSchema();





