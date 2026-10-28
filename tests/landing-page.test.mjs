import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Landing Page: renders editorial industrial layout with portal links and theme toggle', () => {
  const code = fs.readFileSync('src/app/page.tsx', 'utf8');
  assert.match(code, /ThemeToggle/, 'Landing page must include ThemeToggle');
  assert.match(code, /href="\/customer"/, 'Landing page must link to /customer');
  assert.match(code, /href="\/store"/, 'Landing page must link to /store');
  assert.match(code, /href="\/admin"/, 'Landing page must link to /admin');
  assert.match(code, /Precision Garment Care OS/i, 'Headline must match design spec');
  assert.doesNotMatch(code, /[\u{1F300}-\u{1F9FF}]/u, 'Zero raw emojis permitted');
});
