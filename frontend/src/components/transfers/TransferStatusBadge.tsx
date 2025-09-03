// =====================================================
// Budget Manager 2025 - Transfer Status Badge
// Story 1.4: Budget-Transfer-System - Status-Anzeige
// =====================================================

import React from 'react';

interface TransferStatusBadgeProps {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const statusConfig = {
  PENDING: {
    label: 'Ausstehend',
    icon: '🟡',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200'
  },
  APPROVED: {
    label: 'Genehmigt',
    icon: '🟢',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200'
  },
  REJECTED: {
    label: 'Abgelehnt',
    icon: '🔴',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-200'
  },
  CANCELLED: {
    label: 'Storniert',
    icon: '⚫',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-200'
  }
};

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base'
};

const TransferStatusBadge: React.FC<TransferStatusBadgeProps> = ({ 
  status, 
  size = 'md', 
  showIcon = true 
}) => {
  const config = statusConfig[status];
  const sizeClass = sizeClasses[size];

  return (
    <span 
      className={`
        inline-flex items-center gap-1 rounded-full border font-medium
        ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClass}
      `}
      title={`Transfer-Status: ${config.label}`}
    >
      {showIcon && (
        <span className="text-xs">{config.icon}</span>
      )}
      <span>{config.label}</span>
    </span>
  );
};

export default TransferStatusBadge;

