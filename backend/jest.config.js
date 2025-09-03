// =====================================================
// Jest Configuration for ES6 Modules
// Budget Manager 2025 Backend Tests
// =====================================================

export default {
  // Test environment
  testEnvironment: 'node',
  
  // Module transformation
  transform: {},
  
  // Module file extensions
  moduleFileExtensions: ['js', 'json'],
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js',
    '../tests/unit/**/*.test.js',
    '../tests/integration/**/*.test.js'
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  
  // Coverage configuration
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Setup files
  setupFilesAfterEnv: [],
  
  // Globals
  globals: {
    'process.env.NODE_ENV': 'test'
  },
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Force exit after tests
  forceExit: true,
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Timeout for tests
  testTimeout: 10000
};