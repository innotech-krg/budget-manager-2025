// =====================================================
// Budget Manager 2025 - Migration Runner
// =====================================================

import { supabaseAdmin } from './src/config/database.js';
import fs from 'fs';
import path from 'path';

const runMigration = async (migrationFile) => {
  try {
    console.log(`🔄 Running migration: ${migrationFile}`);
    
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    // Split SQL by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`📝 Executing: ${statement.substring(0, 50)}...`);
        const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          console.error(`❌ Error executing statement:`, error);
          // Continue with next statement
        } else {
          console.log(`✅ Statement executed successfully`);
        }
      }
    }
    
    console.log(`✅ Migration completed: ${migrationFile}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Get migration file from command line
const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('❌ Please provide migration file path');
  process.exit(1);
}

runMigration(migrationFile);





