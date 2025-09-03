// =====================================================
// Budget Manager 2025 - Team Selector
// Epic 9 - Bessere UX für Team-Auswahl
// =====================================================

import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  X, 
  ChevronDown,
  Check
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  description?: string;
}

interface TeamSelectorProps {
  availableTeams: Team[];
  selectedTeams: string[];
  onTeamChange: (teamIds: string[]) => void;
  onInlineCreate: () => void;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({
  availableTeams,
  selectedTeams,
  onTeamChange,
  onInlineCreate
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleTeamToggle = (teamId: string) => {
    if (selectedTeams.includes(teamId)) {
      // Team entfernen
      onTeamChange(selectedTeams.filter(id => id !== teamId));
    } else {
      // Team hinzufügen
      onTeamChange([...selectedTeams, teamId]);
    }
  };

  const removeTeam = (teamId: string) => {
    onTeamChange(selectedTeams.filter(id => id !== teamId));
  };

  const getSelectedTeams = () => {
    return availableTeams.filter(team => selectedTeams.includes(team.id));
  };

  const getAvailableTeams = () => {
    return availableTeams.filter(team => !selectedTeams.includes(team.id));
  };

  return (
    <div className="space-y-4">
      {/* Team-Auswahl Header */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Team-Zuweisungen
        </label>
        
        {/* Dropdown für Team-Auswahl */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full px-3 py-2 text-left border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:bg-gray-50 flex items-center justify-between"
          >
            <span className="text-gray-700">
              {selectedTeams.length === 0 
                ? "Teams auswählen..." 
                : `${selectedTeams.length} Team${selectedTeams.length !== 1 ? 's' : ''} ausgewählt`
              }
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown-Menü */}
          {isDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {getAvailableTeams().length > 0 ? (
                <div className="p-2">
                  {getAvailableTeams().map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => {
                        handleTeamToggle(team.id);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 flex items-center"
                    >
                      <Users className="w-4 h-4 text-gray-500 mr-2" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{team.name}</p>
                        {team.description && (
                          <p className="text-sm text-gray-500 truncate">{team.description}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <Users className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Alle Teams bereits ausgewählt</p>
                </div>
              )}
              
              {/* Inline Team Creation */}
              <div className="border-t border-gray-200 p-2">
                <button
                  type="button"
                  onClick={() => {
                    onInlineCreate();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-green-50 flex items-center text-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="font-medium">Neues Team erstellen</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ausgewählte Teams */}
      {selectedTeams.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Check className="w-4 h-4 text-green-600 mr-2" />
            Ausgewählte Teams ({selectedTeams.length})
          </h4>
          <div className="space-y-2">
            {getSelectedTeams().map((team) => (
              <div key={team.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center flex-1 min-w-0">
                  <Users className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-blue-900 truncate">{team.name}</p>
                    {team.description && (
                      <p className="text-sm text-blue-700 truncate">{team.description}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeTeam(team.id)}
                  className="ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded flex-shrink-0"
                  title="Team entfernen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hinweis wenn keine Teams */}
      {selectedTeams.length === 0 && (
        <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="font-medium">Keine Teams ausgewählt</p>
          <p className="text-sm">Wählen Sie Teams aus, um Rollen und Kosten zu kalkulieren</p>
        </div>
      )}
    </div>
  );
};

export default TeamSelector;



