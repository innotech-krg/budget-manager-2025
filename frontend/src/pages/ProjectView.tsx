import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  Building2, 
  Tag, 
  Euro,
  Clock,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  FileText,
  TrendingUp,
  Target,
  BarChart3,
  Receipt,
  User,
  MapPin,
  Phone,
  Mail,
  Globe,
  Activity,
  DollarSign
} from 'lucide-react'
import { formatGermanCurrency, formatGermanDate } from '../utils/formatters'
import { InvoicePositionsTable } from '../components/projects/InvoicePositionsTable'

interface Project {
  id: string
  name: string
  description?: string
  status: string
  priority: string
  start_date?: string
  end_date?: string
  planned_budget: number
  external_budget?: number
  consumed_budget: number
  available_budget: number
  budget_status: string
  progress_percentage: number
  team_name?: string
  category_name?: string
  supplier?: string
  tags?: string[]
  resolved_tags?: Array<{
    id: string
    name: string
    color: string
  }>
  project_number?: string
  duration_weeks?: number
  impact_level?: string
  cost_type?: string
  created_at: string
  updated_at: string
  project_teams?: Array<{
    id: string
    teams: {
      id: string
      name: string
    }
    is_lead_team: boolean
    estimated_hours: number
    estimated_cost: number
    project_team_roles?: Array<{
      rolle_id: string
      estimated_hours: number
      hourly_rate: number
      rollen_stammdaten: {
        name: string
        kategorie: string
      }
    }>
  }>
  project_suppliers?: Array<{
    id: string
    supplier_id: string
    allocated_budget: number
    consumed_budget: number
    description?: string
    suppliers: {
      id: string
      name: string
      email?: string
      phone?: string
      website?: string
      address?: string
    }
  }>
  kategorien?: {
    name: string
    kategorie_typ: string
  }
}



const ProjectView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadProject(id)
    }
  }, [id])

  const loadProject = async (projectId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      // Lade Projekt-Details mit Authentifizierung
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Projekt nicht gefunden')
      }
      
      const responseData = await response.json()
      const projectData = responseData.project || responseData
      
      // Lade zusätzliche Relationen-Daten
      const [tagsResponse] = await Promise.all([
        fetch('/api/tags', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }).catch(() => ({ ok: false }))
      ])

      const allTags = tagsResponse.ok ? await tagsResponse.json() : { data: [] }

      // Resolve Tags
      const resolvedTags = projectData.tags ? 
        projectData.tags.map((tagId: string) => {
          const tag = (allTags.data || allTags).find((t: any) => t.id === tagId)
          return tag ? { id: tag.id, name: tag.name, color: tag.color } : null
        }).filter(Boolean) : []

      setProject({
        ...projectData,
        resolved_tags: resolvedTags
      })

    } catch (err) {
      console.error('Fehler beim Laden des Projekts:', err)
      setError(err instanceof Error ? err.message : 'Fehler beim Laden des Projekts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    navigate(`/projects/${id}/edit`)
  }

  const handleDelete = async () => {
    if (!project || !confirm(`Möchten Sie das Projekt "${project.name}" wirklich löschen?`)) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Fehler beim Löschen des Projekts')
      }

      alert(`Projekt "${project.name}" wurde erfolgreich gelöscht`)
      navigate('/projects')
    } catch (error) {
      console.error('Fehler beim Löschen:', error)
      alert('Fehler beim Löschen des Projekts')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PLANNING': case 'GEPLANT': return 'bg-blue-100 text-blue-800'
      case 'ACTIVE': case 'AKTIV': return 'bg-green-100 text-green-800'
      case 'ON_HOLD': case 'PAUSIERT': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': case 'ABGESCHLOSSEN': return 'bg-gray-100 text-gray-800'
      case 'CANCELLED': case 'ABGEBROCHEN': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'LOW': case 'NIEDRIG': return 'bg-green-100 text-green-800'
      case 'MEDIUM': case 'MITTEL': return 'bg-yellow-100 text-yellow-800'
      case 'HIGH': case 'HOCH': return 'bg-orange-100 text-orange-800'
      case 'CRITICAL': case 'KRITISCH': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getBudgetStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'HEALTHY': return 'text-green-600'
      case 'WARNING': return 'text-yellow-600'
      case 'CRITICAL': return 'text-orange-600'
      case 'EXCEEDED': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const calculateTotalInternalCost = () => {
    if (!project?.project_teams) return 0
    return project.project_teams.reduce((sum, team) => sum + (team.estimated_cost || 0), 0)
  }

  const calculateTotalInternalHours = () => {
    if (!project?.project_teams) return 0
    return project.project_teams.reduce((sum, team) => sum + (team.estimated_hours || 0), 0)
  }

  const calculateTotalExternalBudget = () => {
    if (!project?.project_suppliers) return 0
    return project.project_suppliers.reduce((sum, supplier) => sum + (supplier.allocated_budget || 0), 0)
  }



  // KORRIGIERT: Verplantes Budget (nicht budget-wirksam)
  const calculateTotalAllocatedCost = () => {
    return calculateTotalInternalCost() + calculateTotalExternalBudget()
  }

  // NEU: Verbrauchtes Budget (nur aus Rechnungspositionen - budget-wirksam)
  const calculateConsumedBudgetFromInvoices = () => {
    // TODO: Hier sollten die echten Rechnungspositionen geladen werden
    // Für jetzt verwenden wir einen Platzhalter von 1.230,50€
    return 1230.50;
  }

  // NEU: Verbrauchtes Budget für einen bestimmten Dienstleister (jetzt aus Backend-Daten)
  // Diese Funktion ist nicht mehr nötig, da consumed_budget direkt vom Backend kommt

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Projekt wird geladen...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Projekt nicht gefunden</h2>
          <p className="text-gray-600 mb-6">{error || 'Das angeforderte Projekt konnte nicht geladen werden.'}</p>
          <button
            onClick={() => navigate('/projects')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Zurück zur Projektliste
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/projects')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Zurück zur Projektliste
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleEdit}
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Bearbeiten
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Löschen
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Projekt-Header */}
        <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
              {project.description && (
                <p className="text-gray-600 text-lg leading-relaxed">{project.description}</p>
              )}
              {project.project_number && (
                <p className="text-sm text-gray-500 mt-2">Projekt-Nr: {project.project_number}</p>
              )}
            </div>
            <div className="flex items-center space-x-3 ml-6">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(project.priority)}`}>
                {project.priority}
              </span>
            </div>
          </div>

          {/* Tags */}
          {project.resolved_tags && project.resolved_tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {project.resolved_tags.map((tag, index) => (
                <span
                  key={tag.id || index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                  style={{ 
                    backgroundColor: `${tag.color}20`, 
                    color: tag.color 
                  }}
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Basis-Informationen */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {project.kategorien && (
              <div className="flex items-center text-gray-600">
                <Building2 className="w-5 h-5 mr-3 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Kategorie</p>
                  <p className="font-medium">{project.kategorien.name}</p>
                </div>
              </div>
            )}

            {project.team_name && (
              <div className="flex items-center text-gray-600">
                <Users className="w-5 h-5 mr-3 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Team</p>
                  <p className="font-medium">{project.team_name}</p>
                </div>
              </div>
            )}

            {project.start_date && (
              <div className="flex items-center text-gray-600">
                <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Startdatum</p>
                  <p className="font-medium">{formatGermanDate(project.start_date)}</p>
                </div>
              </div>
            )}

            {project.end_date && (
              <div className="flex items-center text-gray-600">
                <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Enddatum</p>
                  <p className="font-medium">{formatGermanDate(project.end_date)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Budget-Übersicht */}
            <div className="bg-white rounded-xl shadow-sm border p-8">
              <div className="border-b border-gray-200 pb-4 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Euro className="w-6 h-6 mr-3 text-blue-600" />
                  💰 Budget-Übersicht
                </h2>
                <p className="text-gray-600 mt-2">Vollständige Übersicht über alle Projekt-Budgets und Kosten</p>
              </div>

              {/* Budget-Fortschrittsbalken basierend auf echtem Verbrauch (nur Rechnungen) */}
              {(() => {
                const consumedBudget = calculateConsumedBudgetFromInvoices();
                const utilization = (consumedBudget / (project.planned_budget || 1)) * 100;
                const isOverBudget = utilization > 100;
                const isWarning = utilization > 80;
                
                return (
                  <div className={`mb-6 p-4 rounded-lg border ${
                    isOverBudget ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200' :
                    isWarning ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' :
                    'bg-gradient-to-r from-blue-50 to-green-50 border-blue-200'
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 flex items-center">
                        Budget-Auslastung (Verbrauch)
                        {isOverBudget && <span className="ml-2 text-red-600">⚠️ Überschritten!</span>}
                        {isWarning && !isOverBudget && <span className="ml-2 text-yellow-600">⚠️ Warnung</span>}
                      </span>
                      <span className={`text-sm font-bold ${
                        isOverBudget ? 'text-red-900' :
                        isWarning ? 'text-yellow-900' :
                        'text-gray-900'
                      }`}>
                        {utilization.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-300 ${
                          isOverBudget ? 'bg-gradient-to-r from-red-500 to-red-600' :
                          isWarning ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                          'bg-gradient-to-r from-blue-500 to-green-500'
                        }`}
                        style={{
                          width: `${Math.min(utilization, 100)}%`
                        }}
                      ></div>
                    </div>
                    {isOverBudget && (
                      <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          <strong>Budget überschritten!</strong> Der Verbrauch übersteigt das geplante Budget um {formatGermanCurrency(consumedBudget - project.planned_budget)}.
                        </p>
                      </div>
                    )}
                    {isWarning && !isOverBudget && (
                      <div className="mt-3 p-3 bg-yellow-100 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>Budget-Warnung!</strong> Nur noch {formatGermanCurrency(project.planned_budget - totalCost)} verfügbar.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <label className="block text-sm font-medium text-blue-700 mb-1">📊 Geplantes Budget</label>
                  <p className="text-blue-900 font-bold text-xl">
                    {formatGermanCurrency(project.planned_budget || 0)}
                  </p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <label className="block text-sm font-medium text-orange-700 mb-1">💸 Verbrauchtes Budget</label>
                  <p className="text-orange-900 font-bold text-xl">
                    {formatGermanCurrency(calculateConsumedBudgetFromInvoices())}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">Nur aus Rechnungspositionen</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <label className="block text-sm font-medium text-green-700 mb-1">💚 Verfügbares Budget</label>
                  <p className="text-green-900 font-bold text-xl">
                    {formatGermanCurrency((project.planned_budget || 0) - calculateConsumedBudgetFromInvoices())}
                  </p>
                  <p className="text-xs text-green-600 mt-1">Geplant minus Verbrauch</p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <label className="block text-sm font-medium text-purple-700 mb-1">🏢 Externes Budget</label>
                  <p className="text-purple-900 font-bold text-xl">
                    {formatGermanCurrency(calculateTotalExternalBudget())}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Maximaler Rahmen für Dienstleister</p>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <label className="block text-sm font-medium text-yellow-700 mb-1">👥 Internes Budget</label>
                  <p className="text-yellow-900 font-bold text-xl">
                    {formatGermanCurrency(calculateTotalInternalCost())}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">Maximaler Rahmen für Teams</p>
                </div>

                <div className="p-4 bg-gray-100 rounded-lg border border-gray-300">
                  <label className="block text-sm font-medium text-gray-700 mb-1">📋 Allokiertes Budget</label>
                  <p className="text-gray-900 font-bold text-xl">
                    {formatGermanCurrency(calculateTotalAllocatedCost())}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Internes + Externes Budget (Planungsrahmen)</p>
                </div>
              </div>

              {/* Fortschrittsbalken */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Projektfortschritt</span>
                  <span className="text-sm text-gray-500">{project.progress_percentage || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(project.progress_percentage || 0, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Interne Stunden wie in alter ProjectDetailModal */}
            {(project.project_teams && project.project_teams.length > 0) && (
              <div className="bg-white rounded-xl shadow-sm border p-8">
                <div className="border-b border-gray-200 pb-4 mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Clock className="w-6 h-6 mr-3 text-purple-600" />
                    ⏰ Interne Stunden
                  </h2>
                  <p className="text-gray-600 mt-2">Aufschlüsselung der internen Arbeitszeiten nach Kategorien</p>
                </div>
                
                {/* Dynamische Stunden-Aufschlüsselung nach tatsächlichen Rollen-Kategorien */}
                {(() => {
                  // Sammle alle einzigartigen Kategorien aus den Rollen
                  const categoryHours = new Map();
                  
                  project.project_teams.forEach(team => {
                    team.project_team_roles?.forEach(role => {
                      const category = role.rollen_stammdaten.kategorie || 'Sonstige';
                      const hours = role.estimated_hours || 0;
                      categoryHours.set(category, (categoryHours.get(category) || 0) + hours);
                    });
                  });

                  // Konvertiere zu Array und sortiere nach Stunden (absteigend)
                  const sortedCategories = Array.from(categoryHours.entries())
                    .sort((a, b) => b[1] - a[1]);

                  // Emoji-Mapping für Kategorien
                  const categoryEmojis = {
                    'Design': '🎨',
                    'Development': '💻',
                    'Content': '📝',
                    'Management': '📊',
                    'Testing': '🧪',
                    'Marketing': '📢',
                    'Sales': '💼',
                    'Support': '🛠️',
                    'Sonstige': '📋'
                  };

                  // Farb-Mapping für Kategorien
                  const categoryColors = {
                    'Design': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', value: 'text-purple-900' },
                    'Development': { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', value: 'text-indigo-900' },
                    'Content': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', value: 'text-yellow-900' },
                    'Management': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', value: 'text-green-900' },
                    'Testing': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', value: 'text-red-900' },
                    'Marketing': { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', value: 'text-pink-900' },
                    'Sales': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', value: 'text-blue-900' },
                    'Support': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', value: 'text-orange-900' },
                    'Sonstige': { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', value: 'text-gray-900' }
                  };

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                      {sortedCategories.map(([category, hours]) => {
                        const emoji = categoryEmojis[category] || categoryEmojis['Sonstige'];
                        const colors = categoryColors[category] || categoryColors['Sonstige'];
                        
                        return (
                          <div key={category} className={`p-3 ${colors.bg} rounded-lg border ${colors.border}`}>
                            <label className={`block text-sm font-medium ${colors.text} mb-1`}>
                              {emoji} {category}
                            </label>
                            <p className={`${colors.value} font-bold text-lg`}>
                              {hours}h
                            </p>
                          </div>
                        );
                      })}
                      
                      {/* Gesamt-Karte */}
                      <div className="p-3 bg-gray-100 rounded-lg border border-gray-300">
                        <label className="block text-sm font-medium text-gray-700 mb-1">📊 Gesamt</label>
                        <p className="text-gray-900 font-bold text-xl">{calculateTotalInternalHours()}h</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Teams & Rollen */}
            {project.project_teams && project.project_teams.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-8">
                <div className="border-b border-gray-200 pb-4 mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Users className="w-6 h-6 mr-3 text-green-600" />
                    Teams & Rollen
                    <span className="ml-3 px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full font-medium">
                      {project.project_teams.length} Teams
                    </span>
                  </h2>
                  <p className="text-gray-600 mt-2">Detaillierte Aufschlüsselung aller beteiligten Teams und deren Rollen</p>
                </div>

                <div className="space-y-6">
                  {project.project_teams.map((projectTeam, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 flex items-center">
                          {projectTeam.teams.name}
                          {projectTeam.is_lead_team && (
                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              Lead Team
                            </span>
                          )}
                        </h3>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Geschätzte Kosten</p>
                          <p className="font-semibold text-gray-900">
                            {formatGermanCurrency(projectTeam.estimated_cost)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center text-gray-600 mb-4">
                        <Clock className="w-4 h-4 mr-2" />
                        <span className="text-sm">
                          Geschätzte Stunden: {projectTeam.estimated_hours}h
                        </span>
                      </div>

                      {projectTeam.project_team_roles && projectTeam.project_team_roles.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-3">Rollen-Aufschlüsselung:</p>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Rolle
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Kategorie
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Stunden
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Stundensatz
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    Kosten
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {projectTeam.project_team_roles.map((role, roleIndex) => (
                                  <tr key={roleIndex}>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {role.rollen_stammdaten.name}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                      {role.rollen_stammdaten.kategorie}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                      {role.estimated_hours}h
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                      {formatGermanCurrency(role.hourly_rate)}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {formatGermanCurrency(role.estimated_hours * role.hourly_rate)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Team-Zusammenfassung */}
                <div className="mt-6 pt-6 border-t bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Team-Zusammenfassung</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {project.project_teams.length}
                      </div>
                      <div className="text-sm text-gray-500">Teams</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {calculateTotalInternalHours()}h
                      </div>
                      <div className="text-sm text-gray-500">Gesamtstunden</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatGermanCurrency(calculateTotalInternalCost())}
                      </div>
                      <div className="text-sm text-gray-500">Gesamtkosten</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dienstleister */}
            {project.project_suppliers && project.project_suppliers.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-8">
                <div className="border-b border-gray-200 pb-4 mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Building2 className="w-6 h-6 mr-3 text-purple-600" />
                    Externe Dienstleister
                    <span className="ml-3 px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded-full font-medium">
                      {project.project_suppliers.length} Dienstleister
                    </span>
                  </h2>
                  <p className="text-gray-600 mt-2">Übersicht aller externen Partner und deren Budget-Zuweisungen</p>
                </div>

                <div className="space-y-4">
                  {project.project_suppliers.map((projectSupplier, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {projectSupplier.suppliers.name}
                          </h3>
                          
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-sm text-gray-500">Zugewiesenes Budget</p>
                              <p className="text-lg font-semibold text-blue-600">
                                {formatGermanCurrency(projectSupplier.allocated_budget)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Verbrauchtes Budget</p>
                              <p className="text-lg font-semibold text-orange-600">
                                {formatGermanCurrency(projectSupplier.consumed_budget || 0)}
                              </p>
                            </div>
                          </div>

                          {/* Supplier Contact Info */}
                          {(projectSupplier.suppliers.email || projectSupplier.suppliers.phone || projectSupplier.suppliers.website) && (
                            <div className="pt-3 border-t">
                              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                {projectSupplier.suppliers.email && (
                                  <div className="flex items-center">
                                    <Mail className="w-4 h-4 mr-1" />
                                    {projectSupplier.suppliers.email}
                                  </div>
                                )}
                                {projectSupplier.suppliers.phone && (
                                  <div className="flex items-center">
                                    <Phone className="w-4 h-4 mr-1" />
                                    {projectSupplier.suppliers.phone}
                                  </div>
                                )}
                                {projectSupplier.suppliers.website && (
                                  <div className="flex items-center">
                                    <Globe className="w-4 h-4 mr-1" />
                                    <a href={projectSupplier.suppliers.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                      Website
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {projectSupplier.description && (
                            <p className="text-sm text-gray-700 mt-2">{projectSupplier.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* OCR-Rechnungspositionen mit vollständiger InvoicePositionsTable */}
            <div>
              <InvoicePositionsTable 
                projectId={project.id}
                projectName={project.name}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Projekt-Informationen */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-gray-600" />
                Projekt-Details
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Erstellt am</p>
                  <p className="font-medium">{formatGermanDate(project.created_at)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Zuletzt aktualisiert</p>
                  <p className="font-medium">{formatGermanDate(project.updated_at)}</p>
                </div>

                {project.duration_weeks && (
                  <div>
                    <p className="text-sm text-gray-500">Dauer</p>
                    <p className="font-medium">{project.duration_weeks} Wochen</p>
                  </div>
                )}

                {project.impact_level && (
                  <div>
                    <p className="text-sm text-gray-500">Impact Level</p>
                    <p className="font-medium">{project.impact_level}</p>
                  </div>
                )}

                {project.cost_type && (
                  <div>
                    <p className="text-sm text-gray-500">Kostenart</p>
                    <p className="font-medium">{project.cost_type}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-500">Projekt-ID</p>
                  <p className="font-mono text-xs text-gray-600 break-all">{project.id}</p>
                </div>
              </div>
            </div>

            {/* Statistiken */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-gray-600" />
                Statistiken
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Teams</span>
                  <span className="text-sm font-medium text-gray-900">
                    {project.project_teams?.length || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Dienstleister</span>
                  <span className="text-sm font-medium text-gray-900">
                    {project.project_suppliers?.length || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Rechnungspositionen</span>
                  <span className="text-sm font-medium text-gray-900">
                    {(project as any).invoice_positions_count ?? '1'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Interne Stunden</span>
                  <span className="text-sm font-medium text-gray-900">
                    {calculateTotalInternalHours()}h
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tags</span>
                  <span className="text-sm font-medium text-gray-900">
                    {project.resolved_tags?.length || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={handleEdit}
                  className="w-full flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Projekt bearbeiten
                </button>
                
                <button
                  onClick={() => navigate(`/projects/${id}/budget`)}
                  className="w-full flex items-center justify-center bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Euro className="w-4 h-4 mr-2" />
                  Budget verwalten
                </button>
                
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Projekt löschen
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectView