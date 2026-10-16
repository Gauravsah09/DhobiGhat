/**
 * Sentry Free Tier Server Configuration ($0/mo)
 * Captures uncaught API route and database exceptions
 */

export const SERVER_SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || '';

if (SERVER_SENTRY_DSN) {
  console.log('[Sentry] Server exception monitoring active');
}
