// =====================================================
// Budget Manager 2025 - BudgetCard Component Tests
// React Testing Library + Vitest Tests
// =====================================================

import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BudgetCard, Budget } from '../../../../frontend/src/components/budget/BudgetCard'

const mockBudget: Budget = {
  id: 'budget-123',
  jahr: 2025,
  gesamtbudget: 1000000,
  reserve_allokation: 10,
  verfuegbares_budget: 900000,
  status: 'DRAFT',
  beschreibung: 'Test Budget 2025',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

describe('BudgetCard', () => {
  test('sollte Budget-Informationen korrekt anzeigen', () => {
    render(<BudgetCard budget={mockBudget} />)
    
    expect(screen.getByText('Jahresbudget 2025')).toBeInTheDocument()
    expect(screen.getByText('Test Budget 2025')).toBeInTheDocument()
    expect(screen.getByText('Entwurf')).toBeInTheDocument()
    
    // Budget-Beträge prüfen
    expect(screen.getByText(/1\.000\.000,00/)).toBeInTheDocument()
    expect(screen.getByText(/900\.000,00/)).toBeInTheDocument()
    expect(screen.getByText(/100\.000,00/)).toBeInTheDocument() // Reserve
  })

  test('sollte Status-Badge korrekt anzeigen', () => {
    const activeBudget = { ...mockBudget, status: 'ACTIVE' as const }
    render(<BudgetCard budget={activeBudget} />)
    
    expect(screen.getByText('Aktiv')).toBeInTheDocument()
    const statusBadge = screen.getByText('Aktiv').closest('span')
    expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800')
  })

  test('sollte Bearbeiten-Button nur für DRAFT-Status anzeigen', () => {
    const onEdit = vi.fn()
    render(<BudgetCard budget={mockBudget} onEdit={onEdit} />)
    
    const editButton = screen.getByText('Bearbeiten')
    expect(editButton).toBeInTheDocument()
    
    fireEvent.click(editButton)
    expect(onEdit).toHaveBeenCalledWith(mockBudget)
  })

  test('sollte Bearbeiten-Button für ACTIVE-Status nicht anzeigen', () => {
    const activeBudget = { ...mockBudget, status: 'ACTIVE' as const }
    const onEdit = vi.fn()
    render(<BudgetCard budget={activeBudget} onEdit={onEdit} />)
    
    expect(screen.queryByText('Bearbeiten')).not.toBeInTheDocument()
  })

  test('sollte Löschen-Button nur für DRAFT-Status anzeigen', () => {
    const onDelete = vi.fn()
    render(<BudgetCard budget={mockBudget} onDelete={onDelete} />)
    
    const deleteButton = screen.getByText('Löschen')
    expect(deleteButton).toBeInTheDocument()
    
    fireEvent.click(deleteButton)
    expect(onDelete).toHaveBeenCalledWith(mockBudget)
  })

  test('sollte Aktivieren-Button für DRAFT-Status anzeigen', () => {
    const onStatusChange = vi.fn()
    render(<BudgetCard budget={mockBudget} onStatusChange={onStatusChange} />)
    
    const activateButton = screen.getByText('Aktivieren')
    expect(activateButton).toBeInTheDocument()
    
    fireEvent.click(activateButton)
    expect(onStatusChange).toHaveBeenCalledWith(mockBudget, 'ACTIVE')
  })

  test('sollte Schließen-Button für ACTIVE-Status anzeigen', () => {
    const activeBudget = { ...mockBudget, status: 'ACTIVE' as const }
    const onStatusChange = vi.fn()
    render(<BudgetCard budget={activeBudget} onStatusChange={onStatusChange} />)
    
    const closeButton = screen.getByText('Schließen')
    expect(closeButton).toBeInTheDocument()
    
    fireEvent.click(closeButton)
    expect(onStatusChange).toHaveBeenCalledWith(activeBudget, 'CLOSED')
  })

  test('sollte deutsche Datumsformatierung verwenden', () => {
    render(<BudgetCard budget={mockBudget} />)
    
    expect(screen.getAllByText(/1\.1\.2024/)).toHaveLength(2) // Erstellt und Aktualisiert
  })

  test('sollte Reserve-Prozentsatz korrekt anzeigen', () => {
    render(<BudgetCard budget={mockBudget} />)
    
    expect(screen.getByText('Reserve (10%)')).toBeInTheDocument()
  })

  test('sollte Loading-State korrekt handhaben', () => {
    const onEdit = vi.fn()
    render(<BudgetCard budget={mockBudget} onEdit={onEdit} isLoading={true} />)
    
    const editButton = screen.getByText('Bearbeiten')
    expect(editButton).toBeDisabled()
  })
})