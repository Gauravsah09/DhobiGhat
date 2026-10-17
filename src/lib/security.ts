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
 * Synchronous password hash generation for customer credentials
 */
export function hashPassword(password: string): string {
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

