// =====================================================
// Budget Manager 2025 - Projekt-Detail-Modal
// Vollständige Projekt-Informationen anzeigen
// =====================================================

import React from 'react'
import { InvoicePositionsTable } from './InvoicePositionsTable'

interface Project {
  id: string
  project_number?: string
  name: string
  description?: string
  kategorie_name?: string
  team_name?: string
  start_date: string
  end_date: string
  priority: string
  cost_type?: string
  supplier?: string
  impact_level?: string
  planned_budget: number
  consumed_budget: number
  allocated_budget?: number
  internal_hours_design?: number
  internal_hours_content?: number
  internal_hours_dev?: number
  internal_hours_total?: number
  tags?: string[]
  status: string
  created_at: string
  updated_at: string
}

interface ProjectDetailModalProps {
  project: Project
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  onClose,
  onEdit,
  onDelete
}) => {
  // Status-Styling (für deutsche und englische Status)
  const getStatusStyle = (status: string) => {
    const normalizedStatus = status?.toLowerCase()
    switch (normalizedStatus) {
      case 'aktiv':
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'geplant':
      case 'planned':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'abgeschlossen':
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'pausiert':
      case 'paused':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Status-Label (deutsche Anzeige)
  const getStatusLabel = (status: string) => {
    const normalizedStatus = status?.toLowerCase()
    switch (normalizedStatus) {
      case 'aktiv':
      case 'active':
        return 'Aktiv'
      case 'geplant':
      case 'planned':
        return 'Geplant'
      case 'abgeschlossen':
      case 'completed':
        return 'Abgeschlossen'
      case 'pausiert':
      case 'paused':
        return 'Pausiert'
      default:
        return status
    }
  }

  // Verfügbares Budget berechnen (mit englischen Feldnamen)
  const verfuegbaresBudget = (project.planned_budget || 0) - (project.consumed_budget || 0)

  // Gesamte interne Stunden (mit englischen Feldnamen)
  const gesamtStunden = (project.internal_hours_design || 0) + 
                        (project.internal_hours_content || 0) + 
                        (project.internal_hours_dev || 0)

  // Durchlaufzeit berechnen (mit englischen Feldnamen)
  const calculateDuration = () => {
    if (project.start_date && project.end_date) {
      const start = new Date(project.start_date)
      const end = new Date(project.end_date)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7))
      return diffWeeks
    }
    return 0
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {project.name}
              </h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                  {project.project_number || project.id.slice(0, 8)}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusStyle(project.status)}`}>
                  {getStatusLabel(project.status)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Beschreibung */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Beschreibung</h3>
            <p className="text-gray-700 leading-relaxed">
              {project.description || 'Keine Beschreibung verfügbar'}
            </p>
          </div>

          {/* Grunddaten */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Grunddaten</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Kategorie</label>
                <p className="text-gray-900">{project.kategorie_name || 'Nicht zugewiesen'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Verantwortliches Team</label>
                <p className="text-gray-900">{project.team_name || 'Nicht zugewiesen'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Priorität</label>
                <p className="text-gray-900">{project.priority || 'Nicht festgelegt'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Kostenart</label>
                <p className="text-gray-900">{project.cost_type || 'Nicht festgelegt'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Impact Level</label>
                <p className="text-gray-900">{project.impact_level || 'Nicht bewertet'}</p>
              </div>
              {project.supplier && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Dienstleister</label>
                  <p className="text-gray-900">{project.supplier}</p>
                </div>
              )}
            </div>
          </div>

          {/* Zeitraum */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Zeitraum</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Startdatum</label>
                <p className="text-gray-900">
                  {project.start_date ? new Date(project.start_date).toLocaleDateString('de-DE') : 'Nicht festgelegt'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Enddatum</label>
                <p className="text-gray-900">
                  {project.end_date ? new Date(project.end_date).toLocaleDateString('de-DE') : 'Nicht festgelegt'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Durchlaufzeit</label>
                <p className="text-gray-900">{calculateDuration()} Wochen</p>
              </div>
            </div>
          </div>

          {/* Budget-Übersicht */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Budget-Übersicht</h3>
            
            {/* Budget-Fortschrittsbalken */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Budget-Auslastung</span>
                <span className="text-sm font-bold text-gray-900">
                  {((project.consumed_budget || 0) / (project.planned_budget || 1) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(((project.consumed_budget || 0) / (project.planned_budget || 1) * 100), 100)}%`
                  }}
                ></div>
              </div>
            </div>

            {/* Budget-Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <label className="block text-sm font-medium text-blue-700 mb-1">📊 Geplantes Budget</label>
                <p className="text-blue-900 font-bold text-xl">
                  {new Intl.NumberFormat('de-DE', {
                    style: 'currency',
                    currency: 'EUR'
                  }).format(project.planned_budget || 0)}
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <label className="block text-sm font-medium text-orange-700 mb-1">💸 Verbrauchtes Budget</label>
                <p className="text-orange-900 font-bold text-xl">
                  {new Intl.NumberFormat('de-DE', {
                    style: 'currency',
                    currency: 'EUR'
                  }).format(project.consumed_budget || 0)}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <label className="block text-sm font-medium text-green-700 mb-1">💚 Verfügbares Budget</label>
                <p className="text-green-900 font-bold text-xl">
                  {new Intl.NumberFormat('de-DE', {
                    style: 'currency',
                    currency: 'EUR'
                  }).format((project.planned_budget || 0) - (project.consumed_budget || 0))}
                </p>
              </div>
            </div>
          </div>

          {/* Interne Stunden */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">⏰ Interne Stunden</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <label className="block text-sm font-medium text-purple-700 mb-1">🎨 Design</label>
                <p className="text-purple-900 font-bold text-lg">{project.internal_hours_design || 0}h</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <label className="block text-sm font-medium text-yellow-700 mb-1">📝 Content</label>
                <p className="text-yellow-900 font-bold text-lg">{project.internal_hours_content || 0}h</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <label className="block text-sm font-medium text-indigo-700 mb-1">💻 Development</label>
                <p className="text-indigo-900 font-bold text-lg">{project.internal_hours_dev || 0}h</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg border border-gray-300">
                <label className="block text-sm font-medium text-gray-700 mb-1">📊 Gesamt</label>
                <p className="text-gray-900 font-bold text-xl">{gesamtStunden}h</p>
              </div>
            </div>
          </div>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {project.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rechnungspositionen */}
          <div>
            <InvoicePositionsTable 
              projectId={project.id}
              projectName={project.name}
            />
          </div>

          {/* Metadaten */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadaten</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Erstellt am</label>
                <p className="text-gray-900">
                  {new Date(project.created_at).toLocaleString('de-DE')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Zuletzt aktualisiert</label>
                <p className="text-gray-900">
                  {new Date(project.updated_at).toLocaleString('de-DE')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="flex justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Schließen
            </button>
            <div className="flex space-x-3">
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                data-testid="edit-project-modal-btn"
              >
                ✏️ Bearbeiten
              </button>
              <button
                onClick={onDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                data-testid="delete-project-modal-btn"
              >
                🗑️ Löschen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}




