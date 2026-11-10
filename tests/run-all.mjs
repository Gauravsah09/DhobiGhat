import fs from 'node:fs';
import path from 'node:path';
import { run } from 'node:test';
import { spec } from 'node:test/reporters';

const testDir = path.resolve(process.cwd(), 'tests');
const files = fs.readdirSync(testDir)
  .filter(f => f.endsWith('.test.mjs'))
  .map(f => path.join(testDir, f));

console.log(`Running DhobiGhat Permanent Test Suite (${files.length} test files)...`);

const testStream = run({ files });

testStream
  .on('test:fail', () => {
    process.exitCode = 1;
  })
  .compose(new spec())
  .pipe(process.stdout);

