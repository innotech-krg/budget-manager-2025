// =====================================================
// Budget Manager 2025 - Audit Logger Utility
// Deutsche Geschäfts-Compliance Audit-Trail
// =====================================================

import { supabaseAdmin } from '../config/database.js';

// =====================================================
// AUDIT LOG FUNCTIONS
// =====================================================

/**
 * Erstelle Audit-Log-Eintrag
 * @param {Object} logData - Audit-Log-Daten
 * @returns {Promise<Object>} Audit-Log-Ergebnis
 */
export const createAuditLog = async (logData) => {
  try {
    const {
      table_name,
      record_id,
      action,
      old_values = null,
      new_values = null,
      changed_by = null,
      ip_address = null,
      user_agent = null
    } = logData;
    
    // Validiere erforderliche Felder
    if (!table_name || !record_id || !action) {
      throw new Error('table_name, record_id und action sind erforderlich');
    }
    
    // Validiere Action
    const validActions = ['INSERT', 'UPDATE', 'DELETE', 'SELECT', 'DASHBOARD_ACCESS', 'LOGIN', 'LOGOUT', 'COMPLETED', 'PROCESSING', 'FAILED'];
    if (!validActions.includes(action.toUpperCase())) {
      throw new Error(`Ungültige Action: ${action}. Erlaubt: ${validActions.join(', ')}`);
    }
    
    // Audit-Log-Eintrag erstellen
    const auditEntry = {
      table_name,
      record_id,
      action: action.toUpperCase(),
      old_data: old_values ? old_values : null,
      new_data: new_values ? new_values : null,
      changed_by,
      changed_at: new Date().toISOString(),
      ip_address,
      user_agent
    };
    
    const { data, error } = await supabaseAdmin
      .from('audit_log')
      .insert([auditEntry])
      .select('*')
      .single();
    
    if (error) {
      console.error('❌ Fehler beim Erstellen des Audit-Logs:', error);
      // Audit-Log-Fehler sollten nicht den Hauptprozess stoppen
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ Audit-Logger Fehler:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Audit-Logs für bestimmte Tabelle/Record abrufen
 * @param {string} tableName - Tabellenname
 * @param {string} recordId - Record-ID
 * @param {Object} options - Optionen (limit, offset, action)
 * @returns {Promise<Object>} Audit-Log-Historie
 */
export const getAuditHistory = async (tableName, recordId, options = {}) => {
  try {
    const { limit = 50, offset = 0, action = null } = options;
    
    let query = supabaseAdmin
      .from('audit_log')
      .select('*')
      .eq('table_name', tableName)
      .eq('record_id', recordId)
      .order('changed_at', { ascending: false });
    
    if (action) {
      query = query.eq('action', action.toUpperCase());
    }
    
    query = query.range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      throw new Error(`Fehler beim Abrufen der Audit-Historie: ${error.message}`);
    }
    
    // Deutsche Formatierung der Audit-Logs
    const formattedLogs = data.map(log => ({
      ...log,
      changed_at_formatted: new Date(log.changed_at).toLocaleString('de-DE'),
      old_values_parsed: log.old_data ? log.old_data : null,
      new_values_parsed: log.new_data ? log.new_data : null,
      action_description: getActionDescription(log.action, tableName)
    }));
    
    return {
      success: true,
      data: formattedLogs,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: count > (offset + limit)
      }
    };
    
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Audit-Historie:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Deutsche Beschreibung für Audit-Actions
 * @param {string} action - Action (INSERT, UPDATE, DELETE)
 * @param {string} tableName - Tabellenname
 * @returns {string} Deutsche Beschreibung
 */
const getActionDescription = (action, tableName) => {
  const tableDescriptions = {
    'annual_budgets': 'Jahresbudget',
    'projects': 'Projekt',
    'project_budget_tracking': 'Projekt-Budget',
    'budget_transfers': 'Budget-Transfer',
    'teams': 'Team',
    'kategorien': 'Kategorie'
  };
  
  const actionDescriptions = {
    'INSERT': 'erstellt',
    'UPDATE': 'aktualisiert',
    'DELETE': 'gelöscht'
  };
  
  const tableDesc = tableDescriptions[tableName] || tableName;
  const actionDesc = actionDescriptions[action] || action;
  
  return `${tableDesc} ${actionDesc}`;
};

/**
 * Audit-Statistiken für Dashboard
 * @param {Object} filters - Filter (dateFrom, dateTo, tableName, userId)
 * @returns {Promise<Object>} Audit-Statistiken
 */
export const getAuditStatistics = async (filters = {}) => {
  try {
    const { dateFrom, dateTo, tableName, userId } = filters;
    
    let query = supabaseAdmin
      .from('audit_log')
      .select('action, table_name, changed_by, changed_at');
    
    // Filter anwenden
    if (dateFrom) {
      query = query.gte('changed_at', dateFrom);
    }
    
    if (dateTo) {
      query = query.lte('changed_at', dateTo);
    }
    
    if (tableName) {
      query = query.eq('table_name', tableName);
    }
    
    if (userId) {
      query = query.eq('changed_by', userId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Fehler beim Abrufen der Audit-Statistiken: ${error.message}`);
    }
    
    // Statistiken berechnen
    const statistics = {
      total_actions: data.length,
      actions_by_type: {},
      actions_by_table: {},
      actions_by_user: {},
      daily_activity: {}
    };
    
    data.forEach(log => {
      // Actions nach Typ
      statistics.actions_by_type[log.action] = 
        (statistics.actions_by_type[log.action] || 0) + 1;
      
      // Actions nach Tabelle
      statistics.actions_by_table[log.table_name] = 
        (statistics.actions_by_table[log.table_name] || 0) + 1;
      
      // Actions nach Benutzer
      const user = log.changed_by || 'System';
      statistics.actions_by_user[user] = 
        (statistics.actions_by_user[user] || 0) + 1;
      
      // Tägliche Aktivität
      const date = new Date(log.changed_at).toDateString();
      statistics.daily_activity[date] = 
        (statistics.daily_activity[date] || 0) + 1;
    });
    
    return { success: true, statistics };
    
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Audit-Statistiken:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Sensible Daten für Audit-Log anonymisieren
 * @param {Object} data - Zu anonymisierende Daten
 * @param {Array} sensitiveFields - Liste sensibler Felder
 * @returns {Object} Anonymisierte Daten
 */
export const anonymizeSensitiveData = (data, sensitiveFields = []) => {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const defaultSensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'email',
    'phone',
    'ssn',
    'iban',
    'credit_card'
  ];
  
  const allSensitiveFields = [...defaultSensitiveFields, ...sensitiveFields];
  const anonymized = { ...data };
  
  allSensitiveFields.forEach(field => {
    if (anonymized[field]) {
      anonymized[field] = '[ANONYMIZED]';
    }
  });
  
  return anonymized;
};

/**
 * Audit-Log-Bereinigung (alte Logs löschen)
 * @param {number} retentionDays - Aufbewahrungszeit in Tagen
 * @returns {Promise<Object>} Bereinigungsergebnis
 */
export const cleanupOldAuditLogs = async (retentionDays = 365) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const { data, error } = await supabaseAdmin
      .from('audit_log')
      .delete()
      .lt('changed_at', cutoffDate.toISOString());
    
    if (error) {
      throw new Error(`Fehler beim Bereinigen der Audit-Logs: ${error.message}`);
    }
    
    return {
      success: true,
      deletedCount: data?.length || 0,
      cutoffDate: cutoffDate.toISOString(),
      retentionDays
    };
    
  } catch (error) {
    console.error('❌ Fehler beim Bereinigen der Audit-Logs:', error);
    return { success: false, error: error.message };
  }
};

// =====================================================
// EXPORT AUDIT FUNCTIONS
// =====================================================

export default {
  createAuditLog,
  getAuditHistory,
  getAuditStatistics,
  anonymizeSensitiveData,
  cleanupOldAuditLogs
};