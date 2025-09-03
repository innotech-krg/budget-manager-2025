// =====================================================
// Budget Manager 2025 - Budget Tracking Card
// Story 1.3: Dreidimensionales Budget-Tracking
// =====================================================

import React from 'react';
import BudgetStatusIndicator from './BudgetStatusIndicator';
import { formatGermanCurrency } from '../../utils/currency';

interface BudgetTrackingCardProps {
  project: {
    id: string;
    name: string;
    projektnummer: string;
    veranschlagtes_budget: number;
    zugewiesenes_budget: number;
    verbrauchtes_budget: number;
    budget_status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'EXCEEDED';
    budget_verbrauch_prozent: number;
    kategorie_name?: string;
    team_name?: string;
  };
  onUpdateBudget?: (projectId: string) => void;
  onAddExpense?: (projectId: string) => void;
}

const BudgetTrackingCard: React.FC<BudgetTrackingCardProps> = ({
  project,
  onUpdateBudget,
  onAddExpense
}) => {
  // Berechne verbleibendes Budget
  const verbleibendesBudget = project.zugewiesenes_budget - project.verbrauchtes_budget;
  const verbleibendesPositiv = verbleibendesBudget >= 0;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
          <p className="text-sm text-gray-500">{project.projektnummer}</p>
          {project.kategorie_name && (
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
              {project.kategorie_name}
            </span>
          )}
        </div>
        
        {/* Budget-Status */}
        <BudgetStatusIndicator
          status={project.budget_status}
          percentage={project.budget_verbrauch_prozent}
        />
      </div>

      {/* 3D Budget-Dimensionen */}
      <div className="space-y-4">
        {/* Veranschlagtes Budget */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">🎯 Veranschlagt:</span>
          <span className="font-mono text-sm text-gray-900">
            {formatGermanCurrency(project.veranschlagtes_budget)}
          </span>
        </div>

        {/* Zugewiesenes Budget */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">💰 Zugewiesen:</span>
          <span className="font-mono text-sm text-gray-900">
            {formatGermanCurrency(project.zugewiesenes_budget)}
          </span>
        </div>

        {/* Verbrauchtes Budget */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">📊 Verbraucht:</span>
          <span className="font-mono text-sm text-gray-900">
            {formatGermanCurrency(project.verbrauchtes_budget)}
          </span>
        </div>

        {/* Progress Bar für Verbrauch */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              project.budget_status === 'HEALTHY' ? 'bg-green-500' :
              project.budget_status === 'WARNING' ? 'bg-yellow-500' :
              project.budget_status === 'CRITICAL' ? 'bg-orange-500' :
              'bg-red-500'
            }`}
            style={{ width: `${Math.min(project.budget_verbrauch_prozent, 100)}%` }}
          />
        </div>

        {/* Verbleibendes Budget */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span className="text-sm font-medium text-gray-600">💳 Verbleibend:</span>
          <span className={`font-mono text-sm font-semibold ${
            verbleibendesPositiv ? 'text-green-600' : 'text-red-600'
          }`}>
            {verbleibendesPositiv ? '' : '-'}{formatGermanCurrency(Math.abs(verbleibendesBudget))}
          </span>
        </div>
      </div>

      {/* Team-Info */}
      {project.team_name && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-500">Team: {project.team_name}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        {onUpdateBudget && (
          <button
            onClick={() => onUpdateBudget(project.id)}
            className="flex-1 bg-blue-600 text-white text-sm py-2 px-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Budget anpassen
          </button>
        )}
        
        {onAddExpense && (
          <button
            onClick={() => onAddExpense(project.id)}
            className="flex-1 bg-gray-600 text-white text-sm py-2 px-3 rounded-md hover:bg-gray-700 transition-colors"
          >
            Ausgabe hinzufügen
          </button>
        )}
      </div>
    </div>
  );
};

export default BudgetTrackingCard;

