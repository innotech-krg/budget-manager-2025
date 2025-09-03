#!/usr/bin/env node

// =====================================================
// System Connectivity Tests - Separate Script
// Frontend ↔ Backend Verbindungstests
// =====================================================

console.log('🌐 Testing System Connectivity...');

const testEndpoints = [
  { name: 'Frontend', url: 'http://localhost:3000', expected: 'Budget Manager 2025' },
  { name: 'Backend API', url: 'http://localhost:3001/api', expected: 'endpoints' },
  { name: 'Backend Health', url: 'http://localhost:3001/health', expected: 'status' }
];

let passed = 0;
let failed = 0;

for (const test of testEndpoints) {
  try {
    const response = await fetch(test.url);
    const text = await response.text();
    
    if (response.ok && text.includes(test.expected)) {
      console.log('✅', test.name, '- OK');
      passed++;
    } else {
      console.log('❌', test.name, '- FAILED (Status:', response.status, ')');
      failed++;
    }
  } catch (error) {
    console.log('❌', test.name, '- ERROR:', error.message);
    failed++;
  }
}

console.log('\n📊 Connectivity Results:');
console.log('✅ Passed:', passed);
console.log('❌ Failed:', failed);
console.log('📈 Success Rate:', ((passed / (passed + failed)) * 100).toFixed(1) + '%');

process.exit(failed > 0 ? 1 : 0);
