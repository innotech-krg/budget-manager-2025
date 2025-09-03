// =====================================================
// Budget Manager 2025 - Moderne Projekt-Verwaltung
// Integriert 3D Budget-Tracking für bessere UX
// =====================================================

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ProjectFormAdvanced from '../components/projects/ProjectFormAdvanced'
import { ProjectDetailModal } from '../components/projects/ProjectDetailModal'
import { ProjectBudgetOverview } from '../components/projects/ProjectBudgetOverview'
import { ProjectCard } from '../components/projects/ProjectCard'

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
  budget_status?: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'EXCEEDED'
  budget_usage_percent?: number
}

export const ProjectManagement: React.FC = () => {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [annualBudget, setAnnualBudget] = useState<any>(null)

  // Projekte laden
  const loadProjects = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/projects')
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Projekte')
      }
      const data = await response.json()
      
      // Epic 9: Lade zusätzliche Relationen-Daten, Tags und Jahresbudget
      const [tagsResponse, budgetResponse] = await Promise.all([
        fetch('/api/tags'),
        fetch('/api/budgets')
      ])
      const tagsData = tagsResponse.ok ? await tagsResponse.json() : { data: [] }
      const allTags = tagsData.data || tagsData || []
      const budgetData = budgetResponse.ok ? await budgetResponse.json() : null
      
      // Aktuelles Jahresbudget setzen
      if (budgetData && budgetData.currentYearBudget) {
        setAnnualBudget(budgetData.currentYearBudget)
      }
      
                      // Epic 9: Die Teams und Suppliers kommen bereits vom Backend mit
                const projectsWithRelations = (data.projects || data).map((project: any) => {
                  // Resolve Tag-IDs zu Tag-Namen
                  const resolvedTags = project.tags ? 
                    project.tags.map((tagId: string) => {
                      const tag = allTags.find((t: any) => t.id === tagId)
                      return tag ? { id: tag.id, name: tag.name, color: tag.color } : null
                    }).filter(Boolean) : []
                  
                  return {
                    ...project,
                    resolved_tags: resolvedTags
                  }
                })
      
      // Budget-Status für jedes Projekt berechnen
      const projectsWithBudgetStatus = projectsWithRelations.map((project: any) => {
        // Epic 9: Verwende external_budget falls planned_budget 0 ist
        const totalBudget = parseFloat(project.external_budget) || parseFloat(project.planned_budget) || 0
        const consumedBudget = parseFloat(project.consumed_budget) || 0
        const budgetUsagePercent = totalBudget > 0 ? (consumedBudget / totalBudget) * 100 : 0
        
        let budgetStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'EXCEEDED' = 'HEALTHY'
        
        if (budgetUsagePercent > 100) {
          budgetStatus = 'EXCEEDED'
        } else if (budgetUsagePercent > 90) {
          budgetStatus = 'CRITICAL'
        } else if (budgetUsagePercent > 70) {
          budgetStatus = 'WARNING'
        }
        
        return {
          ...project,
          // Korrigiere Budget-Felder für Epic 9 Kompatibilität
          planned_budget: totalBudget,
          consumed_budget: consumedBudget,
          budget_status: budgetStatus,
          budget_usage_percent: Math.round(budgetUsagePercent * 10) / 10
        }
      })
      
      setProjects(projectsWithBudgetStatus)
    } catch (err) {
      setError('Fehler beim Laden der Projekte')
      console.error('Error loading projects:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  // Event Handler
  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setShowCreateForm(true)
  }

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Möchten Sie das Projekt "${project.name}" wirklich löschen?`)) return
    
    try {
      const response = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Fehler beim Löschen')
      
      alert(`Projekt "${project.name}" wurde erfolgreich gelöscht`)
      await loadProjects()
    } catch (err) {
      setError('Fehler beim Löschen des Projekts')
    }
  }

  const handleViewDetails = (project: Project) => {
    // Navigiere zur Projekt-Detailansicht
    navigate(`/projects/${project.id}`)
  }

  const handleProjectSaved = () => {
    setShowCreateForm(false)
    setEditingProject(null)
    loadProjects()
  }





  // Filter-Logik
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.project_number?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Projekte werden geladen...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Sauberer Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Projekt-Verwaltung</h1>
              <p className="text-gray-600">Übersicht und Verwaltung aller Projekte mit integriertem Budget-Tracking</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg"
                data-testid="create-project-btn"
              >
                ➕ Neues Projekt erstellen
              </button>
            </div>
          </div>
        </div>

        {/* Fehler-Anzeige */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* 3D Budget-Tracking Integration */}
        <ProjectBudgetOverview projects={filteredProjects} annualBudget={annualBudget} />

        {/* Vereinfachte Projekt-Liste */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Projekte ({filteredProjects.length})
              </h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Projekte durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                  data-testid="project-search"
                />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Alle Status</option>
                  <option value="active">Aktiv</option>
                  <option value="planned">Geplant</option>
                  <option value="completed">Abgeschlossen</option>
                  <option value="paused">Pausiert</option>
                </select>
              </div>
            </div>
          </div>
          
          {filteredProjects.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Projekte gefunden</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Keine Projekte entsprechen den aktuellen Filterkriterien.'
                  : 'Erstellen Sie Ihr erstes Projekt, um zu beginnen.'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  ➕ Erstes Projekt erstellen
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={handleEditProject}
                  onDelete={handleDeleteProject}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modals */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingProject ? 'Projekt bearbeiten' : 'Neues Projekt erstellen'}
                </h2>
              </div>
              <div className="p-6">
                <ProjectFormAdvanced
                  project={editingProject}
                  onSave={handleProjectSaved}
                  onCancel={() => {
                    setShowCreateForm(false)
                    setEditingProject(null)
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {selectedProject && (
          <ProjectDetailModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
            onEdit={handleEditProject}
            onDelete={handleDeleteProject}
          />
        )}
      </div>
    </div>
  )
}

export default ProjectManagement