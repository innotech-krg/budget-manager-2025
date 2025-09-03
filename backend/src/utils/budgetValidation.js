// =====================================================
// Budget Manager 2025 - Budget Validation Utilities
// Deutsche Geschäftsregeln für Budget-Validierung
// =====================================================

import { formatGermanCurrency, isValidGermanBusinessYear } from '../config/database.js';

// =====================================================
// BUDGET DATA VALIDATION
// =====================================================

/**
 * Validiere Budget-Erstellungsdaten
 * @param {Object} budgetData - Budget-Daten
 * @returns {Object} Validierungsergebnis
 */
export const validateBudgetData = (budgetData) => {
  const errors = [];
  const { jahr, gesamtbudget, reserve_allokation, beschreibung } = budgetData;
  
  // Jahr validieren
  if (!jahr) {
    errors.push('Jahr ist erforderlich');
  } else if (!Number.isInteger(jahr) || !isValidGermanBusinessYear(jahr)) {
    errors.push('Jahr muss eine gültige Jahreszahl sein (aktuelles Jahr ±5 Jahre)');
  }
  
  // Gesamtbudget validieren
  if (!gesamtbudget) {
    errors.push('Gesamtbudget ist erforderlich');
  } else {
    const formattedBudget = formatGermanCurrency(gesamtbudget);
    if (formattedBudget <= 0) {
      errors.push('Gesamtbudget muss größer als 0 sein');
    } else if (formattedBudget > 999999999.99) {
      errors.push('Gesamtbudget ist zu hoch (Maximum: €999.999.999,99)');
    }
  }
  
  // Reserve-Allokation validieren
  if (reserve_allokation !== undefined) {
    const reservePercent = parseFloat(reserve_allokation);
    if (isNaN(reservePercent) || reservePercent < 0 || reservePercent > 50) {
      errors.push('Reserve-Allokation muss zwischen 0% und 50% liegen');
    }
  }
  
  // Beschreibung validieren (optional)
  if (beschreibung && typeof beschreibung !== 'string') {
    errors.push('Beschreibung muss ein Text sein');
  } else if (beschreibung && beschreibung.length > 1000) {
    errors.push('Beschreibung darf maximal 1000 Zeichen lang sein');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    validatedData: errors.length === 0 ? {
      jahr,
      gesamtbudget: formatGermanCurrency(gesamtbudget),
      reserve_allokation: reserve_allokation ? parseFloat(reserve_allokation) : 10.0,
      beschreibung: beschreibung || null
    } : null
  };
};

/**
 * Validiere Budget-Status
 * @param {string} status - Neuer Status
 * @returns {Object} Validierungsergebnis
 */
export const validateBudgetStatus = (status) => {
  const validStatuses = ['DRAFT', 'ACTIVE', 'CLOSED'];
  
  if (!status) {
    return {
      isValid: false,
      error: 'Status ist erforderlich'
    };
  }
  
  if (!validStatuses.includes(status.toUpperCase())) {
    return {
      isValid: false,
      error: `Ungültiger Status. Erlaubte Werte: ${validStatuses.join(', ')}`
    };
  }
  
  return {
    isValid: true,
    validatedStatus: status.toUpperCase()
  };
};

/**
 * Validiere Projekt-Budget-Daten
 * @param {Object} projectBudgetData - Projekt-Budget-Daten
 * @returns {Object} Validierungsergebnis
 */
export const validateProjectBudgetData = (projectBudgetData) => {
  const errors = [];
  const { project_id, veranschlagt, zugewiesen, kategorie } = projectBudgetData;
  
  // Projekt-ID validieren
  if (!project_id) {
    errors.push('Projekt-ID ist erforderlich');
  } else if (typeof project_id !== 'string' || project_id.length < 36) {
    errors.push('Ungültige Projekt-ID');
  }
  
  // Veranschlagtes Budget validieren
  if (veranschlagt === undefined || veranschlagt === null) {
    errors.push('Veranschlagtes Budget ist erforderlich');
  } else {
    const formattedVeranschlagt = formatGermanCurrency(veranschlagt);
    if (formattedVeranschlagt < 0) {
      errors.push('Veranschlagtes Budget darf nicht negativ sein');
    } else if (formattedVeranschlagt > 99999999.99) {
      errors.push('Veranschlagtes Budget ist zu hoch (Maximum: €99.999.999,99)');
    }
  }
  
  // Zugewiesenes Budget validieren (optional)
  if (zugewiesen !== undefined && zugewiesen !== null) {
    const formattedZugewiesen = formatGermanCurrency(zugewiesen);
    if (formattedZugewiesen < 0) {
      errors.push('Zugewiesenes Budget darf nicht negativ sein');
    }
  }
  
  // Kategorie validieren (optional)
  if (kategorie && typeof kategorie !== 'string') {
    errors.push('Kategorie muss ein Text sein');
  } else if (kategorie && kategorie.length > 100) {
    errors.push('Kategorie darf maximal 100 Zeichen lang sein');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    validatedData: errors.length === 0 ? {
      project_id,
      veranschlagt: formatGermanCurrency(veranschlagt),
      zugewiesen: zugewiesen ? formatGermanCurrency(zugewiesen) : 0,
      kategorie: kategorie || 'ALLGEMEIN'
    } : null
  };
};

/**
 * Validiere Budget-Transfer-Daten
 * @param {Object} transferData - Transfer-Daten
 * @returns {Object} Validierungsergebnis
 */
export const validateBudgetTransferData = (transferData) => {
  const errors = [];
  const { von_project_id, zu_project_id, betrag, grund } = transferData;
  
  // Von-Projekt-ID validieren
  if (!von_project_id) {
    errors.push('Quell-Projekt-ID ist erforderlich');
  } else if (typeof von_project_id !== 'string' || von_project_id.length < 36) {
    errors.push('Ungültige Quell-Projekt-ID');
  }
  
  // Zu-Projekt-ID validieren
  if (!zu_project_id) {
    errors.push('Ziel-Projekt-ID ist erforderlich');
  } else if (typeof zu_project_id !== 'string' || zu_project_id.length < 36) {
    errors.push('Ungültige Ziel-Projekt-ID');
  }
  
  // Selbst-Transfer prüfen
  if (von_project_id && zu_project_id && von_project_id === zu_project_id) {
    errors.push('Projekt kann nicht Budget zu sich selbst transferieren');
  }
  
  // Betrag validieren
  if (!betrag) {
    errors.push('Transfer-Betrag ist erforderlich');
  } else {
    const formattedBetrag = formatGermanCurrency(betrag);
    if (formattedBetrag <= 0) {
      errors.push('Transfer-Betrag muss größer als 0 sein');
    } else if (formattedBetrag > 9999999.99) {
      errors.push('Transfer-Betrag ist zu hoch (Maximum: €9.999.999,99)');
    }
  }
  
  // Grund validieren
  if (!grund) {
    errors.push('Transfer-Grund ist erforderlich');
  } else if (typeof grund !== 'string') {
    errors.push('Transfer-Grund muss ein Text sein');
  } else if (grund.length < 10) {
    errors.push('Transfer-Grund muss mindestens 10 Zeichen lang sein');
  } else if (grund.length > 500) {
    errors.push('Transfer-Grund darf maximal 500 Zeichen lang sein');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    validatedData: errors.length === 0 ? {
      von_project_id,
      zu_project_id,
      betrag: formatGermanCurrency(betrag),
      grund
    } : null
  };
};

/**
 * Deutsche Geschäftsregeln für Budget-Allokation prüfen
 * @param {number} verfuegbaresBudget - Verfügbares Budget
 * @param {number} neuZugewiesenesBudget - Neu zuzuweisendes Budget
 * @returns {Object} Validierungsergebnis
 */
export const validateBudgetAllocation = (verfuegbaresBudget, neuZugewiesenesBudget) => {
  const warnings = [];
  const errors = [];
  
  const verfuegbar = parseFloat(verfuegbaresBudget) || 0;
  const neuZugewiesen = parseFloat(neuZugewiesenesBudget) || 0;
  
  // Kritische Überprüfungen
  if (neuZugewiesen <= 0) {
    errors.push('Zugewiesenes Budget muss größer als 0 sein');
  }
  
  // Deutsche Geschäftslogik: Überschreitung erlaubt, aber mit Warnungen
  if (neuZugewiesen > verfuegbar) {
    const ueberschreitung = neuZugewiesen - verfuegbar;
    const ueberschreitungProzent = verfuegbar > 0 ? (ueberschreitung / verfuegbar) * 100 : 100;
    
    if (ueberschreitungProzent > 50) {
      errors.push(`Budget-Überschreitung zu hoch (${ueberschreitungProzent.toFixed(1)}%). Maximum: 50% Überschreitung erlaubt.`);
    } else if (ueberschreitungProzent > 20) {
      warnings.push(`Erhebliche Budget-Überschreitung (${ueberschreitungProzent.toFixed(1)}%). Genehmigung erforderlich.`);
    } else if (ueberschreitungProzent > 0) {
      warnings.push(`Budget-Überschreitung von ${formatGermanCurrency(ueberschreitung)} (${ueberschreitungProzent.toFixed(1)}%)`);
    }
  }
  
  // Deutsche Geschäfts-Warnung bei geringer Restbudget-Reserve
  const restbudget = verfuegbar - neuZugewiesen;
  if (restbudget >= 0 && restbudget < verfuegbar * 0.1) {
    warnings.push('Geringes Restbudget. Empfehlung: 10% Reserve beibehalten.');
  }
  
  return {
    isValid: errors.length === 0,
    hasWarnings: warnings.length > 0,
    errors,
    warnings,
    calculations: {
      verfuegbares_budget: verfuegbar,
      neu_zugewiesenes_budget: neuZugewiesen,
      restbudget: Math.max(0, restbudget),
      ueberschreitung: Math.max(0, neuZugewiesen - verfuegbar)
    }
  };
};

/**
 * Validiere deutsche Währungsformatierung
 * @param {string} currencyString - Währungsstring (z.B. "€1.250.000,50")
 * @returns {Object} Validierungsergebnis
 */
export const validateGermanCurrencyFormat = (currencyString) => {
  if (!currencyString || typeof currencyString !== 'string') {
    return {
      isValid: false,
      error: 'Währungsangabe ist erforderlich',
      formattedValue: null
    };
  }
  
  // Deutsche Währungsformat-Regex
  const germanCurrencyRegex = /^€?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?)\s*€?$/;
  const match = currencyString.trim().match(germanCurrencyRegex);
  
  if (!match) {
    return {
      isValid: false,
      error: 'Ungültiges deutsches Währungsformat. Erwartet: €1.250.000,50',
      formattedValue: null
    };
  }
  
  try {
    const formattedValue = formatGermanCurrency(currencyString);
    return {
      isValid: true,
      formattedValue,
      originalString: currencyString
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Fehler beim Verarbeiten der Währungsangabe',
      formattedValue: null
    };
  }
};

// =====================================================
// EXPORT VALIDATION FUNCTIONS
// =====================================================

export default {
  validateBudgetData,
  validateBudgetStatus,
  validateProjectBudgetData,
  validateBudgetTransferData,
  validateBudgetAllocation,
  validateGermanCurrencyFormat
};