// =====================================================
// Budget Manager 2025 - Rechnungspositions-Tabelle
// Story 2.4: Projekt-Rechnungsposition-Management
// =====================================================

import React, { useState, useEffect } from 'react'
import { apiService } from '../../services/apiService'
import ManualPositionForm from './ManualPositionForm'
import DocumentViewer from '../documents/DocumentViewer'

interface InvoicePosition {
  id: string
  position_number: number
  description: string
  quantity: number
  unit_price: number
  total_amount: number
  tax_amount: number
  tax_rate: number
  category?: string
  assignment_type: 'AUTOMATIC' | 'MANUAL' | 'CORRECTED'
  confidence: number
  assigned_by?: string
  created_at: string
  updated_at: string
  invoice: {
    id: string
    number: string
    date: string
    supplier_name: string
    total_amount: number
    status: string
    created_at: string
  }
}

interface BudgetImpact {
  total_consumed_from_positions: number
  planned_budget: number
  consumed_budget: number
  available_budget: number
  positions_count: number
}

interface InvoicePositionsTableProps {
  projectId: string
  projectName: string
}

export const InvoicePositionsTable: React.FC<InvoicePositionsTableProps> = ({
  projectId,
  projectName
}) => {
  const [positions, setPositions] = useState<InvoicePosition[]>([])
  const [budgetImpact, setBudgetImpact] = useState<BudgetImpact | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showManualForm, setShowManualForm] = useState(false)
  const [expandedPosition, setExpandedPosition] = useState<string | null>(null)

  // Daten laden
  const loadInvoicePositions = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await apiService.getProjectInvoicePositions(projectId, {
        sortBy,
        sortOrder
      })

      if (response.success) {
        setPositions(response.data.positions)
        setBudgetImpact(response.data.budget_impact)
      } else {
        setError(response.error || 'Fehler beim Laden der Rechnungspositionen')
      }
    } catch (err) {
      console.error('Fehler beim Laden der Rechnungspositionen:', err)
      setError('Fehler beim Laden der Rechnungspositionen')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadInvoicePositions()
  }, [projectId, sortBy, sortOrder])

  // Sortierung ändern
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  // Manuelle Position erfolgreich erstellt
  const handleManualPositionSuccess = (newPosition: any) => {
    // Lade Daten neu, um die neue Position anzuzeigen
    loadInvoicePositions()
  }

  // Erweiterte Ansicht togglen
  const toggleExpandedPosition = (positionId: string) => {
    setExpandedPosition(expandedPosition === positionId ? null : positionId)
  }

  // Position entfernen
  const handleRemovePosition = async (positionId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Position vom Projekt entfernen möchten?')) {
      return
    }

    try {
      const response = await apiService.removeProjectInvoicePosition(projectId, positionId)
      
      if (response.success) {
        // Daten neu laden
        await loadInvoicePositions()
      } else {
        setError(response.error || 'Fehler beim Entfernen der Position')
      }
    } catch (err) {
      console.error('Fehler beim Entfernen der Position:', err)
      setError('Fehler beim Entfernen der Position')
    }
  }

  // Assignment-Type Styling
  const getAssignmentTypeStyle = (type: string) => {
    switch (type) {
      case 'AUTOMATIC':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'MANUAL':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'CORRECTED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getAssignmentTypeLabel = (type: string) => {
    switch (type) {
      case 'AUTOMATIC':
        return '🤖 Automatisch'
      case 'MANUAL':
        return '✋ Manuell'
      case 'CORRECTED':
        return '✏️ Korrigiert'
      default:
        return type
    }
  }

  // Konfidenz-Styling
  const getConfidenceStyle = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 font-semibold'
    if (confidence >= 70) return 'text-yellow-600 font-semibold'
    return 'text-red-600 font-semibold'
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Lade Rechnungspositionen...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-600 mr-2">⚠️</span>
            <span className="text-red-800">{error}</span>
          </div>
          <button
            onClick={loadInvoicePositions}
            className="mt-3 text-red-600 hover:text-red-800 font-medium"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              📄 Zugeordnete Rechnungspositionen
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Alle Rechnungspositionen die diesem Projekt zugeordnet sind
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              {positions.length} Position{positions.length !== 1 ? 'en' : ''}
            </div>
            <button
              onClick={() => setShowManualForm(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
            >
              <span className="mr-2">✋</span>
              Manuelle Position
            </button>
          </div>
        </div>
      </div>

      {/* Budget-Impact Übersicht */}
      {budgetImpact && (
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">💰 Budget-Auswirkung</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {new Intl.NumberFormat('de-DE', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(budgetImpact.planned_budget)}
              </div>
              <div className="text-xs text-gray-600">Geplantes Budget</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">
                {new Intl.NumberFormat('de-DE', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(budgetImpact.total_consumed_from_positions)}
              </div>
              <div className="text-xs text-gray-600">Verbrauchtes Budget</div>
              <div className="text-xs text-gray-500 mt-1">({budgetImpact.positions_count} Rechnungspositionen)</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {new Intl.NumberFormat('de-DE', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(budgetImpact.available_budget)}
              </div>
              <div className="text-xs text-gray-600">Verfügbares Budget</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabelle */}
      {positions.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Keine Rechnungspositionen zugeordnet
          </h3>
          <p className="text-gray-600">
            Diesem Projekt sind noch keine Rechnungspositionen zugeordnet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('invoice.date')}
                >
                  Rechnung
                  {sortBy === 'invoice.date' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('description')}
                >
                  Position
                  {sortBy === 'description' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('total_amount')}
                >
                  Betrag
                  {sortBy === 'total_amount' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zuordnung
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Konfidenz
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('created_at')}
                >
                  Zugeordnet am
                  {sortBy === 'created_at' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {positions.map((position) => (
                <React.Fragment key={position.id}>
                  <tr className="hover:bg-gray-50">
                  {/* Rechnung */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {position.invoice.number}
                      </div>
                      <div className="text-gray-500">
                        {position.invoice.supplier_name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(position.invoice.date).toLocaleDateString('de-DE')}
                      </div>
                    </div>
                  </td>

                  {/* Position */}
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900 mb-1">
                        {position.description}
                      </div>
                      <div className="text-xs text-gray-500">
                        {position.quantity}x à {new Intl.NumberFormat('de-DE', {
                          style: 'currency',
                          currency: 'EUR'
                        }).format(position.unit_price)}
                      </div>
                      {position.category && (
                        <div className="text-xs text-gray-400 mt-1">
                          📂 {position.category}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Betrag */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {new Intl.NumberFormat('de-DE', {
                        style: 'currency',
                        currency: 'EUR'
                      }).format(position.total_amount)}
                    </div>
                    {position.tax_amount > 0 && (
                      <div className="text-xs text-gray-500">
                        +{new Intl.NumberFormat('de-DE', {
                          style: 'currency',
                          currency: 'EUR'
                        }).format(position.tax_amount)} MwSt.
                      </div>
                    )}
                  </td>

                  {/* Zuordnung */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getAssignmentTypeStyle(position.assignment_type)}`}>
                      {getAssignmentTypeLabel(position.assignment_type)}
                    </span>
                    {position.assigned_by && (
                      <div className="text-xs text-gray-400 mt-1">
                        von {position.assigned_by}
                      </div>
                    )}
                  </td>

                  {/* Konfidenz */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`text-sm ${getConfidenceStyle(position.confidence)}`}>
                      {Math.round(position.confidence)}%
                    </span>
                  </td>

                  {/* Zugeordnet am */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(position.created_at).toLocaleDateString('de-DE')}
                    <div className="text-xs text-gray-400">
                      {new Date(position.created_at).toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </td>

                  {/* Aktionen */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => toggleExpandedPosition(position.id)}
                        className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
                        title="Original-Rechnung anzeigen"
                      >
                        📄 Dokument
                      </button>
                      <button
                        onClick={() => handleRemovePosition(position.id)}
                        className="text-red-600 hover:text-red-900 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
                        title="Position vom Projekt entfernen"
                      >
                        🗑️ Entfernen
                      </button>
                    </div>
                  </td>
                </tr>
                
                {/* Erweiterte Ansicht mit Original-Dokument */}
                {expandedPosition === position.id && (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 bg-gray-50">
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-900">
                          📎 Original-Rechnung: {position.invoice.number}
                        </h4>
                        <DocumentViewer 
                          invoiceId={position.invoice.id}
                          showUpload={false}
                        />
                      </div>
                    </td>
                  </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Manuelle Position Form */}
      {showManualForm && (
        <ManualPositionForm
          projectId={projectId}
          projectName={projectName}
          onClose={() => setShowManualForm(false)}
          onSuccess={handleManualPositionSuccess}
        />
      )}
    </div>
  )
}
