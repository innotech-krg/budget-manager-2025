// =====================================================
// Budget Manager 2025 - Budget Validation Input
// Story 1.2.3: Intelligente Budget-Zuordnung
// =====================================================

import React, { useState, useEffect, useCallback } from 'react'
import { useFormContext } from 'react-hook-form'
import { budgetAllocationApi, BudgetValidationResponse, AvailableBudget } from '../../services/budgetAllocationApi'
import { debounce } from 'lodash'

interface BudgetValidationInputProps {
  jahr: number
  projektId?: string
  fieldName?: string
  label?: string
  placeholder?: string
  className?: string
  onValidationChange?: (isValid: boolean, validation?: BudgetValidationResponse) => void
  availableBudget?: AvailableBudget
}

/**
 * Input-Komponente mit Real-time Budget-Validierung
 * Implementiert AC-2: Budget-Zuordnung mit Validierung
 */
export const BudgetValidationInput: React.FC<BudgetValidationInputProps> = ({
  jahr,
  projektId,
  fieldName = 'geplantes_budget',
  label = 'Geplantes Budget',
  placeholder = 'z.B. 50000,00',
  className = '',
  onValidationChange,
  availableBudget
}) => {
  const { register, watch, formState: { errors }, setError, clearErrors } = useFormContext()
  const [validation, setValidation] = useState<BudgetValidationResponse | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [lastValidatedValue, setLastValidatedValue] = useState<number | null>(null)

  // Aktuellen Wert überwachen
  const currentValue = watch(fieldName)

  // Debounced Validierung (500ms Verzögerung)
  const debouncedValidation = useCallback(
    debounce(async (value: number) => {
      if (!value || value <= 0) {
        setValidation(null)
        clearErrors(fieldName)
        if (onValidationChange) {
          onValidationChange(true)
        }
        return
      }

      // Nicht erneut validieren wenn der Wert gleich ist
      if (value === lastValidatedValue) {
        return
      }

      try {
        setIsValidating(true)
        setLastValidatedValue(value)

        const validationResult = await budgetAllocationApi.validateBudgetAllocation({
          jahr,
          geplantes_budget: value,
          projekt_id: projektId
        })

        setValidation(validationResult)

        // Form-Validierung setzen
        if (!validationResult.isValid) {
          setError(fieldName, {
            type: 'budget-validation',
            message: validationResult.message
          })
        } else {
          clearErrors(fieldName)
        }

        // Callback für Parent-Komponente
        if (onValidationChange) {
          onValidationChange(validationResult.isValid, validationResult)
        }

      } catch (error) {
        console.error('❌ Fehler bei Budget-Validierung:', error)
        setValidation({
          success: false,
          isValid: false,
          message: 'Fehler bei der Budget-Validierung'
        })
      } finally {
        setIsValidating(false)
      }
    }, 500),
    [jahr, projektId, fieldName, lastValidatedValue, onValidationChange, setError, clearErrors]
  )

  // Validierung bei Wert-Änderung
  useEffect(() => {
    const numericValue = parseFloat(currentValue)
    if (!isNaN(numericValue) && numericValue > 0) {
      debouncedValidation(numericValue)
    } else {
      setValidation(null)
      setLastValidatedValue(null)
    }

    // Cleanup bei Unmount
    return () => {
      debouncedValidation.cancel()
    }
  }, [currentValue, debouncedValidation])

  // Validierungs-Status-Icon
  const getValidationIcon = () => {
    if (isValidating) {
      return <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
    }

    if (!validation) {
      return null
    }

    if (validation.isValid) {
      if (validation.warning) {
        return <span className="text-yellow-500">⚠️</span>
      }
      return <span className="text-green-500">✅</span>
    }

    return <span className="text-red-500">❌</span>
  }

  // Validierungs-Nachricht-Styling
  const getValidationMessageClass = () => {
    if (!validation) return ''

    if (validation.isValid) {
      if (validation.warning) {
        return validation.warning.level === 'CRITICAL' ? 'text-red-600' : 'text-yellow-600'
      }
      return 'text-green-600'
    }

    return 'text-red-600'
  }

  // Verfügbares Budget anzeigen
  const showAvailableBudget = availableBudget && availableBudget.verfuegbares_budget > 0

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <label htmlFor={fieldName} className="block text-sm font-medium text-gray-700">
        {label} <span className="text-red-500">*</span>
      </label>

      {/* Input mit Validierungs-Icon */}
      <div className="relative">
        <input
          type="number"
          id={fieldName}
          step="0.01"
          min="0.01"
          {...register(fieldName, {
            required: `${label} ist erforderlich`,
            min: { value: 0.01, message: 'Budget muss größer als 0 sein' },
            valueAsNumber: true
          })}
          className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
            errors[fieldName] 
              ? 'border-red-300 focus:ring-red-500' 
              : validation?.isValid === false
                ? 'border-red-300 focus:ring-red-500'
                : validation?.isValid === true
                  ? 'border-green-300 focus:ring-green-500'
                  : 'border-gray-300 focus:ring-blue-500'
          }`}
          placeholder={placeholder}
        />
        
        {/* Validierungs-Icon */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          {getValidationIcon()}
        </div>
      </div>

      {/* Verfügbares Budget Hinweis */}
      {showAvailableBudget && (
        <div className="flex items-center justify-between text-sm bg-blue-50 border border-blue-200 rounded-md p-2">
          <span className="text-blue-700">
            💰 Verfügbar: {availableBudget.verfuegbares_budget_formatted || 
                          new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(availableBudget.verfuegbares_budget)}
          </span>
          <span className="text-blue-600 text-xs">
            {availableBudget.auslastung_prozent}% ausgelastet
          </span>
        </div>
      )}

      {/* Form-Validierungs-Fehler */}
      {errors[fieldName] && (
        <p className="text-sm text-red-600">
          {errors[fieldName]?.message}
        </p>
      )}

      {/* Budget-Validierungs-Nachricht */}
      {validation && validation.message && (
        <div className={`text-sm ${getValidationMessageClass()}`}>
          <p>{validation.message}</p>
          
          {/* Warnung bei hoher Auslastung */}
          {validation.warning && (
            <p className="mt-1 font-medium">
              {validation.warning.level === 'CRITICAL' ? '🚨' : '⚠️'} {validation.warning.message}
            </p>
          )}
          
          {/* Maximaler erlaubter Betrag */}
          {!validation.isValid && validation.maxAllowedBudget && validation.maxAllowedBudget > 0 && (
            <p className="mt-1 text-xs">
              Maximal erlaubt: {validation.maxAllowedBudget_formatted || 
                               new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(validation.maxAllowedBudget)}
            </p>
          )}
        </div>
      )}

      {/* Neue Auslastung anzeigen */}
      {validation?.isValid && validation.newUtilization && (
        <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md p-2">
          <div className="flex justify-between items-center">
            <span>Neue Budget-Auslastung:</span>
            <span className={`font-medium ${
              validation.newUtilization >= 95 ? 'text-red-600' :
              validation.newUtilization >= 85 ? 'text-orange-600' :
              validation.newUtilization >= 70 ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {Math.round(validation.newUtilization)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
            <div
              className={`h-1 rounded-full transition-all duration-300 ${
                validation.newUtilization >= 95 ? 'bg-red-500' :
                validation.newUtilization >= 85 ? 'bg-orange-500' :
                validation.newUtilization >= 70 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(validation.newUtilization, 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Hilfetext */}
      <p className="text-xs text-gray-500">
        Das Budget wird in Echtzeit gegen das verfügbare Jahresbudget validiert.
      </p>
    </div>
  )
}

export default BudgetValidationInput

