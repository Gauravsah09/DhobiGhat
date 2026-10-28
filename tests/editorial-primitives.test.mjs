import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Editorial Primitives: components define tactile buttons, hairline cards, and pulsing status dots', () => {
  assert.ok(fs.existsSync('src/components/editorial/Primitives.tsx'), 'src/components/editorial/Primitives.tsx must exist');
  const code = fs.readFileSync('src/components/editorial/Primitives.tsx', 'utf8');
  assert.match(code, /export function EditorialButton/, 'Missing EditorialButton');
  assert.match(code, /export function EditorialCard/, 'Missing EditorialCard');
  assert.match(code, /export function StatusLozenge/, 'Missing StatusLozenge');
  assert.match(code, /rounded-full/, 'Status lozenge must be pill-shaped');
  assert.match(code, /animate-pulse|box-shadow|ring/, 'Status lozenge must have glowing indicator dot');
});
