// =====================================================
// Budget Manager 2025 - Data Mapping Utilities
// Mappt API-Daten (englisch) auf Frontend-Interfaces (deutsch)
// =====================================================

// Mappt API-Projekt-Daten auf Frontend-Format
export const mapApiProjectToFrontend = (apiProject: any) => {
  return {
    ...apiProject,
    // Deutsche Feldnamen für Rückwärtskompatibilität
    beschreibung: apiProject.description || apiProject.beschreibung || '',
    start_datum: apiProject.start_date || apiProject.start_datum || '',
    end_datum: apiProject.end_date || apiProject.end_datum || '',
    prioritaet: apiProject.priority || apiProject.prioritaet || 'medium',
    kostenart: apiProject.cost_type || apiProject.kostenart || 'external',
    dienstleister: apiProject.supplier || apiProject.dienstleister || '',
    geplantes_budget: apiProject.planned_budget || apiProject.geplantes_budget || 0,
    verbrauchtes_budget: apiProject.consumed_budget || apiProject.verbrauchtes_budget || 0,
    interne_stunden_design: apiProject.internal_hours_design || apiProject.interne_stunden_design || 0,
    interne_stunden_content: apiProject.internal_hours_content || apiProject.interne_stunden_content || 0,
    interne_stunden_dev: apiProject.internal_hours_dev || apiProject.interne_stunden_dev || 0,
    
    // Englische Feldnamen für neue Komponenten
    description: apiProject.description || apiProject.beschreibung || '',
    start_date: apiProject.start_date || apiProject.start_datum || '',
    end_date: apiProject.end_date || apiProject.end_datum || '',
    priority: apiProject.priority || apiProject.prioritaet || 'medium',
    cost_type: apiProject.cost_type || apiProject.kostenart || 'external',
    supplier: apiProject.supplier || apiProject.dienstleister || '',
    planned_budget: apiProject.planned_budget || apiProject.geplantes_budget || 0,
    consumed_budget: apiProject.consumed_budget || apiProject.verbrauchtes_budget || 0,
    internal_hours_design: apiProject.internal_hours_design || apiProject.interne_stunden_design || 0,
    internal_hours_content: apiProject.internal_hours_content || apiProject.interne_stunden_content || 0,
    internal_hours_dev: apiProject.internal_hours_dev || apiProject.interne_stunden_dev || 0,
    internal_hours_total: (apiProject.internal_hours_design || apiProject.interne_stunden_design || 0) +
                         (apiProject.internal_hours_content || apiProject.interne_stunden_content || 0) +
                         (apiProject.internal_hours_dev || apiProject.interne_stunden_dev || 0),
  }
}

// Mappt Frontend-Form-Daten auf API-Format
export const mapFrontendProjectToApi = (frontendProject: any) => {
  return {
    ...frontendProject,
    // Englische Feldnamen für API
    description: frontendProject.description || frontendProject.beschreibung,
    start_date: frontendProject.start_date || frontendProject.start_datum,
    end_date: frontendProject.end_date || frontendProject.end_datum,
    priority: frontendProject.priority || frontendProject.prioritaet,
    cost_type: frontendProject.cost_type || frontendProject.kostenart,
    supplier: frontendProject.supplier || frontendProject.dienstleister,
    planned_budget: frontendProject.planned_budget || frontendProject.geplantes_budget,
    consumed_budget: frontendProject.consumed_budget || frontendProject.verbrauchtes_budget,
    internal_hours_design: frontendProject.internal_hours_design || frontendProject.interne_stunden_design,
    internal_hours_content: frontendProject.internal_hours_content || frontendProject.interne_stunden_content,
    internal_hours_dev: frontendProject.internal_hours_dev || frontendProject.interne_stunden_dev,
  }
}

// Status-Mapping zwischen deutsch und englisch
export const mapStatusToGerman = (englishStatus: string): string => {
  const statusMap: { [key: string]: string } = {
    'active': 'aktiv',
    'planned': 'geplant', 
    'completed': 'abgeschlossen',
    'paused': 'pausiert',
    'cancelled': 'abgebrochen'
  }
  return statusMap[englishStatus] || englishStatus
}

export const mapStatusToEnglish = (germanStatus: string): string => {
  const statusMap: { [key: string]: string } = {
    'aktiv': 'active',
    'geplant': 'planned',
    'abgeschlossen': 'completed', 
    'pausiert': 'paused',
    'abgebrochen': 'cancelled'
  }
  return statusMap[germanStatus] || germanStatus
}

// Priority-Mapping zwischen deutsch und englisch
export const mapPriorityToGerman = (englishPriority: string): string => {
  const priorityMap: { [key: string]: string } = {
    'critical': 'Kritisch',
    'high': 'Hoch',
    'medium': 'Mittel',
    'low': 'Niedrig'
  }
  return priorityMap[englishPriority] || englishPriority
}

export const mapPriorityToEnglish = (germanPriority: string): string => {
  const priorityMap: { [key: string]: string } = {
    'Kritisch': 'critical',
    'Hoch': 'high', 
    'Mittel': 'medium',
    'Niedrig': 'low'
  }
  return priorityMap[germanPriority] || germanPriority
}

