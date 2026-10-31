import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Store Login: Renders 4 prominent role tiles and password input', () => {
  const code = fs.readFileSync('src/app/store/login/page.tsx', 'utf8');
  assert.match(code, /Store Manager/i, 'Must have Store Manager tile');
  assert.match(code, /Store Operator/i, 'Must have Store Operator tile');
  assert.match(code, /Rider/i, 'Must have Rider tile');
  assert.match(code, /Worker/i, 'Must have Worker tile');
  assert.match(code, /type=["']password["']/, 'Must require password input');
  assert.doesNotMatch(code, /4-digit shift PIN/i, 'Must remove references to 4-digit PIN');
  assert.doesNotMatch(code, /4-digit PIN/i, 'Must remove references to 4-digit PIN');
  assert.doesNotMatch(code, /Manager@2026!/i, 'Must not expose staff passwords on screen');
  assert.doesNotMatch(code, /Default pwd/i, 'Must not display default passwords on screen');
});

test('Store Floor: Stable order keys and smooth transition tracker to eliminate flickering', () => {
  const code = fs.readFileSync('src/app/store/page.tsx', 'utf8');
  assert.match(code, /updatingOrderId/, 'Must track updating order id to prevent flickering');
  assert.match(code, /transition-all duration-300 ease-in-out/, 'Must have smooth transition animation classes');
  assert.match(code, /key=\{order\.id\}/, 'Must use stable key={order.id}');
});

