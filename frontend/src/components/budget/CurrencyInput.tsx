// =====================================================
// Budget Manager 2025 - Currency Input Component
// Deutsche EUR-Formatierung mit Validierung
// =====================================================

import React, { useState, useEffect } from 'react';
import { CurrencyEuroIcon } from '@heroicons/react/24/outline';
import { formatGermanCurrency, parseGermanCurrency, validateGermanCurrency } from '@/utils/currency';
import { clsx } from 'clsx';

interface CurrencyInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showSymbol?: boolean;
  min?: number;
  max?: number;
  required?: boolean;
  hint?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  value,
  onChange,
  error,
  placeholder = '€0,00',
  disabled = false,
  className = '',
  showSymbol = true,
  min = 0,
  max = 999999999.99,
  required = false,
  hint
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Update display value when value prop changes
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value > 0 ? formatGermanCurrency(value, { showSymbol: false }) : '');
    }
  }, [value, isFocused]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    setDisplayValue(inputValue);
    setLocalError(null);

    // Allow empty input
    if (inputValue === '') {
      onChange(0);
      return;
    }

    // Validate German currency format
    const validation = validateGermanCurrency(inputValue);
    
    if (validation.isValid) {
      // Additional range validation
      if (validation.value < min) {
        setLocalError(`Betrag muss mindestens ${formatGermanCurrency(min)} betragen`);
        return;
      }
      
      if (validation.value > max) {
        setLocalError(`Betrag darf maximal ${formatGermanCurrency(max)} betragen`);
        return;
      }

      onChange(validation.value);
    } else {
      setLocalError(validation.error);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Show raw input format when focused
    if (value > 0) {
      setDisplayValue(formatGermanCurrency(value, { showSymbol: false }));
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // Format display value when not focused
    if (value > 0) {
      setDisplayValue(formatGermanCurrency(value, { showSymbol: false }));
    } else {
      setDisplayValue('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const char = event.key;
    
    // Allow navigation keys
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(char)) {
      return;
    }
    
    // Allow numbers, comma (decimal separator), and dot (thousand separator)
    if (!/[\d,.]/.test(char)) {
      event.preventDefault();
      return;
    }
    
    const currentValue = displayValue;
    
    // Prevent multiple decimal separators
    if (char === ',' && currentValue.includes(',')) {
      event.preventDefault();
      return;
    }
    
    // Limit decimal places to 2
    if (currentValue.includes(',')) {
      const decimalPart = currentValue.split(',')[1];
      if (decimalPart && decimalPart.length >= 2 && /\d/.test(char)) {
        event.preventDefault();
        return;
      }
    }
  };

  const displayError = error || localError;
  const hasError = Boolean(displayError);

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-geschaeft-700">
          {label}
          {required && <span className="text-ampel-rot-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {showSymbol && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <CurrencyEuroIcon className="h-5 w-5 text-geschaeft-400" />
          </div>
        )}
        
        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className={clsx(
            'w-full input-german',
            showSymbol ? 'pl-10' : 'pl-3',
            'pr-3 py-2',
            hasError ? 'border-ampel-rot-300 focus:border-ampel-rot-500 focus:ring-ampel-rot-500' : '',
            disabled ? 'bg-geschaeft-50 text-geschaeft-500 cursor-not-allowed' : '',
            'currency-display',
            className
          )}
        />
        
        {/* Format indicator */}
        {isFocused && !hasError && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-xs text-geschaeft-400">
              Format: 1.000,00
            </span>
          </div>
        )}
      </div>

      {/* Error message */}
      {hasError && (
        <p className="text-sm text-ampel-rot-600 flex items-start">
          <svg className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {displayError}
        </p>
      )}

      {/* Hint */}
      {hint && !hasError && (
        <p className="text-sm text-geschaeft-500">
          {hint}
        </p>
      )}

      {/* Value preview */}
      {value > 0 && !isFocused && !hasError && (
        <div className="flex items-center justify-between text-xs text-geschaeft-600 bg-geschaeft-50 px-3 py-2 rounded">
          <span>Eingabe:</span>
          <span className="font-mono font-semibold">
            {formatGermanCurrency(value)}
          </span>
        </div>
      )}
    </div>
  );
};

// =====================================================
// COMPACT CURRENCY INPUT (for smaller spaces)
// =====================================================

interface CompactCurrencyInputProps extends Omit<CurrencyInputProps, 'label' | 'hint'> {
  size?: 'sm' | 'md' | 'lg';
}

export const CompactCurrencyInput: React.FC<CompactCurrencyInputProps> = ({
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'text-sm py-1 px-2',
    md: 'text-base py-2 px-3',
    lg: 'text-lg py-3 px-4'
  };

  return (
    <CurrencyInput
      {...props}
      className={clsx(sizeClasses[size], className)}
      showSymbol={false}
    />
  );
};

// =====================================================
// CURRENCY DISPLAY (read-only)
// =====================================================

interface CurrencyDisplayProps {
  value: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  value,
  label,
  size = 'md',
  color = 'default',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-2xl'
  };

  const colorClasses = {
    default: 'text-geschaeft-900',
    success: 'text-ampel-gruen-600',
    warning: 'text-ampel-gelb-600',
    danger: 'text-ampel-rot-600'
  };

  return (
    <div className={clsx('flex flex-col', className)}>
      {label && (
        <label className="text-sm font-medium text-geschaeft-600 mb-1">
          {label}
        </label>
      )}
      <span className={clsx(
        'currency-display font-semibold',
        sizeClasses[size],
        colorClasses[color]
      )}>
        {formatGermanCurrency(value)}
      </span>
    </div>
  );
};

export default CurrencyInput;