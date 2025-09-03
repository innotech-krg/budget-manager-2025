// =====================================================
// Budget Manager 2025 - Budget Transfers Page
// Story 1.4: Budget-Transfer-System - Haupt-Seite
// =====================================================

import React from 'react';
import TransferDashboard from '../components/transfers/TransferDashboard';

const BudgetTransfers: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <TransferDashboard />
    </div>
  );
};

export default BudgetTransfers;

