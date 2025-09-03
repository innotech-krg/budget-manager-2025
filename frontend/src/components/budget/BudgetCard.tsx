// =====================================================
// Budget Manager 2025 - BudgetCard Komponente
// Einzelne Jahresbudget-Karte Anzeige
// =====================================================

import React from 'react'
import { formatGermanCurrency, getBudgetStatus } from '../../utils/currency'

export interface Budget {
  id: string
  jahr: number
  gesamtbudget: number
  reserve_allokation: number
  verfuegbares_budget: number
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED'
  beschreibung?: string
  created_at: string
  updated_at: string
}

interface BudgetCardProps {
  budget: Budget
  onEdit?: (budget: Budget) => void
  onDelete?: (budget: Budget) => void
  onStatusChange?: (budget: Budget, newStatus: Budget['status']) => void
  onViewDetails?: (budget: Budget) => void
  onDuplicate?: (budget: Budget) => void
  isLoading?: boolean
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  budget,
  onEdit,
  onDelete,
  onStatusChange,
  onViewDetails,
  onDuplicate,
  isLoading = false
}) => {
  const reserveAmount = (budget.gesamtbudget * (budget.reserve_allokation / 100))
  
  // Deutsche Geschäftslogik: Jahr-basierte Kategorisierung
  const currentYear = new Date().getFullYear()
  const budgetCategory = budget.jahr < currentYear ? 'past' : 
                        budget.jahr === currentYear ? 'current' : 'future'
  
  // Status-spezifische Styling mit Jahr-Kontext
  const getStatusBadge = (status: Budget['status']) => {
    const baseClasses = "inline-flex px-2 py-1 text-xs font-medium rounded-full"
    
    switch (status) {
      case 'DRAFT':
        return budgetCategory === 'future' 
          ? `${baseClasses} bg-blue-100 text-blue-800` // Zukünftig: Blau
          : `${baseClasses} bg-gray-100 text-gray-800`  // Sonstige: Grau
      case 'ACTIVE':
        return budgetCategory === 'current'
          ? `${baseClasses} bg-green-100 text-green-800 ring-2 ring-green-300` // Aktuell aktiv: Grün mit Ring
          : `${baseClasses} bg-green-100 text-green-800` // Sonstige aktive
      case 'CLOSED':
        return `${baseClasses} bg-red-100 text-red-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const getStatusText = (status: Budget['status']) => {
    switch (status) {
      case 'DRAFT': return 'Entwurf'
      case 'ACTIVE': return 'Aktiv'
      case 'CLOSED': return 'Geschlossen'
      default: return status
    }
  }

  const canEdit = budget.status === 'DRAFT'
  const canDelete = budget.status === 'DRAFT'
  const canActivate = budget.status === 'DRAFT'
  const canClose = budget.status === 'ACTIVE'

  // Karten-Styling basierend auf Kategorie
  const getCardClasses = () => {
    const baseClasses = "rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200"
    
    switch (budgetCategory) {
      case 'current':
        return budget.status === 'ACTIVE' 
          ? `${baseClasses} bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 ring-1 ring-green-200` // Aktuell aktiv: Hervorgehoben
          : `${baseClasses} bg-white border border-gray-200` // Aktuell nicht aktiv
      case 'future':
        return `${baseClasses} bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200` // Zukünftig: Blau
      case 'past':
        return `${baseClasses} bg-gray-50 border border-gray-300 opacity-75` // Vergangen: Gedämpft
      default:
        return `${baseClasses} bg-white border border-gray-200`
    }
  }

  return (
    <div data-testid="budget-card" className={getCardClasses()}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-xl font-bold text-gray-900">
              Jahresbudget {budget.jahr}
            </h3>
            {budgetCategory === 'current' && budget.status === 'ACTIVE' && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-600 text-white rounded-full">
                ⭐ Aktuell
              </span>
            )}
            {budgetCategory === 'future' && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded-full">
                🚀 Geplant
              </span>
            )}
            {budgetCategory === 'past' && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-600 text-white rounded-full">
                📁 Archiv
              </span>
            )}
          </div>
          {budget.beschreibung && (
            <p className="text-sm text-gray-600 mt-1">{budget.beschreibung}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className={getStatusBadge(budget.status)}>
            {getStatusText(budget.status)}
          </span>
        </div>
      </div>

      {/* Budget-Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-green-50 rounded-md">
          <p className="text-sm text-gray-600 mb-1">Gesamtbudget</p>
          <p className="text-lg font-bold text-green-600">
            {formatGermanCurrency(budget.gesamtbudget)}
          </p>
        </div>
        
        <div className="text-center p-3 bg-orange-50 rounded-md">
          <p className="text-sm text-gray-600 mb-1">
            Reserve ({budget.reserve_allokation}%)
          </p>
          <p className="text-lg font-bold text-orange-600">
            {formatGermanCurrency(reserveAmount)}
          </p>
        </div>
        
        <div className="text-center p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-gray-600 mb-1">Verfügbar</p>
          <p className="text-lg font-bold text-blue-600">
            {formatGermanCurrency(budget.verfuegbares_budget)}
          </p>
        </div>
      </div>

      {/* Fortschrittsbalken (nur für aktive Budgets) */}
      {budget.status === 'ACTIVE' && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Budget-Auslastung</span>
            <span>25%</span> {/* TODO: Aus tatsächlichen Daten berechnen */}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: '25%' }}
            ></div>
          </div>
        </div>
      )}

      {/* Metadaten */}
      <div className="text-xs text-gray-500 mb-4 space-y-1">
        <p>Erstellt: {new Date(budget.created_at).toLocaleDateString('de-DE')}</p>
        <p>Aktualisiert: {new Date(budget.updated_at).toLocaleDateString('de-DE')}</p>
      </div>

      {/* Aktionen */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="flex space-x-2">
          {/* Details anzeigen */}
          {onViewDetails && (
            <button
              data-testid="budget-view-details-btn"
              onClick={() => onViewDetails(budget)}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Details
            </button>
          )}

          {/* Bearbeiten */}
          {canEdit && onEdit && (
            <button
              data-testid="budget-edit-btn"
              onClick={() => onEdit(budget)}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Bearbeiten
            </button>
          )}

          {/* Löschen */}
          {canDelete && onDelete && (
            <button
              data-testid="budget-delete-btn"
              onClick={() => onDelete(budget)}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Löschen
            </button>
          )}
        </div>

        {/* Status-Änderungen */}
        <div className="flex space-x-2">
          {canActivate && onStatusChange && (
            <button
              onClick={() => onStatusChange(budget, 'ACTIVE')}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            >
              Aktivieren
            </button>
          )}

          {canClose && onStatusChange && (
            <button
              onClick={() => onStatusChange(budget, 'CLOSED')}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Schließen
            </button>
          )}
        </div>
      </div>
    </div>
  )
}