// =====================================================
// Budget Manager 2025 - Budget Tracking Dashboard
// Story 1.3: Dreidimensionales Budget-Tracking
// =====================================================

import React, { useState, useEffect } from 'react';
import BudgetTrackingCard from './BudgetTrackingCard';
import BudgetStatusIndicator from './BudgetStatusIndicator';
import { formatGermanCurrency } from '../../utils/currency';
import { mapApiProjectToFrontend, mapStatusToGerman, mapPriorityToGerman } from '../../utils/dataMapping';

interface Project {
  id: string;
  name: string;
  project_number?: string;
  planned_budget: number;
  allocated_budget: number;
  consumed_budget: number;
  budget_status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'EXCEEDED';
  budget_usage_percent: number;
  kategorie_name?: string;
  team_name?: string;
}

interface BudgetSummary {
  total_projects: number;
  healthy: number;
  warning: number;
  critical: number;
  exceeded: number;
  total_planned: number;
  total_allocated: number;
  total_consumed: number;
}

const BudgetTrackingDashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Keine Demo-Daten mehr - verwende echte API-Daten

  useEffect(() => {
    // Echte API-Daten laden
    const loadData = async () => {
      setLoading(true);
      try {
        // Projekte von der echten API laden
        const response = await fetch('/api/projects');
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Projekte');
        }
        const data = await response.json();
        
        // API-Daten auf Frontend-Format mappen
        const rawProjects = data.projects || data;
        const mappedProjects = rawProjects.map((project: any) => {
          const mapped = mapApiProjectToFrontend(project);
          
          // Budget-Status berechnen
          const budgetUsagePercent = mapped.consumed_budget / mapped.planned_budget * 100;
          let budgetStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'EXCEEDED' = 'HEALTHY';
          
          if (budgetUsagePercent > 100) {
            budgetStatus = 'EXCEEDED';
          } else if (budgetUsagePercent > 90) {
            budgetStatus = 'CRITICAL';
          } else if (budgetUsagePercent > 70) {
            budgetStatus = 'WARNING';
          }
          
          return {
            id: mapped.id,
            name: mapped.name,
            projektnummer: mapped.project_number || `PRJ-${mapped.id.slice(0, 8)}`,
            veranschlagtes_budget: mapped.planned_budget,
            zugewiesenes_budget: mapped.planned_budget, // Vereinfachung: zugewiesen = geplant
            verbrauchtes_budget: mapped.consumed_budget,
            budget_status: budgetStatus,
            budget_verbrauch_prozent: Math.round(budgetUsagePercent * 10) / 10,
            kategorie_name: mapped.kategorie_name,
            team_name: mapped.team_name
          };
        });
        
        // Summary berechnen
        const summary: BudgetSummary = {
          total_projects: mappedProjects.length,
          healthy: mappedProjects.filter(p => p.budget_status === 'HEALTHY').length,
          warning: mappedProjects.filter(p => p.budget_status === 'WARNING').length,
          critical: mappedProjects.filter(p => p.budget_status === 'CRITICAL').length,
          exceeded: mappedProjects.filter(p => p.budget_status === 'EXCEEDED').length,
          total_planned: mappedProjects.reduce((sum, p) => sum + p.planned_budget, 0),
          total_allocated: mappedProjects.reduce((sum, p) => sum + p.allocated_budget, 0),
          total_consumed: mappedProjects.reduce((sum, p) => sum + p.consumed_budget, 0)
        };
        
        setProjects(mappedProjects);
        setSummary(summary);
      } catch (err) {
        setError('Fehler beim Laden der Budget-Daten');
        console.error('Budget Tracking Error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter-Projekte basierend auf Status
  const filteredProjects = projects.filter(project => {
    if (statusFilter === 'all') return true;
    return project.budget_status === statusFilter;
  });

  const handleUpdateBudget = (projectId: string) => {
    console.log('Update Budget für Projekt:', projectId);
    // TODO: Implementiere Budget-Update-Modal
  };

  const handleAddExpense = (projectId: string) => {
    console.log('Ausgabe hinzufügen für Projekt:', projectId);
    // TODO: Implementiere Ausgaben-Modal
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Lade Budget-Tracking-Daten...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          📊 Dreidimensionales Budget-Tracking
        </h1>
        <p className="text-gray-600">
          Überwachen Sie Veranschlagt, Zugewiesen und Verbraucht für alle Projekte
        </p>
      </div>

      {/* Budget-Zusammenfassung */}
      {summary && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget-Übersicht</h2>
          
          {/* Status-Verteilung */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.healthy}</div>
              <div className="text-sm text-gray-600">🟢 Gesund</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{summary.warning}</div>
              <div className="text-sm text-gray-600">🟡 Warnung</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{summary.critical}</div>
              <div className="text-sm text-gray-600">🟠 Kritisch</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.exceeded}</div>
              <div className="text-sm text-gray-600">🔴 Überschritten</div>
            </div>
          </div>

          {/* Budget-Summen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">🎯 Gesamt Veranschlagt</div>
              <div className="text-xl font-bold text-blue-900">
                {formatGermanCurrency(summary.total_veranschlagt)}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">💰 Gesamt Zugewiesen</div>
              <div className="text-xl font-bold text-green-900">
                {formatGermanCurrency(summary.total_zugewiesen)}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">📊 Gesamt Verbraucht</div>
              <div className="text-xl font-bold text-purple-900">
                {formatGermanCurrency(summary.total_verbraucht)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-full text-sm ${
              statusFilter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Alle ({projects.length})
          </button>
          <button
            onClick={() => setStatusFilter('HEALTHY')}
            className={`px-3 py-1 rounded-full text-sm ${
              statusFilter === 'HEALTHY' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🟢 Gesund ({summary?.healthy || 0})
          </button>
          <button
            onClick={() => setStatusFilter('WARNING')}
            className={`px-3 py-1 rounded-full text-sm ${
              statusFilter === 'WARNING' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🟡 Warnung ({summary?.warning || 0})
          </button>
          <button
            onClick={() => setStatusFilter('CRITICAL')}
            className={`px-3 py-1 rounded-full text-sm ${
              statusFilter === 'CRITICAL' 
                ? 'bg-orange-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🟠 Kritisch ({summary?.critical || 0})
          </button>
          <button
            onClick={() => setStatusFilter('EXCEEDED')}
            className={`px-3 py-1 rounded-full text-sm ${
              statusFilter === 'EXCEEDED' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🔴 Überschritten ({summary?.exceeded || 0})
          </button>
        </div>
      </div>

      {/* Projekt-Karten */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map(project => (
          <BudgetTrackingCard
            key={project.id}
            project={project}
            onUpdateBudget={handleUpdateBudget}
            onAddExpense={handleAddExpense}
          />
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Keine Projekte mit dem gewählten Status gefunden.</p>
        </div>
      )}
    </div>
  );
};

export default BudgetTrackingDashboard;

