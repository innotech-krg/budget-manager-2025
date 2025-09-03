// =====================================================
// Budget Manager 2025 - Projekt-Liste
// Deutsche Geschäftsprojekt-Übersicht mit Filterung
// =====================================================

import React, { useState, useMemo } from 'react'
import { ProjectCard } from './ProjectCard'

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

interface ProjectListProps {
  projects: Project[]
  isLoading: boolean
  onViewDetails: (project: Project) => void
  onEdit: (project: Project) => void
  onDelete: (id: string) => void
}

type FilterType = 'all' | 'aktiv' | 'geplant' | 'abgeschlossen' | 'pausiert'
type SortField = 'name' | 'start_date' | 'priority' | 'planned_budget' | 'created_at'
type SortDirection = 'asc' | 'desc'

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  isLoading,
  onViewDetails,
  onEdit,
  onDelete
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterType>('all')
  const [teamFilter, setTeamFilter] = useState('')
  const [kategorieFilter, setKategorieFilter] = useState('')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Eindeutige Teams und Kategorien für Filter
  const uniqueTeams = useMemo(() => {
    return Array.from(new Set(projects.map(p => p.team_name || 'Unbekannt'))).sort()
  }, [projects])

  const uniqueKategorien = useMemo(() => {
    return Array.from(new Set(projects.map(p => p.kategorie_name || 'Unbekannt'))).sort()
  }, [projects])

  // Gefilterte und sortierte Projekte
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects.filter(project => {
      // Text-Suche
      const searchMatch = searchTerm === '' || 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.beschreibung.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.projektnummer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.tags && project.tags.some(tag => 
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        ))

      // Status-Filter
      const statusMatch = statusFilter === 'all' || project.status === statusFilter

      // Team-Filter
      const teamMatch = teamFilter === '' || project.team_name === teamFilter

      // Kategorie-Filter
      const kategorieMatch = kategorieFilter === '' || project.kategorie_name === kategorieFilter

      return searchMatch && statusMatch && teamMatch && kategorieMatch
    })

    // Sortierung
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      // Spezielle Behandlung für verschiedene Datentypen
      if (sortField === 'start_date' || sortField === 'created_at') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      } else if (sortField === 'planned_budget') {
        aValue = Number(aValue) || 0
        bValue = Number(bValue) || 0
      } else if (sortField === 'priority') {
        const priorityOrder = { 'Kritisch': 4, 'Hoch': 3, 'Mittel': 2, 'Niedrig': 1 }
        aValue = priorityOrder[aValue as keyof typeof priorityOrder] || 0
        bValue = priorityOrder[bValue as keyof typeof priorityOrder] || 0
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [projects, searchTerm, statusFilter, teamFilter, kategorieFilter, sortField, sortDirection])

  // Sortierung ändern
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Statistiken
  const stats = useMemo(() => {
    return {
      total: projects.length,
      aktiv: projects.filter(p => p.status === 'aktiv').length,
      geplant: projects.filter(p => p.status === 'geplant').length,
      abgeschlossen: projects.filter(p => p.status === 'abgeschlossen').length,
      pausiert: projects.filter(p => p.status === 'pausiert').length,
      gesamtkosten: projects.reduce((sum, p) => sum + (p.planned_budget || 0) + (p.consumed_budget || 0), 0)
    }
  }, [projects])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Projekte werden geladen...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistiken */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-blue-800">Gesamt</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats.aktiv}</div>
          <div className="text-sm text-green-800">Aktiv</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{stats.geplant}</div>
          <div className="text-sm text-yellow-800">Geplant</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">{stats.abgeschlossen}</div>
          <div className="text-sm text-gray-800">Abgeschlossen</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{stats.pausiert}</div>
          <div className="text-sm text-orange-800">Pausiert</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {new Intl.NumberFormat('de-DE', {
              style: 'currency',
              currency: 'EUR',
              notation: 'compact'
            }).format(stats.gesamtkosten)}
          </div>
          <div className="text-sm text-purple-800">Gesamtkosten</div>
        </div>
      </div>

      {/* Filter und Suche */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        {/* Suchfeld */}
        <div>
          <input
            type="text"
            placeholder="Projekte durchsuchen (Name, Beschreibung, Nummer, Tags)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="project-search-input"
          />
        </div>

        {/* Filter */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterType)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="status-filter"
          >
            <option value="all">Alle Status</option>
            <option value="aktiv">Aktiv</option>
            <option value="geplant">Geplant</option>
            <option value="abgeschlossen">Abgeschlossen</option>
            <option value="pausiert">Pausiert</option>
          </select>

          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="team-filter"
          >
            <option value="">Alle Teams</option>
            {uniqueTeams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>

          <select
            value={kategorieFilter}
            onChange={(e) => setKategorieFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="kategorie-filter"
          >
            <option value="">Alle Kategorien</option>
            {uniqueKategorien.map(kategorie => (
              <option key={kategorie} value={kategorie}>{kategorie}</option>
            ))}
          </select>

          <select
            value={`${sortField}-${sortDirection}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-')
              setSortField(field as SortField)
              setSortDirection(direction as SortDirection)
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="sort-select"
          >
            <option value="created_at-desc">Neueste zuerst</option>
            <option value="created_at-asc">Älteste zuerst</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="start_date-desc">Startdatum (neueste)</option>
            <option value="start_date-asc">Startdatum (älteste)</option>
            <option value="priority-desc">Priorität (hoch-niedrig)</option>
            <option value="priority-asc">Priorität (niedrig-hoch)</option>
            <option value="planned_budget-desc">Budget (hoch-niedrig)</option>
            <option value="planned_budget-asc">Budget (niedrig-hoch)</option>
          </select>
        </div>

        {/* Quick-Filter-Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
              setTeamFilter('')
              setKategorieFilter('')
            }}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300"
            data-testid="clear-filters-btn"
          >
            Filter zurücksetzen
          </button>
          <button
            onClick={() => setStatusFilter('aktiv')}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full hover:bg-blue-200"
            data-testid="active-projects-btn"
          >
            Nur aktive Projekte
          </button>
          <button
            onClick={() => setSortField('start_datum')}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
            data-testid="sort-by-date-btn"
          >
            Nach Startdatum
          </button>
        </div>
      </div>

      {/* Ergebnisse */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {filteredAndSortedProjects.length} von {projects.length} Projekten
          </h3>
        </div>

        {/* Projekt-Liste */}
        {filteredAndSortedProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {projects.length === 0 ? 'Noch keine Projekte' : 'Keine Projekte gefunden'}
            </h3>
            <p className="text-gray-600 mb-4">
              {projects.length === 0 
                ? 'Erstellen Sie Ihr erstes Projekt mit dem Button oben.'
                : 'Versuchen Sie andere Suchbegriffe oder Filter.'
              }
            </p>
            {projects.length > 0 && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setTeamFilter('')
                  setKategorieFilter('')
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                Filter zurücksetzen
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" data-testid="project-list">
            {filteredAndSortedProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onViewDetails={() => onViewDetails(project)}
                onEdit={() => onEdit(project)}
                onDelete={() => onDelete(project.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

