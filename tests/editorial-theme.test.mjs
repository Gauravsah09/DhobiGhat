import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Theme Tokens: globals.css defines both light (:root) and dark (.dark) CSS custom properties', () => {
  const css = fs.readFileSync('src/app/globals.css', 'utf8');
  assert.match(css, /--c-canvas:\s*#fffbf2/i, 'Missing light canvas #fffbf2');
  assert.match(css, /--c-canvas:\s*#0c0a07/i, 'Missing dark canvas #0c0a07');
  assert.match(css, /--c-accent:\s*#d97706/i, 'Missing light accent #d97706');
  assert.match(css, /--c-accent:\s*#f59e0b/i, 'Missing dark accent #f59e0b');
});

test('Theme Toggle Component: ThemeToggle exports a functional client switch using dhobighat-theme', () => {
  assert.ok(fs.existsSync('src/components/ThemeToggle.tsx'), 'src/components/ThemeToggle.tsx must exist');
  const file = fs.readFileSync('src/components/ThemeToggle.tsx', 'utf8');
  assert.match(file, /dhobighat-theme/, 'ThemeToggle must use localStorage key dhobighat-theme');
  assert.match(file, /Sun|Moon/, 'ThemeToggle must render Sun/Moon icons');
});
