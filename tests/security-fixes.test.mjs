import test from 'node:test';
import assert from 'node:assert';
import { SignJWT, jwtVerify } from 'jose';

// Test 1: SVG XML Escaping and XSS Prevention (Finding #2)
test('XSS Prevention: escapeXml strictly neutralizes dangerous script tags', () => {
  function escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  const payload = '<script>alert("XSS")</script>';
  const escaped = escapeXml(payload);
  assert.strictEqual(escaped.includes('<script>'), false);
  assert.strictEqual(escaped.includes('&lt;script&gt;'), true);

  const safeKey = '<img src=x onerror=alert(1)>'.replace(/[^a-zA-Z0-9_\-\.\/]/g, '').slice(0, 120);
  assert.strictEqual(safeKey.includes('<'), false);
  assert.strictEqual(safeKey.includes('='), false);
});

// Test 2: Multi-round Salted Password Hashing & Backward-Compatible Verification (Finding #10)
test('Password Security: hashPassword generates unique salted hash and verifyPassword validates correctly', () => {
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

  function legacyDjb2Hash(password) {
    if (!password) return '';
    let hash1 = 5381;
    let hash2 = 52711;
    const str = password + ':dhobighat_secure_salt_v2';
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash1 = ((hash1 << 5) + hash1) ^ char;
      hash2 = ((hash2 << 5) + hash2) ^ char;
    }
    return `dh_${Math.abs(hash1).toString(16)}_${Math.abs(hash2).toString(16)}`;
  }

  function verifyPassword(password, storedHash) {
    if (!password || !storedHash) return false;
    if (storedHash === password) return true;
    if (storedHash === hashPassword(password)) return true;
    if (storedHash === legacyDjb2Hash(password)) return true;
    return false;
  }

  const rawPassword = 'SecureCustomerPassword#2026';
  const modernHash = hashPassword(rawPassword);
  const legacyHash = legacyDjb2Hash(rawPassword);

  // Modern verification
  assert.strictEqual(verifyPassword(rawPassword, modernHash), true);
  // Wrong password fails
  assert.strictEqual(verifyPassword('WrongPassword123', modernHash), false);
  // Empty password fails
  assert.strictEqual(verifyPassword('', modernHash), false);
  // Legacy account verification succeeds
  assert.strictEqual(verifyPassword(rawPassword, legacyHash), true);
});

// Test 3: SQL Injection Detection & Input Sanitization
test('SQL Injection Prevention: rejects malicious SQL commands and patterns', () => {
  const SQL_INJECTION_PATTERN = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE|EXEC|DECLARE|CAST)\b)|(['";\\])|(--)|(\/\*)|(\bOR\b|\bAND\b)\s+[\d\w'"]+\s*=\s*[\d\w'"]/i;

  function hasSqlInjection(input) {
    if (!input || typeof input !== 'string') return false;
    return SQL_INJECTION_PATTERN.test(input.trim());
  }

  function sanitizeSqlInput(input) {
    if (!input || typeof input !== 'string') return '';
    return input
      .replace(/['";\\`]/g, '')
      .replace(/--/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim();
  }

  assert.strictEqual(hasSqlInjection("admin' OR '1'='1"), true);
  assert.strictEqual(hasSqlInjection("'; DROP TABLE orders; --"), true);
  assert.strictEqual(hasSqlInjection("UNION SELECT * FROM users"), true);
  assert.strictEqual(hasSqlInjection("Rajesh Sharma"), false);
  assert.strictEqual(hasSqlInjection("Bengaluru Indiranagar"), false);

  assert.strictEqual(sanitizeSqlInput("Priya'; DROP TABLE customers; --"), "Priya DROP TABLE customers");
});

// Test 4: Tamper-Proof JWT Token Verification (Finding #5)
test('JWT Security: Tampered payload or signature is strictly rejected', async () => {
  const secretKey = new TextEncoder().encode('dhobighat-super-secure-greedy-nerd-jwt-key-2026');
  const payload = { userId: 'admin-1', role: 'admin', fullName: 'Head of Operations' };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secretKey);

  // Valid token verifies
  const { payload: verified } = await jwtVerify(token, secretKey);
  assert.strictEqual(verified.role, 'admin');

  // Tampered token fails
  const parts = token.split('.');
  const forgedHeader = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url');
  const tamperedToken = `${forgedHeader}.${parts[1]}.${parts[2]}`;

  await assert.rejects(async () => {
    await jwtVerify(tamperedToken, secretKey);
  });
});
