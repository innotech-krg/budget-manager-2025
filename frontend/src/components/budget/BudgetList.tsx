// =====================================================
// Budget Manager 2025 - BudgetList Komponente
// Jahresbudget-Liste mit Filterung und Sortierung
// =====================================================

import React, { useState, useMemo } from 'react'
import { BudgetCard, Budget } from './BudgetCard'
import { BudgetEmptyState, SearchEmptyState, FilterEmptyState, LoadingState, ErrorState } from '../common/EmptyState'

interface BudgetListProps {
  budgets: Budget[]
  onEdit?: (budget: Budget) => void
  onDelete?: (budget: Budget) => void
  onStatusChange?: (budget: Budget, newStatus: Budget['status']) => void
  onViewDetails?: (budget: Budget) => void
  onDuplicate?: (budget: Budget) => void
  onCreateNew?: () => void
  isLoading?: boolean
  error?: string
}

type SortField = 'jahr' | 'gesamtbudget' | 'status' | 'created_at'
type SortDirection = 'asc' | 'desc'
type FilterStatus = 'all' | 'DRAFT' | 'ACTIVE' | 'CLOSED'
type YearFilter = 'all' | string

export const BudgetList: React.FC<BudgetListProps> = ({
  budgets,
  onEdit,
  onDelete,
  onStatusChange,
  onViewDetails,
  onDuplicate,
  onCreateNew,
  isLoading = false,
  error
}) => {
  const [sortField, setSortField] = useState<SortField>('jahr')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [yearFilter, setYearFilter] = useState<YearFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Gefilterte und sortierte Budgets
  const filteredAndSortedBudgets = useMemo(() => {
    let filtered = budgets

    // Status-Filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(budget => budget.status === filterStatus)
    }

    // Jahr-Filter
    if (yearFilter !== 'all') {
      filtered = filtered.filter(budget => budget.jahr.toString() === yearFilter)
    }

    // Suchfilter (erweitert)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(budget => 
        budget.jahr.toString().includes(searchTerm) ||
        (budget.beschreibung && budget.beschreibung.toLowerCase().includes(searchLower)) ||
        budget.gesamtbudget.toString().includes(searchTerm) ||
        budget.status.toLowerCase().includes(searchLower)
      )
    }

    // Deutsche Geschäftslogik: Intelligente Sortierung
    const currentYear = new Date().getFullYear()
    
    filtered.sort((a, b) => {
      // Priorität 1: Aktuelles aktives Budget zuerst
      const aIsCurrentActive = a.jahr === currentYear && a.status === 'ACTIVE'
      const bIsCurrentActive = b.jahr === currentYear && b.status === 'ACTIVE'
      
      if (aIsCurrentActive && !bIsCurrentActive) return -1
      if (!aIsCurrentActive && bIsCurrentActive) return 1
      
      // Priorität 2: Nach Jahr-Kategorie (Aktuell > Zukünftig > Vergangen)
      const aCategory = a.jahr === currentYear ? 1 : a.jahr > currentYear ? 2 : 3
      const bCategory = b.jahr === currentYear ? 1 : b.jahr > currentYear ? 2 : 3
      
      if (aCategory !== bCategory) return aCategory - bCategory
      
      // Priorität 3: Normale Sortierung innerhalb der Kategorie
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      if (sortField === 'created_at') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [budgets, filterStatus, yearFilter, searchTerm, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  const getStatusCount = (status: FilterStatus) => {
    if (status === 'all') return budgets.length
    return budgets.filter(budget => budget.status === status).length
  }

  // Verfügbare Jahre ermitteln
  const getAvailableYears = (): string[] => {
    const years = Array.from(new Set(budgets.map(budget => budget.jahr.toString())))
    return years.sort((a, b) => parseInt(b) - parseInt(a)) // Neueste zuerst
  }

  // Jahr-Zähler für Filter-Anzeige
  const getYearCount = (year: string): number => {
    return budgets.filter(budget => budget.jahr.toString() === year).length
  }

  // Hilfsfunktionen für Empty State Logik
  const hasActiveFilters = filterStatus !== 'all' || yearFilter !== 'all' || searchTerm !== ''
  const clearAllFilters = () => {
    setFilterStatus('all')
    setYearFilter('all')
    setSearchTerm('')
  }

  if (error) {
    return (
      <ErrorState
        title="Fehler beim Laden der Budgets"
        description={error}
        onRetry={() => window.location.reload()}
      />
    )
  }

  return (
    <div data-testid="budget-list-container" className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Jahresbudgets</h1>
          <p className="text-gray-600 mt-1">
            Verwalten Sie Ihre Jahresbudgets mit deutscher Geschäftslogik
          </p>
        </div>
        {onCreateNew && (
          <button
            data-testid="create-budget-btn"
            onClick={onCreateNew}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Neues Budget erstellen
          </button>
        )}
      </div>

      {/* Filter und Suche */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Suche */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Suche
            </label>
            <input
              data-testid="budget-search-input"
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Suche nach Jahr, Beschreibung, Betrag oder Status..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Status-Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">Alle ({getStatusCount('all')})</option>
              <option value="DRAFT">Entwürfe ({getStatusCount('DRAFT')})</option>
              <option value="ACTIVE">Aktiv ({getStatusCount('ACTIVE')})</option>
              <option value="CLOSED">Geschlossen ({getStatusCount('CLOSED')})</option>
            </select>
          </div>

          {/* Jahr-Filter */}
          <div>
            <label htmlFor="year-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Jahr
            </label>
            <select
              id="year-filter"
              data-testid="year-filter"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value as YearFilter)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">Alle Jahre ({budgets.length})</option>
              {getAvailableYears().map(year => (
                <option key={year} value={year}>
                  {year} ({getYearCount(year)})
                </option>
              ))}
            </select>
          </div>

          {/* Sortierung */}
          <div>
            <label htmlFor="sort-field" className="block text-sm font-medium text-gray-700 mb-1">
              Sortieren nach
            </label>
            <select
              id="sort-field"
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="jahr">Jahr</option>
              <option value="gesamtbudget">Gesamtbudget</option>
              <option value="status">Status</option>
              <option value="created_at">Erstellt</option>
            </select>
          </div>

          {/* Sortierrichtung */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reihenfolge
            </label>
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {getSortIcon(sortField)}
              <span className="ml-2">
                {sortDirection === 'asc' ? 'Aufsteigend' : 'Absteigend'}
              </span>
            </button>
          </div>
        </div>

        {/* Schnellfilter-Buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            data-testid="quick-filter-all"
            onClick={() => {
              setFilterStatus('all')
              setYearFilter('all')
              setSearchTerm('')
            }}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filterStatus === 'all' && yearFilter === 'all' && searchTerm === ''
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🔄 Alle anzeigen ({budgets.length})
          </button>
          <button
            data-testid="quick-filter-active"
            onClick={() => setFilterStatus('ACTIVE')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filterStatus === 'ACTIVE'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ✅ Aktive ({getStatusCount('ACTIVE')})
          </button>
          <button
            data-testid="quick-filter-draft"
            onClick={() => setFilterStatus('DRAFT')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filterStatus === 'DRAFT'
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📝 Entwürfe ({getStatusCount('DRAFT')})
          </button>
          <button
            data-testid="quick-filter-current-year"
            onClick={() => setYearFilter(new Date().getFullYear().toString())}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              yearFilter === new Date().getFullYear().toString()
                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📅 {new Date().getFullYear()} ({getYearCount(new Date().getFullYear().toString())})
          </button>
        </div>
      </div>

      {/* Budget-Liste */}
      {isLoading ? (
        <LoadingState 
          title="Budgets werden geladen..."
          description="Bitte warten Sie einen Moment, während wir Ihre Budgets laden."
        />
      ) : filteredAndSortedBudgets.length === 0 ? (
        // Intelligente Empty State Auswahl
        budgets.length === 0 ? (
          // Keine Budgets überhaupt vorhanden
          <BudgetEmptyState 
            onCreateNew={onCreateNew}
            onImport={() => console.log('Import feature coming soon')}
          />
        ) : searchTerm ? (
          // Suchbegriff eingegeben, aber keine Ergebnisse
          <SearchEmptyState 
            searchTerm={searchTerm}
            onClearSearch={() => setSearchTerm('')}
            onCreateNew={onCreateNew}
          />
        ) : hasActiveFilters ? (
          // Filter aktiv, aber keine Ergebnisse
          <FilterEmptyState 
            onClearFilters={clearAllFilters}
            onCreateNew={onCreateNew}
          />
        ) : (
          // Fallback für unerwartete Fälle
          <BudgetEmptyState 
            onCreateNew={onCreateNew}
            onImport={() => console.log('Import feature coming soon')}
          />
        )
      ) : (
        <div data-testid="budget-list" className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedBudgets.map(budget => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onViewDetails={onViewDetails}
              onDuplicate={onDuplicate}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}
    </div>
  )
}