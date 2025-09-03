// =====================================================
// Budget Manager 2025 - Formatters Utility
// Gemeinsame Formatierungsfunktionen
// =====================================================

/**
 * Formatiert einen Betrag als deutsche Währung
 */
export const formatGermanCurrency = (amount: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

/**
 * Formatiert ein Datum im deutschen Format
 */
export const formatGermanDate = (dateString: string): string => {
  if (!dateString || dateString === '1970-01-01') return 'Nicht gesetzt'
  return new Date(dateString).toLocaleDateString('de-DE')
}

/**
 * Formatiert eine Zahl mit deutschen Tausendertrennzeichen
 */
export const formatGermanNumber = (number: number): string => {
  return new Intl.NumberFormat('de-DE').format(number)
}

/**
 * Formatiert einen Prozentsatz
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`
}



