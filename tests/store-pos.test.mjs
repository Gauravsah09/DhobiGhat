import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Store POS: renders workshop terminal layout with print invoice preservation', () => {
  const code = fs.readFileSync('src/app/store/page.tsx', 'utf8');
  assert.match(code, /ThemeToggle/, 'Store POS header must include ThemeToggle');
  assert.match(code, /no-print/, 'Must use no-print utility for interactive controls');
  assert.match(code, /print-only/, 'Must use print-only utility for invoice paper receipt');
  assert.match(code, /window\.print/, 'Must trigger native print dialog');
  assert.doesNotMatch(code, /[\u{1F300}-\u{1F9FF}]/u, 'Zero raw emojis in Store POS');
});
