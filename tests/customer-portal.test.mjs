import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Customer Login: Page exports dedicated Sign In and Sign Up form with password verification', () => {
  const content = fs.readFileSync('src/app/customer/login/page.tsx', 'utf8');
  assert.match(content, /Sign In|Sign Up/i, 'Must support Sign In and Sign Up');
  assert.match(content, /loginWithPassword/i, 'Must use loginWithPassword');
  assert.match(content, /signupCustomer/i, 'Must use signupCustomer');
});

test('Customer Navigation: Navbar provides minimal essential links', () => {
  const content = fs.readFileSync('src/components/customer/CustomerNavbar.tsx', 'utf8');
  assert.match(content, /\/customer\/book/, 'Must link to book');
  assert.match(content, /\/customer\/orders/, 'Must link to orders');
  assert.match(content, /\/customer\/rates/, 'Must link to rates');
});
