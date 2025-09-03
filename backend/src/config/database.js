// =====================================================
// Budget Manager 2025 - Database Configuration
// Supabase PostgreSQL Connection
// =====================================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// =====================================================
// SUPABASE CLIENT CONFIGURATION
// =====================================================

// Echte Supabase-Konfiguration für bdgt-2025 Projekt
const supabaseUrl = process.env.SUPABASE_URL || 'https://ppaletujnevtftvpoorx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYWxldHVqbmV2dGZ0dnBvb3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTI3NzMsImV4cCI6MjA3MTk2ODc3M30.UiSDTbLhsK4Oz1Db5KllBWeH5ttFf8X-E1jPqkjey-U';

// Demo-Modus nur wenn explizit Platzhalter-URL gesetzt ist
const isDemoMode = supabaseUrl === 'your_supabase_project_url';

let supabaseAdmin, supabase;

if (isDemoMode) {
  console.log('🚀 DEMO-MODUS: Supabase-Mock wird verwendet');
  
  // Mock Supabase Client für Demo
  const mockClient = {
    from: (table) => ({
      select: (columns) => ({
        order: (column, options) => ({
          range: (start, end) => ({
            data: [],
            error: null,
            count: 0
          }),
          eq: (column, value) => ({
            range: (start, end) => ({
              data: [],
              error: null,
              count: 0
            }),
            data: [],
            error: null
          }),
          data: [],
          error: null
        }),
        eq: (column, value) => ({
          single: () => ({
            data: null,
            error: { message: 'No rows found' }
          }),
          order: (column, options) => ({
            data: [],
            error: null
          }),
          data: [],
          error: null
        }),
        in: (column, values) => ({
          single: () => ({
            data: null,
            error: { message: 'No rows found' }
          }),
          order: (column, options) => ({
            data: [],
            error: null
          }),
          data: [],
          error: null
        }),
        single: () => ({
          data: null,
          error: null
        }),
        data: [],
        error: null
      }),
      insert: (data) => ({
        select: () => ({
          single: () => ({
            data: data,
            error: null
          }),
          data: [data],
          error: null
        }),
        data: [data],
        error: null
      }),
      update: (data) => ({
        eq: (column, value) => ({
          select: () => ({
            single: () => ({
              data: { ...data, id: value },
              error: null
            }),
            data: [{ ...data, id: value }],
            error: null
          }),
          data: [{ ...data, id: value }],
          error: null
        }),
        data: [data],
        error: null
      }),
      delete: () => ({
        eq: (column, value) => ({
          data: [],
          error: null
        }),
        data: [],
        error: null
      })
    }),
    rpc: () => ({ data: null, error: null })
  };
  
  supabaseAdmin = mockClient;
  supabase = mockClient;
} else {
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL ist nicht in den Umgebungsvariablen definiert');
  }

  if (!supabaseAnonKey) {
    throw new Error('SUPABASE_ANON_KEY muss definiert sein');
  }

  // Für Demo verwenden wir Anon Key für beide Clients
  // In Produktion sollte Service Role Key verwendet werden
  const keyToUse = supabaseServiceKey || supabaseAnonKey;
  
  console.log('🔗 Verbinde mit echter Supabase-Datenbank:', supabaseUrl);

  // Service Role Client für Backend-Operationen (bypasses RLS)
  supabaseAdmin = createClient(supabaseUrl, keyToUse, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  });

  // Anonymous Client für Frontend-Operationen (respects RLS)
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabaseAdmin, supabase };

// =====================================================
// DATABASE UTILITY FUNCTIONS
// =====================================================

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection status
 */
export const testDatabaseConnection = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('annual_budgets')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Datenbankverbindung fehlgeschlagen:', error.message);
      return false;
    }
    
    console.log('✅ Datenbankverbindung erfolgreich');
    return true;
  } catch (error) {
    console.error('❌ Datenbankverbindung fehlgeschlagen:', error.message);
    return false;
  }
};

/**
 * Execute raw SQL query with error handling
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
export const executeQuery = async (query, params = []) => {
  try {
    const { data, error } = await supabaseAdmin.rpc('execute_sql', {
      query_text: query,
      query_params: params
    });
    
    if (error) {
      throw new Error(`SQL Query Error: ${error.message}`);
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('❌ SQL Query Error:', error);
    return { data: null, error };
  }
};

/**
 * Format German currency for database storage
 * @param {string|number} amount - Currency amount
 * @returns {number} Formatted decimal
 */
export const formatGermanCurrency = (amount) => {
  if (typeof amount === 'string') {
    // Remove German formatting (€, spaces, dots for thousands, comma for decimal)
    const cleanAmount = amount
      .replace(/€/g, '')
      .replace(/\\s/g, '')
      .replace(/\\./g, '')
      .replace(',', '.');
    
    return parseFloat(cleanAmount) || 0;
  }
  
  return parseFloat(amount) || 0;
};

/**
 * Format number as German currency string
 * @param {number} amount - Numeric amount
 * @returns {string} Formatted German currency
 */
export const toGermanCurrency = (amount) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

/**
 * Validate German business year
 * @param {number} year - Year to validate
 * @returns {boolean} Is valid business year
 */
export const isValidGermanBusinessYear = (year) => {
  const currentYear = new Date().getFullYear();
  return year >= currentYear - 5 && year <= currentYear + 10;
};

/**
 * Get German fiscal quarter
 * @param {Date} date - Date to get quarter for
 * @returns {Object} Quarter information
 */
export const getGermanFiscalQuarter = (date = new Date()) => {
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  const year = date.getFullYear();
  
  let quarter;
  if (month <= 3) quarter = 'Q1';
  else if (month <= 6) quarter = 'Q2';
  else if (month <= 9) quarter = 'Q3';
  else quarter = 'Q4';
  
  return {
    quarter,
    year,
    quarterName: `${quarter} ${year}`,
    startMonth: Math.floor((month - 1) / 3) * 3 + 1,
    endMonth: Math.floor((month - 1) / 3) * 3 + 3
  };
};

// =====================================================
// DATABASE HEALTH CHECK
// =====================================================

/**
 * Comprehensive database health check
 * @returns {Promise<Object>} Health check results
 */
export const databaseHealthCheck = async () => {
  const healthCheck = {
    status: 'unknown',
    connection: false,
    tables: {},
    performance: {},
    timestamp: new Date().toISOString()
  };
  
  try {
    // Test basic connection
    healthCheck.connection = await testDatabaseConnection();
    
    if (!healthCheck.connection) {
      healthCheck.status = 'error';
      return healthCheck;
    }
    
    // Check critical tables
    const criticalTables = [
      'annual_budgets',
      'projects', 
      'project_budget_tracking',
      'teams',
      'kategorien'
    ];
    
    for (const table of criticalTables) {
      try {
        const { count, error } = await supabaseAdmin
          .from(table)
          .select('*', { count: 'exact', head: true });
          
        healthCheck.tables[table] = {
          exists: !error,
          count: count || 0,
          error: error?.message || null
        };
      } catch (err) {
        healthCheck.tables[table] = {
          exists: false,
          count: 0,
          error: err.message
        };
      }
    }
    
    // Performance test
    const startTime = Date.now();
    await supabaseAdmin.from('annual_budgets').select('id').limit(1);
    healthCheck.performance.queryTime = Date.now() - startTime;
    
    // Determine overall status
    const allTablesExist = Object.values(healthCheck.tables).every(t => t.exists);
    const performanceGood = healthCheck.performance.queryTime < 1000;
    
    if (allTablesExist && performanceGood) {
      healthCheck.status = 'healthy';
    } else if (allTablesExist) {
      healthCheck.status = 'degraded';
    } else {
      healthCheck.status = 'error';
    }
    
  } catch (error) {
    healthCheck.status = 'error';
    healthCheck.error = error.message;
  }
  
  return healthCheck;
};

// =====================================================
// EXPORT DEFAULT CONFIG
// =====================================================

export default {
  supabase,
  supabaseAdmin,
  testDatabaseConnection,
  executeQuery,
  formatGermanCurrency,
  toGermanCurrency,
  isValidGermanBusinessYear,
  getGermanFiscalQuarter,
  databaseHealthCheck
};