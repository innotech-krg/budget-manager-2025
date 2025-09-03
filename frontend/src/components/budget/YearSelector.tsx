// =====================================================
// Budget Manager 2025 - Year Selector Component
// Story 1.2.3 Enhancement: Jahresbudget-Auswahl
// =====================================================

import React, { useState, useEffect } from 'react'

interface YearBudget {
  jahr: number
  hasbudget: boolean
  gesamtbudget: number
  verfuegbares_budget: number
  status: string
  isActive: boolean
}

interface YearSelectorProps {
  selectedYear: number
  onYearChange: (year: number) => void
  className?: string
}

export const YearSelector: React.FC<YearSelectorProps> = ({
  selectedYear,
  onYearChange,
  className = ''
}) => {
  const [yearBudgets, setYearBudgets] = useState<YearBudget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusBadge = (budget: YearBudget) => {
    if (!budget.hasbudget) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
          Kein Budget
        </span>
      )
    }
    
    switch (budget.status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            ✅ Aktiv
          </span>
        )
      case 'DRAFT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
            📝 Entwurf
          </span>
        )
      case 'CLOSED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
            🔒 Geschlossen
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
            ❓ Unbekannt
          </span>
        )
    }
  }

  const fetchYearBudgets = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/budgets/years')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setYearBudgets(data)
      
      console.log('[YearSelector] ✅ Jahresbudgets geladen:', data)
    } catch (err) {
      console.error('[YearSelector] ❌ Fehler beim Laden der Jahresbudgets:', err)
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchYearBudgets()
  }, [])

  if (loading) {
    return (
      <div className={`${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Jahresbudget
        </label>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Jahresbudget
        </label>
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">
            ❌ Fehler beim Laden: {error}
          </p>
          <button
            onClick={fetchYearBudgets}
            className="mt-2 text-sm text-red-700 underline hover:text-red-900"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Jahresbudget *
      </label>
      
      <select
        value={selectedYear}
        onChange={(e) => onYearChange(parseInt(e.target.value))}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        required
      >
        <option value="">Jahr auswählen...</option>
        {yearBudgets.map((budget) => (
          <option 
            key={budget.jahr} 
            value={budget.jahr}
            disabled={!budget.hasbudget || budget.status === 'CLOSED'}
          >
            {budget.jahr} - {budget.hasbudget ? formatCurrency(budget.verfuegbares_budget) : 'Kein Budget'}
          </option>
        ))}
      </select>

      {/* Kompakte Jahr-Info (nur Status) */}
      {selectedYear && (
        <div className="mt-2 text-xs text-gray-500">
          {(() => {
            const selectedBudget = yearBudgets.find(b => b.jahr === selectedYear)
            if (!selectedBudget) {
              return `❓ Keine Informationen für Jahr ${selectedYear} verfügbar`
            }
            if (!selectedBudget.hasbudget) {
              return `⚠️ Für Jahr ${selectedYear} ist noch kein Budget definiert`
            }
            return `✅ Jahr ${selectedYear} - ${formatCurrency(selectedBudget.verfuegbares_budget)} verfügbar`
          })()}
        </div>
      )}

      {/* Hinweis für Planung */}
      <div className="mt-2 text-xs text-gray-500">
        💡 Sie können für das aktuelle Jahr sowie für Vor- und Folgejahre planen
      </div>
    </div>
  )
}

export default YearSelector
