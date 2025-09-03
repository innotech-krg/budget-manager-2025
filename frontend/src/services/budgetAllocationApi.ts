// =====================================================
// Budget Manager 2025 - Budget Allocation API Service
// Story 1.2.3: Intelligente Budget-Zuordnung
// =====================================================

const API_BASE_URL = import.meta.env.PROD 
  ? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api')
  : '/api' // Nutze Vite Proxy in Development

/**
 * Interface für verfügbares Budget
 */
export interface AvailableBudget {
  jahr: number
  gesamtbudget: number
  zugewiesenes_budget: number
  verfuegbares_budget: number
  reserve_budget: number
  verfuegbar_ohne_reserve: number
  reserve_allokation: number
  anzahl_projekte: number
  auslastung_prozent: number
  budget_status: 'GRUEN' | 'GELB' | 'ORANGE' | 'ROT'
  annual_budget_id: string
  // Formatierte Werte für UI
  gesamtbudget_formatted?: string
  zugewiesenes_budget_formatted?: string
  verfuegbares_budget_formatted?: string
  verfuegbar_ohne_reserve_formatted?: string
  reserve_budget_formatted?: string
}

/**
 * Interface für Budget-Validierung
 */
export interface BudgetValidationRequest {
  jahr: number
  geplantes_budget: number
  projekt_id?: string
}

export interface BudgetValidationResponse {
  success: boolean
  isValid: boolean
  error?: string
  message: string
  maxAllowedBudget?: number
  maxAllowedBudget_formatted?: string
  availableBudget?: AvailableBudget
  newUtilization?: number
  warning?: {
    level: 'WARNING' | 'CRITICAL'
    message: string
  }
}

/**
 * Interface für Budget-Reservierung
 */
export interface BudgetReservationRequest {
  projekt_id: string
  geplantes_budget: number
}

export interface BudgetReservationResponse {
  success: boolean
  message: string
  project?: any
  availableBudget?: AvailableBudget
  error?: string
  details?: string
}

/**
 * Custom Error für Budget-Allocation-API
 */
export class BudgetAllocationApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'BudgetAllocationApiError'
  }
}

/**
 * Budget Allocation API Service
 */
class BudgetAllocationApiService {
  
  /**
   * Verfügbares Budget für ein Jahr abrufen
   */
  async getAvailableBudget(jahr: number): Promise<AvailableBudget> {
    try {
      const response = await fetch(`${API_BASE_URL}/budget-allocation/available/${jahr}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 404) {
          throw new BudgetAllocationApiError(
            errorData.message || `Kein aktives Budget für Jahr ${jahr} gefunden`,
            404,
            'NO_ACTIVE_BUDGET'
          )
        }
        
        throw new BudgetAllocationApiError(
          errorData.message || 'Fehler beim Abrufen des verfügbaren Budgets',
          response.status,
          errorData.error
        )
      }

      const data = await response.json()
      return data.availableBudget
      
    } catch (error) {
      console.error('❌ Fehler beim Abrufen des verfügbaren Budgets:', error)
      
      if (error instanceof BudgetAllocationApiError) {
        throw error
      }
      
      throw new BudgetAllocationApiError(
        'Netzwerkfehler beim Abrufen des verfügbaren Budgets',
        0,
        'NETWORK_ERROR'
      )
    }
  }

  /**
   * Budget-Zuordnung validieren
   */
  async validateBudgetAllocation(request: BudgetValidationRequest): Promise<BudgetValidationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/budget-allocation/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const data = await response.json()
      
      // Auch bei 400 (Validierungsfehler) ist die Response gültig
      if (!response.ok && response.status !== 400) {
        throw new BudgetAllocationApiError(
          data.message || 'Fehler bei der Budget-Validierung',
          response.status,
          data.error
        )
      }

      return data
      
    } catch (error) {
      console.error('❌ Fehler bei Budget-Validierung:', error)
      
      if (error instanceof BudgetAllocationApiError) {
        throw error
      }
      
      return {
        success: false,
        isValid: false,
        message: 'Netzwerkfehler bei der Budget-Validierung'
      }
    }
  }

  /**
   * Budget für Projekt reservieren
   */
  async reserveBudget(request: BudgetReservationRequest): Promise<BudgetReservationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/budget-allocation/reserve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new BudgetAllocationApiError(
          data.message || 'Fehler bei der Budget-Reservierung',
          response.status,
          data.error
        )
      }

      return data
      
    } catch (error) {
      console.error('❌ Fehler bei Budget-Reservierung:', error)
      
      if (error instanceof BudgetAllocationApiError) {
        throw error
      }
      
      return {
        success: false,
        message: 'Netzwerkfehler bei der Budget-Reservierung'
      }
    }
  }

  /**
   * Budget freigeben
   */
  async releaseBudget(projektId: string): Promise<BudgetReservationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/budget-allocation/release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projekt_id: projektId }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new BudgetAllocationApiError(
          data.message || 'Fehler bei der Budget-Freigabe',
          response.status,
          data.error
        )
      }

      return data
      
    } catch (error) {
      console.error('❌ Fehler bei Budget-Freigabe:', error)
      
      if (error instanceof BudgetAllocationApiError) {
        throw error
      }
      
      return {
        success: false,
        message: 'Netzwerkfehler bei der Budget-Freigabe'
      }
    }
  }

  /**
   * Budget-Statistiken abrufen
   */
  async getBudgetStatistics(jahr: number): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/budget-allocation/statistics/${jahr}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new BudgetAllocationApiError(
          errorData.message || 'Fehler beim Abrufen der Budget-Statistiken',
          response.status,
          errorData.error
        )
      }

      const data = await response.json()
      return data.statistics
      
    } catch (error) {
      console.error('❌ Fehler beim Abrufen der Budget-Statistiken:', error)
      
      if (error instanceof BudgetAllocationApiError) {
        throw error
      }
      
      throw new BudgetAllocationApiError(
        'Netzwerkfehler beim Abrufen der Budget-Statistiken',
        0,
        'NETWORK_ERROR'
      )
    }
  }

  /**
   * Health Check für Budget-Allocation-Service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/budget-allocation/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      return response.ok
      
    } catch (error) {
      console.error('❌ Budget-Allocation-Service nicht erreichbar:', error)
      return false
    }
  }
}

// Singleton-Instanz exportieren
export const budgetAllocationApi = new BudgetAllocationApiService()
export default budgetAllocationApi

