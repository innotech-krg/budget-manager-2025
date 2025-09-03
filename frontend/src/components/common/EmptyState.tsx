// =====================================================
// Budget Manager 2025 - EmptyState Komponente
// Verbesserte leere Zustände für bessere UX
// =====================================================

import React from 'react'

interface EmptyStateProps {
  icon?: string
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  illustration?: 'budget' | 'search' | 'filter' | 'error' | 'loading'
  size?: 'sm' | 'md' | 'lg'
  testId?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  illustration = 'budget',
  size = 'md',
  testId = 'empty-state'
}) => {
  const getIllustration = () => {
    switch (illustration) {
      case 'budget':
        return (
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-blue-200">
            <svg className="h-12 w-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'search':
        return (
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-purple-100 to-purple-200">
            <svg className="h-12 w-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        )
      case 'filter':
        return (
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-200">
            <svg className="h-12 w-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
        )
      case 'error':
        return (
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-red-100 to-red-200">
            <svg className="h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        )
      case 'loading':
        return (
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
            <svg className="animate-spin h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )
      default:
        return icon ? (
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
            <span className="text-4xl">{icon}</span>
          </div>
        ) : null
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'py-8',
          title: 'text-lg font-semibold',
          description: 'text-sm',
          button: 'px-3 py-2 text-sm'
        }
      case 'lg':
        return {
          container: 'py-16',
          title: 'text-3xl font-bold',
          description: 'text-lg',
          button: 'px-6 py-3 text-lg'
        }
      default: // md
        return {
          container: 'py-12',
          title: 'text-xl font-semibold',
          description: 'text-base',
          button: 'px-4 py-2 text-base'
        }
    }
  }

  const sizeClasses = getSizeClasses()

  return (
    <div data-testid={testId} className={`text-center ${sizeClasses.container}`}>
      {/* Illustration */}
      <div className="mb-6">
        {getIllustration()}
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto">
        <h3 className={`${sizeClasses.title} text-gray-900 mb-2`}>
          {title}
        </h3>
        <p className={`${sizeClasses.description} text-gray-600 mb-6`}>
          {description}
        </p>

        {/* Actions */}
        {(actionLabel || secondaryActionLabel) && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {actionLabel && onAction && (
              <button
                data-testid={`${testId}-primary-action`}
                onClick={onAction}
                className={`${sizeClasses.button} inline-flex items-center justify-center font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
              >
                {actionLabel}
              </button>
            )}
            {secondaryActionLabel && onSecondaryAction && (
              <button
                data-testid={`${testId}-secondary-action`}
                onClick={onSecondaryAction}
                className={`${sizeClasses.button} inline-flex items-center justify-center font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
              >
                {secondaryActionLabel}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Decorative elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-blue-50 to-transparent opacity-30"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-tr from-purple-50 to-transparent opacity-30"></div>
      </div>
    </div>
  )
}

// Vordefinierte Empty States für häufige Anwendungsfälle
export const BudgetEmptyState: React.FC<{
  onCreateNew?: () => void
  onImport?: () => void
}> = ({ onCreateNew, onImport }) => (
  <EmptyState
    testId="empty-budgets-state"
    illustration="budget"
    title="Noch keine Budgets vorhanden"
    description="Erstellen Sie Ihr erstes Jahresbudget, um mit der Verwaltung Ihrer Finanzen zu beginnen."
    actionLabel="🆕 Erstes Budget erstellen"
    onAction={onCreateNew}
    secondaryActionLabel="📁 Budgets importieren"
    onSecondaryAction={onImport}
    size="lg"
  />
)

export const SearchEmptyState: React.FC<{
  searchTerm: string
  onClearSearch?: () => void
  onCreateNew?: () => void
}> = ({ searchTerm, onClearSearch, onCreateNew }) => (
  <EmptyState
    testId="empty-search-state"
    illustration="search"
    title={`Keine Ergebnisse für "${searchTerm}"`}
    description="Versuchen Sie andere Suchbegriffe oder erstellen Sie ein neues Budget."
    actionLabel="🔍 Suche zurücksetzen"
    onAction={onClearSearch}
    secondaryActionLabel="➕ Neues Budget erstellen"
    onSecondaryAction={onCreateNew}
  />
)

export const FilterEmptyState: React.FC<{
  onClearFilters?: () => void
  onCreateNew?: () => void
}> = ({ onClearFilters, onCreateNew }) => (
  <EmptyState
    testId="empty-filter-state"
    illustration="filter"
    title="Keine Budgets entsprechen den Filtern"
    description="Passen Sie Ihre Filter an oder erstellen Sie ein neues Budget."
    actionLabel="🔄 Filter zurücksetzen"
    onAction={onClearFilters}
    secondaryActionLabel="➕ Neues Budget erstellen"
    onSecondaryAction={onCreateNew}
  />
)

export const LoadingState: React.FC<{
  title?: string
  description?: string
}> = ({ 
  title = "Budgets werden geladen...", 
  description = "Bitte warten Sie einen Moment." 
}) => (
  <EmptyState
    testId="loading-state"
    illustration="loading"
    title={title}
    description={description}
  />
)

export const ErrorState: React.FC<{
  title?: string
  description?: string
  onRetry?: () => void
  onSupport?: () => void
}> = ({ 
  title = "Fehler beim Laden der Budgets",
  description = "Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut.",
  onRetry,
  onSupport
}) => (
  <EmptyState
    testId="error-state"
    illustration="error"
    title={title}
    description={description}
    actionLabel="🔄 Erneut versuchen"
    onAction={onRetry}
    secondaryActionLabel="💬 Support kontaktieren"
    onSecondaryAction={onSupport}
  />
)

