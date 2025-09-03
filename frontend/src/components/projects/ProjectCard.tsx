// =====================================================
// Budget Manager 2025 - Project Card Component
// Saubere, moderne Projekt-Darstellung
// =====================================================

import React from 'react'
import { Calendar, Users, Tag, TrendingUp, AlertTriangle, CheckCircle, Clock, XCircle, Edit, Trash2, Eye } from 'lucide-react'

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
  planned_budget: number
  consumed_budget: number
  status: string
  budget_status?: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'EXCEEDED'
  budget_usage_percent?: number
  tags?: string[]
}

interface ProjectCardProps {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
  onViewDetails: (project: Project) => void
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  onEdit, 
  onDelete, 
  onViewDetails 
}) => {

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '1970-01-01') return 'Nicht gesetzt'
    return new Date(dateString).toLocaleDateString('de-DE')
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { color: 'text-green-600', bg: 'bg-green-50', label: 'Aktiv' }
      case 'planned':
        return { color: 'text-blue-600', bg: 'bg-blue-50', label: 'Geplant' }
      case 'completed':
        return { color: 'text-gray-600', bg: 'bg-gray-50', label: 'Abgeschlossen' }
      case 'paused':
        return { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pausiert' }
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-50', label: status }
    }
  }

  const getBudgetStatusConfig = (status?: string) => {
    switch (status) {
      case 'HEALTHY':
        return { color: 'text-green-600', icon: CheckCircle, label: 'Gesund' }
      case 'WARNING':
        return { color: 'text-yellow-600', icon: Clock, label: 'Warnung' }
      case 'CRITICAL':
        return { color: 'text-orange-600', icon: AlertTriangle, label: 'Kritisch' }
      case 'EXCEEDED':
        return { color: 'text-red-600', icon: XCircle, label: 'Überschritten' }
      default:
        return { color: 'text-gray-600', icon: CheckCircle, label: 'Unbekannt' }
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50'
      case 'low':
        return 'text-green-600 bg-green-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const statusConfig = getStatusConfig(project.status)
  const budgetStatusConfig = getBudgetStatusConfig(project.budget_status)
  const BudgetIcon = budgetStatusConfig.icon

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        {/* Projekt-Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {project.name}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                  {project.priority === 'high' ? 'Hoch' : project.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                </span>
              </div>
              
              {project.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {project.description}
                </p>
              )}

              {/* Projekt-Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{formatDate(project.start_date)} - {formatDate(project.end_date)}</span>
                </div>
                
                {(project.team_name || (project.project_teams && project.project_teams.length > 0)) && (
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>
                      {project.team_name || 
                       project.project_teams?.map(pt => pt.teams?.name).filter(Boolean).join(', ') || 
                       'Kein Team'}
                    </span>
                  </div>
                )}
                
                {project.kategorie_name && (
                  <div className="flex items-center text-gray-600">
                    <Tag className="w-4 h-4 mr-2" />
                    <span>{project.kategorie_name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Budget-Tracking Integration */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BudgetIcon className={`w-4 h-4 ${budgetStatusConfig.color}`} />
                <span className="text-sm font-medium text-gray-700">Budget-Status</span>
                <span className={`text-xs px-2 py-1 rounded-full ${budgetStatusConfig.color} bg-white`}>
                  {budgetStatusConfig.label}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {project.budget_usage_percent?.toFixed(1)}% verbraucht
              </div>
            </div>

            {/* Budget-Balken */}
            <div className="mb-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    (project.budget_usage_percent || 0) > 100 ? 'bg-red-500' :
                    (project.budget_usage_percent || 0) > 90 ? 'bg-orange-500' :
                    (project.budget_usage_percent || 0) > 70 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(project.budget_usage_percent || 0, 100)}%` }}
                />
              </div>
            </div>

            {/* Budget-Zahlen */}
            <div className="flex justify-between text-sm">
              <div>
                <span className="text-gray-600">Geplant: </span>
                <span className="font-medium text-gray-900">{formatCurrency(project.planned_budget)}</span>
              </div>
              <div>
                <span className="text-gray-600">Verbraucht: </span>
                <span className="font-medium text-gray-900">{formatCurrency(project.consumed_budget)}</span>
              </div>
              <div>
                <span className="text-gray-600">Verfügbar: </span>
                <span className={`font-medium ${project.planned_budget - project.consumed_budget < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(project.planned_budget - project.consumed_budget)}
                </span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {project.resolved_tags && project.resolved_tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {project.resolved_tags.map((tag: any, index: number) => (
                <span
                  key={tag.id || index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: `${tag.color}20`, 
                    color: tag.color 
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Aktionen */}
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => onViewDetails(project)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Details anzeigen"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(project)}
            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Bearbeiten"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(project)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Löschen"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProjectCard