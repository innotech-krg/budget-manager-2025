// =====================================================
// Budget Manager 2025 - Budget Allocation Indicator
// Story 1.2.3: Intelligente Budget-Zuordnung
// =====================================================

import React, { useState, useEffect } from 'react'
import { budgetAllocationApi, AvailableBudget, BudgetAllocationApiError } from '../../services/budgetAllocationApi'

interface BudgetAllocationIndicatorProps {
  jahr: number
  className?: string
  showDetails?: boolean
  onBudgetUpdate?: (budget: AvailableBudget) => void
}

/**
 * Komponente zur Anzeige des verfügbaren Budgets mit Ampel-System
 * Implementiert AC-1: Verfügbares Budget anzeigen
 */
export const BudgetAllocationIndicator: React.FC<BudgetAllocationIndicatorProps> = ({
  jahr,
  className = '',
  showDetails = true,
  onBudgetUpdate
}) => {
  const [availableBudget, setAvailableBudget] = useState<AvailableBudget | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Verfügbares Budget laden
  const loadAvailableBudget = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const budget = await budgetAllocationApi.getAvailableBudget(jahr)
      setAvailableBudget(budget)
      
      // Callback für Parent-Komponente
      if (onBudgetUpdate) {
        onBudgetUpdate(budget)
      }
      
    } catch (err) {
      console.error('❌ Fehler beim Laden des verfügbaren Budgets:', err)
      
      if (err instanceof BudgetAllocationApiError && err.errorCode === 'NO_ACTIVE_BUDGET') {
        setError(`Kein aktives Budget für Jahr ${jahr} gefunden`)
      } else {
        setError('Fehler beim Laden des verfügbaren Budgets')
      }
    } finally {
      setLoading(false)
    }
  }

  // Initial laden und bei Jahr-Änderung
  useEffect(() => {
    loadAvailableBudget()
  }, [jahr])

  // Auto-Refresh alle 30 Sekunden für Real-time Updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        loadAvailableBudget()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [loading, jahr])

  // Ampel-System Farben
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GRUEN': return 'text-green-600 bg-green-100'
      case 'GELB': return 'text-yellow-600 bg-yellow-100'
      case 'ORANGE': return 'text-orange-600 bg-orange-100'
      case 'ROT': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'GRUEN': return '🟢'
      case 'GELB': return '🟡'
      case 'ORANGE': return '🟠'
      case 'ROT': return '🔴'
      default: return '⚪'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'GRUEN': return 'Niedrige Auslastung'
      case 'GELB': return 'Mittlere Auslastung'
      case 'ORANGE': return 'Hohe Auslastung'
      case 'ROT': return 'Kritische Auslastung'
      default: return 'Unbekannt'
    }
  }

  if (loading) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
            <div className="h-4 bg-gray-300 rounded w-32"></div>
          </div>
          <div className="h-6 bg-gray-300 rounded w-48"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <span className="text-red-500">⚠️</span>
          <div>
            <p className="text-red-700 font-medium">Budget-Status nicht verfügbar</p>
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={loadAvailableBudget}
              className="text-red-600 text-sm underline hover:text-red-800 mt-1"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!availableBudget) {
    return null
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Header mit Status-Ampel */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getStatusIcon(availableBudget.budget_status)}</span>
          <h3 className="font-semibold text-gray-900">
            Verfügbares Budget {jahr}
          </h3>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(availableBudget.budget_status)}`}>
          {getStatusText(availableBudget.budget_status)}
        </span>
      </div>

      {/* Hauptbudget-Anzeige */}
      <div className="mb-4">
        <div className="text-2xl font-bold text-green-600 mb-1">
          {availableBudget.verfuegbares_budget_formatted || 
           new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(availableBudget.verfuegbares_budget)}
        </div>
        <p className="text-sm text-gray-600">
          von {availableBudget.gesamtbudget_formatted || 
               new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(availableBudget.gesamtbudget)} verfügbar
        </p>
      </div>

      {/* Fortschrittsbalken */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Budget-Auslastung</span>
          <span>{availableBudget.auslastung_prozent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              availableBudget.auslastung_prozent >= 95 ? 'bg-red-500' :
              availableBudget.auslastung_prozent >= 85 ? 'bg-orange-500' :
              availableBudget.auslastung_prozent >= 70 ? 'bg-yellow-500' :
              'bg-green-500'
            }`}
            style={{ width: `${Math.min(availableBudget.auslastung_prozent, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Details (optional) */}
      {showDetails && (
        <div className="border-t border-gray-100 pt-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Zugewiesen</p>
              <p className="font-medium">
                {availableBudget.zugewiesenes_budget_formatted || 
                 new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(availableBudget.zugewiesenes_budget)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Projekte</p>
              <p className="font-medium">{availableBudget.anzahl_projekte}</p>
            </div>
            <div>
              <p className="text-gray-600">Reserve</p>
              <p className="font-medium">
                {availableBudget.reserve_budget_formatted || 
                 new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(availableBudget.reserve_budget)}
                <span className="text-gray-500 ml-1">({availableBudget.reserve_allokation}%)</span>
              </p>
            </div>
            <div>
              <p className="text-gray-600">Ohne Reserve</p>
              <p className="font-medium">
                {availableBudget.verfuegbar_ohne_reserve_formatted || 
                 new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(availableBudget.verfuegbar_ohne_reserve)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Refresh-Indikator */}
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Aktualisiert alle 30 Sekunden
        </p>
        <button
          onClick={loadAvailableBudget}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
          disabled={loading}
        >
          {loading ? 'Lädt...' : 'Aktualisieren'}
        </button>
      </div>
    </div>
  )
}

export default BudgetAllocationIndicator

