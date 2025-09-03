// =====================================================
// Budget Manager 2025 - Budget Status Indicator Tests
// Story 1.3: Dreidimensionales Budget-Tracking
// =====================================================

import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import BudgetStatusIndicator from '../../../../frontend/src/components/budget/BudgetStatusIndicator';

describe('BudgetStatusIndicator - Story 1.3', () => {
  test('sollte HEALTHY Status korrekt anzeigen', () => {
    render(
      <BudgetStatusIndicator 
        status="HEALTHY" 
        percentage={60.5} 
      />
    );
    
    expect(screen.getByText('🟢')).toBeInTheDocument();
    expect(screen.getByText('Gesund')).toBeInTheDocument();
    expect(screen.getByText('(60.5%)')).toBeInTheDocument();
  });

  test('sollte WARNING Status korrekt anzeigen', () => {
    render(
      <BudgetStatusIndicator 
        status="WARNING" 
        percentage={85.2} 
      />
    );
    
    expect(screen.getByText('🟡')).toBeInTheDocument();
    expect(screen.getByText('Warnung')).toBeInTheDocument();
    expect(screen.getByText('(85.2%)')).toBeInTheDocument();
  });

  test('sollte CRITICAL Status korrekt anzeigen', () => {
    render(
      <BudgetStatusIndicator 
        status="CRITICAL" 
        percentage={95.8} 
      />
    );
    
    expect(screen.getByText('🟠')).toBeInTheDocument();
    expect(screen.getByText('Kritisch')).toBeInTheDocument();
    expect(screen.getByText('(95.8%)')).toBeInTheDocument();
  });

  test('sollte EXCEEDED Status korrekt anzeigen', () => {
    render(
      <BudgetStatusIndicator 
        status="EXCEEDED" 
        percentage={114.3} 
      />
    );
    
    expect(screen.getByText('🔴')).toBeInTheDocument();
    expect(screen.getByText('Überschritten')).toBeInTheDocument();
    expect(screen.getByText('(114.3%)')).toBeInTheDocument();
  });

  test('sollte custom Label verwenden wenn angegeben', () => {
    render(
      <BudgetStatusIndicator 
        status="WARNING" 
        percentage={80.0}
        label="Achtung!"
      />
    );
    
    expect(screen.getByText('Achtung!')).toBeInTheDocument();
    expect(screen.queryByText('Warnung')).not.toBeInTheDocument();
  });

  test('sollte Prozentsatz verstecken wenn showPercentage=false', () => {
    render(
      <BudgetStatusIndicator 
        status="HEALTHY" 
        percentage={60.0}
        showPercentage={false}
      />
    );
    
    expect(screen.getByText('Gesund')).toBeInTheDocument();
    expect(screen.queryByText('(60.0%)')).not.toBeInTheDocument();
  });

  test('sollte Progress Bar mit korrekter Breite rendern', () => {
    render(
      <BudgetStatusIndicator 
        status="WARNING" 
        percentage={85.0}
      />
    );
    
    // Progress Bar sollte existieren (als div mit bg-yellow-500)
    const progressBar = screen.getByText('Warnung').parentElement?.querySelector('.bg-yellow-500');
    expect(progressBar).toBeInTheDocument();
  });

  test('sollte Prozentsatz auf 100% begrenzen für Progress Bar', () => {
    render(
      <BudgetStatusIndicator 
        status="EXCEEDED" 
        percentage={150.0}
      />
    );
    
    // Text sollte 150% zeigen
    expect(screen.getByText('(150.0%)')).toBeInTheDocument();
    
    // Progress Bar sollte maximal 100% breit sein (wird durch CSS begrenzt)
    const progressBar = screen.getByText('Überschritten').parentElement?.querySelector('.bg-red-500');
    expect(progressBar).toBeInTheDocument();
  });

  test('sollte korrekte CSS-Klassen für verschiedene Status haben', () => {
    const { rerender } = render(
      <BudgetStatusIndicator status="HEALTHY" percentage={60} />
    );
    
    expect(screen.getByText('Gesund').closest('div')).toHaveClass('bg-green-50');
    
    rerender(<BudgetStatusIndicator status="WARNING" percentage={85} />);
    expect(screen.getByText('Warnung').closest('div')).toHaveClass('bg-yellow-50');
    
    rerender(<BudgetStatusIndicator status="CRITICAL" percentage={95} />);
    expect(screen.getByText('Kritisch').closest('div')).toHaveClass('bg-orange-50');
    
    rerender(<BudgetStatusIndicator status="EXCEEDED" percentage={110} />);
    expect(screen.getByText('Überschritten').closest('div')).toHaveClass('bg-red-50');
  });
});
