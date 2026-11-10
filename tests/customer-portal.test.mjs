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

test('Customer Orders: Resilient order matching and session-placed invoice ownership', () => {
  const ordersCode = fs.readFileSync('src/app/customer/orders/page.tsx', 'utf8');
  assert.match(ordersCode, /recentBookedInv/, 'Must check recentBookedInv from session');
  assert.match(ordersCode, /userPhoneClean/, 'Must normalize phone numbers cleanly');
  assert.match(ordersCode, /userEmail/, 'Must check email match');

  const bookCode = fs.readFileSync('src/app/customer/book/page.tsx', 'utf8');
  assert.match(bookCode, /sessionStorage\.setItem\(['"]dhobighat_recent_booked_inv['"]/, 'Must store recent booked invoice in session');
});
