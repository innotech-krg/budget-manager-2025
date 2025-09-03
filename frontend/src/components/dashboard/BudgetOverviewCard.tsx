// =====================================================
// Budget Manager 2025 - Budget Overview Card
// Story 1.5: Echtzeit-Budget-Dashboard - Budget-Übersicht
// =====================================================

import React from 'react';
import { formatGermanCurrency } from '../../utils/currency';

interface BudgetOverviewData {
  totalBudget: {
    amount: number;
    formatted: string;
  };
  allocatedBudget: {
    amount: number;
    formatted: string;
    percentage: number;
  };
  consumedBudget: {
    amount: number;
    formatted: string;
    percentage: number;
  };
  availableBudget: {
    amount: number;
    formatted: string;
  };
  remainingBudget: {
    amount: number;
    formatted: string;
  };
  budgetStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'ERROR';
  budgetStatusLabel: string;
  utilizationPercentage: number;
  budgetCount: number;
  activeProjects: number;
}

interface BudgetOverviewCardProps {
  data: BudgetOverviewData;
  isLoading?: boolean;
  lastUpdated?: string;
}

const BudgetOverviewCard: React.FC<BudgetOverviewCardProps> = ({
  data,
  isLoading = false,
  lastUpdated
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY': return 'text-green-600 bg-green-100';
      case 'WARNING': return 'text-yellow-600 bg-yellow-100';
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      case 'ERROR': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HEALTHY': return '🟢';
      case 'WARNING': return '🟡';
      case 'CRITICAL': return '🔴';
      case 'ERROR': return '⚫';
      default: return '❓';
    }
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">💰</span>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Budget-Übersicht</h3>
            <p className="text-sm text-gray-500">
              {data.budgetCount} Budgets • {data.activeProjects} aktive Projekte
            </p>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(data.budgetStatus)}`}>
          <span className="mr-1">{getStatusIcon(data.budgetStatus)}</span>
          {data.budgetStatusLabel}
        </div>
      </div>

      {/* Budget-Metriken */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Gesamt-Budget */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">Gesamt-Budget</p>
          <p className="text-2xl font-bold text-gray-900">{data.totalBudget.formatted}</p>
        </div>

        {/* Verfügbares Budget */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">Verfügbar</p>
          <p className="text-2xl font-bold text-blue-600">{data.availableBudget.formatted}</p>
        </div>

        {/* Allokiertes Budget */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">Allokiert</p>
          <p className="text-xl font-semibold text-orange-600">{data.allocatedBudget.formatted}</p>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(data.allocatedBudget.percentage, 100)}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-500">{data.allocatedBudget.percentage.toFixed(1)}%</span>
          </div>
        </div>

        {/* Verbrauchtes Budget */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">Verbraucht</p>
          <p className="text-xl font-semibold text-red-600">{data.consumedBudget.formatted}</p>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(data.consumedBudget.percentage)}`}
                style={{ width: `${Math.min(data.consumedBudget.percentage, 100)}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-500">{data.consumedBudget.percentage.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Gesamt-Auslastung */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-600">Gesamt-Auslastung</p>
          <span className="text-sm font-semibold text-gray-900">{data.utilizationPercentage}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(data.utilizationPercentage)}`}
            style={{ width: `${Math.min(data.utilizationPercentage, 100)}%` }}
          ></div>
        </div>
        
        {data.utilizationPercentage >= 90 && (
          <p className="text-xs text-red-600 mt-2 font-medium">
            ⚠️ Kritische Budget-Auslastung erreicht!
          </p>
        )}
        
        {data.utilizationPercentage >= 75 && data.utilizationPercentage < 90 && (
          <p className="text-xs text-yellow-600 mt-2 font-medium">
            ⚠️ Hohe Budget-Auslastung - Überwachung empfohlen
          </p>
        )}
      </div>

      {/* Verbleibendes Budget */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Verbleibendes Budget:</span>
          <span className={`text-lg font-bold ${
            data.remainingBudget.amount >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {data.remainingBudget.formatted}
          </span>
        </div>
        
        {data.remainingBudget.amount < 0 && (
          <p className="text-xs text-red-600 mt-1">
            Budget-Überschreitung von {formatGermanCurrency(Math.abs(data.remainingBudget.amount))}
          </p>
        )}
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          Zuletzt aktualisiert: {new Date(lastUpdated).toLocaleString('de-DE')}
        </div>
      )}
    </div>
  );
};

export default BudgetOverviewCard;

