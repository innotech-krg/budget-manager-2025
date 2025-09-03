// =====================================================
// Budget Manager 2025 - Budget API Service
// Frontend API Integration für Budget-Management
// =====================================================

import { Budget } from '../components/budget/BudgetCard'

// Verwende Vite Proxy für Development, direkte URL für Production
const API_BASE_URL = import.meta.env.PROD 
  ? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api')
  : '/api' // Nutze Vite Proxy in Development

export interface CreateBudgetRequest {
  jahr: number
  gesamtbudget: number
  reserve_allokation: number
  beschreibung?: string
}

export interface UpdateBudgetRequest extends Partial<CreateBudgetRequest> {
  status?: Budget['status']
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ApiListResponse<T> extends ApiResponse<T[]> {
  count?: number
}

class BudgetApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'BudgetApiError'
  }
}

class BudgetApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        let errorDetails = null

        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
          errorDetails = errorData
        } catch {
          // Fallback wenn JSON-Parsing fehlschlägt
        }

        throw new BudgetApiError(errorMessage, response.status, errorDetails)
      }

      const data = await response.json()
      return data
    } catch (error) {
      if (error instanceof BudgetApiError) {
        throw error
      }

      // Network oder andere Fehler
      throw new BudgetApiError(
        `Netzwerkfehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        0,
        error
      )
    }
  }

  // Alle Budgets abrufen
  async getAllBudgets(): Promise<Budget[]> {
    const response = await this.request<{ budgets: Budget[] }>('/budgets')
    return response.budgets || []
  }

  // Einzelnes Budget abrufen
  async getBudget(id: string): Promise<Budget> {
    const response = await this.request<ApiResponse<Budget>>(`/budgets/${id}`)
    if (!response.data) {
      throw new BudgetApiError('Budget nicht gefunden', 404)
    }
    return response.data
  }

  // Neues Budget erstellen
  async createBudget(budgetData: CreateBudgetRequest): Promise<Budget> {
    const response = await this.request<{ budget: Budget; message: string }>('/budgets', {
      method: 'POST',
      body: JSON.stringify(budgetData),
    })
    
    if (!response.budget) {
      throw new BudgetApiError('Fehler beim Erstellen des Budgets')
    }
    
    return response.budget
  }

  // Budget aktualisieren
  async updateBudget(id: string, budgetData: UpdateBudgetRequest): Promise<Budget> {
    const response = await this.request<ApiResponse<Budget>>(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(budgetData),
    })
    
    if (!response.data) {
      throw new BudgetApiError('Fehler beim Aktualisieren des Budgets')
    }
    
    return response.data
  }

  // Budget-Status ändern
  async updateBudgetStatus(id: string, newStatus: Budget['status']): Promise<Budget> {
    const response = await this.request<ApiResponse<Budget>>(`/budgets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ newStatus }),
    })
    
    if (!response.data) {
      throw new BudgetApiError('Fehler beim Ändern des Budget-Status')
    }
    
    return response.data
  }

  // Budget löschen
  async deleteBudget(id: string): Promise<void> {
    await this.request<ApiResponse<void>>(`/budgets/${id}`, {
      method: 'DELETE',
    })
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; message: string }> {
    const response = await this.request<{ status: string; message: string }>('/health')
    return response
  }
}

// Singleton-Instanz exportieren
export const budgetApi = new BudgetApiService()
export { BudgetApiError }