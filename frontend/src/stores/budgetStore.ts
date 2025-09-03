// =====================================================
// Budget Manager 2025 - Budget Store (Zustand)
// Globales State Management für Budget-Daten
// =====================================================

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Budget } from '../components/budget/BudgetCard'
import { budgetApi, BudgetApiError, CreateBudgetRequest, UpdateBudgetRequest } from '../services/budgetApi'

interface BudgetState {
  // State
  budgets: Budget[]
  currentBudget: Budget | null
  isLoading: boolean
  error: string | null
  lastFetch: Date | null

  // Actions
  fetchBudgets: () => Promise<void>
  fetchBudget: (id: string) => Promise<void>
  createBudget: (budgetData: CreateBudgetRequest) => Promise<Budget>
  updateBudget: (id: string, budgetData: UpdateBudgetRequest) => Promise<Budget>
  updateBudgetStatus: (id: string, newStatus: Budget['status']) => Promise<Budget>
  deleteBudget: (id: string) => Promise<void>
  clearError: () => void
  clearCurrentBudget: () => void
  
  // Computed/Selectors
  getBudgetById: (id: string) => Budget | undefined
  getActiveBudget: () => Budget | undefined
  getBudgetsByStatus: (status: Budget['status']) => Budget[]
  getBudgetsByYear: (year: number) => Budget[]
}

export const useBudgetStore = create<BudgetState>()(
  devtools(
    (set, get) => ({
      // Initial State
      budgets: [],
      currentBudget: null,
      isLoading: false,
      error: null,
      lastFetch: null,

      // Actions
      fetchBudgets: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const budgets = await budgetApi.getAllBudgets()
          set({ 
            budgets, 
            isLoading: false, 
            lastFetch: new Date(),
            error: null 
          })
        } catch (error) {
          const errorMessage = error instanceof BudgetApiError 
            ? error.message 
            : 'Fehler beim Laden der Budgets'
          
          set({ 
            isLoading: false, 
            error: errorMessage 
          })
          throw error
        }
      },

      fetchBudget: async (id: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const budget = await budgetApi.getBudget(id)
          set({ 
            currentBudget: budget, 
            isLoading: false,
            error: null 
          })
        } catch (error) {
          const errorMessage = error instanceof BudgetApiError 
            ? error.message 
            : 'Fehler beim Laden des Budgets'
          
          set({ 
            isLoading: false, 
            error: errorMessage,
            currentBudget: null 
          })
          throw error
        }
      },

      createBudget: async (budgetData: CreateBudgetRequest) => {
        set({ isLoading: true, error: null })
        
        try {
          // Debug: Logge die gesendeten Daten
          console.log('🔍 Budget-Daten vor API-Aufruf:', {
            ...budgetData,
            types: {
              jahr: typeof budgetData.jahr,
              gesamtbudget: typeof budgetData.gesamtbudget,
              reserve_allokation: typeof budgetData.reserve_allokation
            }
          })
          
          const newBudget = await budgetApi.createBudget(budgetData)
          
          set(state => ({
            budgets: [...state.budgets, newBudget],
            isLoading: false,
            error: null
          }))
          
          return newBudget
        } catch (error) {
          console.error('❌ Budget-Erstellung fehlgeschlagen:', error)
          
          let errorMessage = 'Fehler beim Erstellen des Budgets'
          
          if (error instanceof BudgetApiError) {
            errorMessage = error.message
          } else if (error.message?.includes('Ungültige Budget-Daten')) {
            errorMessage = 'Ungültige Budget-Daten. Bitte prüfen Sie Ihre Eingaben (Jahr muss eine Zahl sein, Budget > 0, Reserve 0-100%).'
          } else if (error.message?.includes('bereits vorhanden')) {
            errorMessage = 'Ein Budget für dieses Jahr existiert bereits. Pro Jahr ist nur ein Budget erlaubt.'
          } else if (error.message?.includes('vergangene Jahre')) {
            errorMessage = 'Budgets können nur für das aktuelle Jahr oder zukünftige Jahre erstellt werden.'
          }
          
          set({ 
            isLoading: false, 
            error: errorMessage 
          })
          throw error
        }
      },

      updateBudget: async (id: string, budgetData: UpdateBudgetRequest) => {
        set({ isLoading: true, error: null })
        
        try {
          const updatedBudget = await budgetApi.updateBudget(id, budgetData)
          
          set(state => ({
            budgets: state.budgets.map(budget => 
              budget.id === id ? updatedBudget : budget
            ),
            currentBudget: state.currentBudget?.id === id ? updatedBudget : state.currentBudget,
            isLoading: false,
            error: null
          }))
          
          return updatedBudget
        } catch (error) {
          const errorMessage = error instanceof BudgetApiError 
            ? error.message 
            : 'Fehler beim Aktualisieren des Budgets'
          
          set({ 
            isLoading: false, 
            error: errorMessage 
          })
          throw error
        }
      },

      updateBudgetStatus: async (id: string, newStatus: Budget['status']) => {
        set({ isLoading: true, error: null })
        
        try {
          const updatedBudget = await budgetApi.updateBudgetStatus(id, newStatus)
          
          set(state => ({
            budgets: state.budgets.map(budget => 
              budget.id === id ? updatedBudget : budget
            ),
            currentBudget: state.currentBudget?.id === id ? updatedBudget : state.currentBudget,
            isLoading: false,
            error: null
          }))
          
          return updatedBudget
        } catch (error) {
          const errorMessage = error instanceof BudgetApiError 
            ? error.message 
            : 'Fehler beim Ändern des Budget-Status'
          
          set({ 
            isLoading: false, 
            error: errorMessage 
          })
          throw error
        }
      },

      deleteBudget: async (id: string) => {
        set({ isLoading: true, error: null })
        
        try {
          await budgetApi.deleteBudget(id)
          
          set(state => ({
            budgets: state.budgets.filter(budget => budget.id !== id),
            currentBudget: state.currentBudget?.id === id ? null : state.currentBudget,
            isLoading: false,
            error: null
          }))
        } catch (error) {
          const errorMessage = error instanceof BudgetApiError 
            ? error.message 
            : 'Fehler beim Löschen des Budgets'
          
          set({ 
            isLoading: false, 
            error: errorMessage 
          })
          throw error
        }
      },

      clearError: () => {
        set({ error: null })
      },

      clearCurrentBudget: () => {
        set({ currentBudget: null })
      },

      // Computed/Selectors
      getBudgetById: (id: string) => {
        return get().budgets.find(budget => budget.id === id)
      },

      getActiveBudget: () => {
        return get().budgets.find(budget => budget.status === 'ACTIVE')
      },

      getBudgetsByStatus: (status: Budget['status']) => {
        return get().budgets.filter(budget => budget.status === status)
      },

      getBudgetsByYear: (year: number) => {
        return get().budgets.filter(budget => budget.jahr === year)
      },
    }),
    {
      name: 'budget-store', // Name für DevTools
    }
  )
)