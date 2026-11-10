import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Sentry Telemetry Suite: configuration files integrity and safe fallback', () => {
  const root = process.cwd();
  const clientConfig = fs.readFileSync(path.join(root, 'sentry.client.config.ts'), 'utf8');
  const serverConfig = fs.readFileSync(path.join(root, 'sentry.server.config.ts'), 'utf8');
  const edgeConfig = fs.readFileSync(path.join(root, 'sentry.edge.config.ts'), 'utf8');

  // Must have safe fallback when DSN is empty/undefined
  assert.match(clientConfig, /enabled:\s*Boolean\(SENTRY_DSN\)/, 'Client config must safely disable when DSN is not provided');
  assert.match(serverConfig, /enabled:\s*Boolean\(SENTRY_DSN\)/, 'Server config must safely disable when DSN is not provided');
  assert.match(edgeConfig, /enabled:\s*Boolean\(SENTRY_DSN\)/, 'Edge config must safely disable when DSN is not provided');
});

test('Sentry Telemetry Suite: credential sanitization in beforeSend and beforeBreadcrumb', () => {
  const root = process.cwd();
  const clientConfig = fs.readFileSync(path.join(root, 'sentry.client.config.ts'), 'utf8');
  const serverConfig = fs.readFileSync(path.join(root, 'sentry.server.config.ts'), 'utf8');

  // Must sanitize passwords and PINs
  assert.match(clientConfig, /beforeSend/, 'Client config must implement beforeSend hook');
  assert.match(clientConfig, /password|pin/i, 'Client config must scrub password and pin');
  assert.match(serverConfig, /beforeSend/, 'Server config must implement beforeSend hook');
  assert.match(serverConfig, /password|pin/i, 'Server config must scrub password and pin');
});

test('Sentry Telemetry Suite: Next.js App Router instrumentation and global error boundary', () => {
  const root = process.cwd();
  const instrumentation = fs.readFileSync(path.join(root, 'src', 'instrumentation.ts'), 'utf8');
  const globalError = fs.readFileSync(path.join(root, 'src', 'app', 'global-error.tsx'), 'utf8');
  const nextConfig = fs.readFileSync(path.join(root, 'next.config.ts'), 'utf8');

  assert.match(instrumentation, /export async function register/, 'Instrumentation must export register function');
  assert.match(instrumentation, /onRequestError\s*=\s*Sentry\.captureRequestError/, 'Instrumentation must export onRequestError hook');
  assert.match(globalError, /Sentry\.captureException/, 'Global error boundary must capture unhandled exceptions');
  assert.match(nextConfig, /withSentryConfig/, 'next.config.ts must wrap configuration with withSentryConfig');
});

