// =====================================================
// Budget Manager 2025 - Erweiterte Validierungen
// Phase 3: Advanced Validation Middleware
// =====================================================

import { supabaseAdmin } from '../config/database.js'

/**
 * Erweiterte Validierung für Projekt-Erstellung
 */
export const validateProjectCreation = async (req, res, next) => {
  try {
    const {
      name,
      planned_budget,
      budget_year,
      annual_budget_id,
      cost_type,
      start_date,
      end_date,
      internal_hours_design,
      internal_hours_content,
      internal_hours_dev
    } = req.body

    const errors = []

    // 1. Budget-Verfügbarkeit prüfen
    if (planned_budget && annual_budget_id) {
      const { data: annualBudget, error: budgetError } = await supabaseAdmin
        .from('annual_budgets')
        .select('total_budget, consumed_budget, available_budget, reserve_allocation')
        .eq('id', annual_budget_id)
        .eq('status', 'ACTIVE')
        .single()

      if (budgetError || !annualBudget) {
        errors.push({
          field: 'annual_budget_id',
          message: 'Invalid or inactive annual budget',
          code: 'INVALID_ANNUAL_BUDGET'
        })
      } else {
        // Prüfe verfügbares Budget
        const reserveAmount = (annualBudget.total_budget * annualBudget.reserve_allocation) / 100
        const availableForAllocation = annualBudget.total_budget - annualBudget.consumed_budget - reserveAmount
        
        if (planned_budget > availableForAllocation) {
          errors.push({
            field: 'planned_budget',
            message: `Budget exceeds available allocation. Available: €${availableForAllocation.toLocaleString('de-DE')}`,
            code: 'BUDGET_EXCEEDS_AVAILABLE',
            available: availableForAllocation,
            requested: planned_budget
          })
        }
      }
    }

    // 2. Projekt-Name Eindeutigkeit prüfen (pro Jahr)
    if (name && budget_year) {
      const { data: existingProject } = await supabaseAdmin
        .from('projects')
        .select('id')
        .eq('name', name)
        .eq('budget_year', budget_year)
        .single()

      if (existingProject) {
        errors.push({
          field: 'name',
          message: `Project with name "${name}" already exists for year ${budget_year}`,
          code: 'DUPLICATE_PROJECT_NAME'
        })
      }
    }

    // 3. Datums-Validierung
    if (start_date && end_date) {
      const startDate = new Date(start_date)
      const endDate = new Date(end_date)
      const today = new Date()
      
      if (startDate > endDate) {
        errors.push({
          field: 'end_date',
          message: 'End date must be after start date',
          code: 'INVALID_DATE_RANGE'
        })
      }
      
      // Warnung für Projekte die in der Vergangenheit starten
      if (startDate < today && req.method === 'POST') {
        req.warnings = req.warnings || []
        req.warnings.push({
          field: 'start_date',
          message: 'Project starts in the past',
          code: 'PAST_START_DATE'
        })
      }
    }

    // 4. Interne Stunden Validierung
    const totalInternalHours = (internal_hours_design || 0) + 
                              (internal_hours_content || 0) + 
                              (internal_hours_dev || 0)
    
    if (totalInternalHours > 2000) { // Mehr als 1 Vollzeit-Jahr
      errors.push({
        field: 'internal_hours',
        message: `Total internal hours (${totalInternalHours}) seems unrealistic. Please verify.`,
        code: 'EXCESSIVE_INTERNAL_HOURS',
        total: totalInternalHours
      })
    }

    // 5. Kostenart-spezifische Validierung
    if (cost_type === 'internal' && planned_budget > 50000) {
      req.warnings = req.warnings || []
      req.warnings.push({
        field: 'planned_budget',
        message: 'High budget for internal project. Consider if external costs are included.',
        code: 'HIGH_INTERNAL_BUDGET'
      })
    }

    if (cost_type === 'external' && totalInternalHours > 200) {
      req.warnings = req.warnings || []
      req.warnings.push({
        field: 'internal_hours',
        message: 'High internal hours for external project. Verify cost allocation.',
        code: 'HIGH_INTERNAL_HOURS_EXTERNAL'
      })
    }

    // Fehler zurückgeben falls vorhanden
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Advanced validation failed',
        message: 'The project data contains validation errors',
        code: 'ADVANCED_VALIDATION_ERROR',
        errors,
        warnings: req.warnings || []
      })
    }

    next()
  } catch (error) {
    console.error('❌ Advanced validation error:', error)
    res.status(500).json({
      error: 'Validation system error',
      message: 'Unable to perform advanced validation',
      code: 'VALIDATION_SYSTEM_ERROR'
    })
  }
}

/**
 * Budget-Transfer Validierung
 */
export const validateBudgetTransfer = async (req, res, next) => {
  try {
    const { from_budget_id, to_budget_id, amount, reason } = req.body
    const errors = []

    // 1. Verschiedene Budgets prüfen
    if (from_budget_id === to_budget_id) {
      errors.push({
        field: 'to_budget_id',
        message: 'Cannot transfer budget to the same budget',
        code: 'SAME_BUDGET_TRANSFER'
      })
    }

    // 2. Verfügbarkeit des Quell-Budgets prüfen
    const { data: fromBudget } = await supabaseAdmin
      .from('annual_budgets')
      .select('total_budget, consumed_budget, available_budget')
      .eq('id', from_budget_id)
      .eq('status', 'ACTIVE')
      .single()

    if (!fromBudget) {
      errors.push({
        field: 'from_budget_id',
        message: 'Source budget not found or inactive',
        code: 'INVALID_SOURCE_BUDGET'
      })
    } else if (fromBudget.available_budget < amount) {
      errors.push({
        field: 'amount',
        message: `Insufficient budget. Available: €${fromBudget.available_budget.toLocaleString('de-DE')}`,
        code: 'INSUFFICIENT_BUDGET',
        available: fromBudget.available_budget,
        requested: amount
      })
    }

    // 3. Ziel-Budget prüfen
    const { data: toBudget } = await supabaseAdmin
      .from('annual_budgets')
      .select('id, status')
      .eq('id', to_budget_id)
      .single()

    if (!toBudget) {
      errors.push({
        field: 'to_budget_id',
        message: 'Target budget not found',
        code: 'INVALID_TARGET_BUDGET'
      })
    }

    // 4. Grund-Validierung
    if (!reason || reason.trim().length < 10) {
      errors.push({
        field: 'reason',
        message: 'Transfer reason must be at least 10 characters',
        code: 'INSUFFICIENT_REASON'
      })
    }

    // 5. Betrag-Validierung
    if (amount <= 0) {
      errors.push({
        field: 'amount',
        message: 'Transfer amount must be positive',
        code: 'INVALID_AMOUNT'
      })
    }

    if (amount > 1000000) { // 1 Million Euro
      req.warnings = req.warnings || []
      req.warnings.push({
        field: 'amount',
        message: 'Large transfer amount requires additional approval',
        code: 'LARGE_TRANSFER_AMOUNT'
      })
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Budget transfer validation failed',
        message: 'The transfer request contains validation errors',
        code: 'TRANSFER_VALIDATION_ERROR',
        errors,
        warnings: req.warnings || []
      })
    }

    next()
  } catch (error) {
    console.error('❌ Budget transfer validation error:', error)
    res.status(500).json({
      error: 'Transfer validation system error',
      message: 'Unable to perform transfer validation',
      code: 'TRANSFER_VALIDATION_SYSTEM_ERROR'
    })
  }
}

/**
 * Jahresbudget-Validierung
 */
export const validateAnnualBudget = async (req, res, next) => {
  try {
    const { year, total_budget, reserve_allocation, team_id } = req.body
    const errors = []

    // 1. Jahr-Eindeutigkeit prüfen (pro Team oder global)
    const query = supabaseAdmin
      .from('annual_budgets')
      .select('id')
      .eq('year', year)
      .eq('status', 'ACTIVE')

    if (team_id) {
      query.eq('team_id', team_id)
    } else {
      query.is('team_id', null)
    }

    const { data: existingBudget } = await query.single()

    if (existingBudget && req.method === 'POST') {
      errors.push({
        field: 'year',
        message: `Active budget for year ${year} already exists${team_id ? ' for this team' : ' globally'}`,
        code: 'DUPLICATE_ANNUAL_BUDGET'
      })
    }

    // 2. Budget-Größe Validierung
    if (total_budget < 10000) {
      errors.push({
        field: 'total_budget',
        message: 'Annual budget should be at least €10,000',
        code: 'BUDGET_TOO_SMALL'
      })
    }

    if (total_budget > 10000000) { // 10 Millionen Euro
      req.warnings = req.warnings || []
      req.warnings.push({
        field: 'total_budget',
        message: 'Very large budget requires board approval',
        code: 'LARGE_BUDGET_APPROVAL_REQUIRED'
      })
    }

    // 3. Reserve-Allokation Validierung
    if (reserve_allocation < 5) {
      req.warnings = req.warnings || []
      req.warnings.push({
        field: 'reserve_allocation',
        message: 'Low reserve allocation may cause budget issues',
        code: 'LOW_RESERVE_ALLOCATION'
      })
    }

    if (reserve_allocation > 25) {
      req.warnings = req.warnings || []
      req.warnings.push({
        field: 'reserve_allocation',
        message: 'High reserve allocation reduces available budget significantly',
        code: 'HIGH_RESERVE_ALLOCATION'
      })
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Annual budget validation failed',
        message: 'The budget data contains validation errors',
        code: 'ANNUAL_BUDGET_VALIDATION_ERROR',
        errors,
        warnings: req.warnings || []
      })
    }

    next()
  } catch (error) {
    console.error('❌ Annual budget validation error:', error)
    res.status(500).json({
      error: 'Annual budget validation system error',
      message: 'Unable to perform annual budget validation',
      code: 'ANNUAL_BUDGET_VALIDATION_SYSTEM_ERROR'
    })
  }
}

/**
 * Performance-Monitoring Middleware
 */
export const performanceMonitoring = (req, res, next) => {
  const startTime = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - startTime
    
    // Log langsame Anfragen (> 500ms)
    if (duration > 500) {
      console.warn(`⚠️ Slow request: ${req.method} ${req.path} - ${duration}ms`)
    }
    
    // Log sehr langsame Anfragen (> 2000ms)
    if (duration > 2000) {
      console.error(`🐌 Very slow request: ${req.method} ${req.path} - ${duration}ms`)
    }
  })
  
  next()
}

export default {
  validateProjectCreation,
  validateBudgetTransfer,
  validateAnnualBudget,
  performanceMonitoring
}
