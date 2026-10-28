import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Customer Portal: CustomerNavbar includes ThemeToggle and routes to rates, book, and orders', () => {
  const nav = fs.readFileSync('src/components/customer/CustomerNavbar.tsx', 'utf8');
  assert.match(nav, /ThemeToggle/, 'CustomerNavbar must include ThemeToggle');
  assert.match(nav, /\/customer\/rates/, 'Navbar must link to rates');
  assert.match(nav, /\/customer\/book/, 'Navbar must link to book');
  assert.match(nav, /\/customer\/orders/, 'Navbar must link to orders');
  assert.doesNotMatch(nav, /[\u{1F300}-\u{1F9FF}]/u, 'Zero raw emojis in CustomerNavbar');
});
