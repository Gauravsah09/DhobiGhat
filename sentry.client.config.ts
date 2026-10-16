/**
 * Sentry Free Tier Client Configuration ($0/mo)
 * Captures browser exceptions and React rendering crashes
 */

export const CLIENT_SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || '';

if (CLIENT_SENTRY_DSN && typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (process.env.NODE_ENV === 'production') {
      fetch('https://sentry.io/api/embed/error-page/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: event.message, filename: event.filename }),
      }).catch(() => {});
    }
  });
}
