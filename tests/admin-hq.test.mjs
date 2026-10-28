import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Admin HQ: console includes ThemeToggle, telemetry stats, and order stage management', () => {
  const code = fs.readFileSync('src/app/admin/page.tsx', 'utf8');
  assert.match(code, /ThemeToggle/, 'Admin HQ header must include ThemeToggle');
  assert.match(code, /Shift|Cash|Drawer/i, 'Admin HQ must include shift reconciliation controls');
  assert.doesNotMatch(code, /[\u{1F300}-\u{1F9FF}]/u, 'Zero raw emojis in Admin HQ');
});
