// =====================================================
// Budget Manager 2025 - Deutsche Währungs-Utilities
// Deutsche EUR-Formatierung und Validierung
// =====================================================

/**
 * Formatiere Zahl als deutsche Währung
 * @param amount - Betrag als Zahl
 * @param options - Formatierungsoptionen
 * @returns Formatierte deutsche Währung (z.B. "€1.250.000,50")
 */
export const formatGermanCurrency = (
  amount: number | string | null | undefined,
  options: {
    showSymbol?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string => {
  const {
    showSymbol = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options;

  // Handle null, undefined, or invalid values
  if (amount === null || amount === undefined || amount === '') {
    return showSymbol ? '€0,00' : '0,00';
  }

  // Convert string to number if needed
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) {
    return showSymbol ? '€0,00' : '0,00';
  }

  // Use German locale formatting
  const formatter = new Intl.NumberFormat('de-DE', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'EUR',
    minimumFractionDigits,
    maximumFractionDigits
  });

  return formatter.format(numericAmount);
};

/**
 * Parse deutsche Währungsstring zu Zahl
 * @param currencyString - Deutsche Währungsstring (z.B. "€1.250.000,50")
 * @returns Numerischer Wert
 */
export const parseGermanCurrency = (currencyString: string): number => {
  if (!currencyString || typeof currencyString !== 'string') {
    return 0;
  }

  // Remove currency symbol, spaces, and convert German decimal format
  const cleanString = currencyString
    .replace(/€/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '') // Remove thousand separators
    .replace(',', '.'); // Convert decimal comma to dot

  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Validiere deutsche Währungseingabe
 * @param input - Eingabestring
 * @returns Validierungsergebnis
 */
export const validateGermanCurrency = (input: string): {
  isValid: boolean;
  value: number;
  error?: string;
} => {
  if (!input || input.trim() === '') {
    return {
      isValid: false,
      value: 0,
      error: 'Betrag ist erforderlich'
    };
  }

  // German currency regex: allows €1.250.000,50 or 1.250.000,50 format
  const germanCurrencyRegex = /^€?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?)\s*€?$/;
  
  if (!germanCurrencyRegex.test(input.trim())) {
    return {
      isValid: false,
      value: 0,
      error: 'Ungültiges Währungsformat. Verwenden Sie: €1.250.000,50'
    };
  }

  const value = parseGermanCurrency(input);
  
  if (value < 0) {
    return {
      isValid: false,
      value,
      error: 'Betrag darf nicht negativ sein'
    };
  }

  if (value > 999999999.99) {
    return {
      isValid: false,
      value,
      error: 'Betrag ist zu hoch (Maximum: €999.999.999,99)'
    };
  }

  return {
    isValid: true,
    value
  };
};

/**
 * Formatiere Prozentsatz für deutsche Anzeige
 * @param percentage - Prozentsatz als Zahl (z.B. 15.5)
 * @param decimals - Anzahl Dezimalstellen
 * @returns Formatierter Prozentsatz (z.B. "15,5%")
 */
export const formatGermanPercentage = (
  percentage: number | null | undefined,
  decimals: number = 1
): string => {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return '0%';
  }

  return new Intl.NumberFormat('de-DE', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(percentage / 100);
};

/**
 * Berechne Prozentsatz zwischen zwei Beträgen
 * @param part - Teilbetrag
 * @param total - Gesamtbetrag
 * @returns Prozentsatz
 */
export const calculatePercentage = (
  part: number,
  total: number
): number => {
  if (total === 0 || isNaN(part) || isNaN(total)) {
    return 0;
  }
  
  return (part / total) * 100;
};

/**
 * Deutsche Zahlenformatierung ohne Währungssymbol
 * @param number - Zu formatierende Zahl
 * @param decimals - Anzahl Dezimalstellen
 * @returns Deutsche Zahlenformatierung (z.B. "1.250.000,50")
 */
export const formatGermanNumber = (
  number: number | null | undefined,
  decimals: number = 2
): string => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }

  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
};

/**
 * Kompakte deutsche Währungsformatierung für große Beträge
 * @param amount - Betrag
 * @returns Kompakte Formatierung (z.B. "€1,25M")
 */
export const formatCompactGermanCurrency = (amount: number): string => {
  if (isNaN(amount)) return '€0';

  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    notation: 'compact',
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Budget-Status basierend auf Auslastung
 * @param used - Verbrauchter Betrag
 * @param allocated - Zugewiesener Betrag
 * @returns Budget-Status für Ampelsystem
 */
export const getBudgetStatus = (used: number, allocated: number): {
  status: 'GRUEN' | 'GELB' | 'ORANGE' | 'ROT' | 'NICHT_GESTARTET';
  percentage: number;
  color: string;
  emoji: string;
} => {
  if (used === 0) {
    return {
      status: 'NICHT_GESTARTET',
      percentage: 0,
      color: 'geschaeft-400',
      emoji: '⚪'
    };
  }

  const percentage = calculatePercentage(used, allocated);

  if (percentage <= 70) {
    return {
      status: 'GRUEN',
      percentage,
      color: 'ampel-gruen-500',
      emoji: '🟢'
    };
  } else if (percentage <= 90) {
    return {
      status: 'GELB',
      percentage,
      color: 'ampel-gelb-500',
      emoji: '🟡'
    };
  } else if (percentage <= 100) {
    return {
      status: 'ORANGE',
      percentage,
      color: 'ampel-orange-500',
      emoji: '🟠'
    };
  } else {
    return {
      status: 'ROT',
      percentage,
      color: 'ampel-rot-500',
      emoji: '🔴'
    };
  }
};

/**
 * Deutsche Geschäftsjahr-Utilities
 */
export const getGermanBusinessYear = (): number => {
  return new Date().getFullYear();
};

export const getGermanBusinessQuarter = (date: Date = new Date()): {
  quarter: string;
  year: number;
  quarterName: string;
} => {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  
  let quarter: string;
  if (month <= 3) quarter = 'Q1';
  else if (month <= 6) quarter = 'Q2';
  else if (month <= 9) quarter = 'Q3';
  else quarter = 'Q4';
  
  return {
    quarter,
    year,
    quarterName: `${quarter} ${year}`
  };
};

/**
 * Formatiere deutsche Datumsangaben
 * @param date - Datum
 * @returns Deutsche Datumsformatierung
 */
export const formatGermanDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(dateObj);
};

export const formatGermanDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
};

// Export all utilities as default object
export default {
  formatGermanCurrency,
  parseGermanCurrency,
  validateGermanCurrency,
  formatGermanPercentage,
  calculatePercentage,
  formatGermanNumber,
  formatCompactGermanCurrency,
  getBudgetStatus,
  getGermanBusinessYear,
  getGermanBusinessQuarter,
  formatGermanDate,
  formatGermanDateTime
};