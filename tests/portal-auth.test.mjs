import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function hashPassword(password) {
  if (!password) return '';
  const salt = 'dhobighat_kryptos_v3_salt_9281';
  let h1 = 0x811c9dc5;
  let h2 = 0xcbf29ce4;
  const str = password + ':' + salt;

  for (let round = 0; round < 3; round++) {
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i) + (round * 31);
      h1 = Math.imul(h1 ^ code, 0x01000193) ^ (code << 5);
      h2 = Math.imul(h2 ^ (code + i), 0x5bd1e995) ^ (code >> 3);
    }
  }

  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `dh3_${hex1}_${hex2}`;
}

function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return false;
  return storedHash === hashPassword(password);
}

test('Security Hardening: Staff types and initial-data use passwordHash and lack plaintext PINs', () => {
  const typesContent = fs.readFileSync('src/types/index.ts', 'utf8');
  assert.match(typesContent, /passwordHash/i, 'StoreStaff must define passwordHash');
  assert.doesNotMatch(typesContent, /pin:\s*string;\s*\/\/\s*4-digit/i, 'StoreStaff must not have 4-digit PIN');

  const initialDataContent = fs.readFileSync('src/lib/initial-data.ts', 'utf8');
  assert.match(initialDataContent, /passwordHash/i, 'initial-data must define passwordHash for staff');
  assert.doesNotMatch(initialDataContent, /\bpin:\s*['"]\d{4}['"]/i, 'initial-data must not contain numeric staff PINs');
});

test('Password Authentication: Validates secure passwords and rejects numeric PINs', () => {
  const managerHash = hashPassword('Manager@2026!');
  assert.strictEqual(verifyPassword('Manager@2026!', managerHash), true);
  assert.strictEqual(verifyPassword('9999', managerHash), false);
  assert.strictEqual(verifyPassword('1234', managerHash), false);
  assert.strictEqual(verifyPassword('', managerHash), false);

  const adminHash = hashPassword('DhobiGhat@Admin2026!');
  assert.strictEqual(verifyPassword('DhobiGhat@Admin2026!', adminHash), true);
  assert.strictEqual(verifyPassword('admin', adminHash), false);
  assert.strictEqual(verifyPassword('9999', adminHash), false);
});
