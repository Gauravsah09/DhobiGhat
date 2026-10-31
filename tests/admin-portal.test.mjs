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
});
