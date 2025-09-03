// =====================================================
// Budget Manager 2025 - Budget Status Indicator
// Story 1.3: Dreidimensionales Budget-Tracking
// =====================================================

import React from 'react';

interface BudgetStatusIndicatorProps {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'EXCEEDED';
  percentage: number;
  label?: string;
  showPercentage?: boolean;
}

const BudgetStatusIndicator: React.FC<BudgetStatusIndicatorProps> = ({
  status,
  percentage,
  label,
  showPercentage = true
}) => {
  // Deutsche Status-Labels und Farben
  const statusConfig = {
    HEALTHY: {
      label: 'Gesund',
      color: 'bg-green-500',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      icon: '🟢'
    },
    WARNING: {
      label: 'Warnung',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      icon: '🟡'
    },
    CRITICAL: {
      label: 'Kritisch',
      color: 'bg-orange-500',
      textColor: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      icon: '🟠'
    },
    EXCEEDED: {
      label: 'Überschritten',
      color: 'bg-red-500',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: '🔴'
    }
  };

  const config = statusConfig[status];
  const displayLabel = label || config.label;
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
      {/* Status-Icon */}
      <span className="text-sm">{config.icon}</span>
      
      {/* Status-Label */}
      <span className={`font-medium text-sm ${config.textColor}`}>
        {displayLabel}
      </span>
      
      {/* Prozentsatz */}
      {showPercentage && (
        <span className={`text-xs font-mono ${config.textColor}`}>
          ({percentage.toFixed(1)}%)
        </span>
      )}
      
      {/* Progress Bar */}
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${config.color}`}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    </div>
  );
};

export default BudgetStatusIndicator;

