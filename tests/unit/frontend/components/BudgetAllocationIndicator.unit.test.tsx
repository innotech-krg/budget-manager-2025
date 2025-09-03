// =====================================================
// Budget Manager 2025 - Budget Allocation Indicator Tests
// Story 1.2.3: Intelligente Budget-Zuordnung
// =====================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import BudgetAllocationIndicator from '../../../../frontend/src/components/projects/BudgetAllocationIndicator';
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

describe('BudgetAllocationIndicator', () => {
  const mockOnBudgetUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sollte verfügbares Budget anzeigen', async () => {
    const mockBudget = {
      jahr: 2025,
      gesamtbudget: 500000,
      zugewiesenes_budget: 100000,
      verfuegbares_budget: 400000,
      reserve_budget: 50000,
      verfuegbar_ohne_reserve: 350000,
      reserve_allokation: 10,
      anzahl_projekte: 3,
      auslastung_prozent: 20,
      budget_status: 'GRUEN',
      annual_budget_id: 'budget-id-2025',
      gesamtbudget_formatted: '500.000,00 €',
      verfuegbares_budget_formatted: '400.000,00 €',
      verfuegbar_ohne_reserve_formatted: '350.000,00 €',
      reserve_budget_formatted: '50.000,00 €'
    };

    mockBudgetAllocationApi.getAvailableBudget.mockResolvedValue({
      success: true,
      availableBudget: mockBudget,
      timestamp: '2025-01-01T00:00:00Z'
    });

    render(
      <BudgetAllocationIndicator 
        jahr={2025} 
        onBudgetUpdate={mockOnBudgetUpdate} 
      />
    );

    // Loading state
    expect(screen.getByText('Lade verfügbares Budget...')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Budget 2025')).toBeInTheDocument();
    });

    // Check budget display
    expect(screen.getByText('500.000,00 €')).toBeInTheDocument(); // Gesamtbudget
    expect(screen.getByText('400.000,00 €')).toBeInTheDocument(); // Verfügbares Budget
    expect(screen.getByText('350.000,00 €')).toBeInTheDocument(); // Ohne Reserve
    expect(screen.getByText('20%')).toBeInTheDocument(); // Auslastung
    expect(screen.getByText('3 Projekte')).toBeInTheDocument();

    // Check status indicator (green)
    expect(screen.getByText('🟢')).toBeInTheDocument();

    // Check callback was called
    expect(mockOnBudgetUpdate).toHaveBeenCalledWith(mockBudget);
  });

  it('sollte Fehler-Status anzeigen wenn kein Budget existiert', async () => {
    mockBudgetAllocationApi.getAvailableBudget.mockRejectedValue(
      new Error('Kein aktives Budget für Jahr 2025 gefunden')
    );

    render(
      <BudgetAllocationIndicator 
        jahr={2025} 
        onBudgetUpdate={mockOnBudgetUpdate} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Kein aktives Budget/)).toBeInTheDocument();
    });

    expect(screen.getByText('❌')).toBeInTheDocument();
    expect(mockOnBudgetUpdate).not.toHaveBeenCalled();
  });

  it('sollte verschiedene Budget-Status korrekt anzeigen', async () => {
    const testCases = [
      { status: 'GRUEN', icon: '🟢', description: 'Niedrige Auslastung' },
      { status: 'GELB', icon: '🟡', description: 'Mittlere Auslastung' },
      { status: 'ORANGE', icon: '🟠', description: 'Hohe Auslastung' },
      { status: 'ROT', icon: '🔴', description: 'Kritische Auslastung' }
    ];

    for (const testCase of testCases) {
      const mockBudget = {
        jahr: 2025,
        gesamtbudget: 500000,
        verfuegbares_budget: 100000,
        budget_status: testCase.status,
        auslastung_prozent: testCase.status === 'ROT' ? 95 : 50,
        gesamtbudget_formatted: '500.000,00 €',
        verfuegbares_budget_formatted: '100.000,00 €'
      };

      mockBudgetAllocationApi.getAvailableBudget.mockResolvedValue({
        success: true,
        availableBudget: mockBudget
      });

      const { rerender } = render(
        <BudgetAllocationIndicator 
          jahr={2025} 
          onBudgetUpdate={mockOnBudgetUpdate} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText(testCase.icon)).toBeInTheDocument();
      });

      // Clean up for next iteration
      rerender(<div />);
      vi.clearAllMocks();
    }
  });

  it('sollte Budget automatisch aktualisieren wenn Jahr sich ändert', async () => {
    const mockBudget2025 = {
      jahr: 2025,
      gesamtbudget: 500000,
      gesamtbudget_formatted: '500.000,00 €'
    };

    const mockBudget2026 = {
      jahr: 2026,
      gesamtbudget: 600000,
      gesamtbudget_formatted: '600.000,00 €'
    };

    mockBudgetAllocationApi.getAvailableBudget
      .mockResolvedValueOnce({ success: true, availableBudget: mockBudget2025 })
      .mockResolvedValueOnce({ success: true, availableBudget: mockBudget2026 });

    const { rerender } = render(
      <BudgetAllocationIndicator 
        jahr={2025} 
        onBudgetUpdate={mockOnBudgetUpdate} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Budget 2025')).toBeInTheDocument();
    });

    // Change year
    rerender(
      <BudgetAllocationIndicator 
        jahr={2026} 
        onBudgetUpdate={mockOnBudgetUpdate} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Budget 2026')).toBeInTheDocument();
    });

    expect(mockBudgetAllocationApi.getAvailableBudget).toHaveBeenCalledTimes(2);
    expect(mockBudgetAllocationApi.getAvailableBudget).toHaveBeenNthCalledWith(1, 2025);
    expect(mockBudgetAllocationApi.getAvailableBudget).toHaveBeenNthCalledWith(2, 2026);
  });

  it('sollte Retry-Button bei Fehlern anzeigen', async () => {
    mockBudgetAllocationApi.getAvailableBudget.mockRejectedValueOnce(
      new Error('Network error')
    );

    render(
      <BudgetAllocationIndicator 
        jahr={2025} 
        onBudgetUpdate={mockOnBudgetUpdate} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Erneut versuchen')).toBeInTheDocument();
    });

    // Mock successful retry
    const mockBudget = {
      jahr: 2025,
      gesamtbudget: 500000,
      gesamtbudget_formatted: '500.000,00 €'
    };

    mockBudgetAllocationApi.getAvailableBudget.mockResolvedValue({
      success: true,
      availableBudget: mockBudget
    });

    // Click retry
    const retryButton = screen.getByText('Erneut versuchen');
    retryButton.click();

    await waitFor(() => {
      expect(screen.getByText('Budget 2025')).toBeInTheDocument();
    });

    expect(mockBudgetAllocationApi.getAvailableBudget).toHaveBeenCalledTimes(2);
  });

  it('sollte Reserve-Budget-Information anzeigen', async () => {
    const mockBudget = {
      jahr: 2025,
      gesamtbudget: 500000,
      verfuegbares_budget: 400000,
      reserve_budget: 50000,
      verfuegbar_ohne_reserve: 350000,
      reserve_allokation: 10,
      gesamtbudget_formatted: '500.000,00 €',
      verfuegbares_budget_formatted: '400.000,00 €',
      reserve_budget_formatted: '50.000,00 €',
      verfuegbar_ohne_reserve_formatted: '350.000,00 €'
    };

    mockBudgetAllocationApi.getAvailableBudget.mockResolvedValue({
      success: true,
      availableBudget: mockBudget
    });

    render(
      <BudgetAllocationIndicator 
        jahr={2025} 
        onBudgetUpdate={mockOnBudgetUpdate} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Reserve (10%)')).toBeInTheDocument();
    });

    expect(screen.getByText('50.000,00 €')).toBeInTheDocument(); // Reserve Budget
    expect(screen.getByText('350.000,00 €')).toBeInTheDocument(); // Verfügbar ohne Reserve
  });
});
