/**
 * Simple test to verify admin email check
 */

import { isAdminEmail } from './admin';

console.log('Testing admin email validation...\n');

const testCases = [
  { email: 'zhanerke1900@gmail.com', expected: true },
  { email: 'ZHANERKE1900@GMAIL.COM', expected: true },
  { email: 'zhanerke1900@gmail.com  ', expected: true },
  { email: 'other@gmail.com', expected: false },
  { email: null, expected: false },
  { email: undefined, expected: false },
];

testCases.forEach(({ email, expected }) => {
  const result = isAdminEmail(email as any);
  const status = result === expected ? '✓' : '✗';
  console.log(`${status} isAdminEmail("${email}") = ${result} (expected: ${expected})`);
});

console.log('\nAdmin email validation test complete!');
