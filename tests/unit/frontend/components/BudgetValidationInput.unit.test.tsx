// =====================================================
// Budget Manager 2025 - Budget Validation Input Tests
// Story 1.2.3: Intelligente Budget-Zuordnung
// =====================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import BudgetValidationInput from '../../../../frontend/src/components/projects/BudgetValidationInput';
import * as budgetAllocationApi from '../../../../frontend/src/services/budgetAllocationApi';

// Mock the API
vi.mock('../../../../frontend/src/services/budgetAllocationApi', () => ({
  getAvailableBudget: vi.fn(),
  validateBudgetAllocation: vi.fn(),
  BudgetAllocationApiError: class extends Error {
    constructor(message: string, public errorCode?: string) {
      super(message);
      this.name = 'BudgetAllocationApiError';
    }
  }
}));

const mockBudgetAllocationApi = budgetAllocationApi as any;

// Test wrapper component
const TestWrapper = ({ 
  jahr = 2025, 
  currentBudget = 0, 
  onValidation = vi.fn(),
  availableBudget = null 
}) => {
  const methods = useForm({
    defaultValues: { geplantes_budget: currentBudget }
  });

  return (
    <FormProvider {...methods}>
      <BudgetValidationInput
        jahr={jahr}
        currentBudget={currentBudget}
        onValidation={onValidation}
        register={methods.register}
        errors={methods.formState.errors}
        availableBudget={availableBudget}
      />
    </FormProvider>
  );
};

describe('BudgetValidationInput', () => {
  const user = userEvent.setup();
  const mockOnValidation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sollte Budget-Eingabefeld rendern', () => {
    render(<TestWrapper onValidation={mockOnValidation} />);

    expect(screen.getByLabelText(/Geplantes Budget/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0,00')).toBeInTheDocument();
  });

  it('sollte Budget-Validierung bei Eingabe durchführen', async () => {
    const mockValidation = {
      isValid: true,
      availableBudget: { jahr: 2025 },
      newUtilization: 30,
      warning: null
    };

    mockBudgetAllocationApi.validateBudgetAllocation.mockResolvedValue({
      success: true,
      ...mockValidation
    });

    render(<TestWrapper onValidation={mockOnValidation} />);

    const input = screen.getByLabelText(/Geplantes Budget/);
    await user.type(input, '50000');

    await waitFor(() => {
      expect(mockBudgetAllocationApi.validateBudgetAllocation).toHaveBeenCalledWith({
        jahr: 2025,
        geplantes_budget: 50000
      });
    });

    expect(mockOnValidation).toHaveBeenCalledWith(true, mockValidation);
  });

  it('sollte Validierungsfehler anzeigen', async () => {
    const mockValidation = {
      isValid: false,
      error: 'BUDGET_EXCEEDED',
      message: 'Budget überschritten',
      maxAllowedBudget: 100000,
      maxAllowedBudget_formatted: '100.000,00 €'
    };

    mockBudgetAllocationApi.validateBudgetAllocation.mockResolvedValue({
      success: false,
      ...mockValidation
    });

    render(<TestWrapper onValidation={mockOnValidation} />);

    const input = screen.getByLabelText(/Geplantes Budget/);
    await user.type(input, '200000');

    await waitFor(() => {
      expect(screen.getByText(/Budget überschritten/)).toBeInTheDocument();
    });

    expect(screen.getByText('❌')).toBeInTheDocument();
    expect(screen.getByText(/Maximal verfügbar: 100.000,00 €/)).toBeInTheDocument();
    expect(mockOnValidation).toHaveBeenCalledWith(false, mockValidation);
  });

  it('sollte Warnung bei hoher Auslastung anzeigen', async () => {
    const mockValidation = {
      isValid: true,
      availableBudget: { jahr: 2025 },
      newUtilization: 85,
      warning: {
        level: 'WARNING',
        message: 'Hohe Budget-Auslastung (85%)'
      }
    };

    mockBudgetAllocationApi.validateBudgetAllocation.mockResolvedValue({
      success: true,
      ...mockValidation
    });

    render(<TestWrapper onValidation={mockOnValidation} />);

    const input = screen.getByLabelText(/Geplantes Budget/);
    await user.type(input, '100000');

    await waitFor(() => {
      expect(screen.getByText(/Hohe Budget-Auslastung/)).toBeInTheDocument();
    });

    expect(screen.getByText('⚠️')).toBeInTheDocument();
    expect(mockOnValidation).toHaveBeenCalledWith(true, mockValidation);
  });

  it('sollte kritische Warnung bei sehr hoher Auslastung anzeigen', async () => {
    const mockValidation = {
      isValid: true,
      availableBudget: { jahr: 2025 },
      newUtilization: 95,
      warning: {
        level: 'CRITICAL',
        message: 'Kritische Budget-Auslastung (95%)'
      }
    };

    mockBudgetAllocationApi.validateBudgetAllocation.mockResolvedValue({
      success: true,
      ...mockValidation
    });

    render(<TestWrapper onValidation={mockOnValidation} />);

    const input = screen.getByLabelText(/Geplantes Budget/);
    await user.type(input, '150000');

    await waitFor(() => {
      expect(screen.getByText(/Kritische Budget-Auslastung/)).toBeInTheDocument();
    });

    expect(screen.getByText('🚨')).toBeInTheDocument();
    
    // Critical warning should have red styling
    const warningDiv = screen.getByText(/Kritische Budget-Auslastung/).closest('div');
    expect(warningDiv).toHaveClass('bg-red-50');
  });

  it('sollte Debouncing bei schneller Eingabe verwenden', async () => {
    const mockValidation = {
      isValid: true,
      availableBudget: { jahr: 2025 }
    };

    mockBudgetAllocationApi.validateBudgetAllocation.mockResolvedValue({
      success: true,
      ...mockValidation
    });

    render(<TestWrapper onValidation={mockOnValidation} />);

    const input = screen.getByLabelText(/Geplantes Budget/);
    
    // Schnelle Eingabe simulieren
    await user.type(input, '1');
    await user.type(input, '2');
    await user.type(input, '3');
    await user.type(input, '4');
    await user.type(input, '5');

    // Warten auf Debounce (500ms)
    await waitFor(() => {
      expect(mockBudgetAllocationApi.validateBudgetAllocation).toHaveBeenCalledTimes(1);
    }, { timeout: 1000 });

    expect(mockBudgetAllocationApi.validateBudgetAllocation).toHaveBeenCalledWith({
      jahr: 2025,
      geplantes_budget: 12345
    });
  });

  it('sollte keine Validierung bei leerem Wert durchführen', async () => {
    render(<TestWrapper onValidation={mockOnValidation} />);

    const input = screen.getByLabelText(/Geplantes Budget/);
    await user.clear(input);

    // Warten um sicherzustellen, dass keine API-Calls gemacht werden
    await new Promise(resolve => setTimeout(resolve, 600));

    expect(mockBudgetAllocationApi.validateBudgetAllocation).not.toHaveBeenCalled();
    expect(mockOnValidation).toHaveBeenCalledWith(true, null);
  });

  it('sollte keine Validierung bei negativem Wert durchführen', async () => {
    render(<TestWrapper onValidation={mockOnValidation} />);

    const input = screen.getByLabelText(/Geplantes Budget/);
    await user.type(input, '-1000');

    await new Promise(resolve => setTimeout(resolve, 600));

    expect(mockBudgetAllocationApi.validateBudgetAllocation).not.toHaveBeenCalled();
    expect(mockOnValidation).toHaveBeenCalledWith(true, null);
  });

  it('sollte Loading-State während Validierung anzeigen', async () => {
    // Mock delayed response
    mockBudgetAllocationApi.validateBudgetAllocation.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true, isValid: true }), 1000))
    );

    render(<TestWrapper onValidation={mockOnValidation} />);

    const input = screen.getByLabelText(/Geplantes Budget/);
    await user.type(input, '50000');

    // Should show loading indicator
    await waitFor(() => {
      expect(screen.getByText('⏳')).toBeInTheDocument();
    });

    expect(screen.getByText(/Validiere Budget.../)).toBeInTheDocument();
  });

  it('sollte Netzwerk-Fehler behandeln', async () => {
    mockBudgetAllocationApi.validateBudgetAllocation.mockRejectedValue(
      new Error('Network error')
    );

    render(<TestWrapper onValidation={mockOnValidation} />);

    const input = screen.getByLabelText(/Geplantes Budget/);
    await user.type(input, '50000');

    await waitFor(() => {
      expect(screen.getByText(/Fehler bei der Validierung/)).toBeInTheDocument();
    });

    expect(screen.getByText('❌')).toBeInTheDocument();
    expect(mockOnValidation).toHaveBeenCalledWith(false, expect.any(Object));
  });

  it('sollte verfügbares Budget als Kontext anzeigen', () => {
    const mockAvailableBudget = {
      jahr: 2025,
      verfuegbares_budget: 400000,
      verfuegbares_budget_formatted: '400.000,00 €',
      auslastung_prozent: 20
    };

    render(
      <TestWrapper 
        onValidation={mockOnValidation} 
        availableBudget={mockAvailableBudget}
      />
    );

    expect(screen.getByText(/Verfügbar: 400.000,00 €/)).toBeInTheDocument();
    expect(screen.getByText(/20.*% ausgelastet/)).toBeInTheDocument();
  });

  it('sollte Eingabe-Format validieren', async () => {
    render(<TestWrapper onValidation={mockOnValidation} />);

    const input = screen.getByLabelText(/Geplantes Budget/);
    
    // Test verschiedene Eingabe-Formate
    await user.type(input, 'abc'); // Nicht-numerisch
    expect(input).toHaveValue('');

    await user.clear(input);
    await user.type(input, '50000.50'); // Dezimalzahl
    expect(input).toHaveValue('50000.5');

    await user.clear(input);
    await user.type(input, '1000000'); // Große Zahl
    expect(input).toHaveValue('1000000');
  });
});
