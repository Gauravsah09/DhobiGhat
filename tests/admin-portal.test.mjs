import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Admin Console: Renders full views for Slots & Capacity and Reports tabs', () => {
  const code = fs.readFileSync('src/app/admin/page.tsx', 'utf8');
  assert.match(code, /activeTab === 'slots_capacity'/, 'Must render slots_capacity tab view');
  assert.match(code, /activeTab === 'reports'/, 'Must render reports tab view');
  assert.match(code, /Turnaround Time|TAT/i, 'Reports must include TAT metrics');
  assert.match(code, /Morning|Evening|Capacity/i, 'Slots must include slot capacity controls');
});

test('Admin Login: High-privilege Superadmin styling and password validation', () => {
  const code = fs.readFileSync('src/app/admin/login/page.tsx', 'utf8');
  assert.match(code, /Superadmin|Executive/i, 'Must convey superadmin authority');
  assert.match(code, /type=["']password["']/, 'Must require secure password');
  assert.doesNotMatch(code, /DhobiGhat@Admin2026!/i, 'Must not expose admin master password on screen');
  assert.doesNotMatch(code, /Autofill/i, 'Must not provide insecure credential autofill buttons');
  assert.doesNotMatch(code, /Demo Credentials/i, 'Must not show demo credentials table');
});

test('Admin Staff Management: Zero exposed default passwords or PIN leakage', () => {
  const code = fs.readFileSync('src/app/admin/page.tsx', 'utf8');
  assert.doesNotMatch(code, /useState\(['"]1234['"]\)/, 'Must not pre-fill staff PIN state with 1234');
  assert.doesNotMatch(code, /alert\(.*Shift PIN:/, 'Must not echo created staff PIN in browser alert');
});

test('Admin Console: Database Connection Test feature and UI controls', () => {
  const code = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

  // Trigger and state handlers
  assert.match(code, /handleTestDbConnection/, 'Must have handleTestDbConnection function');
  assert.match(code, /fetch\(['"]\/api\/admin\/db-test['"]/, 'Must call /api/admin/db-test API endpoint');
  assert.match(code, /isTestingDb/, 'Must have loading state for DB probe');
  assert.match(code, /dbTestResult/, 'Must hold DB test result state');

  // Header and Dashboard buttons
  assert.match(code, /Test DB Connection/, 'Must render Test DB Connection button in header');
  assert.match(code, /Supabase Cloud Database Connectivity/i, 'Must render connectivity card on dashboard');
  assert.match(code, /Run Connection Test|Test Connection/i, 'Must render connection test action button');

  // Modal and Diagnostics
  assert.match(code, /Database Connection Test/, 'Must render DB Connection Test modal title');
  assert.match(code, /Connection Successful/i, 'Must display success state');
  assert.match(code, /Connection Failed/i, 'Must display failure/error state');
  assert.match(code, /Latency/i, 'Must render connection latency metric');
});

test('Admin DB Test API Route: Implements comprehensive PostgreSQL diagnostics', () => {
  const routeCode = fs.readFileSync('src/app/api/admin/db-test/route.ts', 'utf8');

  // Environment variable validation
  assert.match(routeCode, /NEXT_PUBLIC_SUPABASE_URL/, 'Must check NEXT_PUBLIC_SUPABASE_URL');
  assert.match(routeCode, /NEXT_PUBLIC_SUPABASE_ANON_KEY/, 'Must check NEXT_PUBLIC_SUPABASE_ANON_KEY');
  assert.match(routeCode, /SUPABASE_SERVICE_ROLE_KEY/, 'Must check SUPABASE_SERVICE_ROLE_KEY');

  // Client initialization & latency measurement
  assert.match(routeCode, /getSupabaseAdminClient\(\)/, 'Must initialize Supabase admin client');
  assert.match(routeCode, /performance\.now\(\)/, 'Must benchmark round-trip latency');

  // Probes on core relational tables
  assert.match(routeCode, /from\(['"]admin_users['"]\)/, 'Must probe admin_users table');
  assert.match(routeCode, /from\(['"]store_staff['"]\)/, 'Must probe store_staff table');
  assert.match(routeCode, /from\(['"]customers['"]\)/, 'Must probe customers table');
  assert.match(routeCode, /from\(['"]orders['"]\)/, 'Must probe orders table');
});

