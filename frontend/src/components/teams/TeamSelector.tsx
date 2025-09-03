// =====================================================
// Budget Manager 2025 - Team Selector Component
// Story 1.2.2 Enhancement: Team-Dropdown bei Team hinzufügen
// =====================================================

import React, { useState, useEffect } from 'react'

interface Team {
  id: string
  name: string
  description?: string
  is_active: boolean
  can_view_all_budgets: boolean
  can_transfer_budgets: boolean
}

interface TeamSelectorProps {
  onTeamSelect: (team: Team | null) => void
  excludeTeamIds?: string[]
  placeholder?: string
  className?: string
  allowCreateNew?: boolean
  onCreateNew?: (teamName: string) => void
}

export const TeamSelector: React.FC<TeamSelectorProps> = ({
  onTeamSelect,
  excludeTeamIds = [],
  placeholder = "Team auswählen...",
  className = '',
  allowCreateNew = true,
  onCreateNew
}) => {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamDescription, setNewTeamDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchTeams = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/teams')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setTeams(data)
      
      console.log('[TeamSelector] ✅ Teams geladen:', data)
    } catch (err) {
      console.error('[TeamSelector] ❌ Fehler beim Laden der Teams:', err)
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const teamId = e.target.value
    setSelectedTeamId(teamId)
    
    if (teamId === 'CREATE_NEW') {
      setShowCreateForm(true)
      onTeamSelect(null)
    } else if (teamId === '') {
      onTeamSelect(null)
    } else {
      const selectedTeam = teams.find(team => team.id === teamId)
      onTeamSelect(selectedTeam || null)
    }
  }

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return
    
    try {
      setCreating(true)
      
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTeamName.trim(),
          description: newTeamDescription.trim() || undefined,
          can_view_all_budgets: false,
          can_transfer_budgets: false
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const newTeam = await response.json()
      
      // Team zur Liste hinzufügen
      setTeams(prev => [...prev, newTeam])
      
      // Neues Team auswählen
      setSelectedTeamId(newTeam.id)
      onTeamSelect(newTeam)
      
      // Form zurücksetzen
      setShowCreateForm(false)
      setNewTeamName('')
      setNewTeamDescription('')
      
      // Callback für Parent-Komponente
      if (onCreateNew) {
        onCreateNew(newTeam.name)
      }
      
      console.log('[TeamSelector] ✅ Neues Team erstellt:', newTeam)
    } catch (err) {
      console.error('[TeamSelector] ❌ Fehler beim Erstellen des Teams:', err)
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen des Teams')
    } finally {
      setCreating(false)
    }
  }

  const cancelCreate = () => {
    setShowCreateForm(false)
    setNewTeamName('')
    setNewTeamDescription('')
    setSelectedTeamId('')
    onTeamSelect(null)
  }

  useEffect(() => {
    fetchTeams()
  }, [])

  // Filtere Teams (ausgeschlossene IDs)
  const availableTeams = teams.filter(team => !excludeTeamIds.includes(team.id))

  if (loading) {
    return (
      <div className={className}>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    )
  }

  if (error && !showCreateForm) {
    return (
      <div className={className}>
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">❌ {error}</p>
          <button
            onClick={fetchTeams}
            className="mt-2 text-sm text-red-700 underline hover:text-red-900"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {!showCreateForm ? (
        <>
          <select
            value={selectedTeamId}
            onChange={handleTeamChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">{placeholder}</option>
            {availableTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
                {team.description && ` - ${team.description}`}
              </option>
            ))}
            {allowCreateNew && (
              <option value="CREATE_NEW" className="font-medium text-blue-600">
                ➕ Neues Team erstellen...
              </option>
            )}
          </select>
          
          {/* Team-Details anzeigen */}
          {selectedTeamId && selectedTeamId !== 'CREATE_NEW' && (
            <div className="mt-2 p-2 bg-blue-50 rounded-md">
              {(() => {
                const selectedTeam = teams.find(t => t.id === selectedTeamId)
                if (!selectedTeam) return null
                
                return (
                  <div className="text-sm">
                    <div className="font-medium text-blue-900">{selectedTeam.name}</div>
                    {selectedTeam.description && (
                      <div className="text-blue-700 mt-1">{selectedTeam.description}</div>
                    )}
                    <div className="flex gap-2 mt-2">
                      {selectedTeam.can_view_all_budgets && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          👁️ Alle Budgets
                        </span>
                      )}
                      {selectedTeam.can_transfer_budgets && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          💸 Budget-Transfer
                        </span>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </>
      ) : (
        /* Neues Team erstellen Form */
        <div className="space-y-3 p-4 bg-gray-50 rounded-md border border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Neues Team erstellen</h4>
            <button
              onClick={cancelCreate}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team-Name *
            </label>
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="z.B. Frontend Development Team"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              disabled={creating}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Beschreibung
            </label>
            <textarea
              value={newTeamDescription}
              onChange={(e) => setNewTeamDescription(e.target.value)}
              placeholder="Kurze Beschreibung des Teams..."
              rows={2}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              disabled={creating}
            />
          </div>
          
          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              ❌ {error}
            </div>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={handleCreateTeam}
              disabled={!newTeamName.trim() || creating}
              className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? '⏳ Erstelle...' : '✅ Team erstellen'}
            </button>
            <button
              onClick={cancelCreate}
              disabled={creating}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeamSelector

