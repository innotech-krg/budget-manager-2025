// =====================================================
// Budget Manager 2025 - Budget Tracking Page
// Story 1.3: Dreidimensionales Budget-Tracking
// =====================================================

import React from 'react';
import BudgetTrackingDashboard from '../components/budget/BudgetTrackingDashboard';

const BudgetTracking: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <BudgetTrackingDashboard />
      </div>
    </div>
  );
};

export default BudgetTracking;

