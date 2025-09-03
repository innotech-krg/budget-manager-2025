// =====================================================
// Budget Manager 2025 - BudgetForm Component Tests
// React Testing Library + Vitest Tests
// =====================================================

import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BudgetForm } from '../../../../frontend/src/components/budget/BudgetForm'

describe('BudgetForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('sollte Create-Modus korrekt anzeigen', () => {
    render(
      <BudgetForm
        mode="create"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    expect(screen.getByText('Neues Jahresbudget erstellen')).toBeInTheDocument()
    expect(screen.getByText('Budget erstellen')).toBeInTheDocument()
  })

  test('sollte Edit-Modus korrekt anzeigen', () => {
    const initialData = {
      jahr: 2025,
      gesamtbudget: 1000000,
      reserve_allokation: 10,
      beschreibung: 'Test Budget'
    }
    
    render(
      <BudgetForm
        mode="edit"
        initialData={initialData}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    expect(screen.getByText('Jahresbudget bearbeiten')).toBeInTheDocument()
    expect(screen.getByText('Änderungen speichern')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2025')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1000000')).toBeInTheDocument()
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Budget')).toBeInTheDocument()
  })

  test('sollte Formular-Validierung durchführen', async () => {
    const user = userEvent.setup()
    
    render(
      <BudgetForm
        mode="create"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    // Ungültiges Jahr eingeben
    const jahrInput = screen.getByLabelText(/Geschäftsjahr/)
    await user.clear(jahrInput)
    await user.type(jahrInput, '2019')
    
    await waitFor(() => {
      expect(screen.getByText(/Jahr muss mindestens 2025 sein/)).toBeInTheDocument()
    })
  })

  test('sollte Budget-Übersicht korrekt berechnen', async () => {
    const user = userEvent.setup()
    
    render(
      <BudgetForm
        mode="create"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    // Gesamtbudget eingeben
    const gesamtbudgetInput = screen.getByLabelText(/Gesamtbudget/)
    await user.clear(gesamtbudgetInput)
    await user.type(gesamtbudgetInput, '1000000')
    
    // Reserve-Allokation eingeben
    const reserveInput = screen.getByLabelText(/Reserve-Allokation/)
    await user.clear(reserveInput)
    await user.type(reserveInput, '15')
    
    await waitFor(() => {
      expect(screen.getAllByText(/1\.000\.000,00.*€/)).toHaveLength(2) // Vorschau + Übersicht
      expect(screen.getAllByText(/150\.000,00.*€/)).toHaveLength(2) // Reserve Vorschau + Übersicht
      expect(screen.getByText(/850\.000,00.*€/)).toBeInTheDocument() // Verfügbar
    })
  })

  test('sollte Formular erfolgreich absenden', async () => {
    const user = userEvent.setup()
    
    render(
      <BudgetForm
        mode="create"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    // Formular ausfüllen
    const jahrInput = screen.getByLabelText(/Geschäftsjahr/)
    const gesamtbudgetInput = screen.getByLabelText(/Gesamtbudget/)
    const reserveInput = screen.getByLabelText(/Reserve-Allokation/)
    const beschreibungInput = screen.getByLabelText(/Beschreibung/)
    
    await user.clear(jahrInput)
    await user.type(jahrInput, '2025')
    await user.clear(gesamtbudgetInput)
    await user.type(gesamtbudgetInput, '1000000')
    await user.clear(reserveInput)
    await user.type(reserveInput, '10')
    await user.type(beschreibungInput, 'Test Budget')
    
    // Absenden
    const submitButton = screen.getByText('Budget erstellen')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        jahr: 2025, // Form values are converted to numbers
        gesamtbudget: 1000000,
        reserve_allokation: 10,
        beschreibung: 'Test Budget'
      })
    })
  })

  test('sollte Abbrechen-Funktion ausführen', async () => {
    const user = userEvent.setup()
    
    render(
      <BudgetForm
        mode="create"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    const cancelButton = screen.getByText('Abbrechen')
    await user.click(cancelButton)
    
    expect(mockOnCancel).toHaveBeenCalled()
  })

  test('sollte Loading-State korrekt anzeigen', () => {
    render(
      <BudgetForm
        mode="create"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={true}
      />
    )
    
    expect(screen.getByText('Speichere...')).toBeInTheDocument()
    expect(screen.getByText('Abbrechen')).toBeDisabled()
  })

  test('sollte Beschreibung-Längenbegrenzung validieren', async () => {
    const user = userEvent.setup()
    
    render(
      <BudgetForm
        mode="create"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    const beschreibungInput = screen.getByLabelText(/Beschreibung/)
    const longText = 'a'.repeat(501) // Über 500 Zeichen
    
    await user.type(beschreibungInput, longText)
    
    await waitFor(() => {
      expect(screen.getByText('Beschreibung darf maximal 500 Zeichen haben')).toBeInTheDocument()
    })
  })

  test('sollte deutsche Währungsformatierung in Vorschau anzeigen', async () => {
    const user = userEvent.setup()
    
    render(
      <BudgetForm
        mode="create"
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    )
    
    const gesamtbudgetInput = screen.getByLabelText(/Gesamtbudget/)
    await user.type(gesamtbudgetInput, '1234567.89')
    
    await waitFor(() => {
      expect(screen.getAllByText(/1\.234\.567,89.*€/)).toHaveLength(2) // Vorschau + Übersicht
    })
  })
})