// =====================================================
// Budget Manager 2025 - Vitest Setup
// Jest-DOM und Testing-Library Setup für Vitest
// =====================================================

import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock scrollTo
window.scrollTo = vi.fn()

// Mock German Intl formatting für Tests
Object.defineProperty(Intl, 'NumberFormat', {
  writable: true,
  value: vi.fn().mockImplementation((locale, options) => ({
    format: vi.fn((number) => {
      if (options?.style === 'currency' && options?.currency === 'EUR') {
        // Deutsche Währungsformatierung: 1.234.567,89 €
        return `${number.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
      }
      return number.toLocaleString('de-DE')
    })
  }))
})