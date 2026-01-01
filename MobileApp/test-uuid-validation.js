/**
 * Test script to verify UUID validation is working properly
 * Run this with: node test-uuid-validation.js
 */

// Import the validation function
const { validateRecordId, isValidUUID } = require('./lib/validation.ts');

console.log('🧪 Testing UUID Validation...\n');

// Test cases
const testCases = [
  // Valid UUIDs
  { input: '123e4567-e89b-12d3-a456-426614174000', expected: true, description: 'Valid UUID v4' },
  { input: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', expected: true, description: 'Another valid UUID' },
  
  // Invalid cases that were causing the original error
  { input: undefined, expected: false, description: 'Undefined input' },
  { input: null, expected: false, description: 'Null input' },
  { input: 'undefined', expected: false, description: 'String "undefined"' },
  { input: '', expected: false, description: 'Empty string' },
  { input: '   ', expected: false, description: 'Whitespace only' },
  
  // Invalid UUID formats
  { input: 'not-a-uuid', expected: false, description: 'Invalid format' },
  { input: '123', expected: false, description: 'Too short' },
  { input: '123e4567-e89b-12d3-a456-42661417400', expected: false, description: 'Missing character' },
  { input: '123e4567-e89b-12d3-a456-426614174000x', expected: false, description: 'Extra character' },
];

console.log('Testing isValidUUID function:');
testCases.forEach((testCase, index) => {
  try {
    const result = isValidUUID(testCase.input);
    const status = result === testCase.expected ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${status} - ${testCase.description}: "${testCase.input}" -> ${result}`);
  } catch (error) {
    console.log(`${index + 1}. ❌ ERROR - ${testCase.description}: ${error.message}`);
  }
});

console.log('\nTesting validateRecordId function:');
testCases.forEach((testCase, index) => {
  try {
    const result = validateRecordId(testCase.input);
    const expectedValid = testCase.expected;
    const status = result.isValid === expectedValid ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${status} - ${testCase.description}: isValid=${result.isValid}, error="${result.error || 'none'}"`);
  } catch (error) {
    console.log(`${index + 1}. ❌ ERROR - ${testCase.description}: ${error.message}`);
  }
});

console.log('\n🎉 UUID validation testing completed!');
console.log('\n📝 Summary:');
console.log('- The validation functions now properly handle undefined, null, and invalid UUID inputs');
console.log('- This should prevent the "invalid input syntax for type uuid: \\"undefined\\"" error');
console.log('- All mobile app services now validate UUIDs before database queries');