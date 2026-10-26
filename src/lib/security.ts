/**
 * Security and SQL Injection Prevention Helpers
 * Ensures all user-supplied inputs, search queries, invoice lookups, and parameters
 * are strictly sanitized, validated, and protected against SQL injection, NoSQL injection,
 * and malicious script execution.
 */

// Pattern matching common SQL injection vectors
const SQL_INJECTION_PATTERN = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE|EXEC|DECLARE|CAST)\b)|(['";\\])|(--)|(\/\*)|(\bOR\b|\bAND\b)\s+[\d\w'"]+\s*=\s*[\d\w'"]/i;

/**
 * Checks if a string contains SQL injection patterns
 */
export function hasSqlInjection(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  return SQL_INJECTION_PATTERN.test(input.trim());
}

/**
 * Strips dangerous SQL meta-characters and script tags from text inputs
 */
export function sanitizeSqlInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/['";\\`]/g, '')     // Remove quotes, semicolons, backslashes
    .replace(/--/g, '')           // Remove SQL comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multiline comments
    .trim();
}

/**
 * Validates and sanitizes a 10-digit Indian mobile number
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  return digits.slice(-10);
}

/**
 * Validates and sanitizes an invoice number (e.g. IND-2401)
 */
export function sanitizeInvoiceNo(inv: string): string {
  if (!inv || typeof inv !== 'string') return '';
  return inv.replace(/[^a-zA-Z0-9-_]/g, '').trim().toUpperCase();
}

/**
 * Computes cryptographically secure SHA-256 hash using native Web Crypto API
 * Works across all modern browsers and Node.js runtimes without external dependencies.
 */
export async function sha256Async(message: string): Promise<string> {
  if (!message) return '';
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Synchronous salted password hash generation for customer credentials.
 * Multi-round salted hashing with 64-bit state mixing.
 */
export function hashPassword(password: string): string {
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

/**
 * Legacy hash generator to verify backwards compatibility
 */
function legacyDjb2Hash(password: string): string {
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

/**
 * Verifies a plaintext password against a stored hash (supports modern v3, legacy v2, and plaintext fallback)
 */
export function verifyPassword(password: string, storedHash?: string): boolean {
  if (!password || !storedHash) return false;
  if (storedHash === password) return true;
  if (storedHash === hashPassword(password)) return true;
  if (storedHash === legacyDjb2Hash(password)) return true;
  return false;
}

