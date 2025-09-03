// =====================================================
// Budget Manager 2025 - Project Budget Overview
// Integriert 3D Budget-Tracking in Projekt-Verwaltung
// =====================================================

import React from 'react'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'

interface Project {
  id: string
  name: string
  planned_budget: number
  consumed_budget: number
  budget_status?: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'EXCEEDED'
  budget_usage_percent?: number
  status: string
}

interface ProjectBudgetOverviewProps {
  projects: Project[]
  annualBudget?: {
    total_budget: number
    allocated_budget: number
    consumed_budget: number
    available_budget: number
  }
}

export const ProjectBudgetOverview: React.FC<ProjectBudgetOverviewProps> = ({ projects, annualBudget }) => {
  // Budget-Statistiken berechnen
  const ANNUAL_BUDGET_2025 = annualBudget?.total_budget || 500000
  
  const stats = {
    total: projects.length,
    healthy: projects.filter(p => p.budget_status === 'HEALTHY').length,
    warning: projects.filter(p => p.budget_status === 'WARNING').length,
    critical: projects.filter(p => p.budget_status === 'CRITICAL').length,
    exceeded: projects.filter(p => p.budget_status === 'EXCEEDED').length,
    totalPlanned: annualBudget?.allocated_budget || projects.reduce((sum, p) => sum + (p.planned_budget || 0), 0),
    totalConsumed: annualBudget?.consumed_budget || projects.reduce((sum, p) => sum + (p.consumed_budget || 0), 0),
    availableBudget: annualBudget?.available_budget || (ANNUAL_BUDGET_2025 - projects.reduce((sum, p) => sum + (p.planned_budget || 0), 0))
  }

  const overallUsagePercent = ANNUAL_BUDGET_2025 > 0 
    ? (stats.totalConsumed / ANNUAL_BUDGET_2025) * 100 
    : 0

  // Status-Farben und Icons
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle }
      case 'WARNING':
        return { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock }
      case 'CRITICAL':
        return { color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertTriangle }
      case 'EXCEEDED':
        return { color: 'text-red-600', bg: 'bg-red-50', icon: XCircle }
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-50', icon: CheckCircle }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  if (projects.length === 0) {
    return null
  }

  return (
    <div className="mb-8 space-y-6">
      {/* Budget-Übersicht Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Budget-Übersicht</h2>
            <p className="text-gray-600">Dreidimensionales Budget-Tracking für alle Projekte</p>
          </div>
          <div className="flex items-center space-x-2">
            {overallUsagePercent > 90 ? (
              <TrendingUp className="w-5 h-5 text-red-500" />
            ) : overallUsagePercent > 70 ? (
              <TrendingUp className="w-5 h-5 text-yellow-500" />
            ) : (
              <TrendingUp className="w-5 h-5 text-green-500" />
            )}
            <span className="text-sm font-medium text-gray-600">
              {overallUsagePercent.toFixed(1)}% Gesamtverbrauch
            </span>
          </div>
        </div>

        {/* Gesamt-Budget-Balken */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Gesamt-Budget-Verbrauch</span>
            <span className="text-sm text-gray-600">
              {formatCurrency(stats.totalConsumed)} von {formatCurrency(ANNUAL_BUDGET_2025)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                overallUsagePercent > 100 ? 'bg-red-500' :
                overallUsagePercent > 90 ? 'bg-orange-500' :
                overallUsagePercent > 70 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(overallUsagePercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Status-Statistiken */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Gesamt</div>
          </div>
          
          {[
            { key: 'healthy', label: 'Gesund', count: stats.healthy, status: 'HEALTHY' },
            { key: 'warning', label: 'Warnung', count: stats.warning, status: 'WARNING' },
            { key: 'critical', label: 'Kritisch', count: stats.critical, status: 'CRITICAL' },
            { key: 'exceeded', label: 'Überschritten', count: stats.exceeded, status: 'EXCEEDED' }
          ].map(({ key, label, count, status }) => {
            const config = getStatusConfig(status)
            const Icon = config.icon
            
            return (
              <div key={key} className={`${config.bg} rounded-lg p-4 text-center`}>
                <div className="flex items-center justify-center mb-2">
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className={`text-2xl font-bold ${config.color}`}>{count}</div>
                <div className="text-sm text-gray-600">{label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Kritische Projekte Warnung */}
      {(stats.critical > 0 || stats.exceeded > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800 mb-1">
                Achtung: Kritische Budget-Situation
              </h3>
              <p className="text-sm text-red-700">
                {stats.exceeded > 0 && `${stats.exceeded} Projekt(e) haben das Budget überschritten. `}
                {stats.critical > 0 && `${stats.critical} Projekt(e) sind kritisch (>90% Budget verbraucht).`}
                {' '}Sofortige Maßnahmen erforderlich.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Budget-Trend-Indikator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Durchschnittlicher Verbrauch</p>
              <p className="text-2xl font-bold text-gray-900">
                {projects.length > 0 ? (overallUsagePercent / projects.length).toFixed(1) : 0}%
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Verfügbares Budget</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.availableBudget)}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Risiko-Projekte</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.critical + stats.exceeded}
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-full">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectBudgetOverview
