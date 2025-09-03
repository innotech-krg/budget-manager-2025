// =====================================================
// Budget Manager 2025 - Projekt-Formular
// Vollständige Implementierung gemäß Stories 1.2.1-1.2.4
// =====================================================

import React, { useState, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import BudgetSlider from '../budget/BudgetSlider'
import YearSelector from '../budget/YearSelector'
import TeamSelector from '../teams/TeamSelector'
import TagSelector from '../tags/TagSelector'
import { Tag } from '../../services/tagApi'

// Story 1.2.1: Supplier-Stammdaten (Österreich)
interface Supplier {
  id: string
  name: string
  business_sector?: string
  legal_form?: string
  uid_number?: string
  email?: string
  status: 'ACTIVE' | 'INACTIVE'
  country: string
}

interface Dienstleister {
  id: string
  name: string
  kategorie: string
  status: string
}

// Story 1.2.2: Multi-Team-Management
interface ProjektTeam {
  id?: string
  team_name: string
  ist_lead_team: boolean
  beschreibung?: string
  rollen: TeamRolle[]
}

interface TeamRolle {
  id?: string
  rolle_name: string
  geplante_stunden: number
  tatsaechliche_stunden?: number
  stundensatz?: number
  projekt_stundensatz?: number
  stundensatz_grund?: string
  notizen?: string
}

// Story 1.2.3: Budget-Allocation
interface BudgetInfo {
  jahresbudget: number
  zugeordnetes_budget: number
  verfuegbares_budget: number
  verfuegbar_prozent: number
}

interface ProjectFormData {
  // Basis-Projekt-Daten
  name: string
  description: string
  kategorie_name: string
  kategorie_id?: string
  start_date: string
  end_date: string
  priority: string
  cost_type: string
  impact_level: string
  impact_description?: string
  notes?: string
  tags?: Tag[]
  status: 'active' | 'planned' | 'completed' | 'paused'
  
  // Story 1.2.1: Supplier (Österreich)
  supplier_id?: string
  
  // Story 1.2.2: Multi-Team
  teams: ProjektTeam[]
  
  // Story 1.2.3: Budget-Allocation
  planned_budget: number
  budget_year: number
  cost_limit?: number
  
  // Story 1.2.4: Automatisch berechnet
  internal_costs_total?: number
  external_costs_total?: number
  gesamtstunden?: number
}

interface ProjectFormProps {
  initialData?: Partial<ProjectFormData>
  onSubmit: (data: ProjectFormData) => void
  onCancel: () => void
  isEditing?: boolean
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false
}) => {
  // State für verschiedene Komponenten
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [dienstleister, setDienstleister] = useState<Dienstleister[]>([]) // 🔧 FIX: Missing state
  const [budgetInfo, setBudgetInfo] = useState<BudgetInfo | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [teams, setTeams] = useState<ProjektTeam[]>(initialData?.teams || [])
  const [showTeamSelector, setShowTeamSelector] = useState(false)
  const [showSupplierForm, setShowSupplierForm] = useState(false)
  const [tags, setTags] = useState<Tag[]>(initialData?.tags || [])
  const [interneKostenGesamt, setInterneKostenGesamt] = useState(0)
  const [gesamtstunden, setGesamtstunden] = useState(0)

  // React Hook Form Setup
  const methods = useForm<ProjectFormData>({
    defaultValues: {
      name: initialData?.name || '',
      beschreibung: initialData?.beschreibung || '',
      kategorie_name: initialData?.kategorie_name || 'IT & Digitalisierung',
      start_datum: initialData?.start_datum || '',
      end_datum: initialData?.end_datum || '',
      prioritaet: initialData?.prioritaet || 'mittel',
      kostenart: initialData?.kostenart || 'Software & Lizenzen',
      impact_level: initialData?.impact_level || 'mittel',
      dienstleister_id: initialData?.dienstleister_id || '',
      geplantes_budget: initialData?.geplantes_budget || 0,
      budget_jahr: initialData?.budget_jahr || new Date().getFullYear(),
      kosten_obergrenze: initialData?.kosten_obergrenze || undefined,
      teams: teams,
      status: initialData?.status || 'geplant',
      tags: tags
    }
  })

  const { register, handleSubmit, watch, setValue, formState: { errors } } = methods

  // Watchers für Live-Updates
  const watchedBudget = watch('geplantes_budget')
  const watchedTeams = watch('teams')

  // Story 1.2.1: Dienstleister laden
  useEffect(() => {
    loadDienstleister()
  }, [])

  // Story 1.2.3: Budget-Info laden
  useEffect(() => {
    loadBudgetInfo()
  }, [])

  // Story 1.2.4: Interne Kosten berechnen
  useEffect(() => {
    berechneInterneKosten()
  }, [teams])

  const loadDienstleister = async () => {
    try {
      const response = await fetch('/api/dienstleister')
      if (response.ok) {
        const data = await response.json()
        setDienstleister(data.filter((d: Dienstleister) => d.status === 'AKTIV'))
      }
    } catch (error) {
      console.error('Fehler beim Laden der Dienstleister:', error)
      // Fallback für Demo
      setDienstleister([
        { id: '1', name: 'Design Agentur GmbH', kategorie: 'Design & Kreativ', status: 'AKTIV' },
        { id: '2', name: 'IT Solutions Ltd', kategorie: 'IT & Software', status: 'AKTIV' },
        { id: '3', name: 'Marketing Pro', kategorie: 'Marketing & Werbung', status: 'AKTIV' }
      ])
    }
  }

  const loadBudgetInfo = async (jahr: number = selectedYear) => {
    try {
      const response = await fetch(`/api/budget-allocation/available/${jahr}`)
      if (response.ok) {
        const data = await response.json()
        setBudgetInfo({
          jahresbudget: data.availableBudget?.gesamtbudget || data.gesamtbudget || 0,
          zugeordnetes_budget: data.availableBudget?.zugewiesenes_budget || data.gesamt_zugeordnet || 0,
          verfuegbares_budget: data.availableBudget?.verfuegbares_budget || data.verfuegbares_budget || 0,
          verfuegbar_prozent: data.availableBudget?.auslastung_prozent ? (100 - data.availableBudget.auslastung_prozent) : (data.verfuegbar_prozent || 100),
          externes_budget_zugeordnet: data.availableBudget?.externes_budget_zugeordnet || data.externes_budget_zugeordnet || 0,
          internes_budget_zugeordnet: data.availableBudget?.internes_budget_zugeordnet || data.internes_budget_zugeordnet || 0
        })
      }
    } catch (error) {
      console.error('Fehler beim Laden der Budget-Info:', error)
      // Fallback für Demo
      setBudgetInfo({
        jahresbudget: 1500000,
        zugeordnetes_budget: 750000,
        verfuegbares_budget: 750000,
        verfuegbar_prozent: 50,
        externes_budget_zugeordnet: 500000,
        internes_budget_zugeordnet: 250000
      })
    }
  }

  const berechneInterneKosten = () => {
    let gesamtKosten = 0
    let gesamtStunden = 0

    teams.forEach(team => {
      team.rollen.forEach(rolle => {
        const stundensatz = rolle.projekt_stundensatz || rolle.stundensatz || 0
        gesamtKosten += rolle.geplante_stunden * stundensatz
        gesamtStunden += rolle.geplante_stunden
      })
    })

    setInterneKostenGesamt(gesamtKosten)
    setGesamtstunden(gesamtStunden)
    setValue('interne_kosten_gesamt', gesamtKosten)
    setValue('gesamtstunden', gesamtStunden)
  }

  const handleFormSubmit = (data: ProjectFormData) => {
    // Echte Kategorie-IDs aus der Datenbank
    const generateCategoryId = (categoryName: string) => {
      const categoryMap: { [key: string]: string } = {
        'IT & Digitalisierung': '550e8400-e29b-41d4-a716-446655440002', // Software Development
        'Marketing & Werbung': '550e8400-e29b-41d4-a716-446655440001', // Marketing & Communication
        'Personalentwicklung': '550e8400-e29b-41d4-a716-446655440005', // Business Process Optimization
        'Infrastruktur': '550e8400-e29b-41d4-a716-446655440003', // Infrastructure & Operations
        'Forschung & Entwicklung': '550e8400-e29b-41d4-a716-446655440004', // Research & Development
        'Compliance & Recht': '550e8400-e29b-41d4-a716-446655440005', // Business Process Optimization
        'Kundenservice': '550e8400-e29b-41d4-a716-446655440005', // Business Process Optimization
        'Sonstiges': '550e8400-e29b-41d4-a716-446655440005' // Business Process Optimization
      }
      return categoryMap[categoryName] || categoryMap['Sonstiges']
    }

    const mapPriorityToEnglish = (priority: string) => {
      const priorityMap: { [key: string]: string } = {
        'Niedrig': 'low',
        'Mittel': 'medium', 
        'Hoch': 'high',
        'Kritisch': 'critical'
      }
      return priorityMap[priority] || 'medium'
    }

    const mapImpactToEnglish = (impact: string) => {
      const impactMap: { [key: string]: string } = {
        'Niedrig': 'low',
        'Mittel': 'medium',
        'Hoch': 'high', 
        'Sehr hoch': 'very_high'
      }
      return impactMap[impact] || 'medium'
    }

    const completeData = {
      ...data,
      kategorie_id: generateCategoryId(data.kategorie_name),
      teams: teams,
      tags: tags,
      // English field names for API
      description: data.beschreibung,
      planned_budget: data.geplantes_budget,
      start_date: data.start_datum,
      end_date: data.end_datum,
      priority: mapPriorityToEnglish(data.prioritaet),
      cost_type: data.kostenart,
      supplier: data.dienstleister,
      impact_level: mapImpactToEnglish(data.impact_level),
      internal_hours_design: data.interne_stunden_design || 0,
      internal_hours_content: data.interne_stunden_content || 0,
      internal_hours_dev: data.interne_stunden_dev || 0,
      budget_year: selectedYear,
      // Legacy German fields for backward compatibility
      interne_kosten_gesamt: interneKostenGesamt,
      gesamtstunden: gesamtstunden
    }
    
    onSubmit(completeData)
  }

  // Story 1.2.2: Team hinzufügen
  // Handler für Jahr-Änderung
  const handleYearChange = (jahr: number) => {
    setSelectedYear(jahr)
    loadBudgetInfo(jahr)
  }

  const addTeam = () => {
    const newTeam: ProjektTeam = {
      team_name: 'Neues Team',
      ist_lead_team: teams.length === 0, // Erstes Team ist automatisch Lead
      beschreibung: '',
      rollen: []
    }
    setTeams([...teams, newTeam])
  }

  // Story 1.2.2: Team entfernen
  const removeTeam = (index: number) => {
    const updatedTeams = teams.filter((_, i) => i !== index)
    setTeams(updatedTeams)
  }

  // Story 1.2.2: Team als Lead markieren
  const setLeadTeam = (index: number) => {
    const updatedTeams = teams.map((team, i) => ({
      ...team,
      ist_lead_team: i === index
    }))
    setTeams(updatedTeams)
  }

  // Story 1.2.2: Rolle zu Team hinzufügen
  const addRoleToTeam = (teamIndex: number) => {
    const newRole: TeamRolle = {
      rolle_name: 'Senior Developer',
      geplante_stunden: 40,
      stundensatz: 85,
      notizen: ''
    }
    
    const updatedTeams = [...teams]
    updatedTeams[teamIndex].rollen.push(newRole)
    setTeams(updatedTeams)
  }

  // Story 1.6: Tag-Management (now handled by TagSelector component)

  // Budget-Validierung (inkl. interne Kosten)
  const validateBudget = (externeKosten: number): boolean => {
    if (!budgetInfo) return true
    const gesamtKosten = externeKosten + interneKostenGesamt
    return gesamtKosten <= budgetInfo.verfuegbares_budget
  }

  const getBudgetStatus = (): string => {
    if (!budgetInfo) return 'Unbekannt'
    if (budgetInfo.verfuegbar_prozent > 50) return '🟢 Gesund'
    if (budgetInfo.verfuegbar_prozent > 20) return '🟡 Warnung'
    return '🔴 Kritisch'
  }

  const getBudgetValidationMessage = (externeKosten: number): string | null => {
    if (!budgetInfo) return null
    const gesamtKosten = externeKosten + interneKostenGesamt
    if (gesamtKosten > budgetInfo.verfuegbares_budget) {
      return `Projekt-Gesamtkosten (${gesamtKosten.toLocaleString('de-DE')} €) überschreiten verfügbares Budget (${budgetInfo.verfuegbares_budget.toLocaleString('de-DE')} €)`
    }
    return null
  }

  return (
    <FormProvider {...methods}>
      <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {isEditing ? '✏️ Projekt bearbeiten' : '➕ Neues Projekt erstellen'}
          </h2>
          <p className="text-gray-600">
            Vollständige Projekt-Erstellung mit Teams, Budget-Validierung und automatischer Kosten-Berechnung
          </p>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
          


          {/* Basis-Projekt-Informationen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
            Projektname *
          </label>
          <input
            type="text"
                {...register('name', { required: 'Projektname ist erforderlich' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Projektname eingeben..."
          />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
            Kategorie *
          </label>
          <select
                {...register('kategorie_name', { required: 'Kategorie ist erforderlich' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
                <option value="IT & Digitalisierung">IT & Digitalisierung</option>
                <option value="Marketing & Werbung">Marketing & Werbung</option>
                <option value="Personalentwicklung">Personalentwicklung</option>
                <option value="Infrastruktur">Infrastruktur</option>
                <option value="Forschung & Entwicklung">Forschung & Entwicklung</option>
                <option value="Compliance & Recht">Compliance & Recht</option>
                <option value="Kundenservice">Kundenservice</option>
                <option value="Sonstiges">Sonstiges</option>
          </select>
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beschreibung *
          </label>
            <textarea
              rows={3}
              {...register('beschreibung', { required: 'Beschreibung ist erforderlich' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Projektbeschreibung eingeben..."
            />
            {errors.beschreibung && <p className="text-red-500 text-sm mt-1">{errors.beschreibung.message}</p>}
        </div>

          {/* Story 1.2.1: Dienstleister-Auswahl */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dienstleister (optional)
          </label>
          <select
              {...register('dienstleister_id')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
              <option value="">Keinen Dienstleister auswählen</option>
              {dienstleister.map(dl => (
                <option key={dl.id} value={dl.id}>
                  {dl.name} ({dl.kategorie})
                </option>
              ))}
              <option value="new">➕ Neuen Dienstleister anlegen</option>
          </select>
      </div>

          {/* Zeitraum und Priorität */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
            Startdatum *
          </label>
          <input
            type="date"
                {...register('start_datum', { required: 'Startdatum ist erforderlich' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
            Enddatum *
          </label>
          <input
            type="date"
                {...register('end_datum', { required: 'Enddatum ist erforderlich' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
                Priorität *
          </label>
              <select
                {...register('prioritaet', { required: 'Priorität ist erforderlich' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Priorität auswählen...</option>
                <option value="niedrig">Niedrig</option>
                <option value="mittel">Mittel</option>
                <option value="hoch">Hoch</option>
                <option value="kritisch">Kritisch</option>
              </select>
            </div>
          </div>

          {/* Story 1.2.2: Multi-Team-Management */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">👥 Team-Zuordnung</h3>
                {teams.length > 0 && (
                  <div className="text-sm text-gray-600">
                    {teams.length} Team{teams.length !== 1 ? 's' : ''} zugeordnet
                    {teams.some(t => t.ist_lead_team) && (
                      <span className="ml-2 text-yellow-600">• 1 Lead-Team</span>
                    )}
      </div>
        )}
      </div>

              {/* Team-Hinzufügen Button */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setShowTeamSelector(!showTeamSelector)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Team hinzufügen
                </button>
                
                {/* Team-Auswahl Modal/Dropdown */}
                {showTeamSelector && (
                  <div className="mt-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium text-gray-900">Team auswählen</h4>
                      <button
                        type="button"
                        onClick={() => setShowTeamSelector(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <TeamSelector
                      onTeamSelect={(team) => {
                        if (team) {
                          const newTeam: ProjektTeam = {
                            team_name: team.name,
                            ist_lead_team: false, // Kein automatisches Lead - muss manuell gesetzt werden
                            beschreibung: team.description || '',
                            rollen: []
                          }
                          setTeams(prev => [...prev, newTeam])
                          setShowTeamSelector(false) // Schließe Selector nach Auswahl
                        }
                      }}
                      excludeTeamIds={teams.map(t => t.id).filter(Boolean) as string[]}
                      placeholder="Team aus Liste auswählen oder neu erstellen..."
                      className="w-full"
                      allowCreateNew={true}
                      onCreateNew={(teamName) => {
                        console.log(`Neues Team "${teamName}" wurde erstellt und hinzugefügt`)
                        setShowTeamSelector(false) // Schließe Selector nach Erstellung
                      }}
                    />
                  </div>
                )}
              </div>
        </div>
        
            {teams.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Noch keine Teams zugeordnet.</p>
                <p className="text-sm">Klicken Sie auf "Team hinzufügen", um zu beginnen.</p>
              </div>
            )}

            {/* Lead-Team Warnung */}
            {teams.length > 0 && !teams.some(t => t.ist_lead_team) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <span className="text-yellow-600 mr-2">⚠️</span>
                  <span className="text-sm text-yellow-800">
                    <strong>Kein Lead-Team ausgewählt:</strong> Bitte markieren Sie eines der Teams als Lead-Team.
                  </span>
                </div>
          </div>
        )}
        
            {teams.map((team, teamIndex) => (
              <div key={teamIndex} className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={team.team_name}
                      onChange={(e) => {
                        const updatedTeams = [...teams]
                        updatedTeams[teamIndex].team_name = e.target.value
                        setTeams(updatedTeams)
                      }}
                      className="font-medium text-lg border-none bg-transparent focus:outline-none focus:bg-white focus:border focus:border-gray-300 rounded px-2 py-1"
                    />
                    
                    {/* Lead-Status und Auswahl */}
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-1 cursor-pointer">
                        <input
                          type="radio"
                          name="leadTeam"
                          checked={team.ist_lead_team}
                          onChange={() => setLeadTeam(teamIndex)}
                          className="text-yellow-600 focus:ring-yellow-500"
                        />
                        <span className="text-sm text-gray-700">Lead-Team</span>
                      </label>
                      {team.ist_lead_team && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-medium">
                          👑 Lead
                        </span>
        )}
      </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => removeTeam(teamIndex)}
                      className="text-red-600 hover:text-red-800"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Rollen für dieses Team */}
                <div className="space-y-2">
                  {team.rollen.map((rolle, rolleIndex) => (
                    <div key={rolleIndex} className="flex items-center space-x-3 bg-gray-50 p-3 rounded">
                      <select
                        value={rolle.rolle_name}
                        onChange={(e) => {
                          const updatedTeams = [...teams]
                          updatedTeams[teamIndex].rollen[rolleIndex].rolle_name = e.target.value
                          setTeams(updatedTeams)
                        }}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="Senior Developer">Senior Developer</option>
                        <option value="Junior Developer">Junior Developer</option>
                        <option value="UI/UX Designer">UI/UX Designer</option>
                        <option value="Grafik Designer">Grafik Designer</option>
                        <option value="Project Manager">Project Manager</option>
                        <option value="DevOps Engineer">DevOps Engineer</option>
                        <option value="Quality Assurance">Quality Assurance</option>
                        <option value="Content Manager">Content Manager</option>
                      </select>
                      
                      <input
                        type="number"
                        value={rolle.geplante_stunden}
                        onChange={(e) => {
                          const updatedTeams = [...teams]
                          updatedTeams[teamIndex].rollen[rolleIndex].geplante_stunden = parseInt(e.target.value) || 0
                          setTeams(updatedTeams)
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Std"
                      />
                      
          <input
            type="number"
            step="0.01"
                        value={rolle.stundensatz || ''}
                        onChange={(e) => {
                          const updatedTeams = [...teams]
                          updatedTeams[teamIndex].rollen[rolleIndex].stundensatz = parseFloat(e.target.value) || 0
                          setTeams(updatedTeams)
                        }}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="€/h"
                      />
                      
                      <span className="text-sm font-medium text-green-600 w-24">
                        {((rolle.geplante_stunden || 0) * (rolle.stundensatz || 0)).toLocaleString('de-DE')} €
                      </span>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const updatedTeams = [...teams]
                          updatedTeams[teamIndex].rollen.splice(rolleIndex, 1)
                          setTeams(updatedTeams)
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => addRoleToTeam(teamIndex)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Rolle hinzufügen
                  </button>
        </div>

                {/* Team-Zusammenfassung */}
                <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600">
                  Gesamt: {team.rollen.reduce((sum, rolle) => sum + (rolle.geplante_stunden || 0), 0)}h | 
                  {' '}{team.rollen.reduce((sum, rolle) => sum + ((rolle.geplante_stunden || 0) * (rolle.stundensatz || 0)), 0).toLocaleString('de-DE')} €
          </div>
        </div>
            ))}
      </div>

          {/* Story 1.2.3: Budget-Eingabe mit Validierung */}
          {/* Jahresbudget-Auswahl */}
          <YearSelector
            selectedYear={selectedYear}
            onYearChange={handleYearChange}
            className="mb-6"
          />

          {/* Budget-Schieber mit integrierter Übersicht */}
          {budgetInfo && (
            <BudgetSlider
              verfuegbaresBudget={budgetInfo.verfuegbares_budget}
              externeKosten={watchedBudget || 0}
              interneKosten={interneKostenGesamt}
              onBudgetChange={(budget) => {
                console.log('🎯 BudgetSlider onChange:', budget);
                setValue('geplantes_budget', budget, { shouldValidate: true });
              }}
              jahr={selectedYear}
              jahresbudget={budgetInfo.jahresbudget}
              zugeordnetesbudget={budgetInfo.zugeordnetes_budget}
              gesamtstunden={gesamtstunden}
              className="mb-6"
            />
          )}

          {/* Verstecktes Budget-Feld für Form-Validierung */}
          <input
            type="hidden"
            {...register('geplantes_budget', { 
              required: 'Geplantes Budget ist erforderlich',
              min: { value: 1, message: 'Planned budget must be a positive number' }
            })}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div style={{ display: 'none' }}>
              {/* Altes Budget-Feld ausgeblendet - wird durch Schieber ersetzt */}
        </div>

        <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kosten-Obergrenze (optional)
          </label>
          <input
            type="number"
                step="0.01"
                {...register('kosten_obergrenze')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
          />
        </div>
      </div>



      {/* Weitere Felder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
            Impact Level *
          </label>
          <select
            {...register('impact_level', { required: 'Impact Level ist erforderlich' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
                <option value="">Impact Level auswählen...</option>
                <option value="niedrig">Niedrig</option>
                <option value="mittel">Mittel</option>
                <option value="hoch">Hoch</option>
                <option value="sehr_hoch">Sehr hoch</option>
          </select>
      </div>

      <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
          Status *
        </label>
        <select
          {...register('status', { required: 'Status ist erforderlich' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
                <option value="geplant">Geplant</option>
                <option value="aktiv">Aktiv</option>
                <option value="pausiert">Pausiert</option>
                <option value="abgeschlossen">Abgeschlossen</option>
        </select>
            </div>
      </div>

          {/* Story 1.6: Centralized Tag Management */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (optional)
        </label>
            <TagSelector
              selectedTags={tags}
              onTagsChange={(newTags) => {
                setTags(newTags)
                setValue('tags', newTags)
              }}
              placeholder="Tags auswählen..."
              className="w-full"
        />
      </div>

      {/* Anmerkungen */}
      <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Anmerkungen (optional)
        </label>
        <textarea
          rows={3}
          {...register('anmerkungen')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Zusätzliche Anmerkungen zum Projekt..."
        />
      </div>

      {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Abbrechen
        </button>
        <button
          type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {isEditing ? 'Projekt aktualisieren' : 'Projekt erstellen'}
        </button>
      </div>
    </form>
      </div>
    </FormProvider>
  )
}