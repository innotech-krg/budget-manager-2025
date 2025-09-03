// =====================================================
// Budget Manager 2025 - Team Role Manager
// Epic 9 - Rollen-basierte Kosten-Kalkulation
// =====================================================

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  Euro, 
  Plus, 
  X, 
  Calculator,
  AlertCircle 
} from 'lucide-react';
import { apiService } from '../../services/apiService';

interface Role {
  id: number;
  name: string;
  kategorie: string;
  standard_stundensatz: number;
  min_stundensatz: number;
  max_stundensatz: number;
  beschreibung: string;
  farbe: string;
}

interface TeamRole {
  roleId: number;
  role: Role;
  estimatedHours: number;
  hourlyRate: number;
  totalCost: number;
}

interface TeamRoleManagerProps {
  teamId: string;
  teamName: string;
  onCostChange: (teamId: string, totalCost: number, totalHours: number, roles: TeamRole[]) => void;
}

const TeamRoleManager: React.FC<TeamRoleManagerProps> = ({
  teamId,
  teamName,
  onCostChange
}) => {
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [teamSpecificRoles, setTeamSpecificRoles] = useState<Role[]>([]); // Pool der Team-Rollen
  const [teamRoles, setTeamRoles] = useState<TeamRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lade verfügbare Rollen für das Team
  useEffect(() => {
    loadTeamRoles();
  }, [teamId]);

  // Berechne Gesamtkosten bei Änderungen
  useEffect(() => {
    if (teamRoles.length > 0) {
      const totalCost = teamRoles.reduce((sum, tr) => sum + tr.totalCost, 0);
      const totalHours = teamRoles.reduce((sum, tr) => sum + tr.estimatedHours, 0);
      onCostChange(teamId, totalCost, totalHours, teamRoles);
    }
  }, [teamRoles]);

  const loadTeamRoles = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`🔄 TeamRoleManager: Lade Rollen für Team ${teamId} (${teamName})`);

      // Lade Team-spezifische Rollen
      const teamRolesResponse = await apiService.get(`/api/team-roles/${teamId}`);
      const teamSpecificRoles = teamRolesResponse.data || [];
      console.log(`📊 Team-spezifische Rollen geladen:`, teamSpecificRoles);

      // Lade alle verfügbaren Rollen
      const allRolesResponse = await apiService.get('/api/team-roles/all/roles');
      const allRoles = allRolesResponse.data || [];
      console.log(`📊 Alle verfügbaren Rollen geladen:`, allRoles.length);

      setAvailableRoles(allRoles);

      // Speichere Team-spezifische Rollen als verfügbaren Pool (nicht automatisch zuweisen)
      setTeamSpecificRoles(teamSpecificRoles);

      // Starte mit leeren Team-Rollen - User muss manuell auswählen
      console.log(`✅ ${teamSpecificRoles.length} Team-Rollen als Pool verfügbar für ${teamName}`);
      setTeamRoles([]); // Leer starten!

    } catch (err: any) {
      console.error(`❌ Fehler beim Laden der Team-Rollen für ${teamName}:`, err);
      setError(`Fehler beim Laden der Rollen: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addRole = (role: Role) => {
    const newTeamRole: TeamRole = {
      roleId: role.id,
      role: role,
      estimatedHours: 40, // Standard-Schätzung
      hourlyRate: role.standard_stundensatz,
      totalCost: 40 * role.standard_stundensatz
    };

    setTeamRoles(prev => [...prev, newTeamRole]);
  };

  const removeRole = (roleId: number) => {
    setTeamRoles(prev => prev.filter(tr => tr.roleId !== roleId));
  };

  const updateHours = (roleId: number, hours: number) => {
    setTeamRoles(prev => prev.map(tr => {
      if (tr.roleId === roleId) {
        return {
          ...tr,
          estimatedHours: hours,
          totalCost: hours * tr.hourlyRate
        };
      }
      return tr;
    }));
  };

  const updateHourlyRate = (roleId: number, rate: number) => {
    setTeamRoles(prev => prev.map(tr => {
      if (tr.roleId === roleId) {
        return {
          ...tr,
          hourlyRate: rate,
          totalCost: tr.estimatedHours * rate
        };
      }
      return tr;
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getAvailableRolesToAdd = () => {
    const usedRoleIds = teamRoles.map(tr => tr.roleId);
    // Nur aus dem Team-spezifischen Rollen-Pool auswählen (nicht aus allen verfügbaren Rollen)
    return teamSpecificRoles.filter(role => !usedRoleIds.includes(role.id));
  };

  const totalCost = teamRoles.reduce((sum, tr) => sum + tr.totalCost, 0);
  const totalHours = teamRoles.reduce((sum, tr) => sum + tr.estimatedHours, 0);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-sm text-gray-500 mt-2">Lade Rollen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center text-red-800">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span className="font-medium">Fehler</span>
        </div>
        <p className="text-sm text-red-700 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Team Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Users className="w-5 h-5 text-blue-600 mr-2" />
          <h4 className="font-medium text-gray-900">{teamName}</h4>
        </div>
        <div className="text-sm text-gray-500">
          {teamRoles.length} Rolle{teamRoles.length !== 1 ? 'n' : ''}
        </div>
      </div>

      {/* Aktive Rollen */}
      {teamRoles.length > 0 && (
        <div className="space-y-3">
          {teamRoles.map((teamRole) => (
            <div key={teamRole.roleId} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: teamRole.role.farbe }}
                  ></div>
                  <div>
                    <span className="font-medium text-gray-900">{teamRole.role.name}</span>
                    <span className="ml-2 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                      {teamRole.role.kategorie}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">{teamRole.role.beschreibung}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeRole(teamRole.roleId)}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="Rolle entfernen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Geschätzte Stunden */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Geschätzte Stunden
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={teamRole.estimatedHours}
                    onChange={(e) => updateHours(teamRole.roleId, parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Stundensatz */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Euro className="w-4 h-4 inline mr-1" />
                    Stundensatz
                  </label>
                  <input
                    type="number"
                    min={teamRole.role.min_stundensatz}
                    max={teamRole.role.max_stundensatz}
                    step="0.50"
                    value={teamRole.hourlyRate}
                    onChange={(e) => updateHourlyRate(teamRole.roleId, parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency(teamRole.role.min_stundensatz)} - {formatCurrency(teamRole.role.max_stundensatz)}
                  </p>
                </div>

                {/* Gesamtkosten */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calculator className="w-4 h-4 inline mr-1" />
                    Gesamtkosten
                  </label>
                  <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="font-bold text-blue-900">
                      {formatCurrency(teamRole.totalCost)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rolle hinzufügen */}
      {getAvailableRolesToAdd().length > 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-3">Rolle hinzufügen</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {getAvailableRolesToAdd().map((role) => (
              <button
                key={role.id}
                onClick={() => addRole(role)}
                className="flex items-center p-2 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: role.farbe }}
                ></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{role.name}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(role.standard_stundensatz)}/h</p>
                </div>
                <Plus className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Team-Zusammenfassung als Tabelle */}
      {teamRoles.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-4 flex items-center">
            <Calculator className="w-4 h-4 mr-2" />
            Team-Zusammenfassung: {teamName}
          </h5>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blue-300">
                  <th className="text-left py-2 px-3 font-medium text-blue-800">Rolle</th>
                  <th className="text-right py-2 px-3 font-medium text-blue-800">Stunden</th>
                  <th className="text-right py-2 px-3 font-medium text-blue-800">Stundensatz</th>
                  <th className="text-right py-2 px-3 font-medium text-blue-800">Kosten</th>
                </tr>
              </thead>
              <tbody>
                {teamRoles.map((teamRole, index) => (
                  <tr key={teamRole.roleId} className={index % 2 === 0 ? 'bg-white' : 'bg-blue-25'}>
                    <td className="py-2 px-3 text-gray-900">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                          style={{ backgroundColor: teamRole.role.farbe || '#3B82F6' }}
                        ></div>
                        <div>
                          <div className="font-medium">{teamRole.role.name}</div>
                          <div className="text-xs text-gray-500">{teamRole.role.kategorie}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-gray-900">
                      {teamRole.estimatedHours.toLocaleString('de-DE')}h
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-gray-900">
                      {formatCurrency(teamRole.hourlyRate)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-medium text-gray-900">
                      {formatCurrency(teamRole.totalCost)}
                    </td>
                  </tr>
                ))}
                {/* Team-Summe */}
                <tr className="border-t-2 border-blue-400 bg-blue-100 font-medium">
                  <td className="py-3 px-3 text-blue-900 font-bold">
                    Team-Summe
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-blue-900">
                    {totalHours.toLocaleString('de-DE')}h
                  </td>
                  <td className="py-3 px-3 text-right text-blue-700">
                    Ø {formatCurrency(
                      teamRoles.length > 0 
                        ? teamRoles.reduce((sum, tr) => sum + tr.hourlyRate, 0) / teamRoles.length 
                        : 0
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-blue-900 text-lg">
                    {formatCurrency(totalCost)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hinweis wenn keine Rollen */}
      {teamRoles.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="font-medium">Keine Rollen zugewiesen</p>
          <p className="text-sm">Fügen Sie Rollen hinzu, um Kosten zu kalkulieren</p>
        </div>
      )}
    </div>
  );
};

export default TeamRoleManager;
