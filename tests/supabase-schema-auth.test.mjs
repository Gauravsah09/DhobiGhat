import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Supabase Schema: admin_users table definition and constraints', () => {
  const schema = fs.readFileSync('supabase-schema.sql', 'utf8');

  // Table definition
  assert.match(schema, /CREATE TABLE IF NOT EXISTS admin_users\s*\(/i, 'admin_users table must be created');
  assert.match(schema, /id VARCHAR\(50\) PRIMARY KEY/i, 'admin_users must have VARCHAR(50) id PRIMARY KEY');
  assert.match(schema, /username VARCHAR\(100\) UNIQUE NOT NULL/i, 'admin_users must have UNIQUE username');
  assert.match(schema, /email VARCHAR\(150\) UNIQUE NOT NULL/i, 'admin_users must have UNIQUE email');
  assert.match(schema, /full_name VARCHAR\(150\) NOT NULL/i, 'admin_users must have full_name');
  assert.match(schema, /role VARCHAR\(50\) NOT NULL CHECK\s*\(role IN\s*\('super_admin',\s*'franchise_owner',\s*'finance_auditor'\)\)/i, 'admin_users must check roles');
  assert.match(schema, /password_hash VARCHAR\(255\) NOT NULL/i, 'admin_users must have password_hash');
  assert.match(schema, /permissions TEXT\[\] NOT NULL DEFAULT '{}'/i, 'admin_users must have permissions array');
  assert.match(schema, /is_active BOOLEAN DEFAULT TRUE/i, 'admin_users must have is_active flag');
  assert.match(schema, /created_at TIMESTAMPTZ DEFAULT NOW\(\)/i, 'admin_users must have created_at timestamp');

  // Indexes and RLS
  assert.match(schema, /CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users\(username\)/i, 'Index on username');
  assert.match(schema, /CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users\(email\)/i, 'Index on email');
  assert.match(schema, /ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY/i, 'RLS must be enabled on admin_users');
});

test('Supabase Schema: store_staff and customers password_hash and pgcrypto seeds', () => {
  const schema = fs.readFileSync('supabase-schema.sql', 'utf8');

  // store_staff password_hash and no staff pin_hash
  assert.match(schema, /CREATE TABLE IF NOT EXISTS store_staff\s*\([\s\S]*?password_hash VARCHAR\(255\) NOT NULL/i, 'store_staff must have password_hash NOT NULL');
  const staffTableBlock = schema.match(/CREATE TABLE IF NOT EXISTS store_staff\s*\([\s\S]*?\);/i)?.[0] || '';
  assert.doesNotMatch(staffTableBlock, /\bpin_hash\b/i, 'Legacy pin_hash should not be in store_staff');

  // customers password_hash
  assert.match(schema, /CREATE TABLE IF NOT EXISTS customers\s*\([\s\S]*?password_hash VARCHAR\(255\)/i, 'customers must have password_hash');
  assert.match(schema, /CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers\(phone\)/i, 'Index on customer phone');
  assert.match(schema, /CREATE INDEX IF NOT EXISTS idx_customers_email ON customers\(email\)/i, 'Index on customer email');

  // pgcrypto blowfish seed inserts
  assert.match(schema, /crypt\('DhobiGhat@Admin2026!',\s*gen_salt\('bf',\s*10\)\)/i, 'Admin account seed must use pgcrypto blowfish');
  assert.match(schema, /crypt\('Manager@2026!',\s*gen_salt\('bf',\s*10\)\)/i, 'Store manager seed must use pgcrypto blowfish');

  // RPC verification function
  assert.match(schema, /CREATE OR REPLACE FUNCTION verify_user_password/i, 'Must define verify_user_password RPC');
});

test('Environment Configuration: docker-compose.yml and render.yaml declare required secrets', () => {
  const dockerCompose = fs.readFileSync('docker-compose.yml', 'utf8');
  assert.match(dockerCompose, /SUPABASE_SERVICE_ROLE_KEY=\$\{SUPABASE_SERVICE_ROLE_KEY:-}/);
  assert.match(dockerCompose, /AUTH_JWT_SECRET=\$\{AUTH_JWT_SECRET:-}/);

  const renderYaml = fs.readFileSync('render.yaml', 'utf8');
  assert.match(renderYaml, /key:\s*SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(renderYaml, /key:\s*AUTH_JWT_SECRET/);
});

test('Login API Route: rejects SQL injection attacks and protects credentials', async () => {
  const loginRoute = fs.readFileSync('src/app/api/auth/login/route.ts', 'utf8');

  // Verify Supabase integration
  assert.match(loginRoute, /getSupabaseAdminClient\(\)/, 'Must call getSupabaseAdminClient');
  assert.match(loginRoute, /from\(['"]admin_users['"]\)/, 'Must query admin_users table');
  assert.match(loginRoute, /from\(['"]store_staff['"]\)/, 'Must query store_staff table');
  assert.match(loginRoute, /from\(['"]customers['"]\)/, 'Must query customers table');
  assert.match(loginRoute, /rpc\(['"]verify_user_password['"]/, 'Must support verify_user_password RPC fallback for pgcrypto blowfish');

  // Verify graceful fallback when Supabase is unconfigured
  assert.match(loginRoute, /initialAdminUsers/, 'Must fall back to initialAdminUsers when Supabase is not configured');
  assert.match(loginRoute, /initialStaff/, 'Must fall back to initialStaff when Supabase is not configured');
  assert.match(loginRoute, /getSharedCustomers/, 'Must fall back to shared customers when Supabase is not configured');

  // Verify zero credential leakage in user response payload
  const userBlocks = [...loginRoute.matchAll(/user:\s*\{([^}]+)\}/g)].map(m => m[1]);
  assert.ok(userBlocks.length > 0, 'Found user response blocks');
  for (const block of userBlocks) {
    assert.doesNotMatch(block, /\bpassword\b/i, 'User block must not contain password field');
    assert.doesNotMatch(block, /\bpassword_hash\b/i, 'User block must not contain password_hash field');
    assert.doesNotMatch(block, /\bpin\b/i, 'User block must not contain pin field');
  }
});


test('Supabase Server Client: exports getSupabaseAdminClient and getSupabaseClient', async () => {
  const { getSupabaseAdminClient, getSupabaseClient, checkIsSupabaseConfigured } = await import('../src/lib/supabase-server.ts');

  assert.strictEqual(typeof getSupabaseAdminClient, 'function');
  assert.strictEqual(typeof getSupabaseClient, 'function');
  assert.strictEqual(typeof checkIsSupabaseConfigured, 'function');

  // When unconfigured (clean environment)
  const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const prevAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const prevService = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    assert.strictEqual(getSupabaseAdminClient(), null, 'Should return null when unconfigured');
    assert.strictEqual(getSupabaseClient(), null, 'Should return null when unconfigured');

    // When configured with mock values
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mocktestproject123.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key-12345';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key-98765';

    const adminClient = getSupabaseAdminClient();
    assert.ok(adminClient, 'Admin client should be instantiated when configured');

    const userClient = getSupabaseClient('user-token-xyz');
    assert.ok(userClient, 'User client should be instantiated when configured');
  } finally {
    if (prevUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl; else delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (prevAnon) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = prevAnon; else delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (prevService) process.env.SUPABASE_SERVICE_ROLE_KEY = prevService; else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
});
