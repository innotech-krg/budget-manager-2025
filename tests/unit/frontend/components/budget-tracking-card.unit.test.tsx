// =====================================================
// Budget Manager 2025 - Budget Tracking Card Tests
// Story 1.3: Dreidimensionales Budget-Tracking
// =====================================================

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import BudgetTrackingCard from '../../../../frontend/src/components/budget/BudgetTrackingCard';

const mockProject = {
  id: 'test-project-1',
  name: 'Test Projekt',
  projektnummer: 'WD-2025-001',
  veranschlagtes_budget: 50000,
  zugewiesenes_budget: 45000,
  verbrauchtes_budget: 32000,
  budget_status: 'WARNING' as const,
  budget_verbrauch_prozent: 71.1,
  kategorie_name: 'IT & Software',
  team_name: 'Development Team'
};

describe('BudgetTrackingCard - Story 1.3', () => {
  test('sollte Projekt-Informationen korrekt anzeigen', () => {
    render(<BudgetTrackingCard project={mockProject} />);
    
    expect(screen.getByText('Test Projekt')).toBeInTheDocument();
    expect(screen.getByText('WD-2025-001')).toBeInTheDocument();
    expect(screen.getByText('IT & Software')).toBeInTheDocument();
    expect(screen.getByText('Team: Development Team')).toBeInTheDocument();
  });

  test('sollte 3D Budget-Dimensionen anzeigen', () => {
    render(<BudgetTrackingCard project={mockProject} />);
    
    // Veranschlagtes Budget
    expect(screen.getByText('🎯 Veranschlagt:')).toBeInTheDocument();
    expect(screen.getByText(/50\.000,00.*€/)).toBeInTheDocument();
    
    // Zugewiesenes Budget
    expect(screen.getByText('💰 Zugewiesen:')).toBeInTheDocument();
    expect(screen.getByText(/45\.000,00.*€/)).toBeInTheDocument();
    
    // Verbrauchtes Budget
    expect(screen.getByText('📊 Verbraucht:')).toBeInTheDocument();
    expect(screen.getByText(/32\.000,00.*€/)).toBeInTheDocument();
  });

  test('sollte verbleibendes Budget korrekt berechnen und anzeigen', () => {
    render(<BudgetTrackingCard project={mockProject} />);
    
    expect(screen.getByText('💳 Verbleibend:')).toBeInTheDocument();
    // 45000 - 32000 = 13000
    expect(screen.getByText(/13\.000,00.*€/)).toBeInTheDocument();
  });

  test('sollte negatives verbleibendes Budget rot anzeigen', () => {
    const exceededProject = {
      ...mockProject,
      verbrauchtes_budget: 50000, // Mehr als zugewiesen
      budget_status: 'EXCEEDED' as const,
      budget_verbrauch_prozent: 111.1
    };
    
    render(<BudgetTrackingCard project={exceededProject} />);
    
    const verbleibendesElement = screen.getByText(/^-.*5\.000,00.*€/);
    expect(verbleibendesElement).toHaveClass('text-red-600');
  });

  test('sollte Budget-Status-Indikator rendern', () => {
    render(<BudgetTrackingCard project={mockProject} />);
    
    // Status-Indikator sollte WARNING anzeigen
    expect(screen.getByText('🟡')).toBeInTheDocument();
    expect(screen.getByText('Warnung')).toBeInTheDocument();
  });

  test('sollte Progress Bar mit korrekter Farbe für Status rendern', () => {
    const { rerender } = render(<BudgetTrackingCard project={mockProject} />);
    
    // WARNING Status sollte gelbe Progress Bar haben
    const progressBar = document.querySelector('.bg-yellow-500');
    expect(progressBar).toBeInTheDocument();
    
    // Test mit CRITICAL Status
    const criticalProject = { ...mockProject, budget_status: 'CRITICAL' as const };
    rerender(<BudgetTrackingCard project={criticalProject} />);
    
    const criticalProgressBar = document.querySelector('.bg-orange-500');
    expect(criticalProgressBar).toBeInTheDocument();
  });

  test('sollte Action Buttons rendern wenn Callbacks bereitgestellt', () => {
    const mockUpdateBudget = vi.fn();
    const mockAddExpense = vi.fn();
    
    render(
      <BudgetTrackingCard 
        project={mockProject}
        onUpdateBudget={mockUpdateBudget}
        onAddExpense={mockAddExpense}
      />
    );
    
    expect(screen.getByText('Budget anpassen')).toBeInTheDocument();
    expect(screen.getByText('Ausgabe hinzufügen')).toBeInTheDocument();
  });

  test('sollte Action Button Callbacks korrekt aufrufen', () => {
    const mockUpdateBudget = vi.fn();
    const mockAddExpense = vi.fn();
    
    render(
      <BudgetTrackingCard 
        project={mockProject}
        onUpdateBudget={mockUpdateBudget}
        onAddExpense={mockAddExpense}
      />
    );
    
    fireEvent.click(screen.getByText('Budget anpassen'));
    expect(mockUpdateBudget).toHaveBeenCalledWith('test-project-1');
    
    fireEvent.click(screen.getByText('Ausgabe hinzufügen'));
    expect(mockAddExpense).toHaveBeenCalledWith('test-project-1');
  });

  test('sollte keine Action Buttons rendern wenn keine Callbacks', () => {
    render(<BudgetTrackingCard project={mockProject} />);
    
    expect(screen.queryByText('Budget anpassen')).not.toBeInTheDocument();
    expect(screen.queryByText('Ausgabe hinzufügen')).not.toBeInTheDocument();
  });

  test('sollte ohne Team-Name funktionieren', () => {
    const projectWithoutTeam = {
      ...mockProject,
      team_name: undefined
    };
    
    render(<BudgetTrackingCard project={projectWithoutTeam} />);
    
    expect(screen.getByText('Test Projekt')).toBeInTheDocument();
    expect(screen.queryByText(/Team:/)).not.toBeInTheDocument();
  });

  test('sollte ohne Kategorie-Name funktionieren', () => {
    const projectWithoutCategory = {
      ...mockProject,
      kategorie_name: undefined
    };
    
    render(<BudgetTrackingCard project={projectWithoutCategory} />);
    
    expect(screen.getByText('Test Projekt')).toBeInTheDocument();
    expect(screen.queryByText('IT & Software')).not.toBeInTheDocument();
  });

  test('sollte Hover-Effekt CSS-Klasse haben', () => {
    render(<BudgetTrackingCard project={mockProject} />);
    
    const cardElement = screen.getByText('Test Projekt').closest('.hover\\:shadow-lg');
    expect(cardElement).toBeInTheDocument();
  });
});
